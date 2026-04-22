import { supabase } from '../lib/supabase';

export const notificationService = {
  async isSupported() {
    // If we are in OneSignal mode, we consider it supported because the native bridge will handle it
    const publicKey = await this.getPublicKey();
    if (publicKey === "ONESIGNAL_MODE") {
      return { supported: true };
    }

    const hasSW = 'serviceWorker' in navigator;
    const hasPush = 'PushManager' in window;
    
    if (!hasSW || !hasPush) {
      return { 
        supported: false, 
        reason: !hasSW ? 'Service Worker no soportado' : 'Push Manager no soportado' 
      };
    }
    return { supported: true };
  },

  async getPublicKey() {
    try {
      const response = await fetch('/api/notifications/vapid-public-key');
      if (!response.ok) throw new Error('Error al obtener llave pública');
      const { publicKey } = await response.json();
      return publicKey;
    } catch (e) {
      console.error('Error fetching VAPID public key:', e);
      return "BHvAS8WcZyQ65Ja8V3TDeUT0i3MLcZeec4JsgoH6RK4ZU88qaxkWwsf3fhRact8tEQNvxesWpbVqiuf80nANCDI";
    }
  },

  async subscribeUser(userEmail: string) {
    // If we are in OneSignal mode (server returned ONESIGNAL_MODE for public key)
    const publicKey = await this.getPublicKey();
    
    if (publicKey === "ONESIGNAL_MODE") {
      // In a Median/OneSignal environment, we usually don't need a manual service worker subscribe
      // The native plugin handles it. We just need to register the external user ID.
      console.log('OneSignal mode detected. Registering external user ID:', userEmail);
      
      // We still save to Supabase to keep track of who is an admin for the notification list
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: String(userEmail),
          subscription_json: { type: 'onesignal', email: userEmail }
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      // If OneSignal JS SDK is present (via Median or Script)
      const anyWindow = window as any;
      if (anyWindow.OneSignal) {
        anyWindow.OneSignal.push(() => {
          anyWindow.OneSignal.setExternalUserId(userEmail);
        });
      }
      
      return { type: 'onesignal' };
    }

    const support = await this.isSupported();
    if (!support.supported) {
      throw new Error(support.reason || 'Notificaciones push no soportadas');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration.pushManager) {
        throw new Error('Push Manager no está disponible');
      }

      const publicKey = await this.getPublicKey();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      // We don't have Supabase Auth fully integrated with 'empleados' as users in standard way, 
      // but we can search for the user by email or just use a flag in localStorage.
      // Since the user requested saving to SQL, I'll assume we have a table 'push_subscriptions'.
      
      // For this demo/app, we'll use the email to identify the subscriber in the table
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: String(userEmail), // Force string to match text column in DB
          subscription_json: JSON.parse(JSON.stringify(subscription))
        }, { onConflict: 'user_id, subscription_json' });

      if (error) throw error;

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      throw error;
    }
  },

  async unsubscribeUser(userEmail: string) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from Supabase
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userEmail);
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  },

  async checkSubscription() {
    const publicKey = await this.getPublicKey();
    if (publicKey === "ONESIGNAL_MODE") {
      const anyWindow = window as any;
      if (anyWindow.OneSignal) {
        return true; // We assume true if OneSignal is initialized in Median
      }
    }

    const support = await this.isSupported();
    if (!support.supported) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  },

  async notifyAdmins(saleData: any) {
    try {
      // 1. Call backend to send the notifications via OneSignal
      await fetch('/api/notifications/notify-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            title: '¡Nueva Venta!',
            body: `Se ha realizado una venta por $${saleData.total.toFixed(2)}.`,
            data: { saleId: saleData.id }
          }
        })
      });
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
  },

  async sendTestNotification() {
    try {
      await fetch('/api/notifications/notify-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            title: '🔔 Notificación de Prueba',
            body: '¡Felicidades! El sistema de notificaciones de Stefy Beauty está activo y funcionando.',
            data: { type: 'test' }
          }
        })
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  },

  urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};
