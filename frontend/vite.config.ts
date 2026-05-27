import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      devOptions: {
        enabled: false,
      },
      selfDestroying: true,
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/households\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/auth\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/favorites/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Planificador de Comidas',
        short_name: 'Comidas',
        description: 'Planifica tus comidas, gestiona recetas y listas de la compra',
        theme_color: '#2ec4b6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/dashboard',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/households': { target: 'http://localhost:3001', changeOrigin: true },
      '/favorites': { target: 'http://localhost:3001', changeOrigin: true },
      '/invitations': { target: 'http://localhost:3001', changeOrigin: true },
      '/public': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
