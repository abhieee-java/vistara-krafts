// ============================================================================
// VISTĀRA KRAFTS — SUPABASE CLIENT & AUTHENTICATION CONFIGURATION
// Connects Customer Storefront & Admin Portal to Supabase PostgreSQL & Auth
// ============================================================================

(function (window) {
  'use strict';

  // 1. Production / Environment Configuration Placeholders
  // Replace these with your actual Supabase project credentials from https://supabase.com/dashboard
  const SUPABASE_URL = window.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

  window.VISTARA_SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: !SUPABASE_URL.includes('YOUR_PROJECT_ID') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  };

  // 2. Client Initialization
  let client = null;
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[Vistāra Supabase] Client initialized successfully.');
    } catch (e) {
      console.warn('[Vistāra Supabase] Init error (using local mock fallback):', e);
    }
  } else {
    console.info('[Vistāra Supabase] Supabase JS SDK not yet loaded. Will bind on demand.');
  }

  // 3. Unified Supabase Bridge
  const SupabaseBridge = {
    getClient() {
      if (!client && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        try {
          client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
          console.warn('[Vistāra Supabase] Fallback getClient failed:', e);
        }
      }
      return client;
    },

    isConfigured() {
      return window.VISTARA_SUPABASE_CONFIG.isConfigured;
    },

    // ------------------------------------------------------------------------
    // AUTHENTICATION APIs (Supabase Auth)
    // ------------------------------------------------------------------------
    async signUp(email, password, fullName = '') {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.warn('[Vistāra Supabase] Staged mode: Simulating signup for', email);
        return {
          user: { id: 'usr_' + Date.now().toString(36), email, user_metadata: { full_name: fullName } },
          session: { access_token: 'mock_token_' + Date.now() },
          error: null
        };
      }

      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            gender_preference: 'universal'
          }
        }
      });
      return { user: data?.user || null, session: data?.session || null, error };
    },

    async signIn(email, password) {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.warn('[Vistāra Supabase] Staged mode: Simulating signin for', email);
        return {
          user: { id: 'usr_patron_01', email, user_metadata: { full_name: 'Vistāra Patron' } },
          session: { access_token: 'mock_token_' + Date.now() },
          error: null
        };
      }

      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      return { user: data?.user || null, session: data?.session || null, error };
    },

    async signInWithOAuth(provider = 'google') {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.warn(`[Vistāra Supabase] Staged mode: Simulating ${provider} OAuth signin`);
        return { data: { provider, url: null }, error: null };
      }

      return await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
    },

    async signOut() {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        return { error: null };
      }
      return await sb.auth.signOut();
    },

    async getCurrentUser() {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        return null;
      }
      const { data: { user } } = await sb.auth.getUser();
      return user;
    },

    // ------------------------------------------------------------------------
    // PART 2: PERSONA CURATION UPDATE (Male / Female / Universal Default)
    // ------------------------------------------------------------------------
    async updatePersonaPreference(userId, genderPreference) {
      const valid = ['masculine', 'feminine', 'universal'].includes(genderPreference) ? genderPreference : 'universal';
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.log(`[Vistāra Supabase] Staged mode: Persona preference updated to '${valid}'`);
        return { success: true, genderPreference: valid };
      }

      const { data, error } = await sb
        .from('profiles')
        .update({ gender_preference: valid, updated_at: new Date().toISOString() })
        .eq('id', userId);

      return { data, error, genderPreference: valid };
    },

    // ------------------------------------------------------------------------
    // DATABASE QUERIES (Products, Orders, Mockups)
    // ------------------------------------------------------------------------
    async fetchProducts() {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        return null; // Signals caller to use canonical local catalog seed
      }
      const { data, error } = await sb
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      return error ? null : data;
    },

    async createOrder(orderPayload) {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.log('[Vistāra Supabase] Staged mode: Order stored in local state machine', orderPayload.order_number);
        return { data: orderPayload, error: null };
      }
      const { data, error } = await sb.from('orders').insert([orderPayload]).select();
      return { data: data ? data[0] : null, error };
    },

    async submitCustomInquiry(inquiryPayload) {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) {
        console.log('[Vistāra Supabase] Staged mode: Custom mockup inquiry recorded');
        return { data: inquiryPayload, error: null };
      }
      const { data, error } = await sb.from('custom_mockups').insert([inquiryPayload]).select();
      return { data: data ? data[0] : null, error };
    },

    async recordConsent(userId, consentType, granted = true) {
      const sb = this.getClient();
      if (!this.isConfigured() || !sb) return;
      await sb.from('dpdp_consents').insert([{
        user_id: userId,
        consent_type: consentType,
        granted,
        ip_address: 'client-verified'
      }]);
    }
  };

  window.VistaraSupabase = SupabaseBridge;
})(window);
