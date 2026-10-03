package com.personaltaskmanager.app.widget

import android.content.Context
import android.content.Intent
import androidx.core.app.JobIntentService

/**
 * Background service for widget operations (navigation, toggle, refresh).
 * Uses JobIntentService to avoid blocking the BroadcastReceiver main thread.
 * Enqueue is safe across Android versions; on API 26+ it uses JobScheduler.
 */
class WidgetUpdateService : JobIntentService() {

    companion object {
        private const val JOB_ID = 1001

        fun enqueueWork(context: Context, intent: Intent) {
            val work = Intent(context, WidgetUpdateService::class.java).apply {
                action = intent.action
                putExtras(intent)
                // Preserve original extras explicitly (some devices strip?)
                if (intent.hasExtra(WidgetBroadcastReceiver.EXTRA_WIDGET_ID)) {
                    putExtra(
                        WidgetBroadcastReceiver.EXTRA_WIDGET_ID,
                        intent.getIntExtra(WidgetBroadcastReceiver.EXTRA_WIDGET_ID, -1)
                    )
                }
                if (intent.hasExtra(WidgetBroadcastReceiver.EXTRA_TASK_ID)) {
                    putExtra(
                        WidgetBroadcastReceiver.EXTRA_TASK_ID,
                        intent.getStringExtra(WidgetBroadcastReceiver.EXTRA_TASK_ID)
                    )
                }
                if (intent.hasExtra(WidgetBroadcastReceiver.EXTRA_DAY_ISO)) {
                    putExtra(
                        WidgetBroadcastReceiver.EXTRA_DAY_ISO,
                        intent.getStringExtra(WidgetBroadcastReceiver.EXTRA_DAY_ISO)
                    )
                }
            }
            enqueueWork(context, WidgetUpdateService::class.java, JOB_ID, work)
        }
    }

    override fun onHandleWork(intent: Intent) {
        try {
            // Delegate to receiver logic on background thread
            WidgetBroadcastReceiver().handleIntent(this, intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
