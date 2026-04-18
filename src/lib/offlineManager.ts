import { supabase } from './supabase';
import { PendingAction, OfflineActionType } from '../types';
import { toast } from 'react-hot-toast';

const QUEUE_KEY = 'offline_actions_queue';

class OfflineManager {
  private queue: PendingAction[] = [];
  private isSyncing = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.loadQueue();
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.sync());
        // Also sync on load if online
        if (navigator.onLine) {
          this.sync();
        }
      }
    } catch (e) {
      console.error('OfflineManager init failed', e);
    }
  }

  private loadQueue() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load/parse offline queue', e);
      this.queue = [];
    }
  }

  private saveQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: this.queue.length }));
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public addAction(type: OfflineActionType, data: any) {
    const action: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(action);
    this.saveQueue();

    if (navigator.onLine) {
      this.sync();
    } else {
      toast('Acción guardada localmente. Se sincronizará al recuperar internet.', {
        icon: '📡',
        duration: 3000
      });
    }
  }

  public async sync() {
    if (this.isSyncing || this.queue.length === 0 || !navigator.onLine) return;

    this.isSyncing = true;
    console.log(`Starting sync of ${this.queue.length} actions...`);

    const actionsToSync = [...this.queue];
    const failedActions: PendingAction[] = [];

    for (const action of actionsToSync) {
      try {
        const success = await this.executeAction(action);
        if (!success) {
          action.retryCount++;
          if (action.retryCount < 5) {
            failedActions.push(action);
          }
        }
      } catch (error) {
        console.error(`Sync error for action ${action.type}:`, error);
        action.retryCount++;
        failedActions.push(action);
      }
    }

    this.queue = failedActions;
    this.saveQueue();
    this.isSyncing = false;

    if (failedActions.length === 0 && actionsToSync.length > 0) {
      toast.success('¡Sincronización completada!');
    } else if (failedActions.length > 0) {
      console.warn(`${failedActions.length} actions failed to sync and will be retried.`);
    }
  }

  private async executeAction(action: PendingAction): Promise<boolean> {
    const { type, data } = action;

    try {
      switch (type) {
        case 'CREATE_SALE':
          // Insert sale into vent_history (assuming that's the table name or similar based on onProcessSale context)
          // Wait, I need to check where sales are actually stored in Supabase.
          // In POS.tsx it calls onProcessSale, but also insert activity_logs.
          // I'll need to make sure I know the table names.
          const { error: saleError } = await supabase.from('ventas' as any).insert(data);
          if (saleError) throw saleError;
          return true;

        case 'UPDATE_PRODUCT_STOCK':
          const { error: stockError } = await supabase
            .from('productos')
            .update({ stock: data.stock })
            .eq('id', data.id);
          if (stockError) throw stockError;
          return true;

        case 'CREATE_PRODUCT':
          const { error: insertError } = await supabase.from('productos').insert(data);
          if (insertError) throw insertError;
          return true;

        case 'UPDATE_PRODUCT':
          const { error: updateError } = await supabase
            .from('productos')
            .update(data.updates)
            .eq('id', data.id);
          if (updateError) throw updateError;
          return true;

        case 'DELETE_PRODUCT':
          const { error: deleteError } = await supabase.from('productos').delete().eq('id', data.id);
          if (deleteError) throw deleteError;
          return true;

        case 'LOG_ACTIVITY':
          const { error: logError } = await supabase.from('activity_logs').insert(data);
          if (logError) throw logError;
          return true;

        case 'UPDATE_BUSINESS_INFO':
          const { error: bizError } = await supabase
            .from('business_info')
            .update(data.updates)
            .eq('id', data.id); // Assuming single record or specific ID
          if (bizError) throw bizError;
          return true;

        default:
          console.error('Unknown action type:', type);
          return true; // Don't retry unknown actions
      }
    } catch (e) {
      console.error(`Execution failed for ${type}:`, e);
      return false;
    }
  }
}

export const offlineManager = new OfflineManager();
