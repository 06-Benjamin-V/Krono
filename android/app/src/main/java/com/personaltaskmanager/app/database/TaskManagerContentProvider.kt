package com.personaltaskmanager.app.database

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.database.Cursor
import android.database.sqlite.SQLiteQueryBuilder
import android.net.Uri

/**
 * Exposes tasks / events / app_settings to widgets (and potentially other
 * in-process consumers) via the same SQLite file used by the Capacitor JS layer.
 *
 * Authorities: com.personaltaskmanager.app.widgetdata
 * Paths: /tasks , /events , /app_settings
 */
class TaskManagerContentProvider : ContentProvider() {

    companion object {
        const val AUTHORITY = "com.personaltaskmanager.app.widgetdata"
        val CONTENT_URI_TASKS: Uri = Uri.parse("content://$AUTHORITY/tasks")
        val CONTENT_URI_EVENTS: Uri = Uri.parse("content://$AUTHORITY/events")
        val CONTENT_URI_SETTINGS: Uri = Uri.parse("content://$AUTHORITY/app_settings")

        private const val CODE_TASKS = 1
        private const val CODE_EVENTS = 2
        private const val CODE_SETTINGS = 3

        private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "tasks", CODE_TASKS)
            addURI(AUTHORITY, "events", CODE_EVENTS)
            addURI(AUTHORITY, "app_settings", CODE_SETTINGS)
        }

        private fun tableForCode(code: Int): String = when (code) {
            CODE_TASKS -> "tasks"
            CODE_EVENTS -> "events"
            CODE_SETTINGS -> "app_settings"
            else -> throw IllegalArgumentException("Unknown URI code $code")
        }

        private fun mimeForCode(code: Int): String = when (code) {
            CODE_TASKS -> "vnd.android.cursor.dir/vnd.$AUTHORITY.tasks"
            CODE_EVENTS -> "vnd.android.cursor.dir/vnd.$AUTHORITY.events"
            CODE_SETTINGS -> "vnd.android.cursor.dir/vnd.$AUTHORITY.app_settings"
            else -> throw IllegalArgumentException("Unknown URI code $code")
        }
    }

    private lateinit var helper: TaskManagerDatabaseHelper

    override fun onCreate(): Boolean {
        helper = TaskManagerDatabaseHelper(appContext())
        return true
    }

    private fun appContext() = context
        ?: throw IllegalStateException("ContentProvider not attached to context")

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        val code = uriMatcher.match(uri)
        if (code == UriMatcher.NO_MATCH) throw IllegalArgumentException("Unknown URI $uri")
        val table = tableForCode(code)
        val qb = SQLiteQueryBuilder().apply { tables = table }
        val db = helper.readableDatabase
        val cursor = qb.query(db, projection, selection, selectionArgs, null, null, sortOrder)
        cursor.setNotificationUri(appContext().contentResolver, uri)
        return cursor
    }

    override fun getType(uri: Uri): String? {
        val code = uriMatcher.match(uri)
        if (code == UriMatcher.NO_MATCH) return null
        return mimeForCode(code)
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        val code = uriMatcher.match(uri)
        if (code == UriMatcher.NO_MATCH) throw IllegalArgumentException("Unknown URI $uri")
        val table = tableForCode(code)
        val db = helper.writableDatabase
        val id = db.insertOrThrow(table, null, values)
        val resultUri = Uri.withAppendedPath(uri, id.toString())
        appContext().contentResolver.notifyChange(uri, null)
        return resultUri
    }

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int {
        val code = uriMatcher.match(uri)
        if (code == UriMatcher.NO_MATCH) throw IllegalArgumentException("Unknown URI $uri")
        val table = tableForCode(code)
        val db = helper.writableDatabase
        val rows = db.delete(table, selection, selectionArgs)
        if (rows > 0) appContext().contentResolver.notifyChange(uri, null)
        return rows
    }

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?
    ): Int {
        val code = uriMatcher.match(uri)
        if (code == UriMatcher.NO_MATCH) throw IllegalArgumentException("Unknown URI $uri")
        val table = tableForCode(code)
        val db = helper.writableDatabase
        val rows = db.update(table, values, selection, selectionArgs)
        if (rows > 0) appContext().contentResolver.notifyChange(uri, null)
        return rows
    }
}
