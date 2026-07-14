import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beteseb.app',
  appName: 'Beteseb',
  webDir: 'out',
  server: {
    // Load from the live Vercel deployment.
    // This allows all API routes to work inside the native Android/iOS app.
    url: 'https://beteseb1.online',
    cleartext: false,
  },
};

export default config;
