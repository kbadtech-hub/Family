import { supabase } from './supabase';

export async function registerPushNotifications() {
  if (typeof window === 'undefined') return;

  const win = window as any;
  const isNative = win.Capacitor?.isNativePlatform?.();
  
  if (!isNative) {
    console.log("Push notifications gracefully bypassed in Web platform.");
    return;
  }

  try {
    const PushNotifications = win.Capacitor?.Plugins?.PushNotifications;
    if (!PushNotifications) {
      console.warn("Capacitor PushNotifications plugin is not loaded.");
      return;
    }

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive === 'granted') {
      await PushNotifications.register();
      
      // Handle push token registration and update the user's profile in database
      PushNotifications.addListener('registration', async (token: { value: string }) => {
        console.log("Capacitor Push Registration Token received:", token.value);
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Get current profile to append token to fcm_tokens array field
            const { data: profile } = await supabase
              .from('profiles')
              .select('fcm_tokens')
              .eq('id', user.id)
              .single();
            
            const currentTokens = profile?.fcm_tokens || [];
            if (!currentTokens.includes(token.value)) {
              const updatedTokens = [...currentTokens, token.value];
              await supabase
                .from('profiles')
                .update({ fcm_tokens: updatedTokens })
                .eq('id', user.id);
              console.log("FCM Push Token successfully registered in user profile.");
            }
          }
        } catch (dbErr) {
          console.error("Failed to update fcm_tokens in Supabase profile:", dbErr);
        }
      });

      // Handle push error
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error("Capacitor Push Registration Error:", error);
      });

      // Listen for active notifications received in the foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        console.log("Push Notification received in foreground:", notification);
      });

      // Listen for click action on push notifications
      PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
        console.log("Push Notification action clicked:", action);
      });
    } else {
      console.warn("Push notification permission was denied by the user.");
    }
  } catch (e) {
    console.error("Error setting up Capacitor push notifications:", e);
  }
}
