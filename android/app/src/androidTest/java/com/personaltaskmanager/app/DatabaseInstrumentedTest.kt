package com.personaltaskmanager.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.personaltaskmanager.app.database.TaskManagerDatabaseHelper
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class DatabaseInstrumentedTest {
    @Test fun reopeningPreservesTaskAndSettings() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "qa-${UUID.randomUUID()}.db"
        try {
            TaskManagerDatabaseHelper(context, name).use { helper ->
                val db = helper.writableDatabase
                db.execSQL("INSERT INTO tasks (id,title,type,start_at,end_at,color,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)", arrayOf("qa", "Prueba", "DAILY", "2026-10-03T10:00:00.000Z", "2026-10-04T10:00:00.000Z", "#722f37", 1, "2026-10-03T10:00:00.000Z", "2026-10-03T10:00:00.000Z"))
                db.execSQL("INSERT INTO app_settings (key,value) VALUES (?,?)", arrayOf("deadlineTaskNotificationIntervalHours", "6"))
                assertEquals(1, db.version)
            }
            TaskManagerDatabaseHelper(context, name).use { helper ->
                helper.readableDatabase.rawQuery("SELECT color,completed FROM tasks WHERE id = ?", arrayOf("qa")).use {
                    assertTrue(it.moveToFirst()); assertEquals("#722f37", it.getString(0)); assertEquals(1, it.getInt(1))
                }
                helper.readableDatabase.rawQuery("SELECT value FROM app_settings WHERE key = ?", arrayOf("deadlineTaskNotificationIntervalHours")).use {
                    assertTrue(it.moveToFirst()); assertEquals("6", it.getString(0))
                }
            }
        } finally { context.deleteDatabase(name) }
    }
}
