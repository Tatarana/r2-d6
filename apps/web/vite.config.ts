import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const here = dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL ?? 'http://127.0.0.1:3000';

/** Modulo virtual com a lista de imagens em public/ (art/ e caminhos do manifesto) (o ArtSlot sabe se a arte existe, sem 404 no console). */
function artIndex() {
  const dir = join(here, 'public');
  const id = 'virtual:art-index';
  const resolved = '\0' + id;
  const list = () => (existsSync(dir)
    ? (readdirSync(dir, { recursive: true }) as string[]).map(String).filter((f) => /\.(webp|avif|png|jpe?g|svg)$/i.test(f)).map((f) => f.replace(/\\/g, '/'))
    : []);
  return {
    name: 'r2d6-art-index',
    resolveId: (i: string) => (i === id ? resolved : null),
    load: (i: string) => (i === resolved ? `export default ${JSON.stringify(list())};` : null),
    configureServer(server: any) {
      server.watcher.add(dir);
      const reload = (f: string) => {
        if (!f.replace(/\\/g, '/').includes('/public/art')) return;
        const m = server.moduleGraph.getModuleById(resolved);
        if (m) { server.moduleGraph.invalidateModule(m); server.ws.send({ type: 'full-reload' }); }
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}

export default defineConfig({
  resolve: { alias: { '@': join(here, 'src') } },
  plugins: [
    artIndex(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'r2-d6', short_name: 'r2-d6', description: 'Companheiro de mesa para o Star Wars RPG REUP (D6)',
        lang: 'pt-BR', theme_color: '#05070C', background_color: '#05070C', display: 'standalone', start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        runtimeCaching: [
          { urlPattern: ({ url }: { url: URL }) => /^\/api\/media\//.test(url.pathname), handler: 'CacheFirst', options: { cacheName: 'retratos', expiration: { maxAgeSeconds: 30 * 86400, maxEntries: 80 } } },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: false },
      '/socket.io': { target: API, ws: true, changeOrigin: false },
    },
  },
  build: { chunkSizeWarningLimit: 1100 },
});
