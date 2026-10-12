/**
 * Vistāra Krafts — Cloudflare Edge Auth, D1, KV, R2 & Turnstile Configuration
 *
 * CURRENT MODE: 'development' (Uses developer/sandbox credentials & local edge fallback).
 * WHEN SHIPPING TO CLIENT: Replace the values in `production` (or set via Cloudflare Pages
 * Environment Variables) and flip `ACTIVE_ENV` to 'production'.
 */
(function (global) {
  'use strict';

  const ACTIVE_ENV = (global && global.VISTARA_ENV) || 'development';

  const ENVIRONMENTS = {
    development: {
      mode: 'development',
      isDev: true,
      apiBaseUrl: '/api',
      brand: {
        name: 'Vistāra Krafts',
        legalName: 'Vistāra Krafts Studio & Chemical Atelier',
        instagramHandle: '@resin.art.memories',
        logoPath: './vistara-krafts-logo.jpg'
      },
      cloudflare: {
        accountId: 'dev_cf_account_local',
        d1Binding: 'VISTARA_DB',
        kvBinding: 'VISTARA_SESSIONS',
        r2Binding: 'VISTARA_MEDIA',
        r2PublicUrl: './',
        // Official Cloudflare Turnstile always-pass testing sitekey for localhost/dev:
        turnstileSiteKey: '1x00000000000000000000AA'
      },
      oauth: {
        google: {
          enabled: true,
          // Replace with Client's Google Cloud OAuth 2.0 Web Client ID on launch
          clientId: 'DEV_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          endpoint: '/api/auth/google',
          uxMode: 'popup'
        },
        apple: {
          enabled: true,
          // Replace with Client's Apple Services ID on launch
          clientId: 'in.vistarakrafts.storefront.dev',
          endpoint: '/api/auth/apple',
          scope: 'name email',
          usePopup: true
        },
        emailPassword: {
          enabled: true,
          minPasswordLength: 6,
          requireShippingAddress: false,
          requirePhone: false
        }
      }
    },

    production: {
      mode: 'production',
      isDev: false,
      apiBaseUrl: '/api',
      brand: {
        name: 'Vistāra Krafts',
        legalName: 'Vistāra Krafts Studio & Chemical Atelier',
        instagramHandle: '@resin.art.memories',
        logoPath: './vistara-krafts-logo.jpg'
      },
      cloudflare: {
        accountId: (global && global.CF_ACCOUNT_ID) || 'CLIENT_CLOUDFLARE_ACCOUNT_ID',
        d1Binding: 'VISTARA_DB',
        kvBinding: 'VISTARA_SESSIONS',
        r2Binding: 'VISTARA_MEDIA',
        r2PublicUrl: (global && global.CF_R2_PUBLIC_URL) || 'https://media.vistarakrafts.in',
        turnstileSiteKey: (global && global.CF_TURNSTILE_SITE_KEY) || 'CLIENT_TURNSTILE_SITE_KEY'
      },
      oauth: {
        google: {
          enabled: true,
          clientId: (global && global.CF_GOOGLE_CLIENT_ID) || 'CLIENT_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          endpoint: '/api/auth/google',
          uxMode: 'popup'
        },
        apple: {
          enabled: true,
          clientId: (global && global.CF_APPLE_CLIENT_ID) || 'in.vistarakrafts.storefront',
          endpoint: '/api/auth/apple',
          scope: 'name email',
          usePopup: true
        },
        emailPassword: {
          enabled: true,
          minPasswordLength: 8,
          requireShippingAddress: false,
          requirePhone: false
        }
      }
    }
  };

  const activeConfig = ENVIRONMENTS[ACTIVE_ENV] || ENVIRONMENTS.development;

  if (global) {
    global.VistaraCloudflareConfig = activeConfig;
  }
})(typeof window !== 'undefined' ? window : globalThis);
