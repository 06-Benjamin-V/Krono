import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
export function useResume(callback: () => void): void {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = App.addListener('appStateChange', ({isActive}) => { if (isActive) callback(); });
      void listener.catch(() => undefined);
      return () => { void listener.then(handle => handle.remove()).catch(() => undefined); };
    }
    const onVisible = (): void => { if (document.visibilityState === 'visible') callback(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [callback]);
}
