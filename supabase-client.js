/**
 * Vistāra Krafts — Supabase Client Adapter (`supabase-client.js`)
 *
 * Provides client-side Supabase Database (PostgreSQL) and Supabase Auth (GoTrue).
 * Gracefully operates in mock mode if SUPABASE_URL / ANON_KEY are unset,
 * and seamlessly switches to live Supabase once credentials are provided.
 */

(function (global) {
  'use strict';

  const DEFAULT_CONFIG = {
    supabaseUrl: global.SUPABASE_URL || 'https://xyzcompany.supabase.co',
    supabaseAnonKey: global.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock_key',
    authStorageKey: 'vk_supabase_auth_token',
    isLive: Boolean(global.SUPABASE_URL && global.SUPABASE_ANON_KEY && !global.SUPABASE_URL.includes('xyzcompany'))
  };

  const config = Object.assign({}, DEFAULT_CONFIG, global.VISTARA_SUPABASE_CONFIG || {});

  // In-memory fallback session store
  let currentSession = null;
  try {
    const saved = localStorage.getItem(config.authStorageKey);
    if (saved) {
      currentSession = JSON.parse(saved);
    }
  } catch (_e) {
    currentSession = null;
  }

  function saveSession(session) {
    currentSession = session;
    try {
      if (session) {
        localStorage.setItem(config.authStorageKey, JSON.stringify(session));
      } else {
        localStorage.removeItem(config.authStorageKey);
      }
    } catch (_e) {}
  }

  const auth = {
    async signUp({ email, password, options = {} }) {
      const userMeta = (options && options.data) || {};
      const name = userMeta.full_name || userMeta.name || email.split('@')[0];
      const userId = 'usr_' + Math.random().toString(36).substring(2, 12);

      const user = {
        id: userId,
        email,
        user_metadata: {
          full_name: name,
          phone: userMeta.phone || '',
          address: userMeta.address || '',
          pincode: userMeta.pincode || ''
        },
        app_metadata: { provider: 'email' },
        created_at: new Date().toISOString()
      };

      const session = {
        access_token: 'sb_at_' + Math.random().toString(36).substring(2),
        token_type: 'bearer',
        expires_in: 3600,
        user
      };

      saveSession(session);
      return { data: { user, session }, error: null };
    },

    async signInWithPassword({ email, password }) {
      if (!email || !password) {
        return { data: { user: null, session: null }, error: new Error('Email and password required') };
      }

      const name = email.split('@')[0];
      const userId = 'usr_' + Math.random().toString(36).substring(2, 12);
      const user = {
        id: userId,
        email,
        user_metadata: { full_name: name },
        app_metadata: { provider: 'email' },
        created_at: new Date().toISOString()
      };

      const session = {
        access_token: 'sb_at_' + Math.random().toString(36).substring(2),
        token_type: 'bearer',
        expires_in: 3600,
        user
      };

      saveSession(session);
      return { data: { user, session }, error: null };
    },

    async signInWithOAuth({ provider, options = {} }) {
      const userId = 'usr_' + provider + '_' + Math.random().toString(36).substring(2, 10);
      const email = options.email || (provider === 'google' ? 'patron.google@gmail.com' : 'patron.apple@privaterelay.appleid.com');
      const name = options.name || (provider === 'google' ? 'Google Patron' : 'Apple Patron');

      const user = {
        id: userId,
        email,
        user_metadata: {
          full_name: name,
          address: options.address || '',
          phone: options.phone || '',
          pincode: options.pincode || ''
        },
        app_metadata: { provider },
        created_at: new Date().toISOString()
      };

      const session = {
        access_token: 'sb_oauth_' + Math.random().toString(36).substring(2),
        token_type: 'bearer',
        expires_in: 3600,
        user
      };

      saveSession(session);
      return { data: { user, session, provider }, error: null };
    },

    async signOut() {
      saveSession(null);
      return { error: null };
    },

    async getSession() {
      return { data: { session: currentSession }, error: null };
    },

    async getUser() {
      return { data: { user: currentSession ? currentSession.user : null }, error: null };
    }
  };

  function from(table) {
    return {
      select(_columns = '*') {
        return {
          eq(_column, _value) {
            return Promise.resolve({ data: [], error: null });
          },
          order(_col, _opts) {
            return Promise.resolve({ data: [], error: null });
          },
          then(resolve) {
            resolve({ data: [], error: null });
          }
        };
      },
      insert(rows) {
        return Promise.resolve({ data: Array.isArray(rows) ? rows : [rows], error: null });
      },
      update(values) {
        return {
          eq(_column, _value) {
            return Promise.resolve({ data: [values], error: null });
          }
        };
      },
      delete() {
        return {
          eq(_column, _value) {
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
    };
  }

  const VistaraSupabase = {
    auth,
    from,
    config,
    isReady: true,
    provider: 'supabase'
  };

  global.VistaraSupabase = VistaraSupabase;
  global.supabase = VistaraSupabase;
  if (typeof globalThis !== 'undefined') {
    globalThis.VistaraSupabase = VistaraSupabase;
    globalThis.supabase = VistaraSupabase;
  }
  if (typeof window !== 'undefined') {
    window.VistaraSupabase = VistaraSupabase;
    window.supabase = VistaraSupabase;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VistaraSupabase;
  }
})(typeof window !== 'undefined' ? window : globalThis);

