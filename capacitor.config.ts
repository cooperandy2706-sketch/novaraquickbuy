import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'novara.app.quickbuy',
  appName: 'Novara',
  webDir: 'public',
  server: {
    url: 'https://novaraquickbuy.vercel.app',
    cleartext: true
  }
};

export default config;
