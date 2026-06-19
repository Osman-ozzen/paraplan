import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: 'ParaPlan - Akıllı Finans Yönetimi',
        short_name: 'ParaPlan',
        description: 'Gelir-gider takibi, borç yönetimi, hedef takibi ve grafiksel raporlama',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        start_url: '/',
        id: '/',
        lang: 'tr-TR',
        dir: 'ltr',
        categories: ['finance', 'productivity', 'business'],
        prefer_related_applications: false,
        shortcuts: [
          {
            name: 'Yeni Fiş',
            short_name: 'Fiş',
            description: 'Hızlı gelir/gider kaydı',
            url: '/?sekme=ekle',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Raporlar',
            short_name: 'Rapor',
            description: 'Grafiksel raporlar',
            url: '/?sekme=raporlar',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        globIgnores: ['**/sw.js', '**/workbox-*.js'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              backgroundSync: {
                name: 'api-sync',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
