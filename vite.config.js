import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Папка для результата сборки
    assetsDir: 'assets', // Директория для статичных ресурсов
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet/')) {
            return 'leaflet';
          } else if (id.includes('node_modules/leaflet-routing-machine/')) {
            return 'leaflet-routing-machine';
          } else if (id.includes('node_modules/leaflet-geosearch/')) {
            return 'leaflet-geosearch';
          }
        }
      }
    }
  },
  css: {
    devSourcemap: true, // Включаем source maps для стилей в dev-режиме
  },
  server: {
    hmr: {
      protocol: 'ws', // Протокол для HMR, по умолчанию 'ws' (WebSocket)
      host: 'localhost', // Адрес для HMR (если нужно указать другой)
      port: 3000, // Порт для HMR
    },
  },
});
