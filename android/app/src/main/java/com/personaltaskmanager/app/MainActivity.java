package com.personaltaskmanager.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the custom plugin before the bridge initializes so the web
        // layer can call WidgetBridge.notifyWidgetsUpdated() on native builds.
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}