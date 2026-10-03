package com.personaltaskmanager.app.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/** SQLiteOpenHelper applies upgrades transactionally; SQL is shared with the web tests. */
class TaskManagerDatabaseHelper @JvmOverloads constructor(private val appContext: Context, databaseName: String = DATABASE_NAME) :
    SQLiteOpenHelper(appContext, databaseName, null, schemaVersion(appContext)) {
    companion object {
        // Capacitor strips an optional .db suffix before appending SQLite.db.
        const val DATABASE_NAME = "taskmanagerSQLite.db"
        fun schemaVersion(context: Context): Int = migrationFiles(context).maxOf { it.substringBefore('_').toInt() }
        private fun migrationFiles(context: Context): List<String> =
            context.assets.list("migrations")!!.filter { it.endsWith(".sql") }.sorted()
    }
    override fun onConfigure(db: SQLiteDatabase) { db.setForeignKeyConstraintsEnabled(true) }
    override fun onCreate(db: SQLiteDatabase) { apply(db, 0, schemaVersion(appContext)) }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) { apply(db, oldVersion, newVersion) }
    private fun apply(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        for (file in migrationFiles(appContext)) {
            val version = file.substringBefore('_').toInt()
            if (version > oldVersion && version <= newVersion) {
                val sql = appContext.assets.open("migrations/$file").bufferedReader().use { it.readText() }
                sql.split(';').map { it.trim() }.filter { it.isNotEmpty() }.forEach { db.execSQL(it) }
            }
        }
    }
}
