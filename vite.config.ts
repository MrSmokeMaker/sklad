import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || './';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo-mark.svg'],
        manifest: {
          name: 'Настойки — Мордовское подворье',
          short_name: 'Настойки',
          description: 'Учёт производства и перемещений настоек сети Мордовское подворье',
          theme_color: '#8B1A1A',
          background_color: '#FAF7F2',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          icons: [
            {
              src: 'logo-mark.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    // @ts-ignore
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts'
    }
  };
});
