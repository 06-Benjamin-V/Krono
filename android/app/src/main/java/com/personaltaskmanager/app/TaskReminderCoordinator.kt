package com.personaltaskmanager.app

import android.content.Context
import com.capacitorjs.plugins.localnotifications.LocalNotification
import com.capacitorjs.plugins.localnotifications.LocalNotificationManager
import com.capacitorjs.plugins.localnotifications.NotificationStorage
import com.getcapacitor.CapConfig
import com.getcapacitor.JSObject
import com.personaltaskmanager.app.database.TaskManagerDatabaseHelper
import java.time.Instant
import java.time.format.DateTimeFormatterBuilder
import org.json.JSONObject

/** The sole scheduling entry point for JS and widgets. Adapter pinned to plugin 8.3.1. */
object TaskReminderCoordinator {
    private const val MAX_REMINDERS = 10000
    private val isoMillis = DateTimeFormatterBuilder().appendInstant(3).toFormatter()

    @JvmStatic @Synchronized
    fun reconcile(context: Context): Int {
        val prefs = context.getSharedPreferences("krono_reminder_sync", Context.MODE_PRIVATE)
        check(prefs.edit().putBoolean("pending", true).commit()) { "No se pudo registrar la sincronización" }
        val storage = NotificationStorage(context)
        val manager = LocalNotificationManager(storage, null, context, CapConfig.loadDefault(context))
        manager.createNotificationChannel()
        // All app notifications belong to tasks. This also cancels legacy hashed IDs.
        manager.cancelAll()
        val notifications = mutableListOf<LocalNotification>()
        val failures = mutableListOf<String>()
        val ids = JSONObject(prefs.getString("ids", "{}") ?: "{}")
        var nextId = prefs.getInt("nextId", 1)
        val activeKeys = mutableSetOf<String>()
        val now = System.currentTimeMillis()
        try {
            TaskManagerDatabaseHelper(context).use { helper ->
                val db = helper.readableDatabase
                val interval = db.rawQuery("SELECT value FROM app_settings WHERE key = ?", arrayOf("deadlineTaskNotificationIntervalHours")).use {
                    if (it.moveToFirst()) it.getString(0).toLongOrNull() ?: 4L else 4L
                }
                require(interval in listOf(1L, 2L, 4L, 6L, 8L, 12L, 24L)) { "Intervalo de recordatorios inválido" }
                db.rawQuery("SELECT id,title,type,start_at,end_at FROM tasks WHERE completed = 0", null).use { cursor ->
                    while (cursor.moveToNext()) {
                        val taskId = cursor.getString(0)
                        val title = cursor.getString(1)
                        val start = Instant.parse(cursor.getString(3)).toEpochMilli()
                        val end = Instant.parse(cursor.getString(4)).toEpochMilli()
                        val hours = if (cursor.getString(2) == "DAILY") 2L else interval
                        val plan = try { ReminderPlan.future(start, end, hours, now, MAX_REMINDERS - notifications.size) }
                        catch (error: IllegalArgumentException) { failures.add("$title: ${error.message}"); continue }
                        for ((index, fire) in plan) {
                            val key = "$taskId:$index"
                            activeKeys.add(key)
                            val id = if (ids.has(key)) ids.getInt(key) else {
                                check(nextId < Int.MAX_VALUE) { "Se agotaron los identificadores de avisos" }
                                nextId++.also { ids.put(key, it) }
                            }
                            val minutes = (end - fire) / 60000
                            val remaining = if (minutes >= 60) "${minutes / 60} h ${minutes % 60} min" else "$minutes min"
                            val json = JSObject().put("id", id).put("title", title)
                                .put("body", "Quedan $remaining: $title")
                                .put("schedule", JSObject().put("at", isoMillis.format(Instant.ofEpochMilli(fire))))
                                .put("extra", JSObject().put("taskId", taskId))
                                .put("isExactNotification", false)
                            notifications.add(LocalNotification.buildNotificationFromJSObject(JSObject(json.toString())))
                        }
                    }
                }
            }
            ids.keys().asSequence().toList().filter { it !in activeKeys }.forEach { ids.remove(it) }
            check(prefs.edit().putString("ids", ids.toString()).putInt("nextId", nextId).commit()) { "No se pudo guardar el plan" }
            // Persist before scheduling: a partial failure can be cancelled/reconciled later.
            storage.appendNotifications(notifications)
            if (notifications.isNotEmpty() && manager.schedule(null, notifications) == null) {
                throw IllegalStateException("Activa el permiso de notificaciones en Ajustes")
            }
            if (failures.isNotEmpty()) throw IllegalStateException(failures.joinToString("; "))
            prefs.edit().putBoolean("pending", false).remove("error").commit()
            return notifications.size
        } catch (error: Exception) {
            prefs.edit().putString("error", error.message ?: "Error al sincronizar").commit()
            throw error
        }
    }
}
