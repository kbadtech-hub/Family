import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// When building for Capacitor (Android/iOS), we need static export.
// Static export is incompatible with rewrites() and headers() in Next.js.
const isCapacitorBuild = process.env.IS_CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // Static export for Capacitor native builds
  ...(isCapacitorBuild && { output: 'export' }),

  // Image optimization is not supported in static export mode
  images: {
    unoptimized: isCapacitorBuild,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mpreyyjclfklvofzfosc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  serverExternalPackages: ['firebase-admin'],

  // rewrites and headers are NOT compatible with static export — skip for Capacitor
  ...(!isCapacitorBuild && {
    async rewrites() {
      return [
        {
          source: '/__/auth/:path*',
          destination: 'https://beteseb-89bae.firebaseapp.com/__/auth/:path*',
        },
      ];
    },
    async headers() {
      return [
        {
          source: '/.well-known/apple-app-site-association',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
        },
        {
          source: '/.well-known/assetlinks.json',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
        },
      ];
    },
  }),
};

export default withNextIntl(nextConfig);
