import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const STATIC_ASSETS = [
  'cloudflare-config.js',
  'store-bridge.js',
  'app.js',
  'styles.css',
  'tokens.css',
  'vistara-krafts-logo.jpg'
];

export default defineConfig({
  plugins: [
    {
      name: 'copy-vistara-static-runtime',
      closeBundle() {
        const outDir = path.resolve(process.cwd(), 'dist');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        for (const file of STATIC_ASSETS) {
          const src = path.resolve(process.cwd(), file);
          const dest = path.resolve(outDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    }
  ]
});
