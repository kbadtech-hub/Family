import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beteseb.app',
  appName: 'Beteseb',
  webDir: 'out',
  server: {
    url: 'https://beteseb1.online',
    cleartext: true
  },
  plugins: {
    // Screen security is implemented in MainActivity.java using Android's native FLAG_SECURE
    // API to prevent screenshots, screen recording, and task switcher preview leaks.
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF6B6B',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    }
  }
};

export default config;
