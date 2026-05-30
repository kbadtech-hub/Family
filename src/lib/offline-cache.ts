import { supabase } from './supabase';

export interface OfflineMessage {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_offline?: boolean;
}

export const OfflineCache = {
  // Profiles Caching
  cacheProfiles: (key: string, data: any): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`beteseb_cache_profiles_${key}`, JSON.stringify(data));
      } catch (e) {
        console.error("Profile caching failed", e);
      }
    }
  },

  getCachedProfiles: (key: string): any | null => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`beteseb_cache_profiles_${key}`);
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        console.error("Reading profile cache failed", e);
      }
    }
    return null;
  },

  // Messages Caching
  cacheMessages: (chatKey: string, messages: any[]): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`beteseb_cache_msg_${chatKey}`, JSON.stringify(messages));
      } catch (e) {
        console.error("Message caching failed", e);
      }
    }
  },

  getCachedMessages: (chatKey: string): any[] => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`beteseb_cache_msg_${chatKey}`);
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.error("Reading message cache failed", e);
      }
    }
    return [];
  },

  // Offline Message Queueing
  queueOfflineMessage: (msg: OfflineMessage): void => {
    if (typeof window !== 'undefined') {
      try {
        const queue: OfflineMessage[] = JSON.parse(
          localStorage.getItem('beteseb_offline_messages_queue') || '[]'
        );
        queue.push(msg);
        localStorage.setItem('beteseb_offline_messages_queue', JSON.stringify(queue));
      } catch (e) {
        console.error("Queueing offline message failed", e);
      }
    }
  },

  getOfflineQueue: (): OfflineMessage[] => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('beteseb_offline_messages_queue') || '[]');
      } catch (e) {
        console.error("Reading offline queue failed", e);
      }
    }
    return [];
  },

  clearOfflineQueue: (): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('beteseb_offline_messages_queue');
      } catch (e) {
        console.error("Clearing offline queue failed", e);
      }
    }
  },

  // Flush Queue to Supabase when back online
  syncOfflineMessages: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.onLine) return false;

    const queue = OfflineCache.getOfflineQueue();
    if (queue.length === 0) return true;

    console.log(`Beteseb Cache: Syncing ${queue.length} offline messages...`);
    try {
      // Prepare messages for bulk insert, omitting temporary fields
      const payload = queue.map(msg => ({
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content
      }));

      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw error;

      OfflineCache.clearOfflineQueue();
      console.log("Beteseb Cache: Offline message sync successful!");
      return true;
    } catch (e) {
      console.error("Offline message synchronization failed", e);
      return false;
    }
  }
};

// Initialize automatic synchronization listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    OfflineCache.syncOfflineMessages();
  });
}
