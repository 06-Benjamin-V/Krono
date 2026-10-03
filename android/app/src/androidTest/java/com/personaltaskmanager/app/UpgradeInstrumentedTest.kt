package com.personaltaskmanager.app

import android.database.sqlite.SQLiteDatabase
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Explicit two-install QA workflow: -e upgradeMode seed, then install -r, then verify. */
@RunWith(AndroidJUnit4::class)
class UpgradeInstrumentedTest {
    @Test fun preserveAcrossApkUpdate() {
        val mode = InstrumentationRegistry.getArguments().getString("upgradeMode")
        assumeTrue(mode == "seed" || mode == "verify")
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)!!
        launch.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        val activity = instrumentation.startActivitySync(launch)
        val file = context.getDatabasePath("taskmanagerSQLite.db")
        try {
            val deadline = System.currentTimeMillis() + 15000
            while (!file.exists() && System.currentTimeMillis() < deadline) Thread.sleep(100)
            assertTrue("La app debe crear su base nativa", file.exists())
            SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE).use { db ->
                while (System.currentTimeMillis() < deadline) {
                    val exists = db.rawQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'", null).use { it.moveToFirst() }
                    if (exists) break
                    Thread.sleep(100)
                }
                if (mode == "seed") {
                    db.rawQuery("SELECT COUNT(*) FROM tasks", null).use { it.moveToFirst(); assertEquals("Solo instalación de QA vacía", 0, it.getInt(0)) }
                    db.execSQL("INSERT INTO tasks (id,title,type,start_at,end_at,color,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)", arrayOf<Any>("qa-upgrade", "Conservar al actualizar", "DAILY", "2026-10-01T10:00:00.000Z", "2026-10-02T10:00:00.000Z", "#8B5CF6", 1, "2026-10-01T10:00:00.000Z", "2026-10-01T10:00:00.000Z"))
                    db.execSQL("INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)", arrayOf("deadlineTaskNotificationIntervalHours", "6"))
                    val backup = java.io.File(context.cacheDir, "qa-upgrade-backup.db")
                    assertFalse(backup.exists())
                    db.execSQL("VACUUM INTO ?", arrayOf(backup.path))
                }
                db.rawQuery("SELECT title,color,completed FROM tasks WHERE id=?", arrayOf("qa-upgrade")).use {
                    assertTrue(it.moveToFirst()); assertEquals("Conservar al actualizar", it.getString(0)); assertEquals("#8B5CF6", it.getString(1)); assertEquals(1, it.getInt(2))
                }
                db.rawQuery("SELECT value FROM app_settings WHERE key=?", arrayOf("deadlineTaskNotificationIntervalHours")).use {
                    assertTrue(it.moveToFirst()); assertEquals("6", it.getString(0))
                }
                SQLiteDatabase.openDatabase(java.io.File(context.cacheDir, "qa-upgrade-backup.db").path, null, SQLiteDatabase.OPEN_READONLY).use { backup ->
                    backup.rawQuery("SELECT id FROM tasks WHERE id=?", arrayOf("qa-upgrade")).use { assertTrue(it.moveToFirst()) }
                }
            }
            if (mode == "verify") {
                var content = ""
                val readyBy = System.currentTimeMillis() + 15000
                while (!content.contains("Tu día, a tu ritmo.") && System.currentTimeMillis() < readyBy) {
                    val latch = java.util.concurrent.CountDownLatch(1)
                    instrumentation.runOnMainSync {
                        (activity as com.getcapacitor.BridgeActivity).bridge.webView.evaluateJavascript("document.body.innerText") {
                            content = it; latch.countDown()
                        }
                    }
                    latch.await(1, java.util.concurrent.TimeUnit.SECONDS)
                    if (!content.contains("Tu día, a tu ritmo.")) Thread.sleep(100)
                }
                assertTrue("La interfaz debe salir de inicialización: $content", content.contains("Tu día, a tu ritmo."))
            }
        } finally { instrumentation.runOnMainSync { activity.finish() } }
    }
}
