/**
 * Vistāra Krafts — Cloudinary Media Storage Adapter (`cloudinary-config.js`)
 *
 * Provides client-side media upload, transformation, and CDN optimization
 * via Cloudinary's unsigned upload API and dynamic image delivery.
 */

(function (global) {
  'use strict';

  const DEFAULT_CONFIG = {
    cloudName: global.CLOUDINARY_CLOUD_NAME || 'ecugysfd',
    uploadPreset: global.CLOUDINARY_UPLOAD_PRESET || 'sxr8cHma94PzeXQGH85s_1yT8FY',
    apiKey: global.CLOUDINARY_API_KEY || '157337468163933',
    secureDeliveryUrl: 'https://res.cloudinary.com'
  };

  const config = Object.assign({}, DEFAULT_CONFIG, global.VISTARA_CLOUDINARY_CONFIG || {});

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
   * Uploads an image file directly to Cloudinary using an unsigned upload preset.
   */
  async function uploadImage(file, options = {}) {
    if (!file) throw new Error('No file provided for upload');

    const folder = options.folder || 'products';
    const tags = options.tags || ['vistara-krafts', 'studio'];

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
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', folder);
    formData.append('tags', tags.join(','));

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

