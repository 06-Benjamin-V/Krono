package com.personaltaskmanager.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.capacitorjs.plugins.localnotifications.NotificationStorage
import com.personaltaskmanager.app.database.TaskManagerDatabaseHelper
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.time.Instant

/** Run only on an empty QA installation; never change a user's task set. */
@RunWith(AndroidJUnit4::class)
class RemindersInstrumentedTest {
    @Test fun reconciliationIsStableAndCompletionCancelsPending() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        TaskManagerDatabaseHelper(context).use { helper ->
            val db = helper.writableDatabase
            db.rawQuery("SELECT COUNT(*) FROM tasks", null).use { it.moveToFirst(); assumeTrue(it.getInt(0) == 0) }
            val storage = NotificationStorage(context)
            assumeTrue(storage.getSavedNotificationIds().isEmpty())
            if (Build.VERSION.SDK_INT >= 33) {
                InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand("pm grant ${context.packageName} android.permission.POST_NOTIFICATIONS").use {
                    java.io.FileInputStream(it.fileDescriptor).use { stream -> stream.readBytes() }
                }
                assertEquals(PackageManager.PERMISSION_GRANTED, context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS))
            }
            val instant = Instant.now()
            val start = instant.toString()
            val end = instant.plusSeconds(86400).toString()
            try {
                db.execSQL("INSERT INTO tasks (id,title,type,start_at,end_at,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", arrayOf("qa-reminders", "QA", "DAILY", start, end, "#722f37", start, start))
                assertEquals(11, TaskReminderCoordinator.reconcile(context))
                val ids = storage.getSavedNotificationIds().toSet()
                assertEquals(11, ids.size)
                assertEquals(11, TaskReminderCoordinator.reconcile(context))
                assertEquals(ids, storage.getSavedNotificationIds().toSet())
                val receiver = com.personaltaskmanager.app.widget.WidgetBroadcastReceiver()
                val toggle = android.content.Intent(com.personaltaskmanager.app.widget.WidgetBroadcastReceiver.ACTION_TOGGLE_COMPLETE)
                    .putExtra(com.personaltaskmanager.app.widget.WidgetBroadcastReceiver.EXTRA_TASK_ID, "qa-reminders")
                receiver.handleIntent(context, toggle)
                assertTrue(storage.getSavedNotificationIds().isEmpty())
                receiver.handleIntent(context, toggle)
                assertEquals(11, storage.getSavedNotificationIds().size)
            } finally {
                db.delete("tasks", "id = ?", arrayOf("qa-reminders"))
                TaskReminderCoordinator.reconcile(context)
            }
        }
    }
}
