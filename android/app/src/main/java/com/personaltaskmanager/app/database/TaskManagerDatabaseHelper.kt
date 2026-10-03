package com.personaltaskmanager.app.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.os.Build

/**
 * SQLiteOpenHelper that mirrors the JS migration v1.
 * Database file name must match Capacitor SQLite plugin:
 *   context.getDatabasePath("taskmanager.dbSQLite.db")
 */
class TaskManagerDatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "taskmanager.dbSQLite.db"
        const val DATABASE_VERSION = 1
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
        // WAL mode mirrors the plugin behaviour. Safe to call on API >= 16.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            try {
                db.enableWriteAheadLogging()
            } catch (_: Exception) {
                // Some devices / configurations may not support WAL; ignore.
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        // tasks
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              type TEXT NOT NULL CHECK (type IN ('DAILY','DEADLINE')),
              start_at TEXT NOT NULL,
              end_at TEXT NOT NULL,
              color TEXT NOT NULL,
              completed INTEGER NOT NULL DEFAULT 0,
              completed_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_tasks_start_at ON tasks(start_at);")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_tasks_end_at ON tasks(end_at);")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);")

        // events
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS events (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              start_at TEXT NOT NULL,
              end_at TEXT NOT NULL,
              color TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_events_end_at ON events(end_at);")

        // app_settings
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // No-op for v1. Future migrations must be additive and preserve user data.
    }
}
