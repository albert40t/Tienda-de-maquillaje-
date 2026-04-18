import { useState, useEffect } from 'react';
import { offlineManager } from '../lib/offlineManager';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(offlineManager.getQueueLength());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      offlineManager.sync();
    };
    const handleOffline = () => setIsOnline(false);
    
    const handleQueueChange = (e: any) => {
      setPendingCount(e.detail);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChange as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChange as EventListener);
    };
  }, []);

  return { isOnline, pendingCount, sync: () => offlineManager.sync() };
}
