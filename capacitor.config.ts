import type { CapacitorConfig } from '@capacitor/cli';

// ─── Live Reload Configuration ────────────────────────────────────────────────
//
// DEVELOPMENT (Live Reload):
//   1. Run: npm run dev          (starts Next.js on port 3000)
//   2. Run: npm run dev:android  (opens Capacitor live reload on Android)
//
//   To enable Live Reload, set CAPACITOR_LIVE_RELOAD=true in .env.local
//   and set DEV_SERVER_URL to your machine's local IP (e.g. http://192.168.x.x:3000)
//   ⚠️ Use your LAN IP address, NOT localhost — Android device/emulator cannot reach localhost.
//
// PRODUCTION (Static Build):
//   1. Run: npm run build:android  (builds, syncs, and opens Android Studio)
//   The app loads from: https://beteseb1.online (Vercel deployment)
//
// ─────────────────────────────────────────────────────────────────────────────

const isLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';
const useRemoteServer = process.env.USE_REMOTE_SERVER === 'true';
const devServerUrl = process.env.DEV_SERVER_URL || 'http://192.168.1.100:3000';

const config: CapacitorConfig = {
  appId: 'com.beteseb.app',
  appName: 'Beteseb',
  webDir: 'out',
  server: isLiveReload
    ? {
        url: devServerUrl,
        cleartext: true,
        allowNavigation: [
          '192.168.*.*',
          '10.*.*.*',
          '172.16.*.*',
          'localhost',
          'beteseb1.online',
          '*.beteseb1.online',
          '*.firebaseapp.com',
          '*.google.com',
          '*.facebook.com',
          '*.apple.com',
        ],
      }
    : {
        url: 'https://beteseb1.online',
        cleartext: true,
        allowNavigation: [
          'beteseb1.online',
          '*.beteseb1.online',
          '*.firebaseapp.com',
          '*.google.com',
          '*.facebook.com',
          '*.apple.com',
        ],
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'facebook.com', 'apple.com'],
    },
  },
};

export default config;
