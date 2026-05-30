import { supabase } from './supabase';

export const OfflineCache = {
  // Caching profile & matches data locally
  cacheData: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`beteseb_cache_${key}`, JSON.stringify(data));
      } catch (e) {
        console.error("Local storage caching failed:", e);
      }
    }
  },

  getCachedData: (key: string): any | null => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`beteseb_cache_${key}`);
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        console.error("Failed to read local storage cache:", e);
      }
    }
    return null;
  },

  // Queue offline message
  queueOfflineMessage: (message: {
    sender_id: string;
    receiver_id: string;
    content: string;
  }) => {
    if (typeof window !== 'undefined') {
      try {
        const queue = JSON.parse(localStorage.getItem('beteseb_offline_messages') || '[]');
        queue.push({
          ...message,
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          is_offline_pending: true
        });
        localStorage.setItem('beteseb_offline_messages', JSON.stringify(queue));
      } catch (e) {
        console.error("Failed to queue offline message:", e);
      }
    }
  },

  getOfflineQueue: (): any[] => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('beteseb_offline_messages') || '[]');
      } catch (e) {
        console.error("Failed to read offline message queue:", e);
      }
    }
    return [];
  },

  // Sync / Flush offline queue
  syncOfflineMessages: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    const queue = OfflineCache.getOfflineQueue();
    if (queue.length === 0) return true;

    console.log(`Beteseb Offline Sync: Syncing ${queue.length} pending offline messages...`);
    
    try {
      const messagesToSend = queue.map(({ sender_id, receiver_id, content }) => ({
        sender_id,
        receiver_id,
        content
      }));

      const { error } = await supabase.from('messages').insert(messagesToSend);
      
      if (!error) {
        localStorage.removeItem('beteseb_offline_messages');
        console.log("Beteseb Offline Sync: All offline messages successfully synchronized!");
        return true;
      } else {
        console.error("Failed to insert synced offline messages:", error);
      }
    } catch (e) {
      console.error("Error during offline sync process:", e);
    }
    return false;
  }
};

// Auto-register online sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("Beteseb Offline Sync: Internet connection restored. Triggering offline sync...");
    OfflineCache.syncOfflineMessages();
  });
}
