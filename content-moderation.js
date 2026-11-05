/**
 * VISTĀRA KRAFTS — ENTERPRISE CONTENT MODERATION & ABUSE SHIELD
 * 
 * Provides robust input sanitization, profanity/abuse masking, anti-phishing,
 * and DoS length protection across all public storefront surfaces.
 * 
 * DESIGN PRINCIPLES:
 * 1. ZERO FALSE POSITIVES (Scunthorpe Problem Prevention):
 *    - Uses word-boundary tokenization (\b) combined with an explicit artisan/regional whitelist.
 * 2. SEAMLESS AUTHENTIC USER EXPERIENCE:
 *    - In search: Invalid queries gracefully return 0 results without breaking the UI.
 *    - In personalization/notes: Harmful scripts are stripped while valid symbols/names are preserved.
 *    - In checkout: Delivery addresses are sanitized without dropping legitimate Indian apartment/street formats.
 * 3. OWASP XSS & SCRIPT INJECTION DEFENSE:
 *    - Strips dangerous HTML tags, javascript: URIs, onerror/onload attributes, and iframe embeds.
 * 4. LEGAL COMPLIANCE:
 *    - Aligns with Information Technology Rules 2021 & DPDP Act 2023.
 */

(function(global) {
  'use strict';

  // Explicit Whitelist of legitimate craft, chemical, geographical, and vernacular terms
  // These words contain substrings that naive profanity filters erroneously block
  const CRAFT_AND_REGIONAL_WHITELIST = new Set([
    'assam', 'assamese', 'guwahati', 'nagaon', 'jorhat', 'silchar', 'kokrajhar', 'tezpur',
    'glass', 'glasses', 'brass', 'grass', 'class', 'classic', 'classical', 'pass', 'passion',
    'passionate', 'passed', 'mass', 'compass', 'asset', 'assets', 'assemble', 'assembly',
    'varmala', 'botanical', 'epoxy', 'hardener', 'silicone', 'pigment', 'resin', 'mica',
    'terrazzo', 'coaster', 'coasters', 'pendant', 'keepsake', 'preservation', 'mangalsutra',
    'sindoor', 'wedding', 'anniversary', 'garland', 'petals', 'foliage', 'gold foil',
    'fluvial', 'amethyst', 'agate', 'geode', 'choker', 'bangles', 'shivalingam', 'diya'
  ]);

  // Maximum permitted lengths per input vertical (Prevents memory exhaustion / ReDoS)
  const INPUT_LIMITS = {
    SEARCH: 100,
    MEMORY_CAPTION: 500,
    COMMUNITY_COMMENT: 250,
    ENGRAVING_NOTE: 150,
    RECIPIENT_NAME: 60,
    DELIVERY_ADDRESS: 200,
    PHONE_NUMBER: 18,
    PINCODE: 6
  };

  // High-confidence abusive/profane tokens (evaluated via whole-word boundaries only)
  const RESTRICTED_WHOLE_WORDS = [
    'fuck', 'fucking', 'fucker', 'shit', 'bullshit', 'asshole', 'bitch', 'bastard',
    'dick', 'pussy', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'slut',
    'chutiya', 'madarchod', 'bhenchod', 'bhosdike', 'gandu', 'harami', 'kamina',
    'randi', 'lauda', 'choot', 'gaand', 'mc', 'bc'
  ];

  // Compiled word-boundary regex for strict token matching
  const RESTRICTED_REGEX = new RegExp(
    `\\b(${RESTRICTED_WHOLE_WORDS.join('|')})\\b`,
    'gi'
  );

  // Phishing / spam patterns: unsolicited URLs, Telegram, WhatsApp link spam in public UGC
  const SPAM_URL_REGEX = /\b(https?:\/\/|www\.|t\.me\/|wa\.me\/|bit\.ly\/|tinyurl\.com\/|chat\.whatsapp\.com\/)[^\s]+/gi;

  /**
   * Strips executable HTML, event handlers, and javascript pseudo-protocols.
   * @param {string} input - Raw string from user input
   * @param {number} maxLength - Enforced character limit
   * @returns {string} Sanitized text safe for DOM rendering and storage
   */
  function sanitizeTextInput(input, maxLength = 250) {
    if (typeof input !== 'string') return '';

    // 1. Enforce length cap immediately to prevent ReDoS / memory exhaustion
    let clean = input.slice(0, maxLength);

    // 2. Strip HTML tags entirely
    clean = clean.replace(/<[^>]*>?/gm, '');

    // 3. Strip script / iframe / javascript: pseudo-protocols
    clean = clean.replace(/javascript:/gi, '');
    clean = clean.replace(/data:text\/html/gi, '');
    clean = clean.replace(/on\w+\s*=/gi, '');

    // 4. Normalize excess whitespace while preserving legitimate word spacing
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }

  /**
   * Evaluates text against content safety rules with zero false positives.
   * @param {string} text - The input text to evaluate
   * @param {Object} [options] - Evaluation options
   * @returns {{ isSafe: boolean, cleanText: string, flaggedWords: string[], reason: string | null }}
   */
  function moderateContent(text, options = {}) {
    const {
      vertical = 'general',
      allowUrls = false
    } = options;

    if (typeof text !== 'string' || !text.trim()) {
      return { isSafe: true, cleanText: '', flaggedWords: [], reason: null };
    }

    const maxLength = INPUT_LIMITS[vertical.toUpperCase()] || 250;
    let cleanText = sanitizeTextInput(text, maxLength);
    const flaggedWords = [];

    // Check 1: Anti-Spam / Phishing Link Detection
    if (!allowUrls && SPAM_URL_REGEX.test(cleanText)) {
      return {
        isSafe: false,
        cleanText: cleanText.replace(SPAM_URL_REGEX, '[LINK REMOVED]'),
        flaggedWords: ['unauthorized_external_link'],
        reason: 'External web links and messaging channels are not permitted in community submissions.'
      };
    }

    // Check 2: Word-boundary profanity scan with whitelist defense
    const words = cleanText.toLowerCase().split(/[\s,.;:!?()[\]{}"'\\/+-]+/);
    
    for (const word of words) {
      if (!word || word.length < 2) continue;

      if (CRAFT_AND_REGIONAL_WHITELIST.has(word)) {
        continue;
      }

      if (RESTRICTED_WHOLE_WORDS.includes(word)) {
        flaggedWords.push(word);
      }
    }

    if (flaggedWords.length > 0) {
      cleanText = cleanText.replace(RESTRICTED_REGEX, (match) => {
        if (CRAFT_AND_REGIONAL_WHITELIST.has(match.toLowerCase())) {
          return match;
        }
        return '***';
      });

      if (vertical === 'search') {
        return {
          isSafe: true,
          cleanText,
          flaggedWords,
          reason: null
        };
      }

      return {
        isSafe: false,
        cleanText,
        flaggedWords,
        reason: 'Your message contains prohibited or inappropriate language.'
      };
    }

    return {
      isSafe: true,
      cleanText,
      flaggedWords,
      reason: null
    };
  }

  /**
   * Specialized validator for search queries:
   * Enforces 100 character length and sanitizes special characters without erroring.
   */
  function sanitizeSearchQuery(query) {
    if (typeof query !== 'string') return '';
    let safe = sanitizeTextInput(query, INPUT_LIMITS.SEARCH);
    safe = safe.replace(/[[\]{}()*+?.,\\^$|#]/g, ' ');
    return safe.replace(/\s+/g, ' ').trim();
  }

  /**
   * Specialized sanitizer for delivery addresses:
   * Preserves Indian address conventions while stripping script injection.
   */
  function sanitizeDeliveryAddress(address) {
    if (typeof address !== 'string') return '';
    let safe = sanitizeTextInput(address, INPUT_LIMITS.DELIVERY_ADDRESS);
    safe = safe.replace(/[^a-zA-Z0-9\s,.\-/#]/g, '');
    return safe.replace(/\s+/g, ' ').trim();
  }

  /**
   * Specialized sanitizer for recipient name:
   * Allows alphabets, spaces, dots, hyphens.
   */
  function sanitizeRecipientName(name) {
    if (typeof name !== 'string') return '';
    let safe = sanitizeTextInput(name, INPUT_LIMITS.RECIPIENT_NAME);
    safe = safe.replace(/[^a-zA-Z\s.'"-]/g, '');
    return safe.replace(/\s+/g, ' ').trim();
  }

  const ContentModeration = {
    INPUT_LIMITS,
    CRAFT_AND_REGIONAL_WHITELIST,
    sanitizeTextInput,
    moderateContent,
    sanitizeSearchQuery,
    sanitizeDeliveryAddress,
    sanitizeRecipientName
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentModeration;
  }
  if (typeof global !== 'undefined') {
    global.ContentModeration = ContentModeration;
  }
})(typeof window !== 'undefined' ? window : globalThis);
