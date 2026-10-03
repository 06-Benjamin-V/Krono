package com.personaltaskmanager.app.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.database.Cursor
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import com.personaltaskmanager.app.R
import com.personaltaskmanager.app.database.TaskManagerContentProvider
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

object WidgetDataProvider {

    // Spanish locale formatters
    private val dayHeaderFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("d MMMM yyyy", Locale("es", "ES"))
    private val monthHeaderFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("MMMM yyyy", Locale("es", "ES"))
    private val timeFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("HH:mm")

    private val isoMillis = java.time.format.DateTimeFormatterBuilder().appendInstant(3).toFormatter()
    private val zone: ZoneId get() = ZoneId.systemDefault()

    // ---------- Theme ----------

    private data class WidgetColors(
        val background: Int,
        val text: Int,
        val textSecondary: Int,
        val textMuted: Int,
        val divider: Int,
        val primary: Int,
        val otherMonth: Int
    )

    // Mirrors src/styles/themes.css (light/dark variables)
    private val lightColors = WidgetColors(
        background = Color.parseColor("#FAF6F5"),
        text = Color.parseColor("#2B1B1E"),
        textSecondary = Color.parseColor("#6E5D60"),
        textMuted = Color.parseColor("#7A6A6D"),
        divider = Color.parseColor("#E7DCDD"),
        primary = Color.parseColor("#722F37"),
        otherMonth = Color.parseColor("#B9A9AC")
    )

    private val darkColors = WidgetColors(
        background = Color.parseColor("#171012"),
        text = Color.parseColor("#F5EDEE"),
        textSecondary = Color.parseColor("#A99A9D"),
        textMuted = Color.parseColor("#A08F92"),
        divider = Color.parseColor("#3A2A2E"),
        primary = Color.parseColor("#B04A52"),
        otherMonth = Color.parseColor("#5A4A4E")
    )

    /**
     * Reads the app theme persisted in SQLite (app_settings key "theme",
     * written by ThemeContext/useAppInit). Falls back to the system dark mode.
     */
    private fun isDarkTheme(context: Context): Boolean {
        val uiMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        val systemDark = uiMode == Configuration.UI_MODE_NIGHT_YES
        return try {
            val cursor = context.contentResolver.query(
                TaskManagerContentProvider.CONTENT_URI_SETTINGS,
                arrayOf("value"),
                "key = ?",
                arrayOf("theme"),
                null
            )
            cursor?.use {
                if (it.moveToFirst()) {
                    val v = it.getString(0)
                    if (v == "dark") return true
                    if (v == "light") return false
                }
            }
            systemDark
        } catch (_: Exception) {
            systemDark
        }
    }

    data class TaskRow(
        val id: String,
        val title: String,
        val type: String,
        val startAt: String,
        val endAt: String,
        val color: String,
        val completed: Int
    )

    data class EventRow(
        val id: String,
        val title: String,
        val startAt: String,
        val endAt: String,
        val color: String
    )

    // ---------- DB helpers ----------

    private fun queryTasksForDay(context: Context, startIso: String, endIso: String): List<TaskRow> {
        val out = mutableListOf<TaskRow>()
        val selection = "start_at <= ? AND end_at >= ?"
        val args = arrayOf(endIso, startIso)
        val cursor: Cursor? = context.contentResolver.query(
            TaskManagerContentProvider.CONTENT_URI_TASKS,
            null, selection, args, null
        )
        cursor?.use {
            val idxId = it.getColumnIndexOrThrow("id")
            val idxTitle = it.getColumnIndexOrThrow("title")
            val idxType = it.getColumnIndexOrThrow("type")
            val idxStart = it.getColumnIndexOrThrow("start_at")
            val idxEnd = it.getColumnIndexOrThrow("end_at")
            val idxColor = it.getColumnIndexOrThrow("color")
            val idxCompleted = it.getColumnIndexOrThrow("completed")
            while (it.moveToNext()) {
                out.add(
                    TaskRow(
                        id = it.getString(idxId),
                        title = it.getString(idxTitle) ?: "",
                        type = it.getString(idxType) ?: "",
                        startAt = it.getString(idxStart) ?: "",
                        endAt = it.getString(idxEnd) ?: "",
                        color = it.getString(idxColor) ?: "#3B82F6",
                        completed = it.getInt(idxCompleted)
                    )
                )
            }
        }
        return out
    }

    private fun queryEventsForDay(context: Context, startIso: String, endIso: String): List<EventRow> {
        val out = mutableListOf<EventRow>()
        val selection = "start_at <= ? AND end_at >= ?"
        val args = arrayOf(endIso, startIso)
        val cursor: Cursor? = context.contentResolver.query(
            TaskManagerContentProvider.CONTENT_URI_EVENTS,
            null, selection, args, null
        )
        cursor?.use {
            val idxId = it.getColumnIndexOrThrow("id")
            val idxTitle = it.getColumnIndexOrThrow("title")
            val idxStart = it.getColumnIndexOrThrow("start_at")
            val idxEnd = it.getColumnIndexOrThrow("end_at")
            val idxColor = it.getColumnIndexOrThrow("color")
            while (it.moveToNext()) {
                out.add(
                    EventRow(
                        id = it.getString(idxId),
                        title = it.getString(idxTitle) ?: "",
                        startAt = it.getString(idxStart) ?: "",
                        endAt = it.getString(idxEnd) ?: "",
                        color = it.getString(idxColor) ?: "#3B82F6"
                    )
                )
            }
        }
        return out
    }

    private fun localDateToRangeIso(date: LocalDate): Pair<String, String> {
        val start = isoMillis.format(date.atStartOfDay(zone).toInstant())
        val end = isoMillis.format(date.atTime(LocalTime.MAX).atZone(zone).toInstant())
        return start to end
    }

    private fun instantParseSafe(iso: String): Instant? = try {
        Instant.parse(iso)
    } catch (_: Exception) {
        null
    }

    private fun overlaps(itemStartIso: String, itemEndIso: String, cellDate: LocalDate): Boolean {
        val s = instantParseSafe(itemStartIso) ?: return false
        val e = instantParseSafe(itemEndIso) ?: return false
        val (cellStartIso, cellEndIso) = localDateToRangeIso(cellDate)
        val cs = instantParseSafe(cellStartIso) ?: return false
        val ce = instantParseSafe(cellEndIso) ?: return false
        return !s.isAfter(ce) && !e.isBefore(cs)
    }

    private fun formatDayHeader(date: LocalDate): String = dayHeaderFormatter.format(date)

    private fun formatMonthHeader(yearMonth: YearMonth): String = monthHeaderFormatter.format(yearMonth)

    private fun formatTimeIso(iso: String): String {
        val inst = instantParseSafe(iso) ?: return ""
        return try {
            timeFormatter.format(inst.atZone(zone))
        } catch (_: Exception) {
            ""
        }
    }

    private fun safeColor(hex: String): Int = try {
        Color.parseColor(hex)
    } catch (_: Exception) {
        Color.parseColor("#3B82F6")
    }

    // ---------- Daily ----------

    fun buildDailyListRemoteViews(
        context: Context,
        appWidgetId: Int,
        dayOffset: Int
    ): RemoteViews {
        val targetDate = LocalDate.now(zone).plusDays(dayOffset.toLong())
        val (startIso, endIso) = localDateToRangeIso(targetDate)
        val tasks = queryTasksForDay(context, startIso, endIso)
        val events = queryEventsForDay(context, startIso, endIso)

        val rv = RemoteViews(context.packageName, R.layout.widget_daily_list)

        // Theme colors (matches the app's light/dark theme)
        val themeColors = if (isDarkTheme(context)) darkColors else lightColors
        rv.setInt(R.id.widget_root, "setBackgroundColor", themeColors.background)
        rv.setTextColor(R.id.tv_day_header, themeColors.text)
        rv.setTextColor(R.id.btn_prev_day, themeColors.primary)
        rv.setTextColor(R.id.btn_next_day, themeColors.primary)
        rv.setInt(R.id.divider_daily, "setBackgroundColor", themeColors.divider)
        rv.setTextColor(R.id.tv_empty, themeColors.textMuted)

        // Header
        rv.setTextViewText(R.id.tv_day_header, formatDayHeader(targetDate))

        // Nav intents
        rv.setOnClickPendingIntent(
            R.id.btn_prev_day,
            createActionPendingIntent(context, WidgetBroadcastReceiver.ACTION_PREV_DAY, appWidgetId, 1001)
        )
        rv.setOnClickPendingIntent(
            R.id.btn_next_day,
            createActionPendingIntent(context, WidgetBroadcastReceiver.ACTION_NEXT_DAY, appWidgetId, 1002)
        )

        // Clear previous items
        rv.removeAllViews(R.id.container_items)

        if (tasks.isEmpty() && events.isEmpty()) {
            rv.setViewVisibility(R.id.tv_empty, View.VISIBLE)
            rv.setViewVisibility(R.id.container_items, View.GONE)
        } else {
            rv.setViewVisibility(R.id.tv_empty, View.GONE)
            rv.setViewVisibility(R.id.container_items, View.VISIBLE)

            // Sort: incomplete tasks first, then completed, then events? Keep chronological by startAt
            val sortedTasks = tasks.sortedWith(compareBy({ it.completed }, { it.startAt }))
            val sortedEvents = events.sortedBy { it.startAt }

            for ((taskIndex, t) in sortedTasks.withIndex()) {
                val itemRv = RemoteViews(context.packageName, R.layout.widget_daily_list_item)
                itemRv.setTextViewText(R.id.tv_item_title, t.title)
                itemRv.setTextColor(R.id.tv_item_title, themeColors.text)
                val timeLabel = formatTimeIso(t.startAt)
                val typeLabel = if (t.type == "DAILY") "24 HORAS" else "PLAZO"
                val subtitle = if (timeLabel.isNotEmpty()) "$timeLabel · $typeLabel" else typeLabel
                itemRv.setTextViewText(R.id.tv_item_subtitle, subtitle)
                itemRv.setTextColor(R.id.tv_item_subtitle, themeColors.textSecondary)
                itemRv.setInt(R.id.view_color_bar, "setBackgroundColor", safeColor(t.color))
                // Completion visual: ✓ when completed, empty otherwise (TextView, RemoteViews-safe)
                itemRv.setViewVisibility(R.id.cb_complete, View.VISIBLE)
                itemRv.setTextViewText(R.id.cb_complete, if (t.completed == 1) "✓" else "")
                itemRv.setTextColor(R.id.cb_complete, themeColors.primary)
                // Click on checkbox toggles complete
                val toggleIntent = Intent(context, WidgetBroadcastReceiver::class.java).apply {
                    action = WidgetBroadcastReceiver.ACTION_TOGGLE_COMPLETE
                    putExtra(WidgetBroadcastReceiver.EXTRA_WIDGET_ID, appWidgetId)
                    putExtra(WidgetBroadcastReceiver.EXTRA_TASK_ID, t.id)
                }
                // Stable unique request code: widgetId * 100_000 + taskIndex
                val requestCode = appWidgetId * 100_000 + taskIndex
                val pi = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    toggleIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                itemRv.setOnClickPendingIntent(R.id.cb_complete, pi)
                // Also allow clicking the whole item? optionally
                rv.addView(R.id.container_items, itemRv)
            }

            for (e in sortedEvents) {
                val itemRv = RemoteViews(context.packageName, R.layout.widget_daily_list_item)
                itemRv.setTextViewText(R.id.tv_item_title, e.title)
                itemRv.setTextColor(R.id.tv_item_title, themeColors.text)
                val startLabel = formatTimeIso(e.startAt)
                val endLabel = formatTimeIso(e.endAt)
                val subtitle = if (startLabel.isNotEmpty() && endLabel.isNotEmpty()) "$startLabel – $endLabel" else "Evento"
                itemRv.setTextViewText(R.id.tv_item_subtitle, subtitle)
                itemRv.setTextColor(R.id.tv_item_subtitle, themeColors.textSecondary)
                itemRv.setInt(R.id.view_color_bar, "setBackgroundColor", safeColor(e.color))
                itemRv.setViewVisibility(R.id.cb_complete, View.GONE)
                rv.addView(R.id.container_items, itemRv)
            }
        }

        // Optional: click on empty header to open app
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val pi = PendingIntent.getActivity(
                context,
                appWidgetId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            rv.setOnClickPendingIntent(R.id.tv_day_header, pi)
        }

        return rv
    }

    // ---------- Monthly ----------

    fun buildMonthlyCalendarRemoteViews(
        context: Context,
        appWidgetId: Int,
        monthOffset: Int,
        selectedDayIso: String?
    ): RemoteViews {
        val today = LocalDate.now(zone)
        val yearMonth = YearMonth.from(today).plusMonths(monthOffset.toLong())
        val selectedDate: LocalDate = try {
            if (selectedDayIso != null) {
                val inst = Instant.parse(selectedDayIso)
                inst.atZone(zone).toLocalDate()
            } else today
        } catch (_: Exception) {
            // fallback: try parse as local date string yyyy-MM-dd
            try {
                LocalDate.parse(selectedDayIso)
            } catch (_: Exception) {
                today
            }
        }

        val rv = RemoteViews(context.packageName, R.layout.widget_monthly_calendar)
        rv.setTextViewText(R.id.tv_month_header, formatMonthHeader(yearMonth))

        // Theme colors (matches the app's light/dark theme)
        val themeColors = if (isDarkTheme(context)) darkColors else lightColors
        rv.setInt(R.id.widget_root, "setBackgroundColor", themeColors.background)
        rv.setTextColor(R.id.tv_month_header, themeColors.text)
        rv.setTextColor(R.id.btn_prev_month, themeColors.primary)
        rv.setTextColor(R.id.btn_next_month, themeColors.primary)
        rv.setInt(R.id.divider_monthly, "setBackgroundColor", themeColors.divider)
        val weekdayIds = intArrayOf(
            R.id.tv_wd_0, R.id.tv_wd_1, R.id.tv_wd_2, R.id.tv_wd_3,
            R.id.tv_wd_4, R.id.tv_wd_5, R.id.tv_wd_6
        )
        for (wdId in weekdayIds) rv.setTextColor(wdId, themeColors.textSecondary)
        rv.setTextColor(R.id.tv_task_count, themeColors.text)
        rv.setTextColor(R.id.tv_event_count, themeColors.text)
        rv.setTextColor(R.id.tv_counter_sep, themeColors.textMuted)

        // Month nav
        rv.setOnClickPendingIntent(
            R.id.btn_prev_month,
            createActionPendingIntent(context, WidgetBroadcastReceiver.ACTION_PREV_MONTH, appWidgetId, 2001)
        )
        rv.setOnClickPendingIntent(
            R.id.btn_next_month,
            createActionPendingIntent(context, WidgetBroadcastReceiver.ACTION_NEXT_MONTH, appWidgetId, 2002)
        )

        // Build grid 42 days
        val firstOfMonth = yearMonth.atDay(1)
        val offset = firstOfMonth.dayOfWeek.value - 1 // Monday 0
        val gridStart = firstOfMonth.minusDays(offset.toLong())
        val gridDays = (0 until 42).map { gridStart.plusDays(it.toLong()) }

        // Query range covering entire grid
        val gridStartIso = localDateToRangeIso(gridDays.first()).first
        val gridEndIso = localDateToRangeIso(gridDays.last()).second
        val tasks = queryTasksForDay(context, gridStartIso, gridEndIso)
        val events = queryEventsForDay(context, gridStartIso, gridEndIso)

        // Clear weeks
        val weekIds = intArrayOf(
            R.id.week_0, R.id.week_1, R.id.week_2, R.id.week_3, R.id.week_4, R.id.week_5
        )
        for (weekId in weekIds) rv.removeAllViews(weekId)

        for ((index, cellDate) in gridDays.withIndex()) {
            val week = index / 7
            val weekId = weekIds[week]

            val cellRv = RemoteViews(context.packageName, R.layout.widget_calendar_day_cell)
            cellRv.setTextViewText(R.id.tv_day_number, cellDate.dayOfMonth.toString())

            // Style: selected = primary background + white text (like the app),
            // today = primary text, other month faded
            val isCurrentMonth = cellDate.month == yearMonth.month
            val isSelected = cellDate == selectedDate
            val isToday = cellDate == today

            val textColor = when {
                isSelected -> Color.WHITE
                !isCurrentMonth -> themeColors.otherMonth
                isToday -> themeColors.primary
                else -> themeColors.text
            }
            cellRv.setTextColor(R.id.tv_day_number, textColor)

            // Background for selected (plain color, RemoteViews-safe)
            if (isSelected) {
                cellRv.setInt(R.id.cell_container, "setBackgroundColor", themeColors.primary)
            } else {
                cellRv.setInt(R.id.cell_container, "setBackgroundColor", Color.TRANSPARENT)
            }

            // Dots: collect colors overlapping this cell
            val colors = mutableListOf<String>()
            for (t in tasks) if (overlaps(t.startAt, t.endAt, cellDate)) colors.add(t.color)
            for (e in events) if (overlaps(e.startAt, e.endAt, cellDate)) colors.add(e.color)
            val dots = colors.take(4)

            val dotIds = intArrayOf(R.id.dot_0, R.id.dot_1, R.id.dot_2, R.id.dot_3)
            for (i in dotIds.indices) {
                if (i < dots.size) {
                    cellRv.setViewVisibility(dotIds[i], View.VISIBLE)
                    // Dots are TextViews tinted with the item color (RemoteViews-safe)
                    cellRv.setInt(dotIds[i], "setBackgroundColor", safeColor(dots[i]))
                } else {
                    cellRv.setViewVisibility(dotIds[i], View.GONE)
                }
            }

            // Click intent for selecting day
            val dayIso = cellDate.atStartOfDay(zone).toInstant().toString()
            val selectIntent = Intent(context, WidgetBroadcastReceiver::class.java).apply {
                action = WidgetBroadcastReceiver.ACTION_SELECT_DAY
                putExtra(WidgetBroadcastReceiver.EXTRA_WIDGET_ID, appWidgetId)
                putExtra(WidgetBroadcastReceiver.EXTRA_DAY_ISO, dayIso)
                putExtra(WidgetBroadcastReceiver.EXTRA_MONTH_OFFSET, monthOffset)
            }
            val pi = PendingIntent.getBroadcast(
                context,
                3000 + appWidgetId * 100 + index,
                selectIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            cellRv.setOnClickPendingIntent(R.id.cell_container, pi)

            rv.addView(weekId, cellRv)
        }

        // Counters for selected day
        val selectedTasks = tasks.count { overlaps(it.startAt, it.endAt, selectedDate) }
        val selectedEvents = events.count { overlaps(it.startAt, it.endAt, selectedDate) }
        rv.setTextViewText(R.id.tv_task_count, "Tareas: $selectedTasks")
        rv.setTextViewText(R.id.tv_event_count, "Eventos: $selectedEvents")

        return rv
    }

    private fun createActionPendingIntent(
        context: Context,
        action: String,
        appWidgetId: Int,
        baseCode: Int
    ): PendingIntent {
        val intent = Intent(context, WidgetBroadcastReceiver::class.java).apply {
            this.action = action
            putExtra(WidgetBroadcastReceiver.EXTRA_WIDGET_ID, appWidgetId)
        }
        val requestCode = appWidgetId * 10000 + baseCode
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
