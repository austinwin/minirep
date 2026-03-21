import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    host_permissions: ['<all_urls>'],
    permissions: ['storage'],
  },
  vite: () => ({
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        'node:fs': fileURLToPath(
          new URL('./entrypoints/panel/utils/compat/node-fs.ts', import.meta.url),
        ),
        'node:path': fileURLToPath(
          new URL('./entrypoints/panel/utils/compat/node-path.ts', import.meta.url),
        ),
      },
    },
    optimizeDeps: {
      include: ['react-grid-layout', 'react-resizable', 'react-draggable'],
    },
  }),
});
