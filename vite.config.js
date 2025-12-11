import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Папка для результата сборки
    assetsDir: 'assets', // Директория для статичных ресурсов
    sourcemap: true,
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
