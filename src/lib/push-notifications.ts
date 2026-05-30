import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export async function registerPushNotifications(): Promise<void> {
  // Only execute on native mobile platforms
  if (!Capacitor.isNativePlatform()) {
    console.log("Web Client: Push notifications registration bypassed.");
    return;
  }

  try {
     const { PushNotifications } = window as any;
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
       
       // Handle FCM registration token receipt
       PushNotifications.addListener('registration', async (token: any) => {
         console.log(`FCM Registration Token: ${token.value}`);
         
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            // Append FCM token to the user profile arrays in Supabase
            const { error } = await supabase.rpc('append_fcm_token', {
              user_id: user.id,
              token_val: token.value
            });
            
            if (error) {
              // Fallback to direct array update if RPC is not loaded
              await supabase.from('profiles').update({
                fcm_tokens: supabase.raw(`array_append(fcm_tokens, '${token.value}')`)
              }).eq('id', user.id);
            }
         }
       });

       // Registration error
       PushNotifications.addListener('registrationError', (error: any) => {
         console.error('Push Registration Error: ', error);
       });

       // Handle received notifications
       PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
         console.log('Push Received: ', notification);
       });

       // Handle click actions on notifications
       PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
         console.log('Push Action Performed: ', notification);
       });
     }
  } catch (e) {
     console.error("Failed to register Push Notifications", e);
  }
}
