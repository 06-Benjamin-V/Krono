import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

export interface WidgetBridgePlugin {
  /** Notifies native home-screen widgets that data changed so they refresh. */
  notifyWidgetsUpdated(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

/**
 * Best-effort notification to native widgets. Safe to call on web/tests
 * (no-op) and never throws.
 */
export async function notifyWidgetsUpdated(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetBridge.notifyWidgetsUpdated();
  } catch {
    // Best-effort: widget refresh failure must not break app operations.
  }
}