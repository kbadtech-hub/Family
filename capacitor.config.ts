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
    allowNavigation: [
      'beteseb1.online',
      '*.beteseb1.online',
      '*.firebaseapp.com',
      '*.google.com',
      '*.facebook.com',
      '*.apple.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
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
