import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

interface QueuedAction {
  id: string;
  type: 'mark_dose' | 'mark_slot';
  payload: any;
  timestamp: number;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  queuedCount: number;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
  syncNow: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>(() => {
    try {
      const stored = localStorage.getItem('aangan_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queue]);

  const saveQueue = (newQueue: QueuedAction[]) => {
    setQueue(newQueue);
    localStorage.setItem('aangan_offline_queue', JSON.stringify(newQueue));
  };

  const queueAction = (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: Math.random().toString(36).substring(2),
      timestamp: Date.now(),
    };
    const updated = [...queue, newAction];
    saveQueue(updated);
  };

  const syncQueue = async () => {
    if (!navigator.onLine || queue.length === 0) return;
    const currentQueue = [...queue];
    const remaining: QueuedAction[] = [];

    for (const item of currentQueue) {
      try {
        if (item.type === 'mark_dose') {
          await api.updateDose(item.payload.doseId, item.payload.status);
        } else if (item.type === 'mark_slot') {
          await api.markSlotAll(item.payload.date, item.payload.slot);
        }
      } catch {
        remaining.push(item);
      }
    }

    saveQueue(remaining);
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        queuedCount: queue.length,
        queueAction,
        syncNow: syncQueue,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  return context;
}
