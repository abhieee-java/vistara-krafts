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
        instagramUrl: 'https://www.instagram.com/resin.art.memories',
        logoPath: './vistara-krafts-logo.jpg',
        siteUrl: (global && global.VISTARA_SITE_URL) || 'https://vistara-krafts.vercel.app',
        futureCustomDomain: (global && global.VISTARA_CUSTOM_DOMAIN) || 'https://vistarakrafts.com'
      },
      seo: {
        siteUrl: (global && global.VISTARA_SITE_URL) || 'https://vistara-krafts.vercel.app',
        futureCustomDomain: (global && global.VISTARA_CUSTOM_DOMAIN) || 'https://vistarakrafts.com',
        defaultTitle: 'Vistāra Krafts — Bespoke Varmala Preservation & Optical Epoxy Storefront',
        defaultDescription: 'Official Vistāra Krafts (@resin.art.memories) E-Commerce Storefront in India. Preserved wedding varmalas in 50mm crystal blocks, ocean resin art, and ISO-9001 optical 3:1 & 2:1 epoxy systems with Pan-India express delivery.',
        defaultKeywords: 'Vistara Krafts, Vistāra Krafts, resin.art.memories, bridal varmala preservation India, wedding garland preservation in resin, 3:1 casting epoxy resin India, 2:1 deep pour river table epoxy, 1:1 doming epoxy, UV resin jewelry India, ocean wave resin tray, quartz geode wall art, epoxy pour calculator, HALS UV non-yellowing epoxy, HSN 39073010',
        locale: 'en_IN',
        language: 'en-IN',
        currency: 'INR',
        twitterHandle: '@resin.art.memories',
        instagramUrl: 'https://www.instagram.com/resin.art.memories',
        ogImage: 'https://vistara-krafts.vercel.app/vistara-krafts-logo.jpg',
        llmsTxtPath: '/llms.txt',
        llmsFullTxtPath: '/llms-full.txt',
        sitemapPath: '/sitemap.xml',
        geo: {
          region: 'IN-KA',
          placename: 'Bengaluru, Karnataka, India',
          position: '12.9716;77.5946',
          icbm: '12.9716, 77.5946',
          latitude: 12.9716,
          longitude: 77.5946,
          postalCode: '560001',
          country: 'IN',
          areaServed: ['IN', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur', 'Kolkata', 'Udaipur', 'Goa']
        }
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
        instagramUrl: 'https://www.instagram.com/resin.art.memories',
        logoPath: './vistara-krafts-logo.jpg',
        siteUrl: (global && global.VISTARA_SITE_URL) || 'https://vistara-krafts.vercel.app',
        futureCustomDomain: (global && global.VISTARA_CUSTOM_DOMAIN) || 'https://vistarakrafts.com'
      },
      seo: {
        siteUrl: (global && global.VISTARA_SITE_URL) || 'https://vistara-krafts.vercel.app',
        futureCustomDomain: (global && global.VISTARA_CUSTOM_DOMAIN) || 'https://vistarakrafts.com',
        defaultTitle: 'Vistāra Krafts — Bespoke Varmala Preservation & Optical Epoxy Storefront',
        defaultDescription: 'Official Vistāra Krafts (@resin.art.memories) E-Commerce Storefront in India. Preserved wedding varmalas in 50mm crystal blocks, ocean resin art, and ISO-9001 optical 3:1 & 2:1 epoxy systems with Pan-India express delivery.',
        defaultKeywords: 'Vistara Krafts, Vistāra Krafts, resin.art.memories, bridal varmala preservation India, wedding garland preservation in resin, 3:1 casting epoxy resin India, 2:1 deep pour river table epoxy, 1:1 doming epoxy, UV resin jewelry India, ocean wave resin tray, quartz geode wall art, epoxy pour calculator, HALS UV non-yellowing epoxy, HSN 39073010',
        locale: 'en_IN',
        language: 'en-IN',
        currency: 'INR',
        twitterHandle: '@resin.art.memories',
        instagramUrl: 'https://www.instagram.com/resin.art.memories',
        ogImage: ((global && global.VISTARA_SITE_URL) || 'https://vistara-krafts.vercel.app').replace(/\/+$/, '') + '/vistara-krafts-logo.jpg',
        llmsTxtPath: '/llms.txt',
        llmsFullTxtPath: '/llms-full.txt',
        sitemapPath: '/sitemap.xml',
        geo: {
          region: 'IN-KA',
          placename: 'Bengaluru, Karnataka, India',
          position: '12.9716;77.5946',
          icbm: '12.9716, 77.5946',
          latitude: 12.9716,
          longitude: 77.5946,
          postalCode: '560001',
          country: 'IN',
          areaServed: ['IN', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur', 'Kolkata', 'Udaipur', 'Goa']
        }
      },
      cloudflare: {
        accountId: (global && global.CF_ACCOUNT_ID) || 'CLIENT_CLOUDFLARE_ACCOUNT_ID',
        d1Binding: 'VISTARA_DB',
        kvBinding: 'VISTARA_SESSIONS',
        r2Binding: 'VISTARA_MEDIA',
        r2PublicUrl: (global && global.CF_R2_PUBLIC_URL) || 'https://media.vistarakrafts.com',
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

  activeConfig.getSiteOrigin = function () {
    const raw = (global && global.VISTARA_SITE_URL) || (activeConfig.seo && activeConfig.seo.siteUrl) || 'https://vistara-krafts.vercel.app';
    return String(raw).replace(/\/+$/, '');
  };

  activeConfig.getCanonicalUrl = function (routePath = '') {
    const origin = activeConfig.getSiteOrigin();
    const cleaned = String(routePath || '').trim();
    if (!cleaned || cleaned === '/' || cleaned === '#/home' || cleaned === 'home') {
      return origin + '/';
    }
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }
    if (cleaned.startsWith('#/')) {
      return origin + '/' + cleaned;
    }
    if (cleaned.startsWith('/')) {
      return origin + cleaned;
    }
    return origin + '/#/' + cleaned.replace(/^#\/?/, '');
  };

  if (global) {
    global.VistaraCloudflareConfig = activeConfig;
  }
})(typeof window !== 'undefined' ? window : globalThis);

