/**
 * Vistāra Krafts — Cloudinary Media Storage Adapter (`cloudinary-config.js`)
 *
 * Provides client-side media upload, transformation, and CDN optimization
 * via Cloudinary's authenticated signed upload API (Zero preset required)
 * with graceful unsigned preset fallback and dynamic image delivery.
 */

(function (global) {
  'use strict';

  const DEFAULT_CONFIG = {
    cloudName: global.CLOUDINARY_CLOUD_NAME || 'ecugysfd',
    uploadPreset: global.CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: global.CLOUDINARY_API_KEY || '157337468163933',
    apiSecret: global.CLOUDINARY_API_SECRET || 'sxr8cHma94PzeXQGH85s_1yT8FY',
    secureDeliveryUrl: 'https://res.cloudinary.com'
  };

  const config = Object.assign({}, DEFAULT_CONFIG, global.VISTARA_CLOUDINARY_CONFIG || {});

  async function generateSignature(params, apiSecret) {
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stringToSign));
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  }

  /**
   * Generates a transformed, responsive Cloudinary image URL.
   * e.g., optimize('https://res.cloudinary.com/.../v1/products/varmala.jpg', { width: 800, quality: 'auto' })
   */
  function optimize(url, options = {}) {
    if (!url || typeof url !== 'string') return '';
    if (!url.includes('res.cloudinary.com')) {
      return url; // Non-Cloudinary fallback
    }

    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    const transforms = [`f_${format}`, `q_${quality}`];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width && height) transforms.push(`c_${crop}`);

    const transformStr = transforms.join(',');
    return url.replace('/image/upload/', `/image/upload/${transformStr}/`);
  }

  /**
   * Uploads an image file directly to Cloudinary using authenticated signed mode (no preset needed).
   */
  async function uploadImage(file, options = {}) {
    if (!file) throw new Error('No file provided for upload');

    const folder = options.folder || 'vistara-products';

    // If no real cloud name configured or running in offline/mock mode
    if (!config.cloudName || config.cloudName === 'vistara-krafts') {
      const mockUrl = URL.createObjectURL(file);
      return {
        public_id: 'mock_' + Math.random().toString(36).substring(2, 10),
        secure_url: mockUrl,
        format: file.type.split('/')[1] || 'jpg',
        bytes: file.size,
        width: 1200,
        height: 1200,
        isMock: true
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Prefer signed upload when apiKey and apiSecret are available (Zero upload preset required!)
    if (config.apiKey && config.apiSecret) {
      const timestamp = String(Math.round(Date.now() / 1000));
      const signature = await generateSignature({ folder, timestamp }, config.apiSecret);
      if (signature) {
        formData.append('api_key', config.apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
      } else if (config.uploadPreset) {
        formData.append('upload_preset', config.uploadPreset);
      }
    } else if (config.uploadPreset) {
      formData.append('upload_preset', config.uploadPreset);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error((errJson.error && errJson.error.message) || `Cloudinary upload failed: ${res.statusText}`);
    }

    return res.json();
  }

  const VistaraCloudinary = {
    config,
    optimize,
    uploadImage,
    isReady: true,
    provider: 'cloudinary'
  };

  global.VistaraCloudinary = VistaraCloudinary;
  if (typeof globalThis !== 'undefined') {
    globalThis.VistaraCloudinary = VistaraCloudinary;
  }
  if (typeof window !== 'undefined') {
    window.VistaraCloudinary = VistaraCloudinary;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VistaraCloudinary;
  }
})(typeof window !== 'undefined' ? window : globalThis);
