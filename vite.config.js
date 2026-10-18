import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import createOrderHandler from './api/create-order.js';
import verifyPaymentHandler from './api/verify-payment.js';
import webhookHandler from './api/razorpay-webhook.js';

const STATIC_ASSETS = [
  'supabase-config.js',
  'supabase-client.js',
  'cloudinary-config.js',
  'store-bridge.js',
  'app.js',
  'styles.css',
  'tokens.css',
  'vistara-krafts-logo.jpg',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt'
];

function apiMiddlewarePlugin() {
  return {
    name: 'vistara-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];
        if (!url.startsWith('/api/')) {
          return next();
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          req.rawBody = body;
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch (_e) {
            req.body = body;
          }

          res.status = function (code) {
            res.statusCode = code;
            return res;
          };

          res.json = function (data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          try {
            if (url === '/api/create-order') {
              await createOrderHandler(req, res);
            } else if (url === '/api/verify-payment') {
              await verifyPaymentHandler(req, res);
            } else if (url === '/api/razorpay-webhook') {
              await webhookHandler(req, res);
            } else {
              res.status(404).json({ success: false, error: 'Endpoint not found' });
            }
          } catch (err) {
            res.status(500).json({ success: false, error: err.message });
          }
        });
      });
    }
  };
}

export default defineConfig({
  envPrefix: ['VITE_', 'SUPABASE_', 'CLOUDINARY_'],
  plugins: [
    apiMiddlewarePlugin(),
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
