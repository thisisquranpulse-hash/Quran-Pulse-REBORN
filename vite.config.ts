import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    resolve: {
      alias: {
        '@': (process as any).cwd(),
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'NurQuran Pulse',
          short_name: 'NurQuran',
          description: 'AI-Powered Islamic Learning Assistant & Quran Reader',
          theme_color: '#060D17',
          background_color: '#060D17',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Font Static Assets
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Quran Text & Recitation Data (Immutable)
              // Added 'recitations' and 'resources' to regex to ensure audio metadata is cached
              urlPattern: /^https:\/\/api\.quran\.com\/api\/v4\/(chapters|verses|juzs|recitations|resources).*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'quran-data-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Audio Recitations (The actual MP3 files)
              // Matches verses.quran.com
              urlPattern: /^https:\/\/verses\.quran\.com\/.*\.mp3/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'quran-audio-cache',
                expiration: {
                  maxEntries: 50, // Limit to prevent storage bloat
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                rangeRequests: true // Optimize audio streaming
              }
            },
            {
              // Prayer Times (Network First as they change daily/location based)
              urlPattern: /^https:\/\/api\.aladhan\.com\/v1\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'prayer-times-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 1 Day
                },
                networkTimeoutSeconds: 5
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});