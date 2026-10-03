package com.personaltaskmanager.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class MonthlyCalendarWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val prefs = context.getSharedPreferences(WidgetBroadcastReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        for (widgetId in appWidgetIds) {
            val monthOffset = prefs.getInt("${WidgetBroadcastReceiver.KEY_MONTH_OFFSET}_$widgetId", 0)
            val selectedIso = prefs.getString("${WidgetBroadcastReceiver.KEY_SELECTED_DAY}_$widgetId", null)
            val rv = WidgetDataProvider.buildMonthlyCalendarRemoteViews(context, widgetId, monthOffset, selectedIso)
            appWidgetManager.updateAppWidget(widgetId, rv)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(WidgetBroadcastReceiver.PREFS_NAME, Context.MODE_PRIVATE).edit()
        for (id in appWidgetIds) {
            prefs.remove("${WidgetBroadcastReceiver.KEY_MONTH_OFFSET}_$id")
            prefs.remove("${WidgetBroadcastReceiver.KEY_SELECTED_DAY}_$id")
        }
        prefs.apply()
    }
}
