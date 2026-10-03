package com.personaltaskmanager.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class DailyListWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (widgetId in appWidgetIds) {
            val prefs = context.getSharedPreferences(WidgetBroadcastReceiver.PREFS_NAME, Context.MODE_PRIVATE)
            val offset = prefs.getInt("${WidgetBroadcastReceiver.KEY_DAY_OFFSET}_$widgetId", 0)
            val rv = WidgetDataProvider.buildDailyListRemoteViews(context, widgetId, offset)
            appWidgetManager.updateAppWidget(widgetId, rv)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(WidgetBroadcastReceiver.PREFS_NAME, Context.MODE_PRIVATE).edit()
        for (id in appWidgetIds) {
            prefs.remove("${WidgetBroadcastReceiver.KEY_DAY_OFFSET}_$id")
        }
        prefs.apply()
    }
}
