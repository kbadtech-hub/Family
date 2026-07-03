import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beteseb.app',
  appName: 'Beteseb',
  webDir: 'out',
  server: {
    url: 'https://beteseb1.online',
    cleartext: true
  }
};

export default config;
