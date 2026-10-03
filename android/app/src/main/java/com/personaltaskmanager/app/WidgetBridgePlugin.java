package com.personaltaskmanager.app;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.personaltaskmanager.app.widget.WidgetBroadcastReceiver;

/**
 * Bridge between the web layer (React) and the native home-screen widgets.
 * The web app calls notifyWidgetsUpdated() after any data change so the
 * widgets refresh immediately instead of waiting for the next update.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    public static final String ACTION_WIDGET_DATA_CHANGED =
            "com.personaltaskmanager.app.widget.ACTION_WIDGET_DATA_CHANGED";

    @PluginMethod
    public void notifyWidgetsUpdated(PluginCall call) {
        // Explicit component broadcast: implicit broadcasts are not delivered to
        // non-exported receivers, and WidgetBroadcastReceiver is exported=false.
        Intent intent = new Intent(getContext(), WidgetBroadcastReceiver.class);
        intent.setAction(ACTION_WIDGET_DATA_CHANGED);
        getContext().sendBroadcast(intent);
        call.resolve();
    }
}