package com.personaltaskmanager.app.widget

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class WidgetBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val PREFS_NAME = "widget_prefs"
        const val KEY_DAY_OFFSET = "day_offset"
        const val KEY_MONTH_OFFSET = "month_offset"
        const val KEY_SELECTED_DAY = "selected_day"

        const val ACTION_PREV_DAY = "com.personaltaskmanager.app.widget.ACTION_PREV_DAY"
        const val ACTION_NEXT_DAY = "com.personaltaskmanager.app.widget.ACTION_NEXT_DAY"
        const val ACTION_TOGGLE_COMPLETE = "com.personaltaskmanager.app.widget.ACTION_TOGGLE_COMPLETE"
        const val ACTION_WIDGET_DATA_CHANGED = "com.personaltaskmanager.app.widget.ACTION_WIDGET_DATA_CHANGED"

        const val ACTION_PREV_MONTH = "com.personaltaskmanager.app.widget.ACTION_PREV_MONTH"
        const val ACTION_NEXT_MONTH = "com.personaltaskmanager.app.widget.ACTION_NEXT_MONTH"
        const val ACTION_SELECT_DAY = "com.personaltaskmanager.app.widget.ACTION_SELECT_DAY"

        const val EXTRA_WIDGET_ID = "widget_id"
        const val EXTRA_TASK_ID = "task_id"
        const val EXTRA_DAY_ISO = "day_iso"
        const val EXTRA_MONTH_OFFSET = "month_offset"
    }

    override fun onReceive(context: Context, intent: Intent) {
        // Delegate to service to avoid ANR and to keep DB ops off main thread
        WidgetUpdateService.enqueueWork(context, intent)
    }

    /** Called by the service on a background thread. Keep logic here for reuse. */
    fun handleIntent(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> {
                try { com.personaltaskmanager.app.TaskReminderCoordinator.reconcile(context) }
                catch (error: Exception) { android.util.Log.e("Krono", "Recordatorios pendientes tras reinicio", error) }
                refreshAllWidgets(context)
            }
            ACTION_PREV_DAY, ACTION_NEXT_DAY -> handleDayNav(context, intent)
            ACTION_TOGGLE_COMPLETE -> handleToggleComplete(context, intent)
            ACTION_WIDGET_DATA_CHANGED -> refreshAllWidgets(context)
            ACTION_PREV_MONTH, ACTION_NEXT_MONTH -> handleMonthNav(context, intent)
            ACTION_SELECT_DAY -> handleSelectDay(context, intent)
        }
    }

    private fun handleDayNav(context: Context, intent: Intent) {
        val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val delta = if (intent.action == ACTION_PREV_DAY) -1 else 1
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val key = "${KEY_DAY_OFFSET}_$widgetId"
            val current = prefs.getInt(key, 0)
            prefs.edit().putInt(key, current + delta).apply()
            updateDailyWidget(context, widgetId)
        } else {
            // No widgetId supplied: apply to all daily widgets
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DailyListWidgetProvider::class.java))
            for (id in ids) {
                val key = "${KEY_DAY_OFFSET}_$id"
                val current = prefs.getInt(key, 0)
                prefs.edit().putInt(key, current + delta).apply()
                updateDailyWidget(context, id)
            }
        }
    }

    private fun handleMonthNav(context: Context, intent: Intent) {
        val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val delta = if (intent.action == ACTION_PREV_MONTH) -1 else 1
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val key = "${KEY_MONTH_OFFSET}_$widgetId"
            val cur = prefs.getInt(key, 0)
            prefs.edit().putInt(key, cur + delta).apply()
            // Reset day selection so counters match a visible day in the new month
            prefs.edit().remove("${KEY_SELECTED_DAY}_$widgetId").apply()
            updateMonthlyWidget(context, widgetId)
        } else {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, MonthlyCalendarWidgetProvider::class.java))
            for (id in ids) {
                val key = "${KEY_MONTH_OFFSET}_$id"
                val cur = prefs.getInt(key, 0)
                prefs.edit().putInt(key, cur + delta).apply()
                prefs.edit().remove("${KEY_SELECTED_DAY}_$id").apply()
                updateMonthlyWidget(context, id)
            }
        }
    }

    private fun handleSelectDay(context: Context, intent: Intent) {
        val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val dayIso = intent.getStringExtra(EXTRA_DAY_ISO) ?: return
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            prefs.edit().putString("${KEY_SELECTED_DAY}_$widgetId", dayIso).apply()
            updateMonthlyWidget(context, widgetId)
        } else {
            // broadcast without id: update all monthly widgets with same selected day? keep per-widget but apply to all
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, MonthlyCalendarWidgetProvider::class.java))
            for (id in ids) {
                prefs.edit().putString("${KEY_SELECTED_DAY}_$id", dayIso).apply()
                updateMonthlyWidget(context, id)
            }
        }
    }

    private fun handleToggleComplete(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return
        try {
            com.personaltaskmanager.app.database.TaskManagerDatabaseHelper(context).use { helper ->
                val db = helper.writableDatabase
                db.beginTransaction()
                try {
                    val now = java.time.format.DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(Instant.now())
                    db.execSQL("UPDATE tasks SET completed_at = CASE WHEN completed = 0 THEN ? ELSE NULL END, completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END, updated_at = ? WHERE id = ?", arrayOf(now, now, taskId))
                    db.setTransactionSuccessful()
                } finally { db.endTransaction() }
            }
            com.personaltaskmanager.app.TaskReminderCoordinator.reconcile(context)
        } catch (error: Exception) {
            android.util.Log.e("Krono", "No se pudo sincronizar la acción del widget", error)
        }
        refreshAllWidgets(context)
    }

    private fun refreshAllWidgets(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        // Daily
        val dailyIds = manager.getAppWidgetIds(ComponentName(context, DailyListWidgetProvider::class.java))
        for (id in dailyIds) updateDailyWidget(context, id)
        // Monthly
        val monthlyIds = manager.getAppWidgetIds(ComponentName(context, MonthlyCalendarWidgetProvider::class.java))
        for (id in monthlyIds) updateMonthlyWidget(context, id)
    }

    private fun updateDailyWidget(context: Context, widgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val offset = prefs.getInt("${KEY_DAY_OFFSET}_$widgetId", 0)
        val rv = WidgetDataProvider.buildDailyListRemoteViews(context, widgetId, offset)
        AppWidgetManager.getInstance(context).updateAppWidget(widgetId, rv)
    }

    private fun updateMonthlyWidget(context: Context, widgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val monthOffset = prefs.getInt("${KEY_MONTH_OFFSET}_$widgetId", 0)
        val selectedIso = prefs.getString("${KEY_SELECTED_DAY}_$widgetId", null)
        val rv = WidgetDataProvider.buildMonthlyCalendarRemoteViews(context, widgetId, monthOffset, selectedIso)
        AppWidgetManager.getInstance(context).updateAppWidget(widgetId, rv)
    }
}
