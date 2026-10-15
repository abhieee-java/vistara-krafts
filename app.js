/**
 * Resin Art Memories (@resin.art.memories) × Vistāra Krafts Studio
 * Complete Customer Social E-Commerce Application Controller
 */
(function () {
  'use strict';

  const Store = window.ResinStore;

  const AppState = {
    currentRoute: 'home',
    currentProductId: 'vk-epx-301',
    selectedVariantIdx: 1,
    pdpQty: 1,
    pdpGalleryIdx: 0,
    pdpCustomNote: '',
    catalogCategory: 'all',
    catalogSearch: '',
    catalogSort: 'popular',
    catalogView: 'grid', // 'grid' | 'list'
    catalogRatioFilter: 'all',
    catalogMaxPrice: 12000,
    catalogVisibleCount: 8,
    socialTagFilter: 'all',
    feedPersona: (typeof Store !== 'undefined' && typeof Store.getPersonaPreference === 'function' ? Store.getPersonaPreference() : 'all') || 'all',
    cardVarieties: {},
    pdpSelectedColorIdx: 0,
    pdpSelectedShapeIdx: 0,
    pdpSelectedSizeIdx: 0,
    quizStep: 0,
    quizAnswers: {},
    quizCompleted: false,
    customBuilder: {
      shape: '12" Royal Heirloom Block',
      shapePrice: 4499,
      flowerSource: 'Fresh Wedding Varmala (Free Doorstep Pickup)',
      sourceAddon: 0,
      metallic: '24K Gold Leaf + Champagne Rim',
      metallicAddon: 350,
      secondaryKeepsake: 'None (Main Keepsake Only)',
      secondaryAddon: 0,
      eventDate: '2026-11-18',
      pickupSlot: 'Morning Slot (9:00 AM – 1:00 PM)',
      engraving: '',
      ledBase: true
    },
    orderSearchQuery: '',
    editingAccountProfile: false,
    pendingCheckoutAfterAuth: false,
    calcShape: 'rect', // 'rect' | 'circle'
    calcLength: 20,
    calcWidth: 20,
    calcDiameter: 25,
    calcDepth: 1.5,
    calcSystem: '3:1',
    activeStoryIdx: null,
    storyTimer: null,
    reviews: {
      'vk-epx-301': [
        { author: ' Diya Sharma • Jaipur Resin Studio', rating: 5, date: '2 days ago', verified: true, text: 'Zero micro-bubbles even in 32°C weather! Used the 1.2kg kit for 3 bridal varmala blocks and the optical clarity is like liquid diamond.' },
        { author: 'Rohan Kulkarni • Pune Woodworks', rating: 5, date: '1 week ago', verified: true, text: 'The 3:1 weight ratio is super forgiving when weighed on a digital kitchen scale. Hardens to a rock-solid 82D finish without any amine blush.' }
      ],
      'ram-keep-001': [
        { author: 'Ananya & Kabir • Udaipur Wedding', rating: 5, date: '3 days ago', verified: true, text: 'BlueDart picked up our wedding garlands the next morning and 2 weeks later we received the most breathtaking 12-inch floral block with gold calligraphy!' }
      ]
    }
  };

  // Utility: Escape HTML to prevent XSS on user inputs
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatINR(num) {
    const val = Math.round(Number(num) || 0);
    return '₹' + val.toLocaleString('en-IN');
  }

  // Modal Scroll-Lock & Accessibility Helpers
  const MODAL_IDS = [
    'mobile-menu-drawer',
    'global-filter-drawer',
    'story-viewer-modal',
    'lightbox-modal',
    'tds-spec-modal',
    'share-memory-modal',
    'checkout-modal',
    'payment-processing-modal',
    'global-pincode-modal',
    'cloudflare-auth-modal',
    'account-bar-modal',
    'dpdp-notice-modal',
    'dpdp-preferences-modal',
    'dpdp-grievance-modal'
  ];

  let lastActiveModalId = null;
  let lastModalTriggerEl = null;

  function syncBodyModalLock() {
    if (typeof document === 'undefined' || !document.body) return;
    const openModalId = MODAL_IDS.find(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    }) || null;
    const anyOpen = Boolean(openModalId);
    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.toggle('modal-open', anyOpen);
    }
    document.body.classList.toggle('modal-open', anyOpen);

    if (openModalId && openModalId !== lastActiveModalId) {
      const modalEl = document.getElementById(openModalId);
      if (document.activeElement && document.activeElement !== document.body && (!modalEl || !modalEl.contains(document.activeElement))) {
        lastModalTriggerEl = document.activeElement;
      }
      lastActiveModalId = openModalId;
      if (modalEl) {
        const focusable = modalEl.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0 && !modalEl.contains(document.activeElement)) {
          focusable[0].focus({ preventScroll: true });
        }
      }
    } else if (!openModalId && lastActiveModalId) {
      lastActiveModalId = null;
      if (lastModalTriggerEl && typeof lastModalTriggerEl.focus === 'function' && document.contains(lastModalTriggerEl)) {
        lastModalTriggerEl.focus({ preventScroll: true });
      }
      lastModalTriggerEl = null;
    }
  }

  window.openModalById = function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
      syncBodyModalLock();
    }
  };

  window.closeModalById = function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      syncBodyModalLock();
    }
  };

  window.scrollToSection = function (sectionId) {
    const el = document.getElementById(sectionId);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toast Notification System
  let toastTimer = null;
  window.showToast = function (message, subtitle = '') {
    const container = document.getElementById('global-toast');
    const titleEl = document.getElementById('global-toast-title');
    const subEl = document.getElementById('global-toast-sub');
    if (!container || !titleEl) return;

    titleEl.textContent = message;
    if (subEl) {
      subEl.textContent = subtitle;
      subEl.classList.toggle('hidden', !subtitle);
    }

    container.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
    container.classList.add('opacity-100', 'translate-y-0');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      container.classList.remove('opacity-100', 'translate-y-0');
      container.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
    }, 2800);
  };

  // =========================================================================
  // AWWWARDS SOTD FLUID MICRO-INTERACTIONS & TACTILE FEEDBACK ENGINE
  // (Zero Audio • 100% Focused Luxury E-Commerce Experience)
  // =========================================================================

  // Liquid Resin Ripple Effect on Click
  function sotdResinRipple(e) {
    if (!e || typeof document === 'undefined') return;
    const btn = e.currentTarget || e.target;
    if (!btn || !btn.getBoundingClientRect) return;
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    const d = Math.max(rect.width, rect.height);
    const clientX = e.clientX ?? (rect.left + rect.width / 2);
    const clientY = e.clientY ?? (rect.top + rect.height / 2);
    const x = clientX - rect.left - d / 2;
    const y = clientY - rect.top - d / 2;

    circle.className = 'sotd-ripple-effect';
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    btn.appendChild(circle);

    setTimeout(() => {
      try { circle.remove(); } catch (_e) {}
    }, 700);
  }
  window.sotdResinRipple = sotdResinRipple;

  // Heart-Burst Multi-Particle Physics on Wishlist Toggle
  function sotdHeartBurst(btn) {
    if (!btn || typeof document === 'undefined' || !btn.getBoundingClientRect) return;
    const rect = btn.getBoundingClientRect();
    const wrap = document.createElement('div');
    wrap.className = 'sotd-heart-burst-wrap';
    wrap.style.left = `${rect.left + rect.width / 2}px`;
    wrap.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(wrap);

    const colors = ['#9e3322', '#b08d57', '#ffd79b', '#e05b45', '#ffdeae'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      p.className = 'sotd-burst-particle';
      const angle = (i / 8) * 2 * Math.PI;
      const dist = 24 + (i % 3) * 6;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 8;
      p.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      p.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      p.style.backgroundColor = colors[i % colors.length];
      wrap.appendChild(p);
    }

    setTimeout(() => {
      try { wrap.remove(); } catch (_e) {}
    }, 700);
  }
  window.sotdHeartBurst = sotdHeartBurst;

  // Universal Back Navigation for Non-Technical Users & Accessibility
  window.handleBackButton = function (fallbackRoute = 'home') {
    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      window.history.back();
    } else {
      window.navigateTo(fallbackRoute);
    }
  };

  // Physical Backspace Key Navigation (when user is not editing an input field)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        const isEditable = document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag));
        if (!isEditable) {
          const nonHomeRoutes = ['catalog', 'product', 'social', 'custom-studio', 'wishlist', 'cart', 'account', '404'];
          if (nonHomeRoutes.includes(AppState.currentRoute)) {
            e.preventDefault();
            window.handleBackButton('home');
          }
        }
      }
    });
  }

  // 3D Card Tilt & Specular Light Reflection
  function initSotdTilt() {
    if (typeof document === 'undefined') return;
    if (window.matchMedia) {
      if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    }
    const cards = document.querySelectorAll('.sotd-tilt, .ram-card');
    cards.forEach(card => {
      if (card._sotdTiltBound) return;
      card._sotdTiltBound = true;

      let glare = card.querySelector('.sotd-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'sotd-glare';
        card.appendChild(glare);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const px = (x - cx) / cx;
        const py = (y - cy) / cy;

        const rotX = -py * 5;
        const rotY = px * 5;

        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`;
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)`;
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        if (glare) glare.style.opacity = '0';
      });
    });
  }

  // Magnetic Button Snaps
  function initSotdMagnetic() {
    if (typeof document === 'undefined') return;
    if (window.matchMedia) {
      if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    }
    const btns = document.querySelectorAll('.sotd-magnetic');
    btns.forEach(btn => {
      if (btn._sotdMagBound) return;
      btn._sotdMagBound = true;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        const pullX = Math.max(-6, Math.min(6, x * 0.18));
        const pullY = Math.max(-6, Math.min(6, y * 0.18));
        btn.style.transform = `translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0)`;
      }, { passive: true });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // Interactive Before/After Flower Dehydration Slider Controller
  window.updateSotdSlider = function (rangeEl) {
    if (!rangeEl) return;
    const container = rangeEl.closest('.sotd-dehydration-slider');
    if (!container) return;
    const val = Number(rangeEl.value) || 50;
    container.dataset.split = String(val);
    const beforeLayer = container.querySelector('.sotd-before-layer');
    const divider = container.querySelector('.sotd-slider-divider');
    const pctReadout = container.querySelector('.sotd-slider-pct');
    if (beforeLayer) beforeLayer.style.width = `${val}%`;
    if (divider) divider.style.left = `${val}%`;
    if (pctReadout) pctReadout.textContent = `${val}%`;
  };

  // Specimen Inspection Loupe on PDP
  function initSotdSpecimenLoupe() {
    if (typeof document === 'undefined') return;
    const stage = document.getElementById('pdp-specimen-stage');
    const loupe = document.getElementById('pdp-specimen-loupe');
    const inner = document.getElementById('pdp-loupe-inner');
    if (!stage || !loupe || !inner) return;

    stage.addEventListener('mouseenter', () => {
      loupe.classList.remove('hidden');
    });
    stage.addEventListener('mouseleave', () => {
      loupe.classList.add('hidden');
    });
    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const px = x / rect.width;
      const py = y / rect.height;

      loupe.style.transform = `translate3d(${x - 72}px, ${y - 72}px, 0)`;
      const innerX = -(px * 200);
      const innerY = -(py * 200);
      inner.style.transform = `translate3d(${innerX.toFixed(1)}%, ${innerY.toFixed(1)}%, 0)`;
    }, { passive: true });
  }

  // Fluid Viewport Scroll Reveals
  function initSotdScrollReveals() {
    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const reveals = document.querySelectorAll('.sotd-reveal:not(.is-visible)');
    if (!reveals.length) return;
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => obs.observe(el));
  }

  // Master Studio Interaction Binder
  function initSotdInteractions() {
    initSotdTilt();
    initSotdMagnetic();
    initSotdSpecimenLoupe();
    initSotdScrollReveals();
  }
  window.initSotdInteractions = initSotdInteractions;

  function renderBarOrdersHtml(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return `<p class="text-xs text-on-surface-variant">No studio orders placed yet.</p>`;
    }
    return orders.map(ord => {
      const stages = ord.stages || ['Order Confirmed', 'Materials Prepped', 'Silica Dehydration', 'Deep Cast Pour', 'Polish & Dispatch'];
      const stageIdx = Number(ord.stageIndex ?? 1);
      return `
        <div class="p-3 rounded-xl bg-surface-container-low border border-[#e4e0d8] space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="font-spec-numeral text-xs font-bold text-primary">#${esc(ord.orderId)}</span>
              <span class="text-[10px] text-on-surface-variant block">${esc(ord.date || 'Active Batch')} • ${formatINR(ord.total)}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-[10px] font-bold truncate max-w-[165px]">${esc(ord.status)}</span>
          </div>
          <div class="grid grid-cols-5 gap-1 pt-0.5">
            ${stages.map((st, idx) => `
              <div class="flex flex-col gap-0.5">
                <div class="h-1.5 rounded-full ${idx <= stageIdx ? 'bg-emerald-700' : 'bg-[#e4e0d8]'}"></div>
                <span class="text-[9px] leading-tight truncate ${idx <= stageIdx ? 'font-bold text-primary' : 'text-on-surface-variant'}">${idx + 1}. ${esc(st.split(' ')[0])}</span>
              </div>
            `).join('')}
          </div>
          <p class="text-[10px] text-on-surface-variant truncate">🚚 ${esc(ord.courier || 'BlueDart Air Priority')}</p>
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            ${!ord.mockupApproved ? `
              <button type="button" onclick="window.handleApproveOrderMockup('${esc(ord.orderId)}')" class="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-lg bg-[#9e3322] text-white text-[11px] font-bold cursor-pointer">
                Approve Pre-Pour Layout
              </button>
            ` : `
              <span class="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center">✓ Layout Approved</span>
            `}
            <button type="button" onclick="window.openOrderInvoiceModal('${esc(ord.orderId)}')" class="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-white border border-[#e4e0d8] text-primary text-[11px] font-semibold cursor-pointer">
              GST Invoice
            </button>
            <button type="button" onclick="window.closeModalById('account-bar-modal'); window.handleReorder('${esc(ord.orderId)}');" class="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-white border border-[#e4e0d8] text-primary text-[11px] font-semibold cursor-pointer">
              Reorder
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Sync Header, Bottom Nav Badges & Top-Bar Account Drawer Slots
  function updateGlobalBadges() {
    const summary = Store.getCartSummary();
    const wishlist = Store.getWishlist();
    const pinInfo = Store.getPincodeInfo();
    const isAuth = typeof Store.isAuthenticated === 'function' ? Store.isAuthenticated() : false;
    const auth = (typeof Store.getAuthSession === 'function' && Store.getAuthSession()) || {};
    const profile = Store.getPatronProfile();

    document.querySelectorAll('.js-cart-badge').forEach(el => {
      el.textContent = summary.itemsCount;
      el.classList.toggle('hidden', summary.itemsCount === 0);
    });
    document.querySelectorAll('.js-wishlist-badge').forEach(el => {
      el.textContent = wishlist.length;
      el.classList.toggle('hidden', wishlist.length === 0);
    });
    document.querySelectorAll('.js-header-pin').forEach(el => {
      el.textContent = pinInfo.pin;
    });

    // Update Top-Bar Account Button Label & Status Dot
    const barLabel = document.getElementById('header-account-bar-label');
    const barDot = document.getElementById('header-account-bar-dot');
    const displayName = (auth.name || (isAuth ? profile.name : '') || '').trim();
    if (barLabel) {
      barLabel.textContent = isAuth && displayName ? displayName.split(' ')[0] : 'Sign In';
    }
    if (barDot) {
      barDot.classList.toggle('hidden', !isAuth);
    }

    // Update Slide-Over Navigation Bar Account Card (#bar-drawer-account-slot)
    const drawerSlot = document.getElementById('bar-drawer-account-slot');
    if (drawerSlot) {
      if (isAuth) {
        const providerBadge = String(auth.provider || 'email').toUpperCase();
        const addrText = auth.address || profile.defaultAddress || '';
        drawerSlot.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800">${esc(providerBadge)} VERIFIED</span>
              </div>
              <p class="text-xs font-bold text-primary truncate mt-0.5">${esc(displayName || auth.email || 'Signed-In Patron')}</p>
              ${auth.email ? `<p class="text-[11px] text-on-surface-variant truncate">${esc(auth.email)}</p>` : ''}
              ${addrText ? `<p class="text-[11px] text-on-surface-variant line-clamp-2 mt-1">📍 ${esc(addrText)}</p>` : ''}
            </div>
            <button type="button" onclick="window.closeModalById('mobile-menu-drawer'); window.openAccountBarModal();" class="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-white border border-[#e4e0d8] text-[11px] font-bold text-primary shrink-0 cursor-pointer">Edit</button>
          </div>
          <div class="flex items-center gap-2 pt-1 border-t border-[#e4e0d8]">
            <button type="button" onclick="window.closeModalById('mobile-menu-drawer'); window.openAccountBarModal();" class="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold cursor-pointer">Orders &amp; Address</button>
            <button type="button" onclick="window.handlePatronLogout()" class="min-h-[44px] px-3 py-1.5 rounded-lg bg-white border border-[#e4e0d8] text-[#9e3322] text-[11px] font-bold cursor-pointer">Sign Out</button>
          </div>
        `;
      } else {
        drawerSlot.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] uppercase tracking-wider font-bold text-secondary">Guest Session</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#ffe4de] text-[#9e3322] font-bold">Sign In to Order</span>
          </div>
          <p class="text-[11px] text-on-surface-variant leading-snug">Browse keepsakes &amp; calculate epoxy pours freely. Sign in with Google, Apple, or Email to sync your wishlist and place an order.</p>
          <button type="button" onclick="window.closeModalById('mobile-menu-drawer'); window.openCloudflareAuthModal(false);" class="w-full min-h-[44px] px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-base" aria-hidden="true">login</span>
            <span>Sign In (Google / Apple / Email)</span>
          </button>
        `;
      }
    }

    // Update Top-Bar Account & Shipping Popup Drawer (#account-bar-modal-body)
    const barModalBody = document.getElementById('account-bar-modal-body');
    if (barModalBody) {
      const orders = Store.getOrders();
      if (isAuth) {
        const providerBadge = String(auth.provider || 'email').toUpperCase();
        const curName = auth.name || profile.name || '';
        const curPhone = auth.phone || profile.phone || '';
        const curEmail = auth.email || profile.email || '';
        const curAddr = auth.address || profile.defaultAddress || '';

        barModalBody.innerHTML = `
          <div class="p-3.5 rounded-xl bg-white border border-[#e4e0d8] space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">${esc(providerBadge)} VERIFIED</span>
              <button type="button" onclick="window.handlePatronLogout()" class="min-h-[44px] px-2 flex items-center text-xs font-bold text-[#9e3322] hover:underline cursor-pointer">Sign Out</button>
            </div>
            <p class="text-sm font-bold text-primary break-words">${esc(curName)}</p>
            <p class="text-xs text-on-surface-variant break-words">${esc(curEmail)}${curPhone ? ' • ' + esc(curPhone) : ''}</p>
            <p class="text-xs text-primary bg-surface-container-low p-2.5 rounded-lg border border-[#e4e0d8] break-words">
              <strong class="block text-[10px] uppercase tracking-wider text-secondary mb-0.5">Saved Delivery Address</strong>
              ${curAddr ? esc(curAddr) : 'No address saved yet — will be collected at checkout or below.'}
            </p>
          </div>

          <form onsubmit="window.saveBarAccountDetails(event)" class="p-3.5 rounded-xl bg-white border border-[#e4e0d8] space-y-2.5">
            <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Update Account &amp; Delivery Address</h4>
            <div>
              <label for="bar-prof-name" class="text-[11px] font-semibold text-primary block mb-0.5">Full Name *</label>
              <input id="bar-prof-name" type="text" required value="${esc(curName)}" class="w-full h-11 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
            </div>
            <div>
              <label for="bar-prof-phone" class="text-[11px] font-semibold text-primary block mb-0.5">Mobile / WhatsApp *</label>
              <input id="bar-prof-phone" type="tel" required value="${esc(curPhone)}" placeholder="+91 98765 43210" class="w-full h-11 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
            </div>
            <div>
              <label for="bar-prof-email" class="text-[11px] font-semibold text-primary block mb-0.5">Email Address *</label>
              <input id="bar-prof-email" type="email" required value="${esc(curEmail)}" class="w-full h-11 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
            </div>
            <div>
              <label for="bar-prof-address" class="text-[11px] font-semibold text-primary block mb-0.5">Shipping Street Address &amp; PIN *</label>
              <input id="bar-prof-address" type="text" required value="${esc(curAddr)}" placeholder="Flat / House No., Street, City &amp; 6-Digit PIN" class="w-full h-11 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
            </div>
            <button type="submit" class="w-full min-h-[44px] py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer">Save Account Details</button>
          </form>

          <div class="p-3.5 rounded-xl bg-white border border-[#e4e0d8] space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Live Order Tracker (${orders.length})</h4>
              <span class="text-[10px] font-spec-numeral text-secondary">5-Stage Telemetry</span>
            </div>
            <div id="bar-account-orders-list" class="space-y-2.5">
              ${renderBarOrdersHtml(orders)}
            </div>
          </div>
        `;
      } else {
        barModalBody.innerHTML = `
          <div class="p-4 rounded-xl bg-white border border-[#e4e0d8] space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] font-bold uppercase">Guest Mode</span>
              <span class="text-[11px] text-secondary font-semibold">Verified Account</span>
            </div>
            <p class="text-xs text-on-surface-variant leading-relaxed">
              You can browse all <strong>Vistāra Krafts</strong> keepsakes, save items to your wishlist, and build your bag freely. Sign in with 1 click when you are ready to place an order.
            </p>
            <button type="button" onclick="window.closeModalById('account-bar-modal'); window.openCloudflareAuthModal(false);" class="btn-shimmer w-full min-h-[48px] py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              <span class="material-symbols-outlined text-base" aria-hidden="true">login</span>
              <span>Sign In / Create Account</span>
            </button>
          </div>

          <div class="p-3.5 rounded-xl bg-white border border-[#e4e0d8] space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Studio Batch Tracker (${orders.length})</h4>
              <span class="text-[10px] font-spec-numeral text-secondary">Order History</span>
            </div>
            <div id="bar-account-orders-list" class="space-y-2.5">
              ${renderBarOrdersHtml(orders)}
            </div>
          </div>
        `;
      }
    }
  }

  let lastRenderedRouteKey = '';

  // Route Navigation
  window.navigateTo = function (route, param = null) {
    let targetHash = '#/' + route;
    if (route === 'product' && param) {
      AppState.currentProductId = param;
      AppState.selectedVariantIdx = 0;
      const prod = Store.getProductById(param);
      if (prod && prod.variants) {
        const popIdx = prod.variants.findIndex(v => v.popular);
        AppState.selectedVariantIdx = popIdx > -1 ? popIdx : 0;
      }
      AppState.pdpQty = 1;
      AppState.pdpGalleryIdx = 0;
      AppState.pdpCustomNote = '';
      targetHash = '#/product/' + param;
    } else if (route === 'catalog' && param) {
      AppState.catalogCategory = param;
      targetHash = '#/catalog';
    }

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    handleRouteChange(true);
  };

  function parseHash() {
    const raw = (window.location.hash || '#/home').replace(/^#\/?/, '');
    const qIdx = raw.indexOf('?');
    const pathPart = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
    const queryPart = qIdx >= 0 ? raw.slice(qIdx + 1) : '';
    const parts = (pathPart || '').split('/');
    const route = parts[0] || 'home';
    const param = parts[1] || null;
    const queryParams = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        if (!pair) return;
        const eqIdx = pair.indexOf('=');
        const k = eqIdx >= 0 ? pair.slice(0, eqIdx) : pair;
        const v = eqIdx >= 0 ? pair.slice(eqIdx + 1) : '';
        try {
          queryParams[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (_e) {
          queryParams[k] = v;
        }
      });
    }
    return { route, param, queryParams };
  }

  function handleRouteChange(forceResetScroll = false) {
    const { route, param, queryParams } = parseHash();
    const validRoutes = ['home', 'catalog', 'product', 'social', 'custom-studio', 'wishlist', 'cart', 'account', '404', '500'];

    if (!validRoutes.includes(route)) {
      AppState.currentRoute = '404';
    } else if (route === 'product') {
      if (!param) {
        AppState.currentRoute = '404';
      } else {
        const prod = Store.getProductById(param);
        if (!prod) {
          AppState.currentRoute = '404';
        } else {
          AppState.currentRoute = 'product';
          AppState.currentProductId = param;
          if (prod.variants && AppState.selectedVariantIdx >= prod.variants.length) {
            AppState.selectedVariantIdx = 0;
          }
          if (typeof Store.recordRecentlyViewed === 'function') {
            Store.recordRecentlyViewed(AppState.currentProductId);
          }
        }
      }
    } else {
      AppState.currentRoute = route;
    }

    if (AppState.currentRoute === 'catalog' && queryParams && Object.prototype.hasOwnProperty.call(queryParams, 'q')) {
      AppState.catalogSearch = queryParams.q || '';
    }

    const nextRouteKey = `${AppState.currentRoute}:${AppState.currentRoute === 'product' ? AppState.currentProductId : AppState.currentRoute === 'catalog' ? `${AppState.catalogCategory}:${AppState.catalogSearch}` : ''}`;
    const routeChanged = Boolean(forceResetScroll === true) || nextRouteKey !== lastRenderedRouteKey;
    if (nextRouteKey === lastRenderedRouteKey && forceResetScroll !== true) {
      return;
    }
    lastRenderedRouteKey = nextRouteKey;

    renderActiveView({ resetScroll: routeChanged });
    updateNavHighlight();
    updateGlobalBadges();
    syncBodyModalLock();
  }
  window.handleRouteChange = handleRouteChange;

  function updateNavHighlight() {
    const active = AppState.currentRoute;
    document.querySelectorAll('[data-nav-route]').forEach(btn => {
      const r = btn.getAttribute('data-nav-route');
      const isCurrent = (r === active) || (active === 'product' && r === 'catalog');
      if (btn.classList.contains('bottom-tab-item')) {
        btn.classList.toggle('text-primary', isCurrent);
        btn.classList.toggle('font-bold', isCurrent);
        btn.classList.toggle('text-on-surface-variant', !isCurrent);
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = isCurrent ? "'FILL' 1" : "'FILL' 0";
      } else if (btn.classList.contains('desktop-nav-item')) {
        btn.classList.toggle('text-primary', isCurrent);
        btn.classList.toggle('border-b-2', isCurrent);
        btn.classList.toggle('border-secondary', isCurrent);
        btn.classList.toggle('font-semibold', isCurrent);
        btn.classList.toggle('text-on-surface-variant', !isCurrent);
      }
    });
  }

  // Reusable Product Card Renderer
  function renderProductCard(p, isListView = false) {
    const isFav = Store.isWishlisted(p.id);
    const discountPct = p.regularPrice > p.price ? Math.round(((p.regularPrice - p.price) / p.regularPrice) * 100) : 0;

    const rawColors = Array.isArray(p.colors) ? p.colors : [];
    const rawShapes = Array.isArray(p.shapes) ? p.shapes : [];
    const rawSizes = Array.isArray(p.sizes) ? p.sizes : [];

    const colors = rawColors.map((c, i) => (typeof c === 'string' ? { id: 'c' + i, label: c, hex: '#cda851' } : c));
    const shapes = rawShapes.map((s, i) => (typeof s === 'string' ? { id: 's' + i, label: s } : s));
    const sizes = rawSizes.map((sz, i) => (typeof sz === 'string' ? { id: 'sz' + i, label: sz, priceDelta: 0 } : sz));

    const hasVarieties = colors.length > 0 || shapes.length > 0 || sizes.length > 0;

    if (!AppState.cardVarieties[p.id]) {
      AppState.cardVarieties[p.id] = { colorIdx: 0, shapeIdx: 0, sizeIdx: 0, open: false };
    }
    const varState = AppState.cardVarieties[p.id];
    const currentColorIdx = colors.length ? Math.min(varState.colorIdx || 0, colors.length - 1) : -1;
    const currentShapeIdx = shapes.length ? Math.min(varState.shapeIdx || 0, shapes.length - 1) : -1;
    const currentSizeIdx = sizes.length ? Math.min(varState.sizeIdx || 0, sizes.length - 1) : -1;
    const currentColor = currentColorIdx >= 0 ? colors[currentColorIdx] : null;
    const currentShape = currentShapeIdx >= 0 ? shapes[currentShapeIdx] : null;
    const currentSize = currentSizeIdx >= 0 ? sizes[currentSizeIdx] : null;
    const isOpen = Boolean(varState.open);
    const activePrice = p.price + (currentSize?.priceDelta || 0);

    const isMasculine = p.gender === 'men' || p.genderAffinity === 'masculine';
    const isFeminine = p.gender === 'women' || p.genderAffinity === 'feminine';
    const affinityTag = isMasculine
      ? `<span class="gifting-badge gifting-badge-him" title="Curated for Him • Wood & Dark Resin">👔 For Him</span>`
      : (isFeminine ? `<span class="gifting-badge gifting-badge-her" title="Curated for Her • Floral Keepsake">🌸 For Her</span>` : '');

    if (isListView) {
      return `
        <article class="ram-card sotd-reveal p-3.5 flex flex-col sm:flex-row gap-4 items-start sm:items-center group" data-product-id="${esc(p.id)}">
          <div class="relative w-full sm:w-36 h-44 sm:h-36 rounded-xl bg-surface-container-low overflow-hidden shrink-0 cursor-pointer" onclick="window.navigateTo('product', '${esc(p.id)}')">
            <img src="${esc(p.image)}" alt="${esc(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
            <div class="absolute top-2 left-2 flex flex-col gap-1 max-w-[calc(100%-1rem)]">
              <span class="truncate px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-semibold uppercase shadow-xs">${esc(p.badge)}</span>
              ${affinityTag}
            </div>
          </div>
          <div class="flex-1 min-w-0 w-full flex flex-col justify-between gap-2">
            <div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 text-xs text-secondary">
                  <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">star</span>
                  <span class="font-spec-numeral font-bold text-primary">${p.rating.toFixed(1)}</span>
                  <span class="text-outline font-spec-numeral">(${p.reviewsCount})</span>
                  ${affinityTag ? `<span class="hidden sm:inline-block">${affinityTag}</span>` : ''}
                </div>
                <button type="button" aria-label="Toggle Wishlist" onclick="window.handleWishlistToggle(event, '${esc(p.id)}')" class="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center ${isFav ? 'text-[#9e3322]' : 'text-primary'} hover:scale-105 transition-transform cursor-pointer">
                  <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' ${isFav ? 1 : 0};" aria-hidden="true">${isFav ? 'favorite' : 'favorite_border'}</span>
                </button>
              </div>
              <h2 class="font-headline-sm text-base text-primary font-semibold cursor-pointer hover:text-secondary transition-colors line-clamp-2" onclick="window.navigateTo('product', '${esc(p.id)}')">${esc(p.name)}</h2>
              <p class="text-xs text-on-surface-variant line-clamp-2 mt-0.5">${esc(p.subtitle)}</p>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span class="px-2 py-0.5 rounded bg-surface-container-high text-primary font-spec-numeral text-[11px]">Ratio: ${esc(p.ratio)}</span>
                <span class="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-spec-numeral text-[11px]">Depth: ${esc(p.pourDepth)}</span>
                <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-spec-numeral text-[11px]">${esc(p.unitPriceLabel)}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container">
              <div class="flex items-baseline gap-2">
                <span class="font-spec-numeral text-lg font-bold text-primary">${formatINR(activePrice)}</span>
                <span class="font-spec-numeral text-xs text-outline line-through">${formatINR(p.regularPrice + (currentSize?.priceDelta || 0))}</span>
                ${discountPct > 0 ? `<span class="text-[11px] font-bold text-[#9e3322]">${discountPct}% OFF</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                ${hasVarieties ? `
                <button type="button" onclick="window.toggleProductVariety('${esc(p.id)}', event)" aria-expanded="${isOpen ? 'true' : 'false'}" class="min-h-[44px] px-3 py-2 rounded-lg border border-[#e4e0d8] bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined text-sm text-secondary" aria-hidden="true">tune</span>
                  <span>Varieties</span>
                </button>
                ` : ''}
                <button type="button" onclick="window.navigateTo('product', '${esc(p.id)}')" class="min-h-[44px] px-3.5 py-2 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer">Specs</button>
                <button type="button" onclick="window.handleQuickAdd(this, '${esc(p.id)}')" ${p.inStock === false ? 'disabled' : ''} class="btn-shimmer sotd-magnetic min-h-[44px] px-4 py-2 rounded-lg ${p.inStock === false ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-primary text-on-primary cursor-pointer hover:bg-primary-container'} text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">${p.inStock === false ? 'block' : 'add_shopping_cart'}</span>
                  <span>${p.inStock === false ? 'Sold Out' : 'Quick Add'}</span>
                </button>
              </div>
            </div>
            ${hasVarieties ? `
            <!-- Expandable Variety Drawer for List View -->
            <div id="variety-drawer-${esc(p.id)}" class="variety-drawer ${isOpen ? 'open' : ''} w-full">
              <div class="pt-2 pb-1 border-t border-[#e4e0d8] flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span class="font-bold text-primary">Varieties:</span>
                  <span class="text-[11px] text-secondary font-semibold">${[currentColor?.label, currentShape?.label, currentSize?.label].filter(Boolean).join(' • ')}</span>
                </div>
                ${colors.length > 0 ? `
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[11px] text-on-surface-variant font-medium">Colors:</span>
                  ${colors.map((c, cIdx) => `
                    <button type="button" aria-label="${esc(c.label)}" title="${esc(c.label)}" onclick="window.selectCardVariety('${esc(p.id)}', 'color', ${cIdx}, event)" class="variety-swatch w-6 h-6 rounded-full cursor-pointer relative ${cIdx === currentColorIdx ? 'active ring-2 ring-primary ring-offset-1 scale-110' : 'opacity-80 hover:opacity-100'}" style="background-color: ${esc(c.hex || '#cda851')}; border: 1.5px solid ${(c.hex || '').toLowerCase() === '#ffffff' ? '#ccc' : '#d4af37'};">
                      ${cIdx === currentColorIdx ? '<span class="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold drop-shadow">✓</span>' : ''}
                    </button>
                  `).join('')}
                </div>
                ` : ''}
                ${shapes.length > 0 ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] text-on-surface-variant font-medium">Shapes:</span>
                  ${shapes.map((s, sIdx) => `
                    <button type="button" onclick="window.selectCardVariety('${esc(p.id)}', 'shape', ${sIdx}, event)" class="variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${sIdx === currentShapeIdx ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8]' }">
                      <span>${esc(s.label)}</span>
                    </button>
                  `).join('')}
                </div>
                ` : ''}
                ${sizes.length > 0 ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] text-on-surface-variant font-medium">Sizes:</span>
                  ${sizes.map((sz, szIdx) => `
                    <button type="button" onclick="window.selectCardVariety('${esc(p.id)}', 'size', ${szIdx}, event)" class="variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${szIdx === currentSizeIdx ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8]' }">
                      <span>${esc(sz.label)}</span>
                      ${(sz.priceDelta || 0) > 0 ? `<span class="text-[9px] font-normal">(+${formatINR(sz.priceDelta)})</span>` : ''}
                    </button>
                  `).join('')}
                </div>
                ` : ''}
                <button type="button" onclick="window.addCustomVarietyToCart('${esc(p.id)}')" ${p.inStock === false ? 'disabled' : ''} class="w-full sm:w-auto self-start min-h-[38px] px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer mt-1">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">add_shopping_cart</span>
                  <span id="var-cta-text-${esc(p.id)}">Add Selected Variety • ${formatINR(activePrice)}</span>
                </button>
              </div>
            </div>
            ` : ''}
          </div>
        </article>
      `;
    }

    return `
      <article class="ram-card sotd-tilt sotd-reveal p-2.5 sm:p-3 flex flex-col justify-between relative group h-full" data-product-id="${esc(p.id)}" data-price="${activePrice}" data-ratio="${esc(p.ratio)}">
        <button type="button" aria-label="Save to Wishlist" onclick="window.handleWishlistToggle(event, '${esc(p.id)}')" class="absolute top-3.5 right-3.5 z-10 w-11 h-11 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center ${isFav ? 'text-[#9e3322]' : 'text-primary'} shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer">
          <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' ${isFav ? 1 : 0};" aria-hidden="true">${isFav ? 'favorite' : 'favorite_border'}</span>
        </button>
        <div>
          <div class="relative w-full aspect-square rounded-xl bg-surface-container-low overflow-hidden mb-2.5 cursor-pointer" onclick="window.navigateTo('product', '${esc(p.id)}')">
            <img src="${esc(p.image)}" alt="${esc(p.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <div class="absolute top-2.5 left-2.5 max-w-[calc(100%-3.75rem)] flex flex-col gap-1">
              <span class="px-2.5 py-0.5 rounded-full bg-primary/95 backdrop-blur-xs text-on-primary font-label-sm text-[10px] uppercase font-semibold tracking-wider shadow-xs truncate block">${esc(p.badge)}</span>
              ${affinityTag}
            </div>
            <div class="absolute bottom-0 inset-x-0 bg-primary/90 bg-gradient-to-t from-primary/95 via-primary/85 to-primary/75 px-2.5 py-1.5 flex items-center justify-between gap-1 text-[11px] font-spec-numeral text-white">
              <span class="truncate">${p.category === 'keepsakes' ? 'Custom Keepsake' : 'Ratio ' + esc(p.ratio)}</span>
              <span class="shrink-0">Depth ${esc(p.pourDepth)}</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <div class="flex items-center gap-1 min-w-0">
              <span class="material-symbols-outlined text-secondary text-sm shrink-0" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">star</span>
              <span class="font-spec-numeral text-xs text-primary font-semibold">${p.rating.toFixed(1)}</span>
              <span class="font-spec-numeral text-[11px] text-outline truncate">(${p.reviewsCount})</span>
            </div>
            ${discountPct > 0 ? `<span class="font-spec-numeral text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffe4de] text-[#9e3322] shrink-0">${discountPct}% OFF</span>` : ''}
          </div>
          <h2 class="font-title-md text-[13px] min-[360px]:text-[14px] sm:text-[15px] leading-snug text-primary font-semibold line-clamp-2 min-h-[2.4rem] cursor-pointer hover:text-secondary transition-colors break-words" onclick="window.navigateTo('product', '${esc(p.id)}')">
            ${esc(p.shortName || p.name)}
          </h2>
          <div class="flex flex-wrap gap-1 mt-1.5">
            <span class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] truncate max-w-full">${esc(p.unitPriceLabel)}</span>
            <span class="px-1.5 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-[10px] shrink-0">${p.isCustomizable ? '✨ Personalizable' : 'Lab Certified'}</span>
          </div>
        </div>
        <div class="pt-2.5 mt-2 border-t border-surface-container flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <div class="flex items-baseline gap-1.5 min-w-0 flex-wrap">
              <span id="card-price-${esc(p.id)}" class="font-spec-numeral text-sm min-[360px]:text-base sm:text-lg text-primary font-bold">${formatINR(activePrice)}</span>
              <span class="font-spec-numeral text-[10px] min-[360px]:text-[11px] text-outline line-through">${formatINR(p.regularPrice + (currentSize?.priceDelta || 0))}</span>
            </div>
            <button type="button" onclick="window.navigateTo('product', '${esc(p.id)}')" class="min-h-[44px] px-1.5 sm:px-2 inline-flex items-center text-xs font-semibold text-secondary hover:underline cursor-pointer shrink-0">Details</button>
          </div>
          <button type="button" onclick="window.handleQuickAdd(this, '${esc(p.id)}')" ${p.inStock === false ? 'disabled' : ''} class="btn-shimmer sotd-magnetic w-full h-11 rounded-xl ${p.inStock === false ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-primary hover:bg-primary-container text-on-primary cursor-pointer'} font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-xs">
            <span class="material-symbols-outlined text-base shrink-0" aria-hidden="true">${p.inStock === false ? 'block' : 'add_shopping_cart'}</span>
            <span class="truncate">${p.inStock === false ? 'Sold Out' : 'Quick Add'}</span>
          </button>

          ${hasVarieties ? `
          <!-- Variety Toggle Button & Drawer Immediately Below Product -->
          <div class="mt-1 pt-1.5 border-t border-[#e4e0d8]">
            <button type="button" onclick="window.toggleProductVariety('${esc(p.id)}', event)" aria-expanded="${isOpen ? 'true' : 'false'}" class="w-full min-h-[38px] px-2 py-1.5 rounded-lg border border-[#e4e0d8] bg-surface-container-low hover:bg-surface-container text-primary text-[11px] font-bold flex items-center justify-between gap-1 transition-all cursor-pointer">
              <span class="flex items-center gap-1 truncate">
                <span class="material-symbols-outlined text-sm text-secondary" aria-hidden="true">palette</span>
                <span>${isOpen ? 'Hide Varieties' : 'Select Variety'}</span>
              </span>
              <span class="material-symbols-outlined text-base text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}" aria-hidden="true">expand_more</span>
            </button>
            <div id="variety-drawer-${esc(p.id)}" class="variety-drawer ${isOpen ? 'open' : ''}">
              <div class="pt-2 pb-1 flex flex-col gap-2 text-xs">
                ${colors.length > 0 ? `
                <!-- Colors -->
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-primary">🎨 Colors:</span>
                    <span id="var-color-label-${esc(p.id)}" class="font-semibold text-secondary truncate max-w-[130px]">${esc(currentColor ? currentColor.label : '')}</span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${colors.map((c, cIdx) => `
                      <button type="button" aria-label="${esc(c.label)}" title="${esc(c.label)}" onclick="window.selectCardVariety('${esc(p.id)}', 'color', ${cIdx}, event)" class="variety-swatch w-6 h-6 rounded-full cursor-pointer relative ${cIdx === currentColorIdx ? 'active ring-2 ring-primary ring-offset-1 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}" style="background-color: ${esc(c.hex || '#cda851')}; border: 1.5px solid ${(c.hex || '').toLowerCase() === '#ffffff' ? '#ccc' : '#d4af37'};">
                        ${cIdx === currentColorIdx ? '<span class="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold drop-shadow">✓</span>' : ''}
                      </button>
                    `).join('')}
                  </div>
                </div>
                ` : ''}

                ${shapes.length > 0 ? `
                <!-- Shapes -->
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-primary">📐 Shapes:</span>
                    <span id="var-shape-label-${esc(p.id)}" class="font-semibold text-secondary truncate max-w-[130px]">${esc(currentShape ? currentShape.label : '')}</span>
                  </div>
                  <div class="flex items-center gap-1 flex-wrap">
                    ${shapes.map((s, sIdx) => `
                      <button type="button" onclick="window.selectCardVariety('${esc(p.id)}', 'shape', ${sIdx}, event)" class="variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${sIdx === currentShapeIdx ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container-low'}">
                        <span>${esc(s.label)}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
                ` : ''}

                ${sizes.length > 0 ? `
                <!-- Sizes -->
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-primary">📏 Sizes:</span>
                    <span id="var-size-label-${esc(p.id)}" class="font-semibold text-secondary truncate max-w-[130px]">${esc(currentSize ? currentSize.label : '')}</span>
                  </div>
                  <div class="flex items-center gap-1 flex-wrap">
                    ${sizes.map((sz, szIdx) => `
                      <button type="button" onclick="window.selectCardVariety('${esc(p.id)}', 'size', ${szIdx}, event)" class="variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${szIdx === currentSizeIdx ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container-low'}">
                        <span>${esc(sz.label)}</span>
                        ${(sz.priceDelta || 0) > 0 ? `<span class="text-[9px] ${szIdx === currentSizeIdx ? 'text-[#ffd79b]' : 'text-secondary'} font-normal">(+${formatINR(sz.priceDelta)})</span>` : ''}
                      </button>
                    `).join('')}
                  </div>
                </div>
                ` : ''}

                <!-- Add Selected Variety CTA -->
                <button type="button" onclick="window.addCustomVarietyToCart('${esc(p.id)}')" ${p.inStock === false ? 'disabled' : ''} class="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] transition-all cursor-pointer mt-0.5">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">add_shopping_cart</span>
                  <span id="var-cta-text-${esc(p.id)}">Add Selected Variety • ${formatINR(activePrice)}</span>
                </button>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  // =========================================================================
  // 1. HOME / DISCOVER VIEW
  // =========================================================================
  function renderHomeView() {
    const products = Store.getProducts();
    const persona = AppState.feedPersona || 'all';

    let homeProducts = [...products];
    if (persona === 'masculine') {
      homeProducts.sort((a, b) => {
        const aScore = a.genderAffinity === 'masculine' ? 2 : (a.genderAffinity === 'unisex' ? 1 : 0);
        const bScore = b.genderAffinity === 'masculine' ? 2 : (b.genderAffinity === 'unisex' ? 1 : 0);
        return bScore - aScore || b.reviewsCount - a.reviewsCount;
      });
    } else if (persona === 'feminine') {
      homeProducts.sort((a, b) => {
        const aScore = a.genderAffinity === 'feminine' ? 2 : (a.genderAffinity === 'unisex' ? 1 : 0);
        const bScore = b.genderAffinity === 'feminine' ? 2 : (b.genderAffinity === 'unisex' ? 1 : 0);
        return bScore - aScore || b.reviewsCount - a.reviewsCount;
      });
    }
    const featuredProducts = homeProducts.slice(0, 8);
    const pinInfo = Store.getPincodeInfo();
    const socialPosts = Store.getSocialPosts().slice(0, 3);

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto">
        <!-- Shoppable Instagram Stories Rail (@resin.art.memories) -->
        <section class="px-3.5 sm:px-8 pt-2.5 sm:pt-4 pb-2.5 sm:pb-3 bg-surface border-b border-[#e4e0d8]/70">
          <div class="flex items-center justify-between mb-1.5 sm:mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#9e3322] animate-pulse"></span>
              <span class="font-label-sm text-xs uppercase tracking-wider text-primary font-bold">Live from @resin.art.memories</span>
            </div>
            <a href="https://www.instagram.com/resin.art.memories?utm_source=qr" target="_blank" rel="noopener noreferrer" class="min-h-[44px] text-xs font-semibold text-[#9e3322] hover:underline inline-flex items-center gap-1">
              <span>Open Instagram</span>
              <span class="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
            </a>
          </div>
          <div class="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            ${Store.DEFAULT_STORIES.map((st, idx) => `
              <button type="button" onclick="window.openStoryModal(${idx})" class="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
                <div class="story-ring w-16 h-16 sm:w-20 sm:h-20">
                  <div class="w-full h-full rounded-full overflow-hidden border-2 border-surface bg-surface-container">
                    <img src="${esc(st.image)}" alt="${esc(st.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                  </div>
                </div>
                <span class="font-label-sm text-[11px] text-primary font-semibold tracking-tight">${esc(st.title)}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- Editorial Hero Section (60/30/10 High-RT Architecture) -->
        <section class="relative px-3.5 sm:px-8 py-4 sm:py-10 bg-gradient-to-br from-[#faf8f5] via-[#fdf6f3] to-[#f3f1ec] overflow-hidden border-b border-[#e4e0d8]">
          <div aria-hidden="true" class="absolute inset-0 pointer-events-none opacity-[0.04]">
            <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-deco" width="48" height="48" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="48" stroke="#031a38" stroke-width="1.5"></line>
                  <circle cx="24" cy="24" r="1.5" fill="#b08d57"></circle>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-deco)"></rect>
            </svg>
          </div>

          <div class="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <!-- Hero Left Column (7 cols) -->
            <div class="lg:col-span-7 flex flex-col items-start gap-3.5 min-w-0">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-primary border border-[#b08d57]/40 shadow-2xs max-w-full">
                <img src="${esc(Store.IMAGES.logoVistara)}" alt="Vistāra Krafts VK Monogram" class="w-5 h-5 rounded-sm object-cover shrink-0">
                <span class="font-label-sm text-[11px] uppercase tracking-wider font-bold truncate">Vistāra Krafts • Epoxy &amp; Keepsake Atelier</span>
              </div>

              <h1 class="font-headline-lg text-2xl min-[360px]:text-3xl sm:text-5xl text-primary font-bold tracking-tight leading-[1.14] break-words">
                Hold Your Most Intimate Memories in <span class="italic text-[#9e3322] font-serif">Liquid Glass</span>.
              </h1>

              <p class="font-body-lg text-xs min-[360px]:text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed break-words">
                From preserving wedding varmalas &amp; anniversary roses in museum-grade 50mm blocks to supplying India’s purest 3:1 &amp; 2:1 optical epoxy systems by <strong>Vistāra Krafts</strong>.
              </p>

              <!-- Primary & Secondary Conversion CTAs -->
              <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5 sm:gap-3 pt-1">
                <button type="button" onclick="window.navigateTo('catalog', 'all')" class="btn-shimmer min-h-[48px] w-full sm:w-auto px-4 sm:px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer">
                  <span>Shop Keepsakes &amp; Epoxy Kits</span>
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
                </button>
                <button type="button" onclick="window.navigateTo('custom-studio')" class="min-h-[48px] w-full sm:w-auto px-4 sm:px-6 rounded-xl bg-white hover:bg-[#fdf6f3] text-primary border border-[#b08d57] font-title-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer">
                  <span class="material-symbols-outlined text-lg text-[#9e3322]" aria-hidden="true">auto_awesome</span>
                  <span class="truncate">Custom Keepsake &amp; Calculator</span>
                </button>
              </div>

              <!-- Trust & Optical Clarity Bar -->
              <div class="w-full mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div class="rounded-xl bg-white/90 border border-[#e4e0d8] p-3 flex items-center gap-3 shadow-2xs min-w-0">
                  <img src="${esc(Store.IMAGES.floralCube)}" alt="Preserved Bridal Roses" class="w-11 h-11 rounded-lg object-cover shrink-0">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1 text-[#9e3322] font-label-sm text-[11px] uppercase font-bold truncate">
                      <span class="material-symbols-outlined text-sm shrink-0" aria-hidden="true">local_florist</span>
                      <span class="truncate">Pan-India Varmala Pickup</span>
                    </div>
                    <p class="text-xs text-on-surface leading-tight mt-0.5 break-words">Doorstep flower pickup in 24h across 19,000+ PINs</p>
                  </div>
                </div>
                <div class="rounded-xl bg-white/90 border border-[#e4e0d8] p-3 flex items-center gap-3 shadow-2xs min-w-0">
                  <img src="${esc(Store.IMAGES.ultraclearThumb2)}" alt="Optical Clarity Test Disc" class="w-11 h-11 rounded-lg object-cover shrink-0">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1 text-secondary font-label-sm text-[11px] uppercase font-bold truncate">
                      <span class="material-symbols-outlined text-sm shrink-0" aria-hidden="true">verified</span>
                      <span class="truncate">99.4% Optical Transmission</span>
                    </div>
                    <p class="text-xs text-on-surface leading-tight mt-0.5 break-words">ASTM D1003 HALS UV-shielded non-yellowing resin</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hero Right Showcase Card (5 cols) -->
            <div class="lg:col-span-5 min-w-0">
              <div class="relative rounded-2xl overflow-hidden shadow-xl border border-[#b08d57]/40 bg-primary group cursor-pointer" onclick="window.navigateTo('product', 'ram-keep-001')">
                <div class="aspect-[4/4] sm:aspect-[4/3] lg:aspect-[4/4] w-full overflow-hidden">
                  <img src="${esc(Store.IMAGES.floralCube)}" alt="Bridal Bouquet Preserved in Crystal Clear Resin" class="w-full h-full object-cover object-center scale-[1.22] group-hover:scale-[1.26] transition-transform duration-700">
                </div>
                <div class="absolute inset-x-0 bottom-0 bg-primary/90 bg-gradient-to-t from-primary via-primary/95 to-primary/70 flex flex-col justify-end p-4 sm:p-5 text-white">
                  <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full bg-[#9e3322] text-white text-[10px] font-bold uppercase tracking-wider truncate">Most Loved on @resin.art.memories</span>
                    <span class="font-spec-numeral text-xs bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full shrink-0">★ 5.0 (418)</span>
                  </div>
                  <h2 class="font-headline-sm text-lg sm:text-2xl font-bold break-words">Eternal Varmala &amp; Rose Keepsake Block</h2>
                  <p class="text-xs text-white/90 mt-1 break-words">Includes silica-gel cryo-drying, 24K gold leaf &amp; couple name engraving</p>
                  <div class="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-baseline gap-1.5">
                      <span class="font-spec-numeral text-lg sm:text-xl font-bold text-[#ffd79b]">₹4,499</span>
                      <span class="font-spec-numeral text-xs line-through text-white/80">₹5,499</span>
                    </div>
                    <span class="inline-flex items-center gap-1 min-h-[44px] text-xs font-semibold bg-white text-primary px-3 py-2 rounded-lg shrink-0">
                      <span>Customize Piece</span>
                      <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- First-User Research & Interactive 30-Second Persona Matcher + Pincode Checker -->
        <section class="px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-surface-container-low border-b border-[#e4e0d8]">
          <!-- Left: Guided Discovery Quiz (7 cols) -->
          <div class="lg:col-span-7 ram-card p-5 flex flex-col justify-between gap-4 bg-gradient-to-r from-white to-[#fdf6f3]">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-1.5 text-[#9e3322] font-label-sm text-[11px] uppercase tracking-wider font-bold">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">psychology</span>
                  <span>Find What You Need</span>
                </div>
                <h2 class="font-headline-sm text-lg sm:text-xl text-primary font-bold mt-0.5">What are you creating or preserving today?</h2>
                <p class="text-xs text-on-surface-variant">Tap your goal below and we’ll show you the best choice:</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-spec-numeral text-[11px] font-bold shrink-0">30-Second Helper</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="persona-quiz-options">
              <button type="button" onclick="window.selectPersonaGoal('preserve')" class="p-3 rounded-xl border ${AppState.quizAnswers.goal === 'preserve' ? 'border-[#9e3322] bg-[#ffe4de]/50 ring-2 ring-[#9e3322]/30' : 'border-[#e4e0d8] bg-white'} text-left hover:border-secondary transition-all cursor-pointer">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-[#9e3322]" aria-hidden="true">local_florist</span>
                  <span class="text-[10px] font-bold uppercase text-secondary">Bride / Gift</span>
                </div>
                <p class="font-title-md text-xs font-bold text-primary">Preserve My Flowers</p>
                <p class="text-[11px] text-on-surface-variant mt-0.5">Wedding varmala, bouquet or memorial block</p>
              </button>

              <button type="button" onclick="window.selectPersonaGoal('decor')" class="p-3 rounded-xl border ${AppState.quizAnswers.goal === 'decor' ? 'border-[#9e3322] bg-[#ffe4de]/50 ring-2 ring-[#9e3322]/30' : 'border-[#e4e0d8] bg-white'} text-left hover:border-secondary transition-all cursor-pointer">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-secondary" aria-hidden="true">diamond</span>
                  <span class="text-[10px] font-bold uppercase text-secondary">Collector</span>
                </div>
                <p class="font-title-md text-xs font-bold text-primary">Buy Ready Resin Art</p>
                <p class="text-[11px] text-on-surface-variant mt-0.5">Ocean trays, geode wall art &amp; brass coasters</p>
              </button>

              <button type="button" onclick="window.selectPersonaGoal('diy')" class="p-3 rounded-xl border ${AppState.quizAnswers.goal === 'diy' ? 'border-[#9e3322] bg-[#ffe4de]/50 ring-2 ring-[#9e3322]/30' : 'border-[#e4e0d8] bg-white'} text-left hover:border-secondary transition-all cursor-pointer">
                <div class="flex items-center justify-between mb-1">
                  <span class="material-symbols-outlined text-primary" aria-hidden="true">science</span>
                  <span class="text-[10px] font-bold uppercase text-secondary">Resin Artist</span>
                </div>
                <p class="font-title-md text-xs font-bold text-primary">DIY Epoxy &amp; Molds</p>
                <p class="text-[11px] text-on-surface-variant mt-0.5">3:1 &amp; 2:1 resin kits, mica &amp; silicone molds</p>
              </button>
            </div>

            <div id="persona-recommendation-box" class="${AppState.quizAnswers.goal ? '' : 'hidden'} p-3 rounded-xl bg-primary text-on-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              ${renderPersonaRecommendation()}
            </div>
          </div>

          <!-- Right: Live Pan-India Transit & Floral Pickup Checker (5 cols) -->
          <div class="lg:col-span-5 ram-card p-5 flex flex-col justify-between gap-3 bg-white">
            <div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-xl" aria-hidden="true">local_shipping</span>
                  <h2 class="font-title-md text-base text-primary font-bold">Check Delivery &amp; Pickup</h2>
                </div>
                <span class="font-label-sm text-[11px] text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container/40 font-semibold shrink-0">Air &amp; Surface Cargo</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-1">
                Check delivery times and free 24-hour flower pickup across India:
              </p>
            </div>

            <form class="flex flex-col sm:flex-row gap-2" onsubmit="event.preventDefault(); window.submitHomePincode();">
              <label for="home-pincode-input" class="sr-only">Enter 6-digit PIN code</label>
              <input id="home-pincode-input" type="text" maxlength="6" aria-label="Enter 6-digit PIN code" value="${esc(pinInfo.pin)}" placeholder="Enter 6-digit PIN (e.g. 560001)" class="min-w-0 flex-1 h-12 px-3.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
              <button type="submit" class="h-12 px-5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold shrink-0 active:scale-95 transition-transform cursor-pointer">
                Verify PIN
              </button>
            </form>

            <div id="home-pincode-result" class="p-3 rounded-lg bg-surface-container-low flex items-start gap-2 text-xs">
              <span class="material-symbols-outlined text-base text-[#266b4e] shrink-0 mt-0.5" aria-hidden="true">check_circle</span>
              <span id="home-pincode-msg" class="text-primary leading-relaxed">
                <strong>PIN ${esc(pinInfo.pin)} (${esc(pinInfo.city)})</strong> — Express Delivery in <strong>${esc(pinInfo.days)}</strong> via ${esc(pinInfo.courier)}. Doorstep Floral Pickup &amp; COD active.
              </span>
            </div>
          </div>
        </section>

        <!-- Explore by Craft & Memory Project Rail -->
        <section class="py-7 px-4 sm:px-8 bg-surface flex flex-col gap-4">
          <div class="flex items-end justify-between">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-secondary font-bold">Explore Collections</span>
              <h2 class="font-headline-sm text-xl sm:text-2xl text-primary font-bold tracking-tight">Explore by Memory &amp; Craft Project</h2>
            </div>
            <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[44px] px-2 font-label-sm text-xs text-secondary font-semibold inline-flex items-center gap-0.5 hover:underline cursor-pointer shrink-0">
              <span>View All ${Store.getProducts().length} Series</span>
              <span class="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button type="button" onclick="window.navigateTo('catalog', 'keepsakes')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.floralCube)}" alt="Preserved Florals" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Bridal Varmala</span>
                <span class="font-label-sm text-[11px] text-[#9e3322] block">50mm Deep Cast</span>
              </div>
            </button>

            <button type="button" onclick="window.navigateTo('catalog', 'casting')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.coasterSet)}" alt="Coaster Sets" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Botanical Coasters</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant block">Heat-Shield 3:1</span>
              </div>
            </button>

            <button type="button" onclick="window.navigateTo('catalog', 'keepsakes')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.oceanWave)}" alt="Ocean & Wave Art" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Ocean &amp; Wave Art</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant block">High Viscosity 1:1</span>
              </div>
            </button>

            <button type="button" onclick="window.navigateTo('catalog', 'pigments')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.geodeCanvas)}" alt="Geode Canvas" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Geode Wall Art</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant block">Quartz &amp; Mica</span>
              </div>
            </button>

            <button type="button" onclick="window.navigateTo('catalog', 'deep_pour')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.riverTable)}" alt="Deep Cast Tables" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Deep River Tables</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant block">Ultra Slow 2:1 Pour</span>
              </div>
            </button>

            <button type="button" onclick="window.navigateTo('catalog', 'uv_resin')" class="ram-card p-2.5 text-left flex flex-col gap-2 group cursor-pointer">
              <div class="w-full h-28 rounded-lg overflow-hidden bg-surface-container">
                <img src="${esc(Store.IMAGES.jewelryBezel)}" alt="Jewelry & Bezels" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              </div>
              <div>
                <span class="font-title-md text-xs font-bold text-primary block truncate">Jewelry &amp; Bezels</span>
                <span class="font-label-sm text-[11px] text-on-surface-variant block">90s Hard UV Cure</span>
              </div>
            </button>
          </div>
        </section>

        <!-- Interactive Before & After: 21-Day Cryo-Silica Floral Transformation Slider -->
        <section class="px-4 sm:px-8 py-7 bg-surface flex flex-col gap-4 border-b border-[#e4e0d8]">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-[#9e3322] font-bold">Real Flower Preservation</span>
              <h2 class="font-headline-sm text-2xl sm:text-3xl text-primary font-bold tracking-tight">21-Day Floral Transformation</h2>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Drag the slider to compare real wedding flowers with our clear crystal keepsake block.</p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span class="px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-spec-numeral text-xs font-bold">
                Comparison: <span class="sotd-slider-pct">50%</span>
              </span>
              <button type="button" onclick="window.navigateTo('custom-studio')" class="btn-shimmer sotd-magnetic min-h-[44px] px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span>Commission Keepsake</span>
                <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div class="sotd-dehydration-slider relative w-full aspect-[4/3] sm:aspect-[16/7] rounded-2xl overflow-hidden border border-[#b08d57]/40 shadow-xl select-none" data-split="50">
            <!-- After Layer (Preserved Optical Block) -->
            <div class="absolute inset-0 w-full h-full bg-primary">
              <img src="${esc(Store.IMAGES.floralCube)}" alt="After: Preserved 50mm Crystal Optical Block" class="w-full h-full object-cover">
              <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-[#ffd79b] text-[11px] font-bold uppercase tracking-wider shadow-sm border border-white/15">
                ✨ Day 21: Preserved 50mm Optical Block
              </div>
              <div class="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] hidden sm:block">
                0% Moisture • 95% Natural Color Retained • 85D Mirror Glass
              </div>
            </div>

            <!-- Before Layer (Clipped - Fresh Wedding Garlands) -->
            <div class="sotd-before-layer absolute inset-0 h-full overflow-hidden" style="width: 50%;">
              <img src="${esc(Store.IMAGES.jewelryBezel)}" alt="Before: Fresh Bridal Wedding Garland" class="w-full h-full object-cover max-w-none" style="width: 100%; min-width: 100%;">
              <div class="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider shadow-sm border border-white/15">
                🌸 Day 0: Fresh Wedding Garland
              </div>
              <div class="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] hidden sm:block">
                85% Moisture • Highly Perishable • 24h Express Cryo Pickup
              </div>
            </div>

            <!-- Divider Line & Drag Handle -->
            <div class="sotd-slider-divider absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style="left: 50%;">
              <div class="sotd-slider-handle absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                <span class="material-symbols-outlined text-lg" aria-hidden="true">drag_indicator</span>
              </div>
            </div>

            <!-- Accessible Native Range Input -->
            <input type="range" min="0" max="100" value="50" aria-label="Floral preservation before and after comparison slider" class="sotd-slider-range" oninput="window.updateSotdSlider(this)">
          </div>
        </section>

        <!-- Decorative Art Deco Divider -->
        <div class="px-8"><div class="deco-divider"><span class="deco-diamond"></span></div></div>

        <!-- Bestselling Keepsakes & Archival Resin Systems Grid -->
        <section class="px-4 sm:px-8 py-7 bg-surface flex flex-col gap-5" id="home-catalogue">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div class="inline-flex items-center gap-1.5 text-secondary font-label-sm text-xs uppercase tracking-wider mb-1 font-bold">
                <span class="material-symbols-outlined text-sm" aria-hidden="true">diamond</span>
                <span>Featured Keepsakes &amp; Supplies</span>
              </div>
              <h2 class="font-headline-sm text-2xl sm:text-3xl text-primary font-bold tracking-tight">Bestselling Keepsakes &amp; Epoxy Kits</h2>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="window.navigateTo('catalog', 'keepsakes')" class="min-h-[44px] px-4 py-2 rounded-full bg-[#ffe4de] text-[#9e3322] font-label-sm text-xs font-bold hover:opacity-90 inline-flex items-center cursor-pointer">Preserved Keepsakes</button>
              <button type="button" onclick="window.navigateTo('catalog', 'casting')" class="min-h-[44px] px-4 py-2 rounded-full bg-surface-container-high text-primary font-label-sm text-xs font-semibold hover:bg-secondary-container inline-flex items-center cursor-pointer">Epoxy Kits</button>
              <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[44px] px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-xs font-semibold inline-flex items-center cursor-pointer">All (${Store.getProducts().length})</button>
            </div>
          </div>

          <!-- Feed Curation & Gifting Preference Panel -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-surface-container-low/70 border border-[#e4e0d8] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 text-secondary font-label-sm text-[11px] uppercase tracking-wider font-bold">
                <span class="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
                <span>Feed Curation &amp; Gifting Preference</span>
              </div>
              <p class="text-xs text-on-surface-variant">Personalize your feed: Choose gifts for him, gifts for her, or browse all handcrafted collections.</p>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              <button type="button" onclick="window.setFeedPersona('masculine')" class="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${persona === 'masculine' ? 'bg-primary text-white shadow-xs' : 'bg-white text-primary border border-[#e4e0d8] hover:border-secondary'}">
                <span>👔 Gifts for Him</span>
              </button>
              <button type="button" onclick="window.setFeedPersona('feminine')" class="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${persona === 'feminine' ? 'bg-primary text-white shadow-xs' : 'bg-white text-primary border border-[#e4e0d8] hover:border-secondary'}">
                <span>🌸 Gifts for Her</span>
              </button>
              <button type="button" onclick="window.navigateTo('catalog', 'all'); window.setCatalogSort('gifting');" class="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer bg-white text-primary border border-[#e4e0d8] hover:border-secondary">
                <span class="material-symbols-outlined text-sm" aria-hidden="true">featured_seasonal_and_gifts</span>
                <span>🎁 Gift Sets</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            ${featuredProducts.map(p => renderProductCard(p, false)).join('')}
          </div>
        </section>

        <!-- Social Commerce Teaser Strip (@resin.art.memories) -->
        <section class="px-4 sm:px-8 py-8 bg-[#fdf6f3] border-y border-[#e4e0d8] flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="inline-flex items-center gap-1.5 text-[#9e3322] font-label-sm text-xs uppercase tracking-wider font-bold">
                <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">favorite</span>
                <span>Instagram Community • @resin.art.memories</span>
              </div>
              <h2 class="font-headline-sm text-2xl text-primary font-bold">Shop Directly from Our Studio Reels &amp; Stories</h2>
            </div>
            <button type="button" onclick="window.navigateTo('social')" class="self-start sm:self-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#9e3322] text-white font-label-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer">
              <span>Explore Full Social Feed</span>
              <span class="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${socialPosts.map(post => {
              const taggedProduct = Store.getProductById(post.productId);
              return `
                <div class="ram-card overflow-hidden flex flex-col justify-between bg-white">
                  <div>
                    <div class="p-3 flex items-center justify-between border-b border-surface-container">
                      <div class="flex items-center gap-2">
                        <img src="${esc(post.avatar)}" alt="${esc(post.handle)}" class="w-8 h-8 rounded-full object-cover ring-2 ring-[#9e3322]">
                        <div>
                          <p class="text-xs font-bold text-primary leading-none">${esc(post.handle)}</p>
                          <p class="text-[10px] text-on-surface-variant mt-0.5">${esc(post.location)}</p>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-full bg-[#ffe4de] text-[#9e3322] text-[10px] font-bold">#${esc(post.tag)}</span>
                    </div>
                    <div class="relative aspect-square bg-surface-container overflow-hidden cursor-pointer" onclick="window.navigateTo('social')">
                      <img src="${esc(post.image)}" alt="${esc(post.caption)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                      <span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold">${esc(post.badge)}</span>
                    </div>
                    <div class="p-3.5">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                          <button type="button" onclick="window.handleSocialLike('${esc(post.id)}')" class="min-h-[44px] px-2 flex items-center gap-1 text-xs font-semibold ${post.liked ? 'text-[#9e3322]' : 'text-primary'} cursor-pointer">
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${post.liked ? 1 : 0};" aria-hidden="true">favorite</span>
                            <span class="font-spec-numeral">${post.likes.toLocaleString('en-IN')}</span>
                          </button>
                          <button type="button" onclick="window.navigateTo('social')" class="min-h-[44px] px-2 flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary cursor-pointer">
                            <span class="material-symbols-outlined text-lg" aria-hidden="true">chat_bubble</span>
                            <span class="font-spec-numeral">${post.comments.length}</span>
                          </button>
                        </div>
                        <button type="button" aria-label="Save post" onclick="window.handleSocialSave('${esc(post.id)}')" class="w-11 h-11 flex items-center justify-center text-primary hover:text-secondary cursor-pointer">
                          <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${post.saved ? 1 : 0};" aria-hidden="true">bookmark</span>
                        </button>
                      </div>
                      <p class="text-xs text-on-surface line-clamp-2 leading-relaxed">${esc(post.caption)}</p>
                    </div>
                  </div>
                  ${taggedProduct ? `
                    <div class="px-3.5 py-2.5 bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 min-w-0 cursor-pointer" onclick="window.navigateTo('product', '${esc(taggedProduct.id)}')">
                        <img src="${esc(taggedProduct.image)}" alt="${esc(taggedProduct.shortName)}" class="w-9 h-9 rounded-lg object-cover shrink-0">
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-primary truncate">${esc(taggedProduct.shortName)}</p>
                          <p class="font-spec-numeral text-[11px] text-secondary font-bold">${formatINR(taggedProduct.price)}</p>
                        </div>
                      </div>
                      <button type="button" onclick="window.handleQuickAdd(this, '${esc(taggedProduct.id)}')" class="min-h-[44px] px-3.5 py-2 rounded-lg bg-primary text-on-primary text-[11px] font-semibold shrink-0 cursor-pointer">
                        Add to Bag
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Studio Knowledge Hub & Interactive Quick Pour Calculator + Wholesale Banner -->
        <section class="px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface">
          <!-- Interactive Pour Volume Calculator Card (6 cols) -->
          <div class="lg:col-span-6 ram-card p-5 flex flex-col justify-between gap-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">Studio Knowledge Hub</span>
                <h2 class="font-headline-sm text-xl text-primary font-bold mt-0.5">Interactive Epoxy Pour &amp; Ratio Calculator</h2>
                <p class="text-xs text-on-surface-variant mt-1">Calculate exact Part A (Resin) + Part B (Hardener) gram weights for any mould dimension:</p>
              </div>
              <span class="material-symbols-outlined text-secondary text-3xl" aria-hidden="true">calculate</span>
            </div>

            <div class="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5 bg-surface-container-low p-3 sm:p-3.5 rounded-xl">
              <div>
                <label class="font-label-sm text-[11px] text-on-surface-variant block mb-1" for="home-calc-len">Length (cm)</label>
                <input id="home-calc-len" type="number" min="1" max="500" value="${AppState.calcLength}" class="w-full min-w-0 h-12 px-2.5 bg-white rounded-lg border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
              </div>
              <div>
                <label class="font-label-sm text-[11px] text-on-surface-variant block mb-1" for="home-calc-wid">Width (cm)</label>
                <input id="home-calc-wid" type="number" min="1" max="500" value="${AppState.calcWidth}" class="w-full min-w-0 h-12 px-2.5 bg-white rounded-lg border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
              </div>
              <div>
                <label class="font-label-sm text-[11px] text-on-surface-variant block mb-1" for="home-calc-dep">Depth (cm)</label>
                <input id="home-calc-dep" type="number" min="0.1" max="10" step="0.5" value="${AppState.calcDepth}" class="w-full min-w-0 h-12 px-2.5 bg-white rounded-lg border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
              </div>
              <div>
                <label class="font-label-sm text-[11px] text-on-surface-variant block mb-1" for="home-calc-sys">Ratio System</label>
                <select id="home-calc-sys" class="w-full min-w-0 h-12 px-2 bg-white rounded-lg border border-[#e4e0d8] font-label-sm text-xs text-primary">
                  <option value="3:1" ${AppState.calcSystem === '3:1' ? 'selected' : ''}>3:1 UltraClear</option>
                  <option value="2:1" ${AppState.calcSystem === '2:1' ? 'selected' : ''}>2:1 Deep Pour</option>
                  <option value="1:1" ${AppState.calcSystem === '1:1' ? 'selected' : ''}>1:1 Doming</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container-low border border-[#e4e0d8] min-w-0">
              <div class="min-w-0 flex-1">
                <span class="text-xs text-on-surface-variant block">Recommended Batch Weight (1.1 g/cm³ density):</span>
                <span id="home-calc-output" class="font-spec-numeral text-xs sm:text-base font-bold text-primary block mt-0.5 break-words">
                  ~660g total (Part A: 495g + Part B: 165g)
                </span>
              </div>
              <button type="button" onclick="window.runHomeCalculator()" class="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shrink-0 cursor-pointer">
                Calculate Grams
              </button>
            </div>
          </div>

          <!-- Studio & Production Wholesale Card (6 cols) -->
          <div class="lg:col-span-6 rounded-2xl bg-tertiary text-on-tertiary p-6 relative overflow-hidden shadow-md flex flex-col justify-between gap-4">
            <div aria-hidden="true" class="absolute -right-12 -bottom-12 w-52 h-52 rounded-full bg-secondary/15 pointer-events-none"></div>
            <div class="relative flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary-fixed text-2xl" aria-hidden="true">warehouse</span>
                <span class="font-label-sm text-xs text-secondary-fixed uppercase tracking-wider font-bold">Industrial Craft, Bridal Planners &amp; Furniture Supply</span>
              </div>
              <h2 class="font-headline-sm text-2xl text-white font-bold">Studio &amp; Production Wholesale</h2>
              <p class="text-xs sm:text-sm text-on-tertiary-container leading-relaxed">
                Tiered pricing from 10kg pails to 200kg drums with official 18% GST Input Tax Credit invoices and Batch Certificate of Analysis (COA) for verified workshops.
              </p>
            </div>
            <div class="relative flex flex-wrap items-center gap-3 pt-2">
              <button type="button" onclick="window.openTdsModal('wholesale')" class="min-h-[44px] px-5 rounded-xl bg-secondary text-on-secondary font-label-md text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-transform cursor-pointer">
                <span class="material-symbols-outlined text-lg" aria-hidden="true">download</span>
                <span>View Wholesale Slab &amp; COA Sheet</span>
              </button>
              <button type="button" onclick="window.navigateTo('account')" class="min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-base" aria-hidden="true">receipt_long</span>
                <span>Track Studio Orders &amp; GST Invoices</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 5-Stage Bridal Varmala & Bouquet Preservation Ritual -->
        <section class="px-4 sm:px-8 py-8 bg-surface-container-low border-t border-[#e4e0d8] flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-[#9e3322] font-bold">From Wedding Mandap to Forever Heirloom</span>
              <h2 class="font-headline-sm text-2xl text-primary font-bold">How Our 5-Stage Varmala &amp; Bouquet Preservation Works</h2>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Every garland is treated in our climate-controlled cryo-silica lab before multi-layer 50mm optical casting.</p>
            </div>
            <button type="button" onclick="window.navigateTo('custom-studio')" class="self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
              <span class="material-symbols-outlined text-sm text-[#ffd79b]" aria-hidden="true">event_available</span>
              <span>Book Your Preservation Slot</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            ${[
              { step: '01', icon: 'local_shipping', title: '24h Doorstep Pickup', desc: 'Book your slot & our courier picks up your fresh or dried varmala in a breathable moisture-lock box.' },
              { step: '02', icon: 'ac_unit', title: 'Cryo-Silica Drying', desc: '10–14 days in grade-A floral silica crystals to lock natural rose, orchid & marigold pigments.' },
              { step: '03', icon: 'fact_check', title: 'Mockup Approval', desc: 'We arrange your petals & calligraphy and share a digital layout preview for your 1-click approval.' },
              { step: '04', icon: 'layers', title: '50mm Optical Pour', desc: '4 vacuum-degassed pours using Vistāra 2:1 Deep Pour epoxy fortified with HALS UV400 armor.' },
              { step: '05', icon: 'diamond', title: 'Diamond Buff & Return', desc: 'Polished to 85D mirror glass and shipped back via insured BlueDart Air in a velvet gift trunk.' }
            ].map(st => `
              <div class="ram-card p-4 bg-white flex flex-col justify-between gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-spec-numeral text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ffe4de] text-[#9e3322]">Stage ${st.step}</span>
                  <span class="material-symbols-outlined text-xl text-secondary" aria-hidden="true">${st.icon}</span>
                </div>
                <div>
                  <h3 class="font-title-md text-sm font-bold text-primary mt-1">${st.title}</h3>
                  <p class="text-xs text-on-surface-variant leading-relaxed mt-1">${st.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Vistāra Krafts Epoxy Formulation Comparison Matrix -->
        <section class="px-4 sm:px-8 py-8 bg-surface border-t border-[#e4e0d8] flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-secondary font-bold">ISO 9001 Chemical Architecture</span>
              <h2 class="font-headline-sm text-2xl text-primary font-bold">Choose the Right Vistāra Epoxy System</h2>
            </div>
            <span class="text-xs text-on-surface-variant">All systems 100% reactive solids • Zero VOC • HALS UV-Stabilized</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            ${[
              { id: 'vk-epx-301', ratio: '3:1 by Weight', name: 'UltraClear 3:1 Casting', depth: 'Up to 20mm', cure: '24 Hours', bestFor: 'Coasters, Trays, Clock Faces & Sealing Petals', price: 'From ₹549' },
              { id: 'vk-epx-201', ratio: '2:1 by Weight', name: 'River Flow 2:1 Deep Pour', depth: 'Up to 50mm', cure: '48–72 Hours', bestFor: 'Bridal Varmala Blocks & Live-Edge River Tables', price: 'From ₹2,850' },
              { id: 'vk-res-003', ratio: '1:1 Equal Part', name: 'High-Gloss 1:1 Doming', depth: '6mm Topcoat', cure: '12 Hours', bestFor: 'Ocean Wave Lacing Cells, Canvas Art & Nameplates', price: 'From ₹799' },
              { id: 'vk-uv-hard', ratio: '1-Part UV LED', name: 'Optical UV Hard Resin', depth: '5mm / Layer', cure: '90 Seconds', bestFor: 'Pressed Petal Pendants, Bezel Charms & Earrings', price: 'From ₹379' }
            ].map(sys => `
              <div class="ram-card p-4 bg-white flex flex-col justify-between gap-3">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded bg-primary text-white font-spec-numeral text-[11px] font-bold">${sys.ratio}</span>
                    <span class="font-spec-numeral text-xs font-bold text-secondary">${sys.price}</span>
                  </div>
                  <h3 class="font-title-md text-sm font-bold text-primary mt-1">${sys.name}</h3>
                  <p class="text-xs text-on-surface-variant">${sys.bestFor}</p>
                  <div class="flex flex-wrap gap-1.5 pt-1 text-[11px] font-spec-numeral">
                    <span class="px-2 py-0.5 rounded bg-surface-container-low text-primary">Pour: ${sys.depth}</span>
                    <span class="px-2 py-0.5 rounded bg-surface-container-low text-primary">Cure: ${sys.cure}</span>
                  </div>
                </div>
                <button type="button" onclick="window.navigateTo('product', '${sys.id}')" class="w-full min-h-[44px] py-2 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-primary text-xs font-bold transition-colors cursor-pointer">
                  Inspect Formula &amp; Kits →
                </button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Frequently Asked Questions (Bridal Preservation & Resin Care) -->
        <section class="px-4 sm:px-8 py-8 bg-surface-container-low border-t border-[#e4e0d8] flex flex-col gap-4">
          <div>
            <span class="font-label-sm text-[11px] uppercase tracking-widest text-[#9e3322] font-bold">Atelier Patron Care &amp; Technical FAQ</span>
            <h2 class="font-headline-sm text-2xl text-primary font-bold">Frequently Asked Questions</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${[
              {
                q: 'Do I need to dry my wedding varmala before sending it to the studio?',
                a: 'No! Please send your garlands fresh within 24 to 72 hours of your ceremony. Never freeze flowers or spray water/perfume on petals. Wrap only the cut stem ends in a slightly damp tissue, place inside a breathable cardboard box, and book our 24h doorstep pickup.'
              },
              {
                q: 'How long does the complete varmala preservation process take?',
                a: 'A 50mm heirloom floral block takes 14 to 21 days from flower receipt: 10 days of cryo-silica dehydration, digital layout mockup approval on your Account/WhatsApp, 4 sequential vacuum-degassed pours, and diamond buffing.'
              },
              {
                q: 'Will my flowers change color inside the resin block?',
                a: 'Our silica-gel cryo dehydration retains up to 95% of natural floral structure. Deep red roses often mature into a rich burgundy velvet, and white blooms develop a warm champagne-ivory tone. You approve the dried petal layout before we pour!'
              },
              {
                q: 'How do you prevent epoxy yellowing in Indian summer temperatures?',
                a: 'All Vistāra Krafts formulations are fortified with dual HALS (Hindered Amine Light Stabilizers) and UV400 absorbers tested per ASTM D1003. Keep finished resin art indoors away from direct harsh afternoon sunlight for decades of crystal clarity.'
              }
            ].map(faq => `
              <details class="ram-card bg-white p-4 group">
                <summary class="min-h-[44px] flex items-center justify-between gap-3 cursor-pointer list-none font-title-md text-xs sm:text-sm font-bold text-primary">
                  <span>${faq.q}</span>
                  <span class="material-symbols-outlined text-secondary shrink-0" aria-hidden="true">expand_more</span>
                </summary>
                <p class="text-xs text-on-surface-variant leading-relaxed pt-2.5 mt-2 border-t border-surface-container">${faq.a}</p>
              </details>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderPersonaRecommendation() {
    const goal = AppState.quizAnswers.goal;
    if (goal === 'preserve') {
      return `
        <div class="flex items-center gap-3">
          <img src="${esc(Store.IMAGES.floralCube)}" alt="Varmala Block" class="w-12 h-12 rounded-lg object-cover shrink-0">
          <div>
            <span class="text-[10px] uppercase tracking-wider text-[#ffd79b] font-bold">98% Match for Brides &amp; Anniversaries</span>
            <p class="text-xs sm:text-sm font-bold text-white">Eternal Varmala &amp; Bridal Bouquet 12" Time-Capsule Block (₹4,499)</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button type="button" onclick="window.navigateTo('product', 'ram-keep-001')" class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-lg bg-[#9e3322] text-white text-xs font-bold cursor-pointer">Customize Now</button>
        </div>
      `;
    }
    if (goal === 'decor') {
      return `
        <div class="flex items-center gap-3">
          <img src="${esc(Store.IMAGES.oceanWave)}" alt="Ocean Tray" class="w-12 h-12 rounded-lg object-cover shrink-0">
          <div>
            <span class="text-[10px] uppercase tracking-wider text-[#ffd79b] font-bold">Top Hand-Poured Home &amp; Gift Piece</span>
            <p class="text-xs sm:text-sm font-bold text-white">Maldives Ocean Wave Burma Teak Tray &amp; Coasters (₹2,199)</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button type="button" onclick="window.navigateTo('product', 'ram-keep-002')" class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold cursor-pointer">View Piece</button>
        </div>
      `;
    }
    return `
      <div class="flex items-center gap-3">
        <img src="${esc(Store.IMAGES.ultraclearMain)}" alt="UltraClear 3:1" class="w-12 h-12 rounded-lg object-cover shrink-0">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-[#ffd79b] font-bold">#1 Studio Formulation</span>
          <p class="text-xs sm:text-sm font-bold text-white">UltraClear 3:1 Casting Resin 1.2kg Studio Kit (₹1,299)</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <button type="button" onclick="window.navigateTo('product', 'vk-epx-301')" class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold cursor-pointer">View Specs</button>
      </div>
    `;
  }

  // =========================================================================
  // 2. CATALOG & TECHNICAL FILTERS VIEW
  // =========================================================================
  function getFilteredCatalogProducts() {
    let list = [...Store.getProducts()];

    if (AppState.catalogCategory && AppState.catalogCategory !== 'all') {
      list = list.filter(p =>
        p.category === AppState.catalogCategory ||
        p.subCategory === AppState.catalogCategory ||
        (Array.isArray(p.relatedCategories) && p.relatedCategories.includes(AppState.catalogCategory))
      );
    }

    if (AppState.catalogRatioFilter && AppState.catalogRatioFilter !== 'all') {
      list = list.filter(p => p.ratio === AppState.catalogRatioFilter);
    }

    if (AppState.catalogMaxPrice) {
      list = list.filter(p => p.price <= AppState.catalogMaxPrice);
    }

    if (AppState.catalogSearch.trim()) {
      const q = AppState.catalogSearch.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.badge.toLowerCase().includes(q) ||
        p.ratio.toLowerCase().includes(q)
      );
    }

    const persona = AppState.feedPersona || 'all';
    const sort = AppState.catalogSort;

    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    } else if (sort === 'viscosity') {
      const order = { low: 1, medium: 2, high: 3 };
      list.sort((a, b) => (order[a.viscosity] || 2) - (order[b.viscosity] || 2));
    } else if (sort === 'gifts_him' || (sort === 'popular' && persona === 'masculine')) {
      const getHimScore = (p) => (p.genderAffinity === 'masculine' ? 20 : (p.genderAffinity === 'unisex' ? 10 : 0));
      list.sort((a, b) => getHimScore(b) - getHimScore(a) || b.reviewsCount - a.reviewsCount);
    } else if (sort === 'gifts_her' || (sort === 'popular' && persona === 'feminine')) {
      const getHerScore = (p) => (p.genderAffinity === 'feminine' ? 20 : (p.genderAffinity === 'unisex' ? 10 : 0));
      list.sort((a, b) => getHerScore(b) - getHerScore(a) || b.reviewsCount - a.reviewsCount);
    } else if (sort === 'gifting') {
      const getGiftScore = (p) => ((p.giftingTags && p.giftingTags.length) ? 20 : (p.isCustomizable ? 10 : 0));
      list.sort((a, b) => getGiftScore(b) - getGiftScore(a) || b.reviewsCount - a.reviewsCount);
    } else {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    return list;
  }

  function renderCatalogView() {
    const filtered = getFilteredCatalogProducts();
    const visible = filtered.slice(0, AppState.catalogVisibleCount);
    const categories = [
      { id: 'all', label: `All (${Store.getProducts().length})` },
      { id: 'keepsakes', label: '✨ Floral & Art Keepsakes' },
      { id: 'casting', label: 'Casting 3:1' },
      { id: 'deep_pour', label: 'Deep Pour 2:1' },
      { id: 'doming', label: 'Doming 1:1' },
      { id: 'uv_resin', label: 'UV Jewelry' },
      { id: 'pigments', label: 'Mica Pigments' },
      { id: 'molds', label: 'Silicone Molds' },
      { id: 'ceramics', label: 'Stoneware Vessels' }
    ];

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 gap-4">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Discover</span>
          </button>
        </div>

        <!-- Category Header -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div class="flex items-center gap-1 text-on-surface-variant font-label-sm text-xs uppercase tracking-wider">
              <button type="button" onclick="window.navigateTo('home')" class="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center hover:text-primary cursor-pointer">Home</button>
              <span class="material-symbols-outlined text-xs" aria-hidden="true">chevron_right</span>
              <span class="text-secondary font-bold">Storefront Catalogue</span>
            </div>
            <h1 class="font-headline-lg text-2xl sm:text-4xl text-primary font-bold tracking-tight mt-0.5">
              Keepsake Art &amp; Epoxy Resin Supplies
            </h1>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Handcrafted flower preservation, ocean decor, and quality 3:1, 2:1 &amp; UV resin formulas.
            </p>
          </div>
          <div class="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl border border-[#e4e0d8] self-start sm:self-end shrink-0">
            <span class="material-symbols-outlined text-secondary text-base" aria-hidden="true">verified</span>
            <span class="font-label-sm text-xs text-primary font-semibold">Tested &amp; Certified • Batch 2026-C</span>
          </div>
        </div>

        <!-- Categories & Gifting Filter Rail (Unified on PC, clean scroll on mobile) -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5 py-1">
          <!-- Horizontal Category Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            ${categories.map(cat => `
              <button type="button" onclick="window.setCatalogCategory('${cat.id}')" class="min-h-[44px] px-3.5 py-1.5 rounded-full font-label-sm text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${AppState.catalogCategory === cat.id ? 'bg-primary text-on-primary font-bold shadow-xs' : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container/50'}">
                ${esc(cat.label)}
              </button>
            `).join('')}
          </div>

          <!-- Feed Curation & Gifting Quick Bar -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
            <span class="text-xs font-bold text-primary flex items-center gap-1 shrink-0">
              <span class="material-symbols-outlined text-secondary text-sm" aria-hidden="true">auto_awesome</span>
              <span>Gifts:</span>
            </span>
            <button type="button" onclick="window.setFeedPersona('masculine')" class="min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${AppState.feedPersona === 'masculine' || AppState.catalogSort === 'gifts_him' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container-low text-primary border border-[#e4e0d8] hover:border-secondary'}">
              <span>👔 For Him</span>
            </button>
            <button type="button" onclick="window.setFeedPersona('feminine')" class="min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${AppState.feedPersona === 'feminine' || AppState.catalogSort === 'gifts_her' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container-low text-primary border border-[#e4e0d8] hover:border-secondary'}">
              <span>🌸 For Her</span>
            </button>
            <button type="button" onclick="window.setCatalogSort('gifting')" class="min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${AppState.catalogSort === 'gifting' ? 'bg-secondary text-white shadow-xs' : 'bg-surface-container-low text-primary border border-[#e4e0d8] hover:border-secondary'}">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">featured_seasonal_and_gifts</span>
              <span>🎁 Gift Sets</span>
            </button>
          </div>
        </div>

        <!-- Sticky Search, Filter & Sort Controls Bar (Sticky on md+ desktop/tablet so mobile viewports aren't crushed) -->
        <div class="md:sticky md:top-[93px] z-30 bg-surface/95 backdrop-blur-md py-3 border-y border-[#e4e0d8] flex flex-col gap-2.5 max-w-full">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <!-- Instant Search Input -->
            <div class="relative w-full sm:flex-1 min-w-0">
              <label for="catalog-search-input" class="sr-only">Search catalogue products</label>
              <span class="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-3.5 pointer-events-none" aria-hidden="true">search</span>
              <input id="catalog-search-input" type="text" aria-label="Search catalogue products" value="${esc(AppState.catalogSearch)}" oninput="window.setCatalogSearch(this.value)" placeholder="Search varmala block, 3:1 resin, ocean tray, mica, mold..." class="w-full h-12 pl-9 pr-10 rounded-xl bg-white border border-[#e4e0d8] text-xs sm:text-sm text-primary">
              ${AppState.catalogSearch ? `
                <button type="button" aria-label="Clear search" onclick="window.setCatalogSearch('')" class="w-11 h-11 absolute right-1 top-0.5 flex items-center justify-center text-outline hover:text-primary cursor-pointer">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">close</span>
                </button>
              ` : ''}
            </div>

            <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <!-- Filter Drawer Trigger -->
              <button type="button" onclick="window.toggleCatalogFilterDrawer(true)" class="flex-1 sm:flex-initial h-12 px-3 sm:px-4 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                <span class="material-symbols-outlined text-base" aria-hidden="true">tune</span>
                <span>Specs Filter</span>
              </button>

              <!-- Sort Select -->
              <label for="catalog-sort-select" class="sr-only">Sort products</label>
              <select id="catalog-sort-select" aria-label="Sort products" onchange="window.setCatalogSort(this.value)" class="flex-1 sm:flex-initial h-12 px-2.5 sm:px-3 rounded-xl bg-white border border-[#e4e0d8] font-label-sm text-xs text-primary cursor-pointer">
                <option value="popular" ${AppState.catalogSort === 'popular' ? 'selected' : ''}>Sort: Popularity</option>
                <option value="gifts_him" ${AppState.catalogSort === 'gifts_him' ? 'selected' : ''}>👔 Gifts for Him (Wood &amp; Dark Resin)</option>
                <option value="gifts_her" ${AppState.catalogSort === 'gifts_her' ? 'selected' : ''}>🌸 Gifts for Her (Floral &amp; Crystal Keepsakes)</option>
                <option value="gifting" ${AppState.catalogSort === 'gifting' ? 'selected' : ''}>🎁 Curated Gift Options &amp; Sets</option>
                <option value="price_asc" ${AppState.catalogSort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                <option value="price_desc" ${AppState.catalogSort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                <option value="rating" ${AppState.catalogSort === 'rating' ? 'selected' : ''}>Highest Rated</option>
                <option value="viscosity" ${AppState.catalogSort === 'viscosity' ? 'selected' : ''}>Viscosity: Low–High</option>
              </select>

              <!-- Grid / List Switcher -->
              <div class="flex items-center bg-surface-container-low p-0.5 rounded-xl border border-[#e4e0d8] shrink-0">
                <button type="button" aria-label="Grid View" onclick="window.setCatalogView('grid')" class="w-11 h-11 rounded-lg flex items-center justify-center ${AppState.catalogView === 'grid' ? 'bg-white text-primary shadow-2xs' : 'text-on-surface-variant'} cursor-pointer">
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">grid_view</span>
                </button>
                <button type="button" aria-label="List View" onclick="window.setCatalogView('list')" class="w-11 h-11 rounded-lg flex items-center justify-center ${AppState.catalogView === 'list' ? 'bg-white text-primary shadow-2xs' : 'text-on-surface-variant'} cursor-pointer">
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">view_stream</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Active Filter Summary Row -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
            <div class="flex items-center gap-1.5 flex-wrap min-w-0">
              ${AppState.catalogCategory !== 'all' ? `
                <button type="button" onclick="window.setCatalogCategory('all')" class="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-primary font-medium cursor-pointer">
                  <span>Category: ${esc(AppState.catalogCategory)}</span>
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              ` : ''}
              ${AppState.catalogRatioFilter !== 'all' ? `
                <button type="button" onclick="window.setCatalogRatio('all')" class="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-primary font-medium cursor-pointer">
                  <span>Ratio: ${esc(AppState.catalogRatioFilter)}</span>
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              ` : ''}
              ${AppState.catalogMaxPrice < 12000 ? `
                <button type="button" onclick="window.setCatalogMaxPrice(12000)" class="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-primary font-medium cursor-pointer">
                  <span>Max: ${formatINR(AppState.catalogMaxPrice)}</span>
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              ` : ''}
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e8f5e9] text-[#266b4e] font-semibold">
                In Stock • Pan-India Dispatch
              </span>
            </div>
            <span class="font-spec-numeral font-bold text-primary shrink-0">${filtered.length} Products</span>
          </div>
        </div>

        <!-- Product Grid or Empty State -->
        ${filtered.length === 0 ? `
          <div class="ram-card p-10 text-center flex flex-col items-center gap-3.5 my-4 bg-white">
            <div class="relative w-24 h-24 flex items-center justify-center lottie-anim-float">
              <div class="absolute inset-0 rounded-full bg-[#d4af37]/15 lottie-anim-pulse blur-md pointer-events-none"></div>
              <svg class="w-full h-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No formulations found">
                <circle cx="45" cy="45" r="28" stroke="#0f172a" stroke-width="2.5" fill="#fcf9f5" />
                <circle cx="45" cy="45" r="22" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 4" class="lottie-anim-spin" />
                <path d="M66 66 L86 86" stroke="#9e3322" stroke-width="4" stroke-linecap="round" />
                <polygon points="45,34 47,40 53,42 47,44 45,50 43,44 37,42 43,40" fill="#d4af37" />
                <circle cx="28" cy="74" r="2.5" fill="#d4af37" opacity="0.6" />
              </svg>
            </div>
            <h2 class="font-headline-sm text-xl text-primary font-bold">No Matching Formulations Found</h2>
            <p class="text-xs text-on-surface-variant max-w-sm">Try clearing your search keyword, adjusting the viscosity filter, or resetting technical ratio parameters.</p>
            <button type="button" onclick="window.resetCatalogFilters()" class="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer">Reset All Filters</button>
          </div>
        ` : `
          <div class="${AppState.catalogView === 'list' ? 'flex flex-col gap-3.5' : 'grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5'}" id="catalog-product-grid">
            ${visible.map(p => renderProductCard(p, AppState.catalogView === 'list')).join('')}
          </div>
        `}

        <!-- Pagination / Load More Section -->
        ${filtered.length > visible.length ? `
          <div class="py-6 flex flex-col items-center gap-3">
            <p class="text-xs text-on-surface-variant font-spec-numeral">Showing <strong>${visible.length}</strong> of <strong>${filtered.length}</strong> formulations</p>
            <button type="button" onclick="window.loadMoreCatalog()" class="min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer">
              <span class="material-symbols-outlined text-base" aria-hidden="true">refresh</span>
              <span>Load Remaining (${filtered.length - visible.length}) Products</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // =========================================================================
  // 3. PRODUCT DETAIL PAGE (PDP) VIEW
  // =========================================================================
  function renderPdpView() {
    const product = Store.getProductById(AppState.currentProductId);
    if (!product) {
      return render404View();
    }
    const variants = product.variants || [];
    const activeVariant = variants[AppState.selectedVariantIdx] || variants[0] || {
      id: 'default',
      label: 'Standard Edition',
      desc: product.subtitle,
      price: product.price,
      regularPrice: product.regularPrice,
      unitPrice: product.unitPriceLabel
    };

    const rawColors = Array.isArray(product.colors) ? product.colors : [];
    const rawShapes = Array.isArray(product.shapes) ? product.shapes : [];
    const rawSizes = Array.isArray(product.sizes) ? product.sizes : [];

    const colors = rawColors.map((c, i) => (typeof c === 'string' ? { id: 'c' + i, label: c, hex: '#cda851' } : c));
    const shapes = rawShapes.map((s, i) => (typeof s === 'string' ? { id: 's' + i, label: s } : s));
    const sizes = rawSizes.map((sz, i) => (typeof sz === 'string' ? { id: 'sz' + i, label: sz, priceDelta: 0 } : sz));

    const hasVarieties = colors.length > 0 || shapes.length > 0 || sizes.length > 0;

    const activeColorIdx = colors.length ? Math.min(AppState.pdpSelectedColorIdx || 0, colors.length - 1) : -1;
    const activeShapeIdx = shapes.length ? Math.min(AppState.pdpSelectedShapeIdx || 0, shapes.length - 1) : -1;
    const activeSizeIdx = sizes.length ? Math.min(AppState.pdpSelectedSizeIdx || 0, sizes.length - 1) : -1;
    const activeColor = activeColorIdx >= 0 ? colors[activeColorIdx] : null;
    const activeShape = activeShapeIdx >= 0 ? shapes[activeShapeIdx] : null;
    const activeSize = activeSizeIdx >= 0 ? sizes[activeSizeIdx] : null;
    const sizeDelta = activeSize ? (activeSize.priceDelta || 0) : 0;

    const currentPrice = activeVariant.price + sizeDelta;
    const regularPrice = (activeVariant.regularPrice || activeVariant.price) + sizeDelta;
    const discountPct = regularPrice > currentPrice ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0;

    // Tiered volume pricing calculation synced with Store.getEffectiveUnitPrice
    const tier1Price = Store.getEffectiveUnitPrice(currentPrice, 1);
    const tier2Price = Store.getEffectiveUnitPrice(currentPrice, 3);
    const tier3Price = Store.getEffectiveUnitPrice(currentPrice, 6);
    const effectiveUnit = Store.getEffectiveUnitPrice(currentPrice, AppState.pdpQty);
    const totalCtaPrice = effectiveUnit * AppState.pdpQty;

    const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
    const activeImg = gallery[AppState.pdpGalleryIdx] || gallery[0];
    const isFav = Store.isWishlisted(product.id);
    const pinInfo = Store.getPincodeInfo();
    const prodReviews = AppState.reviews[product.id] || AppState.reviews['vk-epx-301'] || [];

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto pb-36 lg:pb-24">
        <!-- Logistics & Batch Ribbon -->
        <div class="bg-primary text-on-primary px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-label-sm">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-secondary-fixed text-sm" aria-hidden="true">science</span>
            <span class="font-spec-numeral">SKU: ${esc(product.sku)} • Batch VK-26-C38 Lab Certified</span>
          </div>
          <span class="text-secondary-fixed flex items-center gap-1 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Fresh Studio Allocation
          </span>
        </div>

        <!-- Breadcrumb & Back Navigation -->
        <nav aria-label="Breadcrumb" class="px-4 sm:px-8 py-1.5 bg-surface-container-low text-on-surface-variant text-xs flex items-center justify-between gap-2 border-b border-[#e4e0d8] flex-wrap">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.handleBackButton('catalog')" aria-label="Go back to previous page" class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary min-h-[44px] px-2.5 rounded-lg bg-white border border-[#e4e0d8] hover:bg-surface-container transition-colors cursor-pointer shrink-0">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
              <span>Back</span>
            </button>
            <ol class="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap">
              <li><button type="button" onclick="window.navigateTo('home')" class="min-h-[44px] px-1.5 inline-flex items-center justify-center hover:text-primary cursor-pointer">Home</button></li>
              <li>/</li>
              <li><button type="button" onclick="window.navigateTo('catalog', '${esc(product.category || 'keepsakes')}')" class="min-h-[44px] px-1.5 inline-flex items-center justify-center hover:text-primary capitalize cursor-pointer">${esc(String(product.category || 'keepsakes').replace(/_/g, ' '))}</button></li>
              <li>/</li>
              <li class="text-primary font-bold truncate pl-1">${esc(product.shortName || product.name)}</li>
            </ol>
          </div>
          <button type="button" onclick="window.shareCurrentProduct('${esc(product.id)}')" class="min-h-[44px] px-2 flex items-center gap-1 text-secondary font-semibold hover:underline shrink-0 cursor-pointer">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">share</span>
            <span>Share</span>
          </button>
        </nav>

        <!-- Main 2-Column Desktop / Stacked Mobile PDP Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-8 pt-6 items-start">
          <!-- Left Column: Gallery (6 cols) -->
          <div class="lg:col-span-6 lg:col-start-1 flex flex-col gap-3">
            <div id="pdp-specimen-stage" class="relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-[#e4e0d8] shadow-sm group cursor-crosshair">
              <img id="pdp-main-img" src="${esc(activeImg)}" alt="${esc(product.name)}" class="w-full h-full object-cover transition-all duration-300">
              
              <!-- Liquid Glass Specimen Inspection Loupe -->
              <div id="pdp-specimen-loupe" class="sotd-specimen-loupe hidden">
                <div id="pdp-loupe-inner" class="absolute w-[250%] h-[250%] max-w-none">
                  <img id="pdp-loupe-img" src="${esc(activeImg)}" alt="Specimen Micro-Zoom" class="w-full h-full object-cover">
                </div>
                <div class="absolute inset-0 border border-white/20 rounded-full flex items-center justify-center pointer-events-none">
                  <div class="w-full h-px bg-white/30"></div>
                  <div class="h-full w-px bg-white/30 absolute"></div>
                  <span class="absolute bottom-2 text-[9px] font-spec-numeral text-white bg-black/60 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">2.5× Macro</span>
                </div>
              </div>

              <div class="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
                <span class="bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm text-[11px] tracking-wider uppercase font-bold shadow-xs">${esc(product.badge || 'Studio Edition')}</span>
                <span class="bg-primary/90 text-on-primary px-3 py-1 rounded-full font-label-sm text-[11px] flex items-center gap-1 shadow-xs">
                  <span class="material-symbols-outlined text-xs text-secondary-fixed" aria-hidden="true">verified</span>
                  Optical Grade
                </span>
              </div>
              <div class="absolute bottom-3.5 right-3.5 flex items-center gap-2">
                <span id="pdp-gallery-counter" class="bg-primary/85 backdrop-blur-md text-on-primary px-3 py-1.5 rounded-full font-spec-numeral text-xs">
                  ${AppState.pdpGalleryIdx + 1} of ${gallery.length}
                </span>
                <button type="button" aria-label="Zoom Image" onclick="window.openLightbox('${esc(activeImg)}', '${esc(product.name)}')" class="w-11 h-11 rounded-full bg-primary/85 backdrop-blur-md text-on-primary flex items-center justify-center hover:bg-primary cursor-pointer">
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">zoom_in</span>
                </button>
              </div>
            </div>

            <!-- 4-Angle Thumbnail Selector -->
            <div class="grid grid-cols-4 gap-2.5">
              ${gallery.map((imgUrl, idx) => `
                <button type="button" aria-label="View Gallery Angle ${idx + 1}" onclick="window.selectPdpGallery(${idx})" class="aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${idx === AppState.pdpGalleryIdx ? 'border-primary ring-2 ring-primary/30 scale-[1.02]' : 'border-[#e4e0d8] opacity-75 hover:opacity-100'}">
                  <img src="${esc(imgUrl)}" alt="Angle ${idx + 1}" class="w-full h-full object-cover">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: Specs, Variants & Conversion Controls (6 cols) -->
          <div class="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex flex-col gap-5">
            <div>
              <span class="font-label-sm text-secondary uppercase tracking-widest text-[11px] font-bold">Archival Formula &amp; Studio Edition</span>
              <h1 class="font-headline-lg text-2xl sm:text-3xl text-primary font-bold mt-0.5">${esc(product.name)}</h1>
              <p class="text-xs sm:text-sm text-on-surface-variant italic mt-1">${esc(product.subtitle || 'Museum-Grade Optical Epoxy & Handcrafted Keepsake Edition')}</p>

              <!-- Ratings & Badges -->
              <div class="flex items-center flex-wrap gap-2 mt-3">
                <div class="flex items-center gap-1.5 bg-surface-container-high px-3 min-h-[44px] rounded-full text-xs">
                  <span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">star</span>
                  <span class="font-spec-numeral font-bold text-primary">${Number(product.rating || 4.9).toFixed(1)}</span>
                  <span class="text-outline">•</span>
                  <button type="button" onclick="window.scrollToSection('pdp-reviews')" class="min-h-[44px] inline-flex items-center text-on-surface-variant underline cursor-pointer">${Number(product.reviewsCount || 24)} verified reviews</button>
                </div>
                <span class="flex items-center gap-1 text-[#266b4e] text-xs bg-[#e8f5e9] px-3 min-h-[44px] rounded-full font-semibold">
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">water_drop</span>
                  98% Bubble-Free Rating
                </span>
                ${product.gender === 'women' || product.genderAffinity === 'feminine' ? `
                  <span class="flex items-center gap-1 text-[#9e3322] text-xs bg-[#ffe4de] px-3 min-h-[44px] rounded-full font-semibold">
                    <span>🌸</span> Mainly for Female / Women
                  </span>
                ` : (product.gender === 'men' || product.genderAffinity === 'masculine' ? `
                  <span class="flex items-center gap-1 text-blue-900 text-xs bg-blue-100 px-3 min-h-[44px] rounded-full font-semibold">
                    <span>👔</span> Mainly for Male / Men
                  </span>
                ` : `
                  <span class="flex items-center gap-1 text-amber-900 text-xs bg-amber-50 border border-amber-200/60 px-3 min-h-[44px] rounded-full font-semibold">
                    <span>✨</span> Universal (All Genders)
                  </span>
                `)}
              </div>
            </div>

            <!-- Main Dynamic Price Box -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-[#e4e0d8] flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between flex-wrap gap-2">
                <div class="flex items-baseline gap-2.5">
                  <span id="pdp-display-price" class="font-spec-numeral text-2xl sm:text-3xl text-primary font-bold">${formatINR(currentPrice)}</span>
                  <span id="pdp-display-regular" class="font-spec-numeral text-sm line-through text-outline">${formatINR(regularPrice)}</span>
                  ${discountPct > 0 ? `<span id="pdp-display-discount" class="font-spec-numeral text-xs font-bold bg-[#ffe4de] text-[#9e3322] px-2.5 py-0.5 rounded-full">${discountPct}% OFF</span>` : ''}
                </div>
                <span id="pdp-display-unit" class="font-spec-numeral text-xs text-primary font-semibold bg-surface-container-highest px-2.5 py-1 rounded-lg">${esc(activeVariant.unitPrice || product.unitPriceLabel || 'Standard Edition')}</span>
              </div>
              <div class="flex items-center justify-between gap-2 text-xs text-on-surface-variant pt-1">
                <span>Inclusive of all GST taxes (18% B2B Input Credit eligible)</span>
                <span class="text-[#266b4e] font-bold flex items-center gap-0.5 shrink-0">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span> In Stock
                </span>
              </div>
            </div>

            ${hasVarieties ? `
            <!-- Interactive Product Varieties: Colors, Shapes, Sizes -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-[#e4e0d8] flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <span class="font-title-md text-xs sm:text-sm text-primary font-bold flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-secondary text-base" aria-hidden="true">palette</span>
                  <span>Bespoke Product Varieties</span>
                </span>
                <span class="font-label-sm text-[11px] text-secondary font-semibold">Tuned for Your Order</span>
              </div>

              ${colors.length > 0 ? `
              <!-- Colors -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-primary">🎨 Color / Resin Tint:</span>
                  <span class="font-semibold text-secondary">${esc(activeColor ? activeColor.label : '')}</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  ${colors.map((c, cIdx) => `
                    <button type="button" aria-label="${esc(c.label)}" title="${esc(c.label)}" onclick="window.selectPdpVariety('color', ${cIdx})" class="variety-swatch w-8 h-8 rounded-full transition-transform cursor-pointer relative ${cIdx === activeColorIdx ? 'active ring-2 ring-primary ring-offset-2 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100 hover:scale-105'}" style="background-color: ${esc(c.hex || '#cda851')}; border: 2px solid ${(c.hex || '').toLowerCase() === '#ffffff' ? '#ccc' : '#d4af37'};">
                      ${cIdx === activeColorIdx ? '<span class="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow">✓</span>' : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${shapes.length > 0 ? `
              <!-- Shapes -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-primary">📐 Bespoke Shape:</span>
                  <span class="font-semibold text-secondary">${esc(activeShape ? activeShape.label : '')}</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  ${shapes.map((s, sIdx) => `
                    <button type="button" onclick="window.selectPdpVariety('shape', ${sIdx})" class="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${sIdx === activeShapeIdx ? 'bg-primary text-white border-primary shadow-xs' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container'}">
                      <span>${esc(s.label)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${sizes.length > 0 ? `
              <!-- Sizes -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-primary">📏 Edition Size:</span>
                  <span class="font-semibold text-secondary">${esc(activeSize ? activeSize.label : '')}</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  ${sizes.map((sz, szIdx) => `
                    <button type="button" onclick="window.selectPdpVariety('size', ${szIdx})" class="min-h-[44px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${szIdx === activeSizeIdx ? 'bg-primary text-white border-primary shadow-xs' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container'}">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs truncate">${esc(sz.label)}</span>
                        ${sz.popular ? `<span class="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[9px] font-bold uppercase shrink-0">Popular</span>` : ''}
                      </div>
                      <span class="text-[11px] ${szIdx === activeSizeIdx ? 'text-[#ffd79b]' : 'text-on-surface-variant'}">${(sz.priceDelta || 0) > 0 ? '+' + formatINR(sz.priceDelta) : 'Standard Studio'}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <!-- Variant / Kit Selector -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="font-title-md text-sm text-primary font-bold">Select Kit / Edition Architecture</span>
                <span class="font-label-sm text-xs text-secondary font-semibold">Self-Leveling Low Exotherm</span>
              </div>
              <div class="grid grid-cols-1 gap-2">
                ${variants.map((v, idx) => {
                  const isSelected = idx === AppState.selectedVariantIdx;
                  return `
                    <button type="button" onclick="window.selectPdpVariant(${idx})" class="p-3.5 rounded-xl border text-left flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 transition-all cursor-pointer ${isSelected ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container-low'}">
                      <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <span class="material-symbols-outlined text-xl ${isSelected ? 'text-secondary-fixed' : 'text-secondary'} shrink-0" aria-hidden="true">workspace_premium</span>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <p class="font-title-md text-sm font-bold ${isSelected ? 'text-white' : 'text-primary'} break-words">${esc(v.label)}</p>
                            ${v.popular ? `<span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase shrink-0">Most Popular</span>` : ''}
                          </div>
                          <p class="text-xs ${isSelected ? 'text-white/85' : 'text-on-surface-variant'} break-words">${esc(v.desc || '')}</p>
                        </div>
                      </div>
                      <div class="text-left min-[420px]:text-right shrink-0 min-[420px]:pl-2 flex min-[420px]:flex-col items-baseline min-[420px]:items-end gap-2 min-[420px]:gap-0">
                        <p class="font-spec-numeral text-base font-bold ${isSelected ? 'text-white' : 'text-primary'}">${formatINR(v.price)}</p>
                        <span class="font-spec-numeral text-[11px] ${isSelected ? 'text-secondary-fixed' : 'text-on-surface-variant'}">${esc(v.unitPrice || '')}</span>
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Custom Memory / Engraving Note (Especially for Keepsake items) -->
            <div class="p-3.5 rounded-xl bg-[#fdf6f3] border border-[#9e3322]/30 flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <label for="pdp-custom-note" class="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-[#9e3322]" aria-hidden="true">edit_note</span>
                  <span>${product.isCustomizable ? 'Personalization / Couple Name & Date Engraving (Free)' : 'Studio Batch Note / COA Request (Optional)'}</span>
                </label>
                <span class="text-[10px] font-semibold text-[#9e3322] uppercase shrink-0">Included</span>
              </div>
              <input id="pdp-custom-note" type="text" value="${esc(AppState.pdpCustomNote)}" oninput="window.setPdpCustomNote(this.value)" placeholder="${product.isCustomizable ? 'e.g. Aarav & Meera • 12 Oct 2026 • Gold Foil Calligraphy' : 'e.g. Include printed ASTM Certificate of Analysis with shipment'}" class="w-full h-12 px-3 rounded-lg bg-white border border-[#e4e0d8] text-xs text-primary">
            </div>

            <!-- Inline Primary Conversion Actions (Desktop & Mobile) -->
            <div class="p-3.5 sm:p-4 rounded-xl bg-white border border-[#e4e0d8] shadow-xs flex flex-col gap-2.5">
              <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div class="h-12 bg-surface-container-low rounded-xl flex items-center px-1 shrink-0 border border-[#e4e0d8]">
                  <button type="button" aria-label="Decrease quantity" onclick="window.changePdpQty(-1)" class="w-11 h-11 flex items-center justify-center text-primary font-bold cursor-pointer">
                    <span class="material-symbols-outlined text-base" aria-hidden="true">remove</span>
                  </button>
                  <span class="w-7 text-center font-spec-numeral text-sm text-primary font-bold">${AppState.pdpQty}</span>
                  <button type="button" aria-label="Increase quantity" onclick="window.changePdpQty(1)" class="w-11 h-11 flex items-center justify-center text-primary font-bold cursor-pointer">
                    <span class="material-symbols-outlined text-base" aria-hidden="true">add</span>
                  </button>
                </div>
                <button type="button" onclick="window.addPdpToCart()" class="btn-shimmer min-w-0 flex-1 h-12 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                  <span class="material-symbols-outlined text-lg shrink-0" aria-hidden="true">shopping_bag</span>
                  <span class="truncate">Add to Studio Bag • ${formatINR(totalCtaPrice)}</span>
                </button>
                <button type="button" aria-label="Save to Wishlist" onclick="window.handleWishlistToggle(event, '${esc(product.id)}')" class="w-12 h-12 rounded-xl bg-surface-container-low border border-[#e4e0d8] flex items-center justify-center ${isFav ? 'text-[#9e3322]' : 'text-primary'} shrink-0 cursor-pointer">
                  <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' ${isFav ? 1 : 0};" aria-hidden="true">${isFav ? 'favorite' : 'favorite_border'}</span>
                </button>
              </div>
              <button type="button" onclick="window.buyNowPdp()" class="w-full h-12 px-4 rounded-xl bg-[#9e3322] hover:opacity-95 text-white font-title-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-lg shrink-0" aria-hidden="true">bolt</span>
                <span>Express Buy Now (UPI / Card / COD)</span>
              </button>
            </div>

            <!-- Tiered Studio Volume Pricing -->
            <div class="p-4 rounded-xl bg-surface-container-high flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h2 class="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider font-body-md">
                  <span class="material-symbols-outlined text-secondary text-base" aria-hidden="true">local_offer</span>
                  <span>Tiered Studio Volume Pricing</span>
                </h2>
                <span class="text-[11px] text-secondary font-semibold">Auto-applied in bag</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-2.5 rounded-lg ${AppState.pdpQty < 3 ? 'bg-primary text-white shadow-xs' : 'bg-white text-primary'}">
                  <span class="text-[11px] block ${AppState.pdpQty < 3 ? 'text-white/90' : 'text-on-surface-variant'}">1 – 2 Units</span>
                  <span class="font-spec-numeral text-sm font-bold block mt-0.5">${formatINR(tier1Price)}</span>
                  <span class="text-[10px] block ${AppState.pdpQty < 3 ? 'text-white/85' : 'text-on-surface-variant'}">Standard Rate</span>
                </div>
                <div class="p-2.5 rounded-lg ${AppState.pdpQty >= 3 && AppState.pdpQty < 6 ? 'bg-primary text-white shadow-xs' : 'bg-white text-primary'}">
                  <span class="text-[11px] block ${AppState.pdpQty >= 3 && AppState.pdpQty < 6 ? 'text-white/90' : 'text-on-surface-variant'}">3 – 5 Units</span>
                  <span class="font-spec-numeral text-sm font-bold block mt-0.5">${formatINR(tier2Price)}</span>
                  <span class="text-[10px] font-bold ${AppState.pdpQty >= 3 && AppState.pdpQty < 6 ? 'text-secondary-fixed' : 'text-secondary'} block">Save 8%</span>
                </div>
                <div class="p-2.5 rounded-lg ${AppState.pdpQty >= 6 ? 'bg-primary text-white shadow-xs' : 'bg-white text-primary'}">
                  <span class="text-[11px] block ${AppState.pdpQty >= 6 ? 'text-white/90' : 'text-on-surface-variant'}">6+ Units</span>
                  <span class="font-spec-numeral text-sm font-bold block mt-0.5">${formatINR(tier3Price)}</span>
                  <span class="text-[10px] font-bold ${AppState.pdpQty >= 6 ? 'text-secondary-fixed' : 'text-secondary'} block">Save 16%</span>
                </div>
              </div>
            </div>

            <!-- Technical Formulation Specs Matrix -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h2 class="font-headline-sm text-lg text-primary font-bold">Technical Formulation &amp; Material Specs</h2>
                <span class="font-label-sm text-[11px] uppercase tracking-wider text-outline">Lab Tested 25°C</span>
              </div>
              <div class="rounded-xl overflow-hidden border border-[#e4e0d8] bg-white text-xs">
                ${Object.entries({
                  'Mix Ratio / Structure': (product.specs && product.specs.mixRatioWeight) || `${product.ratio || '3:1'} by Weight`,
                  'Volume Ratio': (product.specs && product.specs.mixRatioVolume) || '2.6 : 1',
                  'Working Pot Life': (product.specs && product.specs.workingPotLife) || product.potLife || '45 Minutes',
                  'Demold Duration': (product.specs && product.specs.demoldDuration) || '24 Hours',
                  'Full Glass Cure': (product.specs && product.specs.fullGlassCure) || product.cureTime || '48 – 72 Hours',
                  'Dynamic Viscosity': (product.specs && product.specs.dynamicViscosity) || '650 mPa·s (Optical Grade)',
                  'Max Single Pour Depth': (product.specs && product.specs.maxDepth) || product.pourDepth || '20mm',
                  'Shore D Hardness': (product.specs && product.specs.hardness) || '83D Scratch-Shield',
                  'UV Stability Rating': (product.specs && product.specs.uvStability) || 'HALS + UV400 Stabilized'
                }).map(([k, v], i) => `
                  <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-3 ${i % 2 === 0 ? 'bg-surface-container-low' : 'bg-white'} min-w-0">
                    <span class="font-medium text-on-surface-variant break-words">${esc(k)}</span>
                    <span class="font-spec-numeral font-bold text-primary text-left sm:text-right break-words">${esc(v)}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Downloadable TDS & SDS Triggers -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button type="button" onclick="window.openTdsModal('tds')" class="min-h-[48px] p-3 rounded-xl bg-white border border-[#e4e0d8] hover:border-secondary text-primary flex items-center gap-2.5 text-left cursor-pointer">
                  <span class="material-symbols-outlined text-secondary text-xl" aria-hidden="true">picture_as_pdf</span>
                  <div>
                    <p class="text-xs font-bold">TDS (Spec Sheet)</p>
                    <p class="text-[10px] text-on-surface-variant">Interactive Lab Data • PDF</p>
                  </div>
                </button>
                <button type="button" onclick="window.openTdsModal('sds')" class="min-h-[48px] p-3 rounded-xl bg-white border border-[#e4e0d8] hover:border-secondary text-primary flex items-center gap-2.5 text-left cursor-pointer">
                  <span class="material-symbols-outlined text-secondary text-xl" aria-hidden="true">security</span>
                  <div>
                    <p class="text-xs font-bold">SDS (Safety Sheet)</p>
                    <p class="text-[10px] text-on-surface-variant">ISO 11014 Zero-VOC Cert</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Live Indian PIN Code Serviceability Check -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-[#e4e0d8] flex flex-col gap-2.5">
              <div class="flex items-center justify-between gap-2">
                <label for="pdp-pincode-input" class="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base text-primary" aria-hidden="true">local_shipping</span>
                  <span>Express Delivery &amp; Pickup Estimation</span>
                </label>
                <span class="text-[11px] text-secondary font-semibold shrink-0">Solvent Safe Sealed</span>
              </div>
              <form class="flex gap-2" onsubmit="event.preventDefault(); window.verifyPdpPincode();">
                <input id="pdp-pincode-input" type="text" maxlength="6" aria-label="Enter 6-digit PIN code" value="${esc(pinInfo.pin)}" placeholder="Enter 6-digit PIN code" class="min-w-0 flex-1 h-12 px-3 bg-white rounded-lg border border-[#e4e0d8] font-spec-numeral text-xs text-primary">
                <button type="submit" class="px-5 h-12 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer shrink-0">Verify</button>
              </form>
              <div id="pdp-pincode-result" class="p-2.5 rounded-lg bg-white text-xs text-primary flex items-start gap-2">
                <span class="material-symbols-outlined text-[#266b4e] text-base shrink-0 mt-0.5" aria-hidden="true">verified_user</span>
                <span><strong>${esc(pinInfo.pin)} (${esc(pinInfo.city)})</strong> — Delivery in <strong>${esc(pinInfo.days)}</strong> via ${esc(pinInfo.courier)}. Cash on Delivery &amp; UPI supported.</span>
              </div>
            </div>
          </div>

          <!-- Frequently Paired Studio Bundle (Placed after Right Column in DOM so H1 comes first & Mobile users see Product Info before Upsell) -->
          <div class="lg:col-span-6 lg:col-start-1 ram-card p-4 bg-surface-container-low flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-headline-sm text-base text-primary font-bold">Frequently Paired Studio Bundle</h2>
              <span class="bg-secondary text-on-secondary font-spec-numeral text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0">Save ₹349</span>
            </div>
            <div class="flex items-center justify-between gap-2 py-1 overflow-x-auto no-scrollbar">
              <div class="flex flex-col items-center text-center w-24 shrink-0">
                <img src="${esc(Store.IMAGES.ultraclearMain)}" alt="UltraClear 3:1" class="w-16 h-16 rounded-lg object-cover border border-[#e4e0d8] bg-white p-0.5">
                <span class="text-[11px] font-semibold text-primary mt-1 truncate w-full">UltraClear 3:1</span>
                <span class="font-spec-numeral text-xs text-secondary font-bold">₹1,299</span>
              </div>
              <span class="material-symbols-outlined text-secondary" aria-hidden="true">add</span>
              <div class="flex flex-col items-center text-center w-24 shrink-0">
                <img src="${esc(Store.IMAGES.siliconeMold4x)}" alt="Silicone Molds" class="w-16 h-16 rounded-lg object-cover border border-[#e4e0d8] bg-white p-0.5">
                <span class="text-[11px] font-semibold text-primary mt-1 truncate w-full">Geode Molds (4x)</span>
                <span class="font-spec-numeral text-xs text-secondary font-bold">₹449</span>
              </div>
              <span class="material-symbols-outlined text-secondary" aria-hidden="true">add</span>
              <div class="flex flex-col items-center text-center w-24 shrink-0">
                <img src="${esc(Store.IMAGES.oceanMicaJar)}" alt="Chameleon Mica" class="w-16 h-16 rounded-lg object-cover border border-[#e4e0d8] bg-white p-0.5">
                <span class="text-[11px] font-semibold text-primary mt-1 truncate w-full">Chameleon Mica</span>
                <span class="font-spec-numeral text-xs text-secondary font-bold">₹899</span>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-white border border-[#e4e0d8] flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="flex items-baseline gap-1.5">
                  <span class="font-spec-numeral text-lg font-bold text-primary">₹2,298</span>
                  <span class="font-spec-numeral text-xs line-through text-outline">₹2,647</span>
                </div>
                <p class="text-[11px] text-secondary font-medium">Complete resin + 4x geode molds + 12x mica combo</p>
              </div>
              <button type="button" onclick="window.addStudioBundle()" class="min-h-[44px] px-4 py-2.5 rounded-lg bg-secondary hover:opacity-95 text-on-secondary text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0">
                <span class="material-symbols-outlined text-base" aria-hidden="true">shopping_bag</span>
                <span>Add 3 Items</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <section id="pdp-reviews" class="px-4 sm:px-8 pt-10 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#e4e0d8] pt-8">
            <div>
              <span class="font-label-sm text-xs uppercase tracking-wider text-secondary font-bold">Verified Studio Patrons</span>
              <h2 class="font-headline-sm text-xl text-primary font-bold">Artisan &amp; Bride Reviews (${prodReviews.length})</h2>
            </div>
            <button type="button" onclick="window.toggleReviewForm()" class="self-start min-h-[44px] px-4 py-2 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-surface-container-high cursor-pointer">
              + Write a Studio Review
            </button>
          </div>

          <form id="pdp-review-form" onsubmit="event.preventDefault(); window.submitPdpReview('${esc(product.id)}');" class="hidden ram-card p-4 flex flex-col gap-3 bg-surface-container-low">
            <h3 class="text-xs font-bold text-primary uppercase font-body-md">Submit Your Experience</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="rev-author" class="text-[11px] font-bold text-primary block mb-1">Your Name &amp; City</label>
                <input id="rev-author" type="text" required aria-label="Your Name and City" placeholder="Your Name & City (e.g. Kavya • Bengaluru)" class="w-full h-12 px-3 rounded-lg bg-white border border-[#e4e0d8] text-xs">
              </div>
              <div>
                <label for="rev-rating" class="text-[11px] font-bold text-primary block mb-1">Review Rating</label>
                <select id="rev-rating" aria-label="Review Rating" class="w-full h-12 px-3 rounded-lg bg-white border border-[#e4e0d8] text-xs">
                  <option value="5">★★★★★ (5.0 — Flawless Pour / Keepsake)</option>
                  <option value="4">★★★★☆ (4.0 — Very Good)</option>
                </select>
              </div>
            </div>
            <div>
              <label for="rev-text" class="text-[11px] font-bold text-primary block mb-1">Review Details</label>
              <textarea id="rev-text" rows="2" required aria-label="Review Details" placeholder="Share how the clarity, pot life, or floral preservation turned out..." class="w-full p-3 rounded-lg bg-white border border-[#e4e0d8] text-xs"></textarea>
            </div>
            <button type="submit" class="self-start min-h-[48px] px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer">Post Verified Review</button>
          </form>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${prodReviews.map(r => `
              <div class="ram-card p-4 flex flex-col gap-2 bg-white min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-primary truncate">${esc(r.author)}</span>
                  <span class="text-[11px] text-[#266b4e] font-semibold shrink-0">✓ Verified Purchase • ${esc(r.date)}</span>
                </div>
                <div class="flex items-center text-amber-500 text-xs">${'★'.repeat(r.rating)}</div>
                <p class="text-xs text-on-surface-variant leading-relaxed break-anywhere">${esc(r.text)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Recently Viewed & Curated Recommendations -->
        <section class="px-4 sm:px-8 pt-8 flex flex-col gap-4">
          <div class="flex items-center justify-between border-t border-[#e4e0d8] pt-6">
            <div>
              <span class="font-label-sm text-xs uppercase tracking-wider text-[#9e3322] font-bold">Continue Exploring</span>
              <h2 class="font-headline-sm text-xl text-primary font-bold">Recently Viewed &amp; Curated For You</h2>
            </div>
            <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[44px] px-3 text-xs font-bold text-secondary hover:underline cursor-pointer">Full Catalogue →</button>
          </div>
          <div class="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-4">
            ${Store.getRecentlyViewedProducts(product.id, 4).map(p => renderProductCard(p, false)).join('')}
          </div>
        </section>

        <!-- Sticky Bottom PDP Action Bar (aligned with lg:hidden mobile bottom nav) -->
        <aside class="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e4e0d8] px-2.5 sm:px-8 py-2.5 shadow-lg max-w-full">
          <div class="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-3">
            <button type="button" aria-label="Save to Wishlist" onclick="window.handleWishlistToggle(event, '${esc(product.id)}')" class="hidden sm:flex w-12 h-12 rounded-xl bg-surface-container-low items-center justify-center ${isFav ? 'text-[#9e3322]' : 'text-primary'} shrink-0 cursor-pointer">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' ${isFav ? 1 : 0};" aria-hidden="true">${isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
            <div class="hidden min-[420px]:flex h-12 bg-surface-container-low rounded-xl items-center px-0.5 sm:px-1 shrink-0 border border-[#e4e0d8]">
              <button type="button" aria-label="Decrease quantity" onclick="window.changePdpQty(-1)" class="w-11 h-11 flex items-center justify-center text-primary font-bold cursor-pointer">
                <span class="material-symbols-outlined text-base" aria-hidden="true">remove</span>
              </button>
              <span id="pdp-qty-val" class="w-5 sm:w-8 text-center font-spec-numeral text-sm text-primary font-bold">${AppState.pdpQty}</span>
              <button type="button" aria-label="Increase quantity" onclick="window.changePdpQty(1)" class="w-11 h-11 flex items-center justify-center text-primary font-bold cursor-pointer">
                <span class="material-symbols-outlined text-base" aria-hidden="true">add</span>
              </button>
            </div>
            <button type="button" id="pdp-add-to-cart-btn" onclick="window.addPdpToCart()" ${product.inStock === false ? 'disabled' : ''} class="btn-shimmer min-w-0 flex-1 h-12 px-2.5 sm:px-5 rounded-xl ${product.inStock === false ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-primary hover:bg-primary-container text-on-primary cursor-pointer'} font-title-md text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md active:scale-[0.99] transition-all">
              <span class="material-symbols-outlined text-base sm:text-xl shrink-0" aria-hidden="true">${product.inStock === false ? 'block' : 'shopping_bag'}</span>
              <span id="pdp-cta-label" class="truncate">${product.inStock === false ? 'Out of Stock' : `Add to Bag • ${formatINR(totalCtaPrice)}`}</span>
            </button>
            <button type="button" id="pdp-buy-now-btn" onclick="window.buyNowPdp()" ${product.inStock === false ? 'disabled' : ''} class="h-12 px-3 sm:px-5 rounded-xl ${product.inStock === false ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-[#9e3322] hover:opacity-95 text-white cursor-pointer'} font-title-md text-xs sm:text-sm font-bold flex items-center justify-center gap-1 shadow-md shrink-0 whitespace-nowrap">
              <span class="material-symbols-outlined text-base sm:text-lg shrink-0" aria-hidden="true">bolt</span>
              <span>Buy Now</span>
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  // =========================================================================
  // 4. SOCIAL COMMERCE HUB (@resin.art.memories)
  // =========================================================================
  function renderSocialView() {
    const posts = Store.getSocialPosts();
    const filtered = AppState.socialTagFilter === 'all'
      ? posts
      : posts.filter(p => p.tag === AppState.socialTagFilter);

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 gap-6">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Discover</span>
          </button>
        </div>

        <!-- Official Instagram Profile Header Card -->
        <div class="ram-card p-5 sm:p-6 !bg-[#031a38] bg-gradient-to-r from-[#031a38] via-[#1b2f4e] to-[#2c1e21] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="story-ring w-20 h-20 sm:w-24 sm:h-24 shrink-0">
              <img src="${esc(Store.IMAGES.floralCube)}" alt="@resin.art.memories" class="w-full h-full rounded-full object-cover border-2 border-[#031a38]">
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-headline-sm text-xl sm:text-2xl font-bold">@resin.art.memories</h1>
                <span class="px-2.5 py-0.5 rounded-full bg-[#9e3322] text-white text-[10px] font-bold uppercase whitespace-nowrap">Verified Official Storefront</span>
              </div>
              <p class="text-xs sm:text-sm text-white/90 mt-1.5 max-w-xl leading-relaxed">
                🌹 Preserving Wedding Varmalas, Anniversary Roses &amp; Intimate Memories in Museum-Grade Crystal Resin • Powered by Vistāra Krafts Optical Formulations
              </p>
              <div class="flex flex-wrap items-center gap-4 sm:gap-5 mt-3 font-spec-numeral text-xs">
                <span><strong>642</strong> Creations</span>
                <span><strong>48.9K</strong> Patrons</span>
                <span><strong>100%</strong> Custom Hand-Poured</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <a href="https://www.instagram.com/resin.art.memories?utm_source=qr" target="_blank" rel="noopener noreferrer" class="flex-1 md:flex-initial min-h-[48px] px-4 py-2.5 rounded-xl bg-[#9e3322] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap">
              <span class="material-symbols-outlined text-base" aria-hidden="true">open_in_new</span>
              <span>Follow on Instagram</span>
            </a>
            <button type="button" onclick="window.openShareMemoryModal()" class="flex-1 md:flex-initial min-h-[48px] px-4 py-2.5 rounded-xl bg-white text-primary text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer">
              <span class="material-symbols-outlined text-base text-[#9e3322]" aria-hidden="true">add_a_photo</span>
              <span>Post Your Memory</span>
            </button>
          </div>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            ${[
              { id: 'all', label: 'All Feed Posts' },
              { id: 'BridalVarmala', label: '#BridalVarmala' },
              { id: 'OceanArt', label: '#OceanArt' },
              { id: 'ResinFormulas', label: '#ResinFormulas' },
              { id: 'ClientLove', label: '#ClientLove' }
            ].map(t => `
              <button type="button" onclick="window.setSocialTagFilter('${t.id}')" class="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${AppState.socialTagFilter === t.id ? 'bg-primary text-white shadow-xs' : 'bg-surface-container-high text-primary hover:bg-secondary-container/50'}">
                ${esc(t.label)}
              </button>
            `).join('')}
          </div>
          <span class="text-xs text-on-surface-variant font-spec-numeral shrink-0">${filtered.length} Shoppable Posts</span>
        </div>

        <!-- Social Feed Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${filtered.map(post => {
            const tagged = Store.getProductById(post.productId);
            return `
              <article class="ram-card overflow-hidden flex flex-col justify-between bg-white min-w-0">
                <div>
                  <div class="p-3.5 flex items-center justify-between border-b border-surface-container">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img src="${esc(post.avatar)}" alt="${esc(post.authorName)}" class="w-9 h-9 rounded-full object-cover ring-2 ring-[#9e3322] shrink-0">
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-primary truncate">${esc(post.authorName)}</p>
                        <p class="text-[11px] text-on-surface-variant truncate">${esc(post.handle)} • ${esc(post.timeAgo)}</p>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] font-bold shrink-0">#${esc(post.tag)}</span>
                  </div>

                  <div class="relative aspect-square bg-surface-container overflow-hidden group" ondblclick="window.handleSocialLike('${esc(post.id)}')">
                    <img src="${esc(post.image)}" alt="${esc(post.caption)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold">${esc(post.badge)}</span>
                  </div>

                  <div class="p-4 flex flex-col gap-2.5 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <button type="button" onclick="window.handleSocialLike('${esc(post.id)}')" class="min-h-[44px] px-2 flex items-center gap-1 text-xs font-bold ${post.liked ? 'text-[#9e3322]' : 'text-primary'} cursor-pointer">
                          <span class="material-symbols-outlined text-xl ${post.liked ? 'animate-heart-pop' : ''}" style="font-variation-settings: 'FILL' ${post.liked ? 1 : 0};" aria-hidden="true">favorite</span>
                          <span class="font-spec-numeral">${post.likes.toLocaleString('en-IN')}</span>
                        </button>
                        <span class="flex items-center gap-1 text-xs text-on-surface-variant font-spec-numeral">
                          <span class="material-symbols-outlined text-lg" aria-hidden="true">chat_bubble</span>
                          ${(post.comments || []).length}
                        </span>
                      </div>
                      <button type="button" onclick="window.handleSocialSave('${esc(post.id)}')" class="min-h-[44px] px-2 text-xs font-semibold flex items-center gap-1 ${post.saved ? 'text-secondary' : 'text-on-surface-variant'} cursor-pointer">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${post.saved ? 1 : 0};" aria-hidden="true">bookmark</span>
                        <span>${post.saved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <p class="text-xs text-on-surface leading-relaxed break-anywhere">${esc(post.caption)}</p>

                    <!-- Comments List -->
                    <div class="pt-2 border-t border-surface-container flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                      ${(post.comments || []).map(c => `
                        <p class="text-[11px] text-on-surface-variant break-anywhere"><strong class="text-primary">${esc(c.user)}</strong> ${esc(c.text)}</p>
                      `).join('')}
                    </div>

                    <!-- Add Comment Input -->
                    <form class="flex gap-1.5 pt-1" onsubmit="event.preventDefault(); window.handleSocialComment('${esc(post.id)}', this);">
                      <input type="text" name="commentText" required aria-label="Add a comment for @resin.art.memories" placeholder="Add a comment for @resin.art.memories..." class="min-w-0 flex-1 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
                      <button type="submit" class="px-4 h-12 rounded-lg bg-primary text-white text-xs font-semibold shrink-0 cursor-pointer">Post</button>
                    </form>
                  </div>
                </div>

                <!-- Tagged Shoppable Product Strip -->
                ${tagged ? `
                  <div class="p-3 bg-[#fdf6f3] border-t border-[#e4e0d8] flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0 cursor-pointer" onclick="window.navigateTo('product', '${esc(tagged.id)}')">
                      <img src="${esc(tagged.image)}" alt="${esc(tagged.shortName)}" class="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#e4e0d8]">
                      <div class="min-w-0">
                        <span class="text-[10px] uppercase tracking-wider text-[#9e3322] font-bold block">Tagged in Reel</span>
                        <p class="text-xs font-bold text-primary truncate">${esc(tagged.shortName)}</p>
                        <p class="font-spec-numeral text-xs font-bold text-secondary">${formatINR(tagged.price)}</p>
                      </div>
                    </div>
                    <button type="button" onclick="window.handleQuickAdd(this, '${esc(tagged.id)}')" class="min-h-[44px] px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shrink-0 cursor-pointer">
                      Shop Piece
                    </button>
                  </div>
                ` : ''}
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. CUSTOM MEMORY PRESERVATION BUILDER & EPOXY CALCULATOR STUDIO
  // =========================================================================
  function renderCustomStudioView() {
    const b = AppState.customBuilder;
    const ledCost = b.ledBase ? 499 : 0;
    const secondaryCost = Number(b.secondaryAddon) || 0;
    const totalCustomPrice = b.shapePrice + b.sourceAddon + b.metallicAddon + secondaryCost + ledCost;

    const calcRes = Store.calculateResinNeeded({
      shape: AppState.calcShape,
      lengthCm: AppState.calcLength,
      widthCm: AppState.calcWidth,
      diameterCm: AppState.calcDiameter,
      depthCm: AppState.calcDepth,
      ratioSystem: AppState.calcSystem
    });
    const recommendedProdId = AppState.calcSystem === '2:1' ? 'vk-epx-201' : (AppState.calcSystem === '1:1' ? 'vk-res-003' : 'vk-epx-301');
    const recommendedProd = Store.getProductById(recommendedProdId);

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 gap-6">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Discover</span>
          </button>
        </div>

        <!-- Studio Header -->
        <div class="flex flex-col gap-1">
          <span class="font-label-sm text-xs uppercase tracking-widest text-[#9e3322] font-bold">Bespoke Atelier &amp; Formulation Lab</span>
          <h1 class="font-headline-lg text-2xl sm:text-4xl text-primary font-bold">Custom Memory Preservation &amp; Pour Calculator</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">Design your one-of-a-kind wedding/anniversary floral block OR calculate exact resin ratios for your own DIY moulds.</p>
        </div>

        <!-- Part A: Interactive 5-Step Custom Keepsake Configurator -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-7 ram-card p-5 sm:p-6 flex flex-col gap-5 bg-white">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container pb-3">
              <h2 class="font-headline-sm text-xl text-primary font-bold">1. Configure Your Custom Resin Keepsake</h2>
              <span class="px-2.5 py-1 rounded-full bg-[#ffe4de] text-[#9e3322] text-xs font-bold whitespace-nowrap shrink-0">Doorstep Flower Pickup</span>
            </div>

            <!-- Step 1: Vessel Architecture -->
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Step 1: Choose Keepsake Geometry</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${[
                  { label: '8" Romantic Cube', price: 2999, desc: '8–12 Roses • 50mm deep' },
                  { label: '10" Royal Hexagon Frame', price: 3899, desc: 'Half Garland • 45mm deep' },
                  { label: '12" Royal Heirloom Block', price: 4499, desc: 'Full Varmala • 50mm deep' },
                  { label: '14" Mughal Arch Block', price: 5299, desc: 'Jaimala + Wedding Invite' },
                  { label: '16" Gallery Mantel Frame', price: 6999, desc: 'Dual Garlands + 2 Coasters' }
                ].map(item => `
                  <button type="button" onclick="window.updateCustomBuilder('shape', '${esc(item.label)}', ${item.price})" class="p-3 rounded-xl border text-left transition-all cursor-pointer ${b.shape === item.label ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-primary border-[#e4e0d8]'}">
                    <p class="text-xs font-bold">${esc(item.label)}</p>
                    <p class="text-[11px] ${b.shape === item.label ? 'text-white/85' : 'text-on-surface-variant'} mt-0.5">${esc(item.desc)}</p>
                    <p class="font-spec-numeral text-sm font-bold mt-1.5 ${b.shape === item.label ? 'text-[#ffd79b]' : 'text-secondary'}">${formatINR(item.price)}</p>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Step 2: Flower / Memory Source -->
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Step 2: How Will Your Flowers Reach Our Studio?</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${[
                  { label: 'Fresh Wedding Varmala (Free Doorstep Pickup)', addon: 0 },
                  { label: 'Studio Pre-Sourced Ecuadorian Roses & Orchids', addon: 650 }
                ].map(src => `
                  <button type="button" onclick="window.updateCustomBuilder('flowerSource', '${esc(src.label)}', ${src.addon})" class="p-3 rounded-xl border text-left transition-all cursor-pointer ${b.flowerSource === src.label ? 'border-[#9e3322] bg-[#ffe4de]/40 ring-1 ring-[#9e3322]' : 'border-[#e4e0d8] bg-white'}">
                    <p class="text-xs font-bold text-primary">${esc(src.label)}</p>
                    <p class="font-spec-numeral text-[11px] text-secondary font-semibold mt-1">${src.addon === 0 ? 'Complimentary Courier Kit' : '+ ' + formatINR(src.addon)}</p>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Step 3: Metallic & Pigment Accents -->
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Step 3: Select Luxury Inclusions</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${[
                  { label: 'Pure Crystal Clear (Zero Flakes)', addon: 0 },
                  { label: '24K Gold Leaf + Champagne Rim', addon: 350 },
                  { label: 'Rose-Gold Foil + Crushed Quartz', addon: 450 }
                ].map(inc => `
                  <button type="button" onclick="window.updateCustomBuilder('metallic', '${esc(inc.label)}', ${inc.addon})" class="p-3 rounded-xl border text-left transition-all cursor-pointer ${b.metallic === inc.label ? 'border-secondary bg-secondary-container/30 font-bold' : 'border-[#e4e0d8] bg-white'}">
                    <p class="text-xs text-primary">${esc(inc.label)}</p>
                    <p class="font-spec-numeral text-[11px] text-secondary mt-1">${inc.addon === 0 ? 'Included' : '+ ' + formatINR(inc.addon)}</p>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Step 4: Complementary Keepsake Add-ons (Spare Petals) -->
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Step 4: Complementary Spare-Petal Add-Ons</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${[
                  { label: 'None (Main Keepsake Only)', addon: 0 },
                  { label: 'Matching Resin Ring Platter', addon: 899 },
                  { label: '2x Preserved Petal Bookmarks', addon: 599 }
                ].map(sec => `
                  <button type="button" onclick="window.updateCustomBuilder('secondaryKeepsake', '${esc(sec.label)}', ${sec.addon})" class="p-3 rounded-xl border text-left transition-all cursor-pointer ${b.secondaryKeepsake === sec.label ? 'border-primary bg-surface-container-high font-bold' : 'border-[#e4e0d8] bg-white'}">
                    <p class="text-xs text-primary">${esc(sec.label)}</p>
                    <p class="font-spec-numeral text-[11px] text-secondary mt-1">${sec.addon === 0 ? 'No extra charge' : '+ ' + formatINR(sec.addon)}</p>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Step 5: Event Date, Pickup Slot, Calligraphy Engraving & Warm LED Pedestal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-surface-container">
              <div>
                <label class="text-xs font-bold text-primary block mb-1" for="custom-event-date">Wedding / Event Date</label>
                <input id="custom-event-date" type="date" value="${esc(b.eventDate || '2026-11-18')}" onchange="window.updateCustomBuilderSchedule('eventDate', this.value)" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-xs text-primary">
              </div>
              <div>
                <label class="text-xs font-bold text-primary block mb-1" for="custom-pickup-slot">Preferred Doorstep Pickup Window</label>
                <select id="custom-pickup-slot" onchange="window.updateCustomBuilderSchedule('pickupSlot', this.value)" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs font-semibold text-primary">
                  <option value="Morning Slot (9:00 AM – 1:00 PM)" ${b.pickupSlot === 'Morning Slot (9:00 AM – 1:00 PM)' ? 'selected' : ''}>Morning Slot (9:00 AM – 1:00 PM)</option>
                  <option value="Afternoon Slot (2:00 PM – 6:00 PM)" ${b.pickupSlot === 'Afternoon Slot (2:00 PM – 6:00 PM)' ? 'selected' : ''}>Afternoon Slot (2:00 PM – 6:00 PM)</option>
                  <option value="Self-Ship via Air Courier (Reimbursed)" ${b.pickupSlot === 'Self-Ship via Air Courier (Reimbursed)' ? 'selected' : ''}>Self-Ship via Air Courier (Reimbursed)</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-bold text-primary block mb-1" for="custom-engraving-input">Custom Names / Date Calligraphy</label>
                <input id="custom-engraving-input" type="text" value="${esc(b.engraving)}" oninput="window.updateCustomBuilderText(this.value)" placeholder="e.g. Aarav & Meera • 12.10.2026" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
              </div>
              <div class="flex items-end">
                <label class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] flex items-center justify-between gap-2 cursor-pointer">
                  <span class="text-xs font-semibold text-primary">Warm Teak LED Light Base (+₹499)</span>
                  <input type="checkbox" ${b.ledBase ? 'checked' : ''} onchange="window.updateCustomBuilderLed(this.checked)" class="w-5 h-5 accent-primary shrink-0">
                </label>
              </div>
            </div>

            <!-- Bridal Flower Care & Packing Rules Box -->
            <div class="p-4 rounded-xl bg-[#fdf6f3] border border-[#9e3322]/25 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#9e3322] text-base" aria-hidden="true">verified_user</span>
                <h3 class="text-xs font-bold text-primary uppercase tracking-wider">Essential Post-Wedding Flower Care Protocol</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
                <p><strong>1. Never Freeze:</strong> Store garlands in the normal refrigerator crisper (4°C–8°C), never in the deep freezer.</p>
                <p><strong>2. No Water/Perfume Spray:</strong> Keep petals dry; wrap only the cut stems in a slightly damp tissue.</p>
                <p><strong>3. Breathable Carton:</strong> Pack loosely in newspaper or cotton inside a sturdy box—avoid sealed plastic bags.</p>
                <p><strong>4. Pre-Pour Approval:</strong> We WhatsApp &amp; upload your digital floral arrangement mockup before pouring resin.</p>
              </div>
            </div>
          </div>

          <!-- Live Custom Preview & Instant Add to Bag Card (5 cols) -->
          <div class="lg:col-span-5 ram-card p-5 !bg-primary bg-gradient-to-b from-primary to-[#101d33] text-white flex flex-col gap-4 sticky top-24 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[11px] uppercase tracking-widest text-[#ffd79b] font-bold">Live Bespoke Preview</span>
              <span class="px-2 py-0.5 rounded bg-white/10 font-spec-numeral text-[11px]">14-Day Cryo-Cure</span>
            </div>
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/15">
              <img src="${esc(Store.IMAGES.floralCube)}" alt="Custom Keepsake Preview" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/55 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4">
                <p id="custom-preview-engraving" class="font-serif italic text-base text-[#ffd79b] text-center tracking-wide break-anywhere line-clamp-2">“${esc(b.engraving || 'Your Forever Memory')}”</p>
              </div>
            </div>
            <div class="space-y-1.5 text-xs border-y border-white/15 py-3">
              <div class="flex justify-between gap-2"><span class="text-white/75">Architecture:</span><span class="font-semibold text-right">${esc(b.shape)}</span></div>
              <div class="flex justify-between gap-2"><span class="text-white/75">Floral Source:</span><span class="font-semibold truncate max-w-[200px] text-right">${esc(b.flowerSource)}</span></div>
              <div class="flex justify-between gap-2"><span class="text-white/75">Inclusions:</span><span class="font-semibold text-right">${esc(b.metallic)}</span></div>
              <div class="flex justify-between gap-2"><span class="text-white/75">Add-On Piece:</span><span class="font-semibold text-right">${esc(b.secondaryKeepsake || 'None')}</span></div>
              <div class="flex justify-between gap-2"><span class="text-white/75">Pickup Schedule:</span><span class="font-semibold text-right">${esc(b.eventDate)} • ${esc((b.pickupSlot || '').split(' ')[0])}</span></div>
              <div class="flex justify-between gap-2"><span class="text-white/75">Teak LED Stand:</span><span class="font-semibold text-right">${b.ledBase ? 'Yes (+₹499)' : 'No'}</span></div>
            </div>
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-xs text-white/75 block">Total Commission Estimate</span>
                <span class="font-spec-numeral text-2xl font-bold text-[#ffd79b]">${formatINR(totalCustomPrice)}</span>
              </div>
              <span class="text-[11px] text-emerald-300 font-semibold">Free Air Insured Return</span>
            </div>
            <button type="button" onclick="window.addCustomCommissionToCart()" class="btn-shimmer w-full h-12 rounded-xl bg-[#9e3322] hover:opacity-95 text-white font-title-md text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg" aria-hidden="true">redeem</span>
              <span>Book &amp; Add Custom Keepsake to Bag</span>
            </button>
          </div>
        </div>

        <!-- Interactive Before & After: 21-Day Cryo-Silica Floral Transformation Slider -->
        <div class="ram-card p-5 sm:p-6 bg-white flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-surface-container pb-3">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-[#9e3322] font-bold">Heirloom Preservation Science</span>
              <h2 class="font-headline-sm text-xl text-primary font-bold">Interactive Flower Transformation: Raw Garland vs Preserved Block</h2>
              <p class="text-xs text-on-surface-variant mt-0.5">Drag the slider horizontally to view how fresh bridal varmalas transform through 21-day cryo-silica dehydration into optical 85D diamond resin.</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-spec-numeral text-xs font-bold shrink-0">
              Split: <span class="sotd-slider-pct">50%</span>
            </span>
          </div>

          <div class="sotd-dehydration-slider relative w-full aspect-[4/3] sm:aspect-[16/7] rounded-2xl overflow-hidden border border-[#b08d57]/40 shadow-md select-none" data-split="50">
            <!-- After Layer (Preserved Optical Block) -->
            <div class="absolute inset-0 w-full h-full bg-primary">
              <img src="${esc(Store.IMAGES.floralCube)}" alt="After: Preserved 50mm Crystal Optical Block" class="w-full h-full object-cover">
              <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-[#ffd79b] text-[11px] font-bold uppercase tracking-wider shadow-sm border border-white/15">
                ✨ Day 21: Preserved 50mm Optical Block
              </div>
              <div class="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] hidden sm:block">
                0% Moisture • 95% Natural Color Retained • 85D Mirror Glass
              </div>
            </div>

            <!-- Before Layer (Clipped - Fresh Wedding Garlands) -->
            <div class="sotd-before-layer absolute inset-0 h-full overflow-hidden" style="width: 50%;">
              <img src="${esc(Store.IMAGES.jewelryBezel)}" alt="Before: Fresh Bridal Wedding Garland" class="w-full h-full object-cover max-w-none" style="width: 100%; min-width: 100%;">
              <div class="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider shadow-sm border border-white/15">
                🌸 Day 0: Fresh Wedding Garland
              </div>
              <div class="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] hidden sm:block">
                85% Moisture • Highly Perishable • 24h Express Cryo Pickup
              </div>
            </div>

            <!-- Divider Line & Drag Handle -->
            <div class="sotd-slider-divider absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style="left: 50%;">
              <div class="sotd-slider-handle absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                <span class="material-symbols-outlined text-lg" aria-hidden="true">drag_indicator</span>
              </div>
            </div>

            <!-- Accessible Native Range Input -->
            <input type="range" min="0" max="100" value="50" aria-label="Floral preservation before and after comparison slider" class="sotd-slider-range" oninput="window.updateSotdSlider(this)">
          </div>
        </div>

        <!-- Part B: Interactive Epoxy Pour & Ratio Calculator (Rectangular & Circular Moulds) -->
        <div id="studio-pour-calculator" class="ram-card p-5 sm:p-6 bg-white flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-3">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-secondary font-bold">Vistāra Krafts Chemical Lab</span>
              <h2 class="font-headline-sm text-xl text-primary font-bold">2. Interactive Epoxy Pour &amp; Mix Ratio Calculator</h2>
              <p class="text-xs text-on-surface-variant">Calculate exact Resin (Part A) and Hardener (Part B) weights in grams for Rectangular or Circular moulds (1.10 g/cm³ density).</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" id="studio-calc-shape-rect" onclick="window.setStudioCalcShape('rect')" class="min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${AppState.calcShape === 'rect' ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-[#e4e0d8]'}">
                Rectangular (L × W × D)
              </button>
              <button type="button" id="studio-calc-shape-circle" onclick="window.setStudioCalcShape('circle')" class="min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${AppState.calcShape === 'circle' ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-[#e4e0d8]'}">
                Circular / Round (Ø × D)
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div class="lg:col-span-7 flex flex-col gap-4">
              <div class="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                ${AppState.calcShape === 'circle' ? `
                  <div class="col-span-1 min-[360px]:col-span-2">
                    <label class="text-xs font-bold text-primary block mb-1" for="studio-calc-diam">Mould Diameter Ø (cm)</label>
                    <input id="studio-calc-diam" type="number" min="0.5" step="0.5" value="${AppState.calcDiameter}" class="w-full min-w-0 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
                  </div>
                ` : `
                  <div>
                    <label class="text-xs font-bold text-primary block mb-1" for="studio-calc-len">Length (cm)</label>
                    <input id="studio-calc-len" type="number" min="0.5" step="0.5" value="${AppState.calcLength}" class="w-full min-w-0 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
                  </div>
                  <div>
                    <label class="text-xs font-bold text-primary block mb-1" for="studio-calc-wid">Width (cm)</label>
                    <input id="studio-calc-wid" type="number" min="0.5" step="0.5" value="${AppState.calcWidth}" class="w-full min-w-0 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
                  </div>
                `}
                <div>
                  <label class="text-xs font-bold text-primary block mb-1" for="studio-calc-dep">Pour Depth (cm)</label>
                  <input id="studio-calc-dep" type="number" min="0.1" step="0.1" value="${AppState.calcDepth}" class="w-full min-w-0 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm text-primary">
                </div>
                <div>
                  <label class="text-xs font-bold text-primary block mb-1" for="studio-calc-sys">Ratio System</label>
                  <select id="studio-calc-sys" class="w-full min-w-0 h-12 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-xs font-bold text-primary">
                    <option value="3:1" ${AppState.calcSystem === '3:1' ? 'selected' : ''}>3:1 Casting</option>
                    <option value="2:1" ${AppState.calcSystem === '2:1' ? 'selected' : ''}>2:1 Deep Pour</option>
                    <option value="1:1" ${AppState.calcSystem === '1:1' ? 'selected' : ''}>1:1 Doming</option>
                  </select>
                </div>
              </div>

              <button type="button" id="studio-calc-run-btn" onclick="window.runStudioCalculator()" class="min-h-[48px] px-5 rounded-xl bg-primary text-white font-label-md text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer">
                <span class="material-symbols-outlined text-base text-[#ffd79b]" aria-hidden="true">calculate</span>
                <span>Calculate Exact Resin &amp; Hardener Mass</span>
              </button>
            </div>

            <div class="lg:col-span-5 p-4 rounded-xl bg-surface-container-low border border-[#e4e0d8] flex flex-col gap-3 min-w-0">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-xs font-bold uppercase tracking-wider text-secondary">Formulation Output</span>
                <span class="font-spec-numeral text-xs font-bold text-primary">${esc(AppState.calcSystem)} by Weight</span>
              </div>
              <p id="studio-calc-result" class="font-spec-numeral text-sm sm:text-base font-bold text-primary break-words">
                ${calcRes.valid
                  ? `~${calcRes.totalGrams}g total (Part A: ${calcRes.partAGrams}g + Part B: ${calcRes.partBGrams}g)`
                  : 'Please enter positive dimensions (> 0 cm) to calculate resin mass.'}
              </p>
              <div class="flex flex-wrap sm:flex-nowrap items-center justify-between pt-2 border-t border-[#e4e0d8] gap-2">
                <div class="min-w-0 flex-1">
                  <span class="text-[11px] text-on-surface-variant block">Recommended Kit:</span>
                  <span class="text-xs font-bold text-primary truncate block">${esc(recommendedProd ? recommendedProd.name : 'UltraClear 3:1 Casting Resin')}</span>
                </div>
                <button type="button" onclick="window.addRecommendedCalcKitToCart()" class="min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold shrink-0 hover:opacity-95 cursor-pointer flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">add_shopping_cart</span>
                  <span>Add Kit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 6. SAVED / WISHLIST VIEW
  // =========================================================================
  function renderWishlistView() {
    const wishlistIds = Store.getWishlist();
    const products = Store.getProducts().filter(p => wishlistIds.includes(p.id));
    const savedPosts = Store.getSocialPosts().filter(p => p.saved);

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 gap-6">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back</span>
          </button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4e0d8] pb-4">
          <div>
            <span class="font-label-sm text-xs uppercase tracking-widest text-[#9e3322] font-bold">Personal Curation</span>
            <h1 class="font-headline-lg text-2xl sm:text-3xl text-primary font-bold">Saved Keepsakes &amp; Formulations (${products.length})</h1>
          </div>
          ${products.length > 0 ? `
            <button type="button" onclick="window.moveAllWishlistToCart()" class="min-h-[48px] px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer">
              <span class="material-symbols-outlined text-base" aria-hidden="true">shopping_bag</span>
              <span>Add All ${products.length} Saved Items to Bag</span>
            </button>
          ` : ''}
        </div>

        ${products.length === 0 ? `
          <div class="ram-card p-10 text-center flex flex-col items-center gap-3.5 bg-white">
            <div class="relative w-24 h-24 flex items-center justify-center lottie-anim-heart">
              <div class="absolute inset-0 rounded-full bg-[#ffe4de] lottie-anim-pulse blur-md pointer-events-none"></div>
              <svg class="w-full h-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Saved list empty">
                <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 6" class="lottie-anim-spin" opacity="0.6" />
                <path d="M50 78 C50 78 22 58 22 38 C22 26 32 18 42 22 C46 24 49 28 50 32 C51 28 54 24 58 22 C68 18 78 26 78 38 C78 58 50 78 50 78 Z" fill="#ffe4de" stroke="#9e3322" stroke-width="2" />
                <path d="M44 48 C48 42 54 44 56 40" stroke="#266b4e" stroke-width="1.5" stroke-linecap="round" fill="none" />
                <circle cx="70" cy="24" r="2.5" fill="#d4af37" />
              </svg>
            </div>
            <h2 class="font-headline-sm text-xl text-primary font-bold">Your Wishlist is Empty</h2>
            <p class="text-xs text-on-surface-variant max-w-sm">Tap the heart icon on any resin formulation or floral keepsake to bookmark it for your next pour.</p>
            <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer">Explore Catalogue</button>
          </div>
        ` : `
          <div class="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${products.map(p => renderProductCard(p, false)).join('')}
          </div>
        `}

        ${savedPosts.length > 0 ? `
          <div class="pt-4 border-t border-[#e4e0d8] flex flex-col gap-3">
            <h2 class="font-headline-sm text-lg text-primary font-bold">Bookmarked @resin.art.memories Reels (${savedPosts.length})</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              ${savedPosts.map(post => `
                <div class="ram-card p-3 flex items-center gap-3 bg-white">
                  <img src="${esc(post.image)}" alt="${esc(post.tag)}" class="w-16 h-16 rounded-lg object-cover shrink-0">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-primary truncate">${esc(post.handle)} • #${esc(post.tag)}</p>
                    <p class="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">${esc(post.caption)}</p>
                    <button type="button" onclick="window.navigateTo('social')" class="min-h-[44px] inline-flex items-center text-[11px] font-bold text-[#9e3322] mt-0.5 hover:underline cursor-pointer">View in Feed →</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // =========================================================================
  // 7. CART & CHECKOUT VIEW (Single Clean Invoice Summary + Working Controls)
  // =========================================================================
  function renderCartView() {
    const summary = Store.getCartSummary();
    const pinInfo = Store.getPincodeInfo();
    const gstInfo = Store.getGstInfo();

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-28 gap-6">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('catalog')" aria-label="Go back to catalogue" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Shopping</span>
          </button>
        </div>

        <!-- Free Shipping Progression Strip -->
        <div class="p-4 rounded-2xl bg-secondary-container text-on-secondary-container shadow-xs flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <div class="flex items-center gap-2 text-primary">
              <span class="material-symbols-outlined text-lg text-secondary" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">local_shipping</span>
              <span>
                ${summary.isFreeShipping
                  ? 'Unlocked! Eligible for <strong>Free Pan-India BlueDart Air Express Delivery</strong>!'
                  : `Add <strong>${formatINR(summary.amountToFreeShipping)}</strong> more for <strong>Free Pan-India Express Delivery</strong>!`}
              </span>
            </div>
            <span class="font-spec-numeral font-bold text-primary whitespace-nowrap">${formatINR(summary.subtotal)} / ₹1,499</span>
          </div>
          <div class="w-full bg-white/70 h-2 rounded-full overflow-hidden">
            <div class="bg-secondary h-full rounded-full transition-all duration-500" style="width: ${summary.shippingProgress}%;"></div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-label-sm text-xs uppercase tracking-wider text-secondary font-bold">Apothecary Dispatch Batch</p>
            <h1 class="font-headline-md text-2xl sm:text-3xl text-primary font-bold">Your Studio Bag (${summary.itemsCount})</h1>
          </div>
          <span class="font-spec-numeral text-xs px-3 py-1 rounded-full bg-surface-container-high text-primary font-semibold whitespace-nowrap">Batch #VK-4409</span>
        </div>

        ${summary.cart.length === 0 ? `
          <div class="ram-card p-10 text-center flex flex-col items-center gap-3.5 bg-white">
            <div class="relative w-24 h-24 flex items-center justify-center lottie-anim-float">
              <div class="absolute inset-0 rounded-full bg-[#d4af37]/15 lottie-anim-pulse blur-md pointer-events-none"></div>
              <svg class="w-full h-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Studio bag empty">
                <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 6" class="lottie-anim-spin" opacity="0.6" />
                <path d="M30 38 L34 82 C34 85 37 88 40 88 H60 C63 88 66 85 66 82 L70 38 Z" fill="#fcf9f5" stroke="#0f172a" stroke-width="2" />
                <path d="M38 38 C38 24 62 24 62 38" stroke="#d4af37" stroke-width="2" stroke-linecap="round" fill="none" />
                <polygon points="50,46 52,50 56,52 52,54 50,58 48,54 44,52 48,50" fill="#9e3322" />
                <circle cx="74" cy="30" r="2.5" fill="#d4af37" />
                <circle cx="26" cy="68" r="2" fill="#d4af37" opacity="0.7" />
              </svg>
            </div>
            <h2 class="font-headline-sm text-xl text-primary font-bold">Your Studio Bag is Empty</h2>
            <p class="text-xs text-on-surface-variant max-w-sm">Explore our preserved bridal keepsakes, ocean serving boards, or optical 3:1 &amp; 2:1 epoxy systems.</p>
            <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs cursor-pointer">Browse Catalogue</button>
          </div>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left Column: Cart Line Items (7 cols) -->
            <div class="lg:col-span-7 flex flex-col gap-4">
              ${summary.cart.map(item => {
                const effectiveUnit = Store.getEffectiveUnitPrice(item);
                const isTierDiscounted = effectiveUnit < item.price;
                return `
                <div class="ram-card p-3 sm:p-4 bg-white flex flex-col gap-3 min-w-0" data-cart-item-id="${esc(item.cartItemId)}">
                  <div class="flex gap-2.5 sm:gap-4 min-w-0">
                    <img src="${esc(item.image)}" alt="${esc(item.name)}" onclick="window.navigateTo('product', '${esc(item.productId)}')" class="w-16 h-16 sm:w-24 sm:h-24 rounded-xl object-cover bg-surface-container shrink-0 cursor-pointer border border-[#e4e0d8]">
                    <div class="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-1.5">
                          <h2 onclick="window.navigateTo('product', '${esc(item.productId)}')" class="font-title-md text-xs min-[360px]:text-sm sm:text-base text-primary font-bold line-clamp-2 cursor-pointer hover:text-secondary break-words">${esc(item.name)}</h2>
                          <button type="button" aria-label="Remove item" onclick="window.handleCartRemove('${esc(item.cartItemId)}')" class="w-11 h-11 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-low flex items-center justify-center shrink-0 cursor-pointer">
                            <span class="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                          </button>
                        </div>
                        <p class="text-xs text-on-surface-variant break-words">${esc(item.variantLabel)} • SKU: ${esc(item.sku)}</p>
                        ${(item.color || item.shape || item.size) ? `
                          <div class="flex flex-wrap items-center gap-1.5 my-1 text-[11px]">
                            ${item.color ? `<span class="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold border border-[#e4e0d8]">🎨 ${esc(item.color)}</span>` : ''}
                            ${item.shape ? `<span class="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold border border-[#e4e0d8]">📐 ${esc(item.shape)}</span>` : ''}
                            ${item.size ? `<span class="px-2 py-0.5 rounded-full bg-secondary-container/50 text-secondary font-bold border border-[#e4e0d8]">📏 ${esc(item.size)}</span>` : ''}
                          </div>
                        ` : ''}
                        ${item.customNote ? `<p class="text-[11px] text-[#9e3322] font-medium mt-1 break-anywhere">✨ Note: “${esc(item.customNote)}”</p>` : ''}
                      </div>
                      <div class="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mt-2">
                        <span class="font-spec-numeral text-sm sm:text-base font-bold text-primary" data-line-total="${effectiveUnit * item.qty}">${formatINR(effectiveUnit * item.qty)}</span>
                        <span class="font-spec-numeral text-[11px] sm:text-xs text-outline">(${formatINR(effectiveUnit)} / unit)</span>
                        ${isTierDiscounted ? `<span class="px-2 py-0.5 rounded-full bg-secondary-container/60 text-secondary font-label-sm text-[10px] font-bold">Volume Tier Applied</span>` : ''}
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container">
                    <div class="flex items-center bg-surface-container-low rounded-lg p-1 border border-[#e4e0d8]">
                      <button type="button" aria-label="Decrease quantity" onclick="window.handleCartQty('${esc(item.cartItemId)}', -1)" class="w-11 h-11 rounded-md bg-white text-primary flex items-center justify-center font-bold hover:bg-surface-container cursor-pointer">
                        <span class="material-symbols-outlined text-sm" aria-hidden="true">remove</span>
                      </button>
                      <span class="font-spec-numeral text-xs font-bold px-3 text-primary">${item.qty}</span>
                      <button type="button" aria-label="Increase quantity" onclick="window.handleCartQty('${esc(item.cartItemId)}', 1)" class="w-11 h-11 rounded-md bg-white text-primary flex items-center justify-center font-bold hover:bg-surface-container cursor-pointer">
                        <span class="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                      </button>
                    </div>
                    <button type="button" onclick="window.handleSaveForLater('${esc(item.cartItemId)}', '${esc(item.productId)}')" class="min-h-[44px] px-3 rounded-lg text-xs text-secondary font-semibold hover:bg-surface-container-low flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-sm" aria-hidden="true">bookmark_add</span>
                      <span>Save for later</span>
                    </button>
                  </div>
                </div>
              `;}).join('')}

              <!-- Pincode Dispatch Indicator Card -->
              <div class="ram-card p-3.5 sm:p-4 bg-white flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-3 min-w-0">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-xl" aria-hidden="true">pin_drop</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs sm:text-sm font-bold text-primary truncate">Delivering to PIN ${esc(pinInfo.pin)} (${esc(pinInfo.city)})</p>
                    <p class="text-xs text-on-surface-variant truncate">${esc(pinInfo.courier)} • Guaranteed in ${esc(pinInfo.days)}</p>
                  </div>
                </div>
                <button type="button" onclick="window.promptChangePincode()" class="min-h-[44px] px-3 rounded-lg text-xs font-bold text-secondary underline whitespace-nowrap shrink-0 cursor-pointer">Change PIN</button>
              </div>

              <!-- B2B GST Input Tax Credit (18%) Box -->
              <div class="ram-card p-4 bg-white flex flex-col gap-3 min-w-0">
                <label class="flex items-start gap-3 cursor-pointer min-h-[44px]">
                  <input type="checkbox" ${gstInfo.enabled ? 'checked' : ''} onchange="window.toggleGstClaim(this.checked)" class="mt-1 w-5 h-5 accent-primary rounded shrink-0">
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-bold text-primary flex items-center gap-1.5 flex-wrap">
                      <span>Claim GST Input Tax Credit (18% ITC)</span>
                      <span class="material-symbols-outlined text-sm text-secondary" aria-hidden="true">verified_user</span>
                    </span>
                    <p class="text-xs text-on-surface-variant break-words">Receive an automated B2B tax invoice with HSN 39073010 for registered studios.</p>
                  </div>
                </label>
                <div id="cart-gst-fields" class="${gstInfo.enabled ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-surface-container">
                  <div>
                    <label for="cart-gstin-input" class="text-[11px] text-on-surface-variant font-medium block mb-1">GSTIN (15-Character ID)</label>
                    <input id="cart-gstin-input" type="text" maxlength="15" value="${esc(gstInfo.gstin)}" onchange="window.saveGstField()" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm uppercase text-primary">
                  </div>
                  <div>
                    <label for="cart-tradename-input" class="text-[11px] text-on-surface-variant font-medium block mb-1">Registered Legal Studio / Entity Name</label>
                    <input id="cart-tradename-input" type="text" value="${esc(gstInfo.tradeName)}" onchange="window.saveGstField()" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-sm text-primary">
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Voucher + Single Unified Invoice Summary (5 cols) -->
            <div class="lg:col-span-5 flex flex-col gap-4 sticky top-24 min-w-0">
              <!-- Voucher Box -->
              <div class="ram-card p-4 bg-white flex flex-col gap-2.5 min-w-0">
                <label for="cart-coupon-input" class="text-sm font-bold text-primary">Studio Voucher or Instagram Promo Code</label>
                <form class="flex flex-col min-[360px]:flex-row gap-2" onsubmit="event.preventDefault(); window.handleApplyCoupon();">
                  <input id="cart-coupon-input" type="text" value="${esc(summary.couponCode || summary.savedCouponCode)}" placeholder="Enter code (e.g. KRAFTFIRST)" class="flex-1 min-w-0 h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-sm uppercase text-primary">
                  <button type="submit" class="px-5 h-12 rounded-lg bg-primary text-white text-xs font-bold shrink-0 cursor-pointer">APPLY</button>
                </form>
                <div class="flex flex-wrap gap-2 pt-1">
                  ${Object.values(Store.COUPONS).map(c => `
                    <button type="button" onclick="window.quickSelectCoupon('${c.code}')" class="min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-spec-numeral font-semibold border transition-colors cursor-pointer ${summary.couponCode === c.code ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-primary border-[#e4e0d8] hover:border-secondary'}">
                      ${c.code}
                    </button>
                  `).join('')}
                </div>
                ${summary.couponDiscount > 0 ? `
                  <div class="flex items-center gap-1.5 text-[#266b4e] text-xs font-semibold pt-1">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">check_circle</span>
                    <span>Code <strong>${esc(summary.couponCode)}</strong> active — ${formatINR(summary.couponDiscount)} saved!</span>
                  </div>
                ` : (summary.couponInvalidReason ? `
                  <div id="cart-coupon-warning" class="flex items-start gap-1.5 text-[#704600] bg-[#fff5e0] p-2.5 rounded-lg text-xs font-medium mt-1">
                    <span class="material-symbols-outlined text-sm shrink-0 mt-0.5" aria-hidden="true">info</span>
                    <span>${esc(summary.couponInvalidReason)}</span>
                  </div>
                ` : '')}
              </div>

              <!-- SINGLE Clean Invoice Summary (Fixed Duplicate Bug from Stitch Raw HTML) -->
              <div id="order-invoice-summary" class="ram-card p-5 bg-white flex flex-col gap-3">
                <h2 class="font-headline-sm text-lg text-primary font-bold border-b border-surface-container pb-2">Invoice Summary</h2>
                <div class="flex justify-between items-center text-xs sm:text-sm text-on-surface-variant">
                  <span>Cart Subtotal (${summary.itemsCount} items)</span>
                  <span class="font-spec-numeral font-bold text-primary">${formatINR(summary.subtotal)}</span>
                </div>
                ${summary.couponDiscount > 0 ? `
                  <div class="flex justify-between items-center text-xs sm:text-sm text-[#266b4e] font-medium">
                    <span>Studio Voucher (${esc(summary.couponCode)})</span>
                    <span class="font-spec-numeral font-bold">-${formatINR(summary.couponDiscount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between items-center text-xs sm:text-sm text-on-surface-variant">
                  <span>Express Air Logistics</span>
                  <span class="font-spec-numeral font-bold ${summary.isFreeShipping ? 'text-[#266b4e]' : 'text-primary'}">
                    ${summary.isFreeShipping ? 'FREE' : formatINR(summary.shippingFee)}
                  </span>
                </div>
                <div class="flex justify-between items-center text-xs text-outline">
                  <span>Includes ₹${summary.gstAmount.toFixed(2)} GST (18%)</span>
                  <span>${gstInfo.enabled ? 'Eligible 18% ITC' : 'Tax Inclusive'}</span>
                </div>
                <div class="pt-3 mt-1 border-t border-surface-container flex justify-between items-baseline bg-surface-container-low p-3.5 rounded-xl">
                  <div>
                    <span class="font-headline-sm text-base text-primary font-bold block">Total Payable</span>
                    <span class="text-[11px] text-on-surface-variant">Zero hidden charges at dispatch</span>
                  </div>
                  <span class="font-spec-numeral text-2xl font-bold text-primary">${formatINR(summary.payable)}</span>
                </div>

                <button type="button" onclick="window.openCheckoutModal()" class="btn-shimmer w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-md text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer">
                  <span>Proceed to Secure Checkout • ${formatINR(summary.payable)}</span>
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
                </button>

                <p class="text-[11px] text-center text-on-surface-variant pt-1">
                  🔒 100% Encrypted via <strong>Razorpay Payment Gateway</strong> • UPI, Cards, NetBanking &amp; COD
                </p>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  // =========================================================================
  // 8. CUSTOMER ACCOUNT, ORDER TRACKER, MOCKUP APPROVAL & CARE VAULT
  // =========================================================================
  function renderAccountView() {
    const allOrders = Store.getOrders();
    const filteredOrders = Store.findOrder(AppState.orderSearchQuery);
    const profile = Store.getPatronProfile();
    const gstInfo = Store.getGstInfo();
    const isAuth = typeof Store.isAuthenticated === 'function' ? Store.isAuthenticated() : false;
    const auth = (typeof Store.getAuthSession === 'function' && Store.getAuthSession()) || {};

    return `
      <div class="route-view-enter flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 gap-6">
        <!-- Back Navigation Button -->
        <div class="flex items-center">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Storefront</span>
          </button>
        </div>

        <!-- Patron Profile & Account Banner -->
        <div class="ram-card p-5 bg-white flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0">
            <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <img src="${esc(Store.IMAGES.logoVistara)}" alt="Vistāra Krafts Patron Emblem" class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover ring-2 ring-secondary shrink-0">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold uppercase truncate">${esc(profile.memberTier || 'Atelier Patron')}</span>
                  <span class="px-2.5 py-0.5 rounded-full ${isAuth ? 'bg-[#e8f5e9] text-[#266b4e]' : 'bg-[#ffe4de] text-[#9e3322]'} font-spec-numeral text-[10px] font-bold shrink-0">
                    ${isAuth ? `Verified (${esc(String(auth.provider || 'email').toUpperCase())})` : 'Guest Session • Sign In to Order'}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-spec-numeral text-[10px] font-bold shrink-0">${Number(profile.loyaltyPoints || 250)} Krafts Credits</span>
                </div>
                <h1 class="font-headline-sm text-base sm:text-2xl text-primary font-bold mt-0.5 break-words">${esc(isAuth && auth.name ? auth.name : profile.name)} — Studio Account &amp; Order Tracker</h1>
                <p class="text-xs text-on-surface-variant break-words">${esc([isAuth && auth.phone ? auth.phone : profile.phone, isAuth && auth.email ? auth.email : profile.email, gstInfo.gstin ? `GSTIN: ${gstInfo.gstin}` : ''].filter(Boolean).join(' • ') || 'Sign in with Google, Apple, or Email to sync your wishlist and orders')}</p>
                <p class="text-[11px] text-on-surface-variant break-words mt-0.5">📍 Default Dispatch: ${esc((isAuth && auth.address) || profile.defaultAddress || 'Will be collected at checkout')}</p>
              </div>
            </div>
            <div class="flex flex-col min-[380px]:flex-row flex-wrap items-stretch min-[380px]:items-center gap-2 w-full sm:w-auto shrink-0">
              ${isAuth ? `
                <button type="button" onclick="window.handlePatronLogout()" class="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#fdf6f3] border border-[#9e3322]/30 text-[#9e3322] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">logout</span>
                  <span>Sign Out</span>
                </button>
              ` : `
                <button type="button" onclick="window.openCloudflareAuthModal(false)" class="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">login</span>
                  <span>Sign In (Google / Apple / Email)</span>
                </button>
              `}
              <button type="button" id="account-edit-profile-btn" onclick="window.toggleAccountProfileEdit()" class="flex-1 min-[380px]:flex-initial min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-[#e4e0d8] text-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-base text-secondary" aria-hidden="true">edit</span>
                <span>${AppState.editingAccountProfile ? 'Close Editor' : 'Edit Profile & Address'}</span>
              </button>
              <button type="button" onclick="window.navigateTo('custom-studio')" class="flex-1 min-[380px]:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-[#9e3322] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                <span class="material-symbols-outlined text-base" aria-hidden="true">local_florist</span>
                <span>New Booking</span>
              </button>
            </div>
          </div>

          ${AppState.editingAccountProfile ? `
            <form id="account-profile-form" onsubmit="window.saveAccountProfile(event)" class="pt-4 border-t border-surface-container grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="acc-prof-name" class="text-xs font-bold text-primary block mb-1">Full Name</label>
                <input id="acc-prof-name" type="text" required value="${esc(isAuth ? (auth.name || profile.name) : '')}" placeholder="Enter your full name" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
              </div>
              <div>
                <label for="acc-prof-phone" class="text-xs font-bold text-primary block mb-1">WhatsApp / Mobile Number</label>
                <input id="acc-prof-phone" type="tel" required value="${esc(isAuth ? (auth.phone || profile.phone) : '')}" placeholder="+91 98765 43210" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] font-spec-numeral text-xs text-primary">
              </div>
              <div>
                <label for="acc-prof-email" class="text-xs font-bold text-primary block mb-1">Email Address (for COA &amp; GST Invoices)</label>
                <input id="acc-prof-email" type="email" required value="${esc(isAuth ? (auth.email || profile.email) : '')}" placeholder="you@example.com" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
              </div>
              <div>
                <label for="acc-prof-address" class="text-xs font-bold text-primary block mb-1">Default Delivery &amp; Flower Pickup Address</label>
                <input id="acc-prof-address" type="text" required value="${esc(isAuth ? (auth.address || profile.defaultAddress) : '')}" placeholder="Street address, City &amp; 6-digit PIN" class="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-[#e4e0d8] text-xs text-primary">
              </div>
              <div class="sm:col-span-2 flex justify-end gap-2 pt-1">
                <button type="submit" class="min-h-[48px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer">Save Patron Details</button>
              </div>
            </form>
          ` : ''}
        </div>

        <!-- Live Orders & 5-Stage Floral Preservation Tracker -->
        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="font-label-sm text-xs uppercase tracking-wider text-secondary font-bold">Real-Time Atelier Telemetry</span>
              <h2 class="font-headline-sm text-xl text-primary font-bold">Active Orders &amp; Varmala Preservation Timeline (${filteredOrders.length} of ${allOrders.length})</h2>
            </div>
            <div class="w-full sm:w-80">
              <label for="account-order-search" class="sr-only">Search orders by Order ID, item, or courier</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined text-base text-outline absolute left-3 pointer-events-none" aria-hidden="true">search</span>
                <input id="account-order-search" type="search" value="${esc(AppState.orderSearchQuery)}" oninput="window.setAccountOrderSearch(this.value)" placeholder="Filter by Order #VK, item, or courier..." class="w-full h-12 pl-9 pr-3 rounded-xl bg-white border border-[#e4e0d8] text-xs text-primary">
              </div>
            </div>
          </div>

          ${filteredOrders.length === 0 ? `
            <div class="ram-card p-10 bg-white text-center flex flex-col items-center gap-3.5">
              <div class="relative w-24 h-24 flex items-center justify-center lottie-anim-float">
                <div class="absolute inset-0 rounded-full bg-[#d4af37]/15 lottie-anim-pulse blur-md pointer-events-none"></div>
                <svg class="w-full h-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No studio orders">
                  <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 6" class="lottie-anim-spin" opacity="0.6" />
                  <rect x="25" y="30" width="50" height="42" rx="4" fill="#fcf9f5" stroke="#0f172a" stroke-width="2" />
                  <line x1="25" y1="51" x2="75" y2="51" stroke="#d4af37" stroke-width="1.5" />
                  <line x1="50" y1="30" x2="50" y2="72" stroke="#d4af37" stroke-width="1.5" />
                  <circle cx="50" cy="51" r="7" fill="#9e3322" stroke="#d4af37" stroke-width="1.5" />
                  <polygon points="50,48 51,51 54,51 52,53 53,56 50,54 47,56 48,53 46,51 49,51" fill="#fff" />
                  <circle cx="72" cy="24" r="2.5" fill="#d4af37" />
                </svg>
              </div>
              <h3 class="font-headline-sm text-lg text-primary font-bold">${allOrders.length === 0 ? 'No Studio Orders Placed Yet' : 'No Matching Orders Found'}</h3>
              <p class="text-xs text-on-surface-variant max-w-md">${allOrders.length === 0 ? 'Your order history and floral preservation timelines will appear here once you place your first order.' : 'Try clearing your order search filter or search with a different Order #VK ID.'}</p>
              ${allOrders.length === 0 ? `
                <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold mt-1 shadow-xs cursor-pointer">Browse Catalogue to Place Your First Order</button>
              ` : `
                <button type="button" onclick="window.setAccountOrderSearch('')" class="min-h-[48px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold mt-1 shadow-xs cursor-pointer">Show All Orders</button>
              `}
            </div>
          ` : filteredOrders.map(ord => `
            <div class="ram-card p-5 bg-white flex flex-col gap-4" data-order-id="${esc(ord.orderId)}">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container pb-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-spec-numeral text-xs font-bold text-secondary">ORDER #${esc(ord.orderId)}</span>
                    ${ord.giftWrap ? `<span class="px-2 py-0.5 rounded-full bg-[#fdf6f3] border border-[#9e3322]/30 text-[#9e3322] text-[10px] font-bold">🎁 Silk Potli Gift Wrap</span>` : ''}
                  </div>
                  <h3 class="text-sm font-bold text-primary mt-0.5">${esc(ord.status)}</h3>
                  <p class="text-xs text-on-surface-variant">Placed on ${esc(ord.date)} • ${esc(ord.courier)} • ${esc(ord.paymentMethod || 'UPI Instant')}</p>
                </div>
                <div class="text-right">
                  <span class="font-spec-numeral text-lg font-bold text-primary">${formatINR(ord.total)}</span>
                  <span class="block text-[11px] text-[#266b4e] font-semibold">18% GST Invoice Ready</span>
                </div>
              </div>

              <!-- 5-Stage Progress Stepper -->
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
                ${(ord.stages || []).map((st, idx) => {
                  const done = idx <= (ord.stageIndex || 1);
                  return `
                    <div class="p-2.5 rounded-xl border ${done ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-on-surface-variant border-[#e4e0d8]'} flex items-center gap-2">
                      <span class="material-symbols-outlined text-base ${done ? 'text-[#ffd79b]' : 'text-outline'}" aria-hidden="true">${done ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <span class="text-[11px] font-semibold leading-tight">${esc(st)}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Pre-Pour Digital Layout Mockup Approval Banner -->
              <div class="p-3.5 rounded-xl ${ord.mockupApproved ? 'bg-[#e8f5e9] border border-[#266b4e]/30' : 'bg-[#fdf6f3] border border-[#9e3322]/30'} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg ${ord.mockupApproved ? 'text-[#266b4e]' : 'text-[#9e3322]'} shrink-0 mt-0.5" aria-hidden="true">${ord.mockupApproved ? 'verified' : 'photo_library'}</span>
                  <div>
                    <p class="text-xs font-bold text-primary">
                      ${ord.mockupApproved
                        ? 'Pre-Pour Floral Arrangement & Batch Spec Approved'
                        : 'Action Available: Pre-Pour Digital Floral Layout & Batch Verification'}
                    </p>
                    <p class="text-[11px] text-on-surface-variant">
                      ${ord.mockupApproved
                        ? 'Your layout approval is locked in. Our senior resin artist has initiated the multi-layer optical pour.'
                        : 'Confirm your floral petal positioning and calligraphy proof so our studio can proceed to the final crystal resin pour.'}
                    </p>
                  </div>
                </div>
                ${ord.mockupApproved ? `
                  <span class="px-3 py-1.5 rounded-lg bg-white text-[#266b4e] text-xs font-bold shrink-0 self-start sm:self-center">✓ Layout Approved</span>
                ` : `
                  <button type="button" onclick="window.handleApproveOrderMockup('${esc(ord.orderId)}')" class="min-h-[44px] px-4 py-2 rounded-lg bg-[#9e3322] hover:opacity-95 text-white text-xs font-bold shrink-0 self-start sm:self-center cursor-pointer">
                    Approve Pre-Pour Layout
                  </button>
                `}
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div class="text-xs text-on-surface-variant flex flex-wrap gap-2">
                  ${(ord.items || []).map(it => `
                    <div class="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-primary font-medium flex flex-col gap-0.5 border border-[#e4e0d8]/80">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold">${it.qty}×</span>
                        <span>${esc(it.name)}</span>
                        ${it.variantLabel ? `<span class="text-on-surface-variant text-[11px]">(${esc(it.variantLabel)})</span>` : ''}
                      </div>
                      ${(it.color || it.shape || it.size) ? `
                        <div class="flex items-center gap-1.5 flex-wrap text-[10px] text-on-surface-variant font-semibold">
                          ${it.color ? `<span class="px-1.5 py-0.5 rounded bg-white border border-[#e4e0d8]">🎨 ${esc(it.color)}</span>` : ''}
                          ${it.shape ? `<span class="px-1.5 py-0.5 rounded bg-white border border-[#e4e0d8]">📐 ${esc(it.shape)}</span>` : ''}
                          ${it.size ? `<span class="px-1.5 py-0.5 rounded bg-secondary-container/50 text-secondary border border-[#e4e0d8]">📏 ${esc(it.size)}</span>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
                <div class="flex flex-wrap items-center gap-2 shrink-0">
                  <button type="button" onclick="window.openOrderInvoiceModal('${esc(ord.orderId)}')" class="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-[#e4e0d8] text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-sm text-secondary" aria-hidden="true">receipt_long</span>
                    <span>View GST Tax Invoice</span>
                  </button>
                  <button type="button" onclick="window.handleReorder('${esc(ord.orderId)}')" class="min-h-[44px] px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-sm" aria-hidden="true">replay</span>
                    <span>Reorder to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Customer Bridal Flower Packing & Resin Care Vault -->
        <div class="ram-card p-5 bg-surface-container-low border border-[#e4e0d8] flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span class="font-label-sm text-[11px] uppercase tracking-widest text-[#9e3322] font-bold">Atelier Patron Care Handbook</span>
              <h2 class="font-headline-sm text-lg text-primary font-bold">Bridal Varmala Packing &amp; Heirloom Care Guide</h2>
              <p class="text-xs text-on-surface-variant">Follow these studio guidelines to keep your wedding flowers vibrant before pickup and your cured resin crystal-clear for decades.</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-[#e8f5e9] text-[#266b4e] text-xs font-bold self-start whitespace-nowrap">✓ Museum Preservation Standard</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl bg-white border border-[#e4e0d8] flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">1. Pre-Pickup Flower Storage</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ffe4de] text-[#9e3322]">First 48 Hours</span>
              </div>
              <p class="text-[11px] text-on-surface-variant">Place your varmala or bouquet in the normal refrigerator section (4°C–8°C). Never freeze petals, as ice crystals bruise floral pigments.</p>
              <p class="text-[11px] text-on-surface-variant">Wrap only the cut stems in a lightly damp tissue and keep petals completely dry.</p>
            </div>

            <div class="p-4 rounded-xl bg-white border border-[#e4e0d8] flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">2. Breathable Transit Carton</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container">Air Pickup Ready</span>
              </div>
              <p class="text-[11px] text-on-surface-variant">Line a corrugated cardboard box with plain newspaper or soft cotton cloth. Avoid airtight plastic bags which trap moisture and cause mould in transit.</p>
              <p class="text-[11px] text-on-surface-variant">Include your wedding invite card, rings, or auspicious threads in a labelled paper envelope inside the box.</p>
            </div>

            <div class="p-4 rounded-xl bg-white border border-[#e4e0d8] flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">3. Long-Term Resin Heirloom Care</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">10+ Year Clarity</span>
              </div>
              <p class="text-[11px] text-on-surface-variant">Wipe your cured resin block or ocean board with a soft microfiber cloth and mild soap water. Never use acetone, alcohol, or abrasive scrubbers.</p>
              <p class="text-[11px] text-on-surface-variant">Display indoors away from direct harsh afternoon window sunlight to preserve botanical colour saturation.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // DYNAMIC SEO, GEO & AEO (SCHEMA.ORG JSON-LD @GRAPH) CONTROLLER
  // =========================================================================
  let lastSeoSnapshot = null;

  function setMetaTagValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const strVal = String(value ?? '');
    el.content = strVal;
    if (typeof el.setAttribute === 'function') {
      el.setAttribute('content', strVal);
    }
  }

  function setLinkTagHref(id, hrefValue) {
    const el = document.getElementById(id);
    if (!el) return;
    const strHref = String(hrefValue ?? '');
    el.href = strHref;
    if (typeof el.setAttribute === 'function') {
      el.setAttribute('href', strHref);
    }
  }

  function buildDynamicSchemaGraph(seoCfg, routeMeta, activeProduct, activeVariant) {
    const siteUrl = seoCfg.siteUrl;
    const allProducts = (Store && typeof Store.getProducts === 'function') ? Store.getProducts() : [];

    const orgNode = {
      '@type': ['Organization', 'OnlineStore', 'LocalBusiness'],
      '@id': `${siteUrl}/#organization`,
      name: 'Vistāra Krafts × Resin Art Memories',
      alternateName: ['Vistara Krafts', 'Resin Art Memories', '@resin.art.memories', 'Vistāra Krafts Studio'],
      legalName: 'Vistāra Krafts Studio India',
      url: `${siteUrl}/`,
      logo: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/#logo`,
        url: `${siteUrl}/vistara-krafts-logo.jpg`,
        contentUrl: `${siteUrl}/vistara-krafts-logo.jpg`,
        width: 512,
        height: 512,
        caption: 'Vistāra Krafts × Resin Art Memories (@resin.art.memories) Official Studio Emblem'
      },
      image: `${siteUrl}/vistara-krafts-logo.jpg`,
      description: seoCfg.defaultDescription,
      email: 'concierge@vistarakrafts.in',
      telephone: '+91-80-4890-7210',
      priceRange: '₹299 - ₹12,999',
      currenciesAccepted: 'INR',
      paymentAccepted: 'UPI, Google Pay, PhonePe, Paytm, Credit Card, Debit Card, NetBanking, Cash on Delivery (COD)',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '42 Craft Enclave, Indiranagar 100 Feet Road',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        postalCode: seoCfg.geo.postalCode || '560001',
        addressCountry: seoCfg.geo.country || 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: seoCfg.geo.latitude || 12.9716,
        longitude: seoCfg.geo.longitude || 77.5946
      },
      areaServed: [
        'IN',
        { '@type': 'Country', name: 'India' },
        { '@type': 'City', name: 'Bengaluru' },
        { '@type': 'City', name: 'Mumbai' },
        { '@type': 'City', name: 'New Delhi' },
        { '@type': 'City', name: 'Hyderabad' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'City', name: 'Pune' },
        { '@type': 'City', name: 'Kolkata' },
        { '@type': 'City', name: 'Ahmedabad' },
        { '@type': 'City', name: 'Jaipur' }
      ],
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        '@id': `${siteUrl}/#return-policy`,
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      },
      sameAs: [
        'https://www.instagram.com/resin.art.memories?utm_source=qr',
        'https://www.instagram.com/resin.art.memories',
        seoCfg.futureCustomDomain || 'https://vistarakrafts.in'
      ]
    };

    const websiteNode = {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: 'Vistāra Krafts (@resin.art.memories) — Epoxy Resin & Bridal Keepsake Studio',
      inLanguage: 'en-IN',
      publisher: { '@id': `${siteUrl}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/#/catalog?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };

    const webPageNode = {
      '@type': routeMeta.pageSchemaType || 'WebPage',
      '@id': `${routeMeta.canonicalUrl}#webpage`,
      url: routeMeta.canonicalUrl,
      name: routeMeta.title,
      description: routeMeta.description,
      inLanguage: 'en-IN',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['meta[name="description"]', 'h1', 'h2']
      }
    };

    const breadcrumbNode = {
      '@type': 'BreadcrumbList',
      '@id': `${routeMeta.canonicalUrl}#breadcrumb`,
      itemListElement: routeMeta.breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };

    const normalizeImageUrl = (rawImg) => {
      const str = String(rawImg || '').trim();
      if (!str) return `${siteUrl}/vistara-krafts-logo.jpg`;
      if (/^https?:\/\//i.test(str) || str.startsWith('data:')) return str;
      return `${siteUrl}/${str.replace(/^\/+/, '')}`;
    };

    const mapProductToSchema = (prod, isPrimaryActive) => {
      const specsObj = (prod.specs && typeof prod.specs === 'object') ? prod.specs : {};
      const specsList = [
        { '@type': 'PropertyValue', name: 'Mix Ratio by Weight', value: String(specsObj.mixRatioWeight || prod.ratio || 'Custom Studio') },
        { '@type': 'PropertyValue', name: 'Dynamic Viscosity', value: String(specsObj.viscosity || prod.viscosity || 'Studio Tuned') },
        { '@type': 'PropertyValue', name: 'Max Single Pour Depth', value: String(specsObj.maxDepth || prod.pourDepth || 'Up to 50mm') },
        { '@type': 'PropertyValue', name: 'Full Glass Cure', value: String(specsObj.fullCure || prod.cureTime || '24 hrs') },
        { '@type': 'PropertyValue', name: 'HSN Code', value: String(specsObj.hsnCode || '39073010 (18% GST)') }
      ];
      Object.entries(specsObj).forEach(([k, v]) => {
        if (!['mixRatioWeight', 'viscosity', 'maxDepth', 'fullCure', 'hsnCode'].includes(k)) {
          specsList.push({
            '@type': 'PropertyValue',
            name: k,
            value: String(v)
          });
        }
      });

      const prodReviews = (AppState.reviews && AppState.reviews[prod.id]) || [];
      const schemaReviews = prodReviews.length > 0
        ? prodReviews.map(r => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: String(r.author || 'Verified Patron').trim() },
            reviewRating: { '@type': 'Rating', ratingValue: String(r.rating || 5), bestRating: '5' },
            reviewBody: String(r.text || '')
          }))
        : [
            {
              '@type': 'Review',
              author: { '@type': 'Person', name: 'Verified Vistāra Patron' },
              reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
              reviewBody: `${prod.name} delivered optical-grade clarity and zero micro-bubbles in Indian studio conditions.`
            }
          ];

      const selectedPrice = Number((isPrimaryActive && activeVariant && activeVariant.price) ? activeVariant.price : (prod.price || 1299));
      const shippingFeeValue = selectedPrice >= 1499 ? '0' : '99';
      const skuVal = prod.sku || `VK-${String(prod.id).toUpperCase()}`;

      const productSchema = {
        '@type': 'Product',
        '@id': `${siteUrl}/#/product/${prod.id}${isPrimaryActive ? '#active-product' : '#product'}`,
        productID: prod.id,
        sku: skuVal,
        mpn: skuVal,
        name: isPrimaryActive && activeVariant ? `${prod.name} (${activeVariant.label})` : prod.name,
        description: prod.subtitle || `${prod.name} — Handcrafted by Vistāra Krafts × Resin Art Memories (@resin.art.memories).`,
        image: normalizeImageUrl(prod.image),
        url: `${siteUrl}/#/product/${prod.id}`,
        category: prod.category || 'keepsakes',
        brand: {
          '@type': 'Brand',
          name: String(prod.id).startsWith('ram-')
            ? 'Resin Art Memories (@resin.art.memories)'
            : (String(prod.id).startsWith('potry-') ? 'Potry × Vistāra Krafts' : 'Vistāra Krafts')
        },
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/#/product/${prod.id}`,
          priceCurrency: 'INR',
          price: String(selectedPrice),
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: prod.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@id': `${siteUrl}/#organization` },
          hasMerchantReturnPolicy: { '@id': `${siteUrl}/#return-policy` },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: shippingFeeValue, currency: 'INR' },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' }
            }
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(prod.rating || 4.9),
          reviewCount: String(prod.reviewsCount || 120),
          bestRating: '5',
          worstRating: '1'
        },
        review: schemaReviews,
        additionalProperty: specsList
      };

      return productSchema;
    };

    const itemListNode = {
      '@type': 'ItemList',
      '@id': `${siteUrl}/#catalog-list`,
      name: 'Vistāra Krafts × Resin Art Memories Complete Product Catalogue',
      numberOfItems: allProducts.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: allProducts.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: mapProductToSchema(p, false)
      }))
    };

    const faqNode = {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I preserve my wedding varmala or bridal bouquet in epoxy resin across India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Book a commission on the Vistāra Krafts Custom Bridal Studio (#/custom-studio). Keep your flowers in a refrigerator (4°C–8°C, never frozen) wrapped in breathable paper. Vistāra Krafts arranges free doorstep BlueDart Priority Air flower pickup across 28,000+ Indian PIN codes, performs 7-day silica gel chromatic dehydration, and casts your flowers in 50mm museum-grade HALS UV-stabilized 2:1 deep-pour epoxy.'
          }
        },
        {
          '@type': 'Question',
          name: 'How much epoxy resin do I need for my mould dimensions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Multiply Length (cm) × Width (cm) × Depth (cm) for rectangular moulds (or π × r² × Depth for circular moulds) to find volume in cm³, then multiply by 1.1 g/cm³ epoxy density. For 3:1 Casting Resin, split total weight into 75% Part A Resin and 25% Part B Hardener. For 2:1 Deep Pour Epoxy, split into 66.7% Part A and 33.3% Part B. For 1:1 Art Doming Resin, split 50% Part A and 50% Part B.'
          }
        },
        {
          '@type': 'Question',
          name: 'Which epoxy resin is best for deep river tables vs coasters and ocean trays?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use River Flow 2:1 Deep Pour Epoxy (SKU: VK-EPX-201-3KG) for pours between 20mm and 50mm such as live-edge river tables and bridal floral blocks. Use UltraClear 3:1 Casting Resin (SKU: VK-EPX-301-12K) for 5mm to 20mm casts, and High-Gloss 1:1 Art & Doming Resin (SKU: VK-HG-11-500) for high-gloss surface coats and ocean wave lacing.'
          }
        },
        {
          '@type': 'Question',
          name: 'Does Vistāra Krafts epoxy resin turn yellow in Indian sunlight and humidity?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Every Vistāra Krafts epoxy resin formulation is engineered with dual HALS (Hindered Amine Light Stabilizers) and benzotriazole UV absorbers, plus tropical moisture-resistant cycloaliphatic hardeners rated for up to 85% relative humidity in Indian coastal and monsoon climates.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do you provide GST tax invoices, Cash on Delivery (COD), and express shipping in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Every order includes an official 18% GST Tax Invoice (HSN 39073010 for epoxy resins) for B2B input tax credit. Orders above ₹1,499 qualify for free express shipping via BlueDart and Delhivery across 28,000+ Indian PIN codes, with UPI, Card, and Cash on Delivery (COD) available.'
          }
        }
      ]
    };

    const howToVarmalaNode = {
      '@type': 'HowTo',
      '@id': `${siteUrl}/#howto-varmala-preservation`,
      name: 'How to Preserve a Wedding Varmala or Bridal Bouquet in Museum-Grade Epoxy Resin',
      description: '5-stage archival floral preservation protocol by Vistāra Krafts × @resin.art.memories.',
      totalTime: 'P21D',
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'INR', value: '2999' },
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Chilled Flower Care & Air Pickup', text: 'Refrigerate garlands at 4°C–8°C in breathable newspaper and schedule free BlueDart Priority Air pickup.' },
        { '@type': 'HowToStep', position: 2, name: '7-Day Silica Gel Chromatic Dehydration', text: 'Submerge petals in fine optical silica crystals to lock in natural crimson, pastel, and ivory pigments.' },
        { '@type': 'HowToStep', position: 3, name: 'Bespoke Layout & WhatsApp Mockup Approval', text: 'Approve the 1:1 floral arrangement, 24K gold leaf accents, and custom calligraphy tag before pouring.' },
        { '@type': 'HowToStep', position: 4, name: 'Vacuum-Degassed Multi-Layer 2:1 Deep Pour', text: 'Cast in 12mm thermal-controlled stages up to 50mm depth inside a dust-free cleanroom.' },
        { '@type': 'HowToStep', position: 5, name: '5000-Grit Diamond Polish & Insured Delivery', text: 'Wet-sand, buff to optical refraction, and ship via insured air courier across India.' }
      ]
    };

    const howToMixingNode = {
      '@type': 'HowTo',
      '@id': `${siteUrl}/#howto-epoxy-mixing`,
      name: 'How to Measure, Mix, and Pour 3:1 & 2:1 Crystal Epoxy Resin Without Bubbles',
      description: 'Studio protocol for achieving glass-clear, bubble-free epoxy resin casts in Indian ambient temperatures (24°C–30°C).',
      totalTime: 'PT45M',
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'INR', value: '1299' },
      supply: [
        { '@type': 'HowToSupply', name: 'Vistāra Krafts UltraClear 3:1 or River Flow 2:1 Epoxy Resin Kit' },
        { '@type': 'HowToSupply', name: 'Chameleon Aurora Mica Pigment or Ocean Paste' }
      ],
      tool: [
        { '@type': 'HowToTool', name: 'Digital Precision Gram Scale (0.1g accuracy)' },
        { '@type': 'HowToTool', name: 'Silicone Mixing Spatula & Graduated Cup' },
        { '@type': 'HowToTool', name: 'Butane Micro-Torch or Heat Gun' }
      ],
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Weigh Part A & Part B on Digital Gram Scale', text: 'Tare your mixing cup on a digital scale. Pour 3 parts Part A Resin to 1 part Part B Hardener by weight (or 2:1 for Deep Pour) — never measure weight-ratio systems by volume.' },
        { '@type': 'HowToStep', position: 2, name: 'Slow Fold Mixing for 4 Minutes', text: 'Stir slowly in one direction for 3 to 4 minutes, scraping the cup walls and bottom stick to eliminate unmixed striations without whipping air into the resin.' },
        { '@type': 'HowToStep', position: 3, name: '5-Minute Degas Rest & Pour', text: 'Let the mixed cup sit for 5 minutes so micro-bubbles rise, then pour in a thin laminar stream into your levelled silicone mold.' },
        { '@type': 'HowToStep', position: 4, name: 'Surface Torch Pass & Dust Cover', text: 'Pass a warm heat gun or micro-torch 15cm above the surface for 2 seconds to pop surface tension bubbles, then cover with a dust dome for 24–72 hours.' }
      ]
    };

    const graph = [orgNode, websiteNode, webPageNode, breadcrumbNode];
    if (activeProduct) {
      graph.push(mapProductToSchema(activeProduct, true));
    }
    graph.push(itemListNode, faqNode, howToVarmalaNode, howToMixingNode);

    return {
      '@context': 'https://schema.org',
      '@graph': graph
    };
  }

  // =========================================================================
  // 9. CUSTOM 404 NOT FOUND VIEW (Reliable UX for Non-Technical Users)
  // =========================================================================
  function render404View() {
    return `
      <div class="route-view-enter flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16 text-center gap-6">
        <!-- Back Navigation Button -->
        <div class="self-start">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Previous Page</span>
          </button>
        </div>

        <!-- Lottie-Style Animated Kinetic SVG: Preserved Floral Botanical Crystal Specimen -->
        <div class="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-[#d4af37]/15 lottie-anim-pulse blur-xl pointer-events-none"></div>
          <svg class="w-full h-full drop-shadow-md lottie-anim-float" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated missing specimen illustration">
            <ellipse cx="100" cy="100" rx="84" ry="32" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 6" opacity="0.6" class="lottie-anim-spin" />
            <polygon points="100,28 152,70 140,148 100,172 60,148 48,70" fill="#fcf9f5" stroke="#0f172a" stroke-width="2" />
            <polygon points="100,28 152,70 100,105" fill="#f4efe6" stroke="#0f172a" stroke-width="1.2" opacity="0.8" />
            <polygon points="100,28 48,70 100,105" fill="#ede5d8" stroke="#0f172a" stroke-width="1.2" opacity="0.8" />
            <polygon points="48,70 60,148 100,105" fill="#e2d7c5" stroke="#0f172a" stroke-width="1.2" opacity="0.7" />
            <polygon points="152,70 140,148 100,105" fill="#dbcdb8" stroke="#0f172a" stroke-width="1.2" opacity="0.7" />
            <polygon points="60,148 100,172 100,105" fill="#d0bfab" stroke="#0f172a" stroke-width="1.2" opacity="0.85" />
            <polygon points="140,148 100,172 100,105" fill="#c4b09b" stroke="#0f172a" stroke-width="1.2" opacity="0.85" />
            <circle cx="100" cy="98" r="8" fill="#9e3322" opacity="0.9" />
            <circle cx="94" cy="94" r="5" fill="#d4af37" opacity="0.8" />
            <circle cx="106" cy="94" r="5" fill="#d4af37" opacity="0.8" />
            <circle cx="100" cy="88" r="5" fill="#d4af37" opacity="0.8" />
            <path d="M100 106 Q98 126 100 142" stroke="#266b4e" stroke-width="1.5" stroke-linecap="round" />
            <polygon points="160,42 163,48 169,51 163,54 160,60 157,54 151,51 157,48" fill="#d4af37" />
            <circle cx="45" cy="120" r="2.5" fill="#d4af37" />
            <circle cx="155" cy="130" r="3" fill="#9e3322" opacity="0.7" />
          </svg>
        </div>

        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">error_outline</span>
          <span>HTTP 404 • Page Not Found</span>
        </div>

        <div class="space-y-3 max-w-xl">
          <h1 class="font-headline-lg font-serif text-3xl sm:text-5xl text-primary font-bold tracking-tight">
            Artisan Piece or Craft Material Not Found
          </h1>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            The keepsake, resin formulation, or atelier page you are looking for does not exist, has been moved, or the link may have a typo.
          </p>
        </div>

        <!-- Direct Search Bar -->
        <div class="w-full max-w-md my-1">
          <form onsubmit="event.preventDefault(); const q = this.querySelector('input').value; window.navigateTo('catalog', 'all'); window.setCatalogSearch(q);" class="relative flex items-center">
            <span class="material-symbols-outlined text-lg text-outline absolute left-3.5 pointer-events-none" aria-hidden="true">search</span>
            <input type="search" placeholder="Search resin formulations, varmala blocks, molds..." aria-label="Search catalogue products" class="w-full h-12 pl-10 pr-24 rounded-xl bg-white border border-[#e4e0d8] text-xs text-primary shadow-2xs focus:ring-2 focus:ring-secondary focus:border-secondary outline-none">
            <button type="submit" class="absolute right-1.5 px-3.5 h-9 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold cursor-pointer">Find</button>
          </form>
        </div>

        <!-- Quick Recovery Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button type="button" onclick="window.navigateTo('home')" class="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition shadow-xs">
            <span class="material-symbols-outlined text-base" aria-hidden="true">home</span>
            <span>Discover Home</span>
          </button>
          <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[44px] px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition shadow-xs">
            <span class="material-symbols-outlined text-base" aria-hidden="true">inventory_2</span>
            <span>Browse Full Catalogue</span>
          </button>
          <button type="button" onclick="window.navigateTo('custom-studio')" class="min-h-[44px] px-5 py-2.5 rounded-xl bg-white border border-[#e4e0d8] hover:bg-surface-container-low text-primary text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition shadow-2xs">
            <span class="material-symbols-outlined text-base text-[#9e3322]" aria-hidden="true">auto_awesome</span>
            <span>Custom Studio</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant/80 mt-2">
          Need custom floral preservation assistance? WhatsApp our artisan desk or visit <a href="https://www.instagram.com/resin.art.memories?utm_source=qr" target="_blank" rel="noopener noreferrer" class="text-[#9e3322] font-semibold underline">@resin.art.memories</a>.
        </p>
      </div>
    `;
  }

  function render500View(errorDetails = '') {
    const traceId = 'VK-ERR-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    return `
      <div class="route-view-enter flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16 text-center gap-6">
        <!-- Back Navigation Button -->
        <div class="self-start">
          <button type="button" onclick="window.handleBackButton('home')" aria-label="Go back to previous page" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary min-h-[44px] py-1 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer w-fit">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            <span>Back to Previous Page</span>
          </button>
        </div>

        <!-- Lottie-Style Animated Kinetic SVG: Optical Curing Prism & Precision Gears -->
        <div class="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-[#d4af37]/10 lottie-anim-pulse blur-xl pointer-events-none"></div>
          <svg class="w-full h-full drop-shadow-md" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated system interruption illustration">
            <circle cx="100" cy="100" r="88" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="4 8" opacity="0.45" />
            <g class="lottie-anim-spin">
              <circle cx="100" cy="100" r="64" stroke="#0f172a" stroke-width="2" stroke-dasharray="14 8" opacity="0.65" />
              <circle cx="100" cy="100" r="54" stroke="#d4af37" stroke-width="1" opacity="0.3" />
            </g>
            <g class="lottie-anim-spin-rev">
              <circle cx="100" cy="100" r="42" stroke="#9e3322" stroke-width="1.8" stroke-dasharray="10 6" opacity="0.75" />
              <polygon points="100,62 133,119 67,119" stroke="#d4af37" stroke-width="1.5" fill="none" opacity="0.5" />
            </g>
            <g class="lottie-anim-pulse">
              <polygon points="100,72 124,100 100,128 76,100" fill="#0f172a" stroke="#d4af37" stroke-width="2" />
              <line x1="76" y1="100" x2="124" y2="100" stroke="#d4af37" stroke-width="1" opacity="0.7" />
              <line x1="100" y1="72" x2="100" y2="128" stroke="#d4af37" stroke-width="1" opacity="0.7" />
            </g>
          </svg>
        </div>

        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fdf6f3] border border-[#9e3322]/20 text-[#9e3322] text-xs font-bold uppercase tracking-wider">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">precision_manufacturing</span>
          <span>HTTP 500 • Studio System Interruption</span>
        </div>

        <div class="space-y-3 max-w-xl">
          <h1 class="font-headline-lg font-serif text-3xl sm:text-5xl text-primary font-bold tracking-tight">
            Temporary Atelier System Calibration
          </h1>
          <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Our optical curing servers or cloud edge are taking a momentary breath. <strong>Your Studio Bag, items, and inputs remain safe.</strong> No orders or patron transactions were compromised.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button type="button" onclick="window.location.reload()" class="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs">
            <span class="material-symbols-outlined text-base" aria-hidden="true">refresh</span>
            <span>Retry Request</span>
          </button>
          <button type="button" onclick="window.navigateTo('catalog', 'all')" class="min-h-[48px] px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs">
            <span class="material-symbols-outlined text-base" aria-hidden="true">inventory_2</span>
            <span>Browse Catalogue</span>
          </button>
          <a href="https://wa.me/919876543210?text=Hello%20Vistara%20Krafts%20Team,%20I%20experienced%20a%20500%20server%20interruption%20on%20the%20website" target="_blank" rel="noopener noreferrer" class="min-h-[48px] px-5 py-2.5 rounded-xl bg-white border border-[#e4e0d8] hover:bg-surface-container-low text-primary text-xs font-bold inline-flex items-center gap-2 shadow-2xs">
            <span class="material-symbols-outlined text-base text-[#25D366]" aria-hidden="true">chat</span>
            <span>WhatsApp Concierge</span>
          </a>
        </div>

        <div class="p-3.5 rounded-xl bg-surface-container-low border border-[#e4e0d8] max-w-md w-full text-left flex items-start gap-3">
          <span class="material-symbols-outlined text-secondary text-base mt-0.5" aria-hidden="true">info</span>
          <div class="text-[11px] text-on-surface-variant">
            <p class="font-bold text-primary">Incident Diagnostics</p>
            <p class="font-mono mt-0.5">Trace ID: ${traceId}</p>
            <p class="mt-1">${esc(errorDetails || 'Automatic failover ready. Local cache intact.')}</p>
          </div>
        </div>
      </div>
    `;
  }
  window.render500View = render500View;


  function updateRouteSeoAndSchema() {
    if (typeof document === 'undefined') return null;
    const seoCfg = (Store && typeof Store.getSeoConfig === 'function')
      ? Store.getSeoConfig()
      : {
          siteUrl: String(window.VISTARA_SITE_URL || 'https://vistara-krafts.vercel.app').replace(/\/+$/, ''),
          futureCustomDomain: 'https://vistarakrafts.in',
          defaultTitle: 'Vistāra Krafts (@resin.art.memories) | UltraClear Epoxy Resin Systems & Bridal Varmala Preservation Studio India',
          defaultDescription: 'Official Vistāra Krafts × Resin Art Memories (@resin.art.memories) Storefront.',
          defaultKeywords: 'Vistara Krafts, Resin Art Memories, @resin.art.memories, bridal varmala preservation India, epoxy resin kit India',
          locale: 'en_IN',
          currency: 'INR',
          geo: {
            country: 'IN',
            region: 'IN-KA',
            placename: 'Bengaluru, Karnataka, India',
            postalCode: '560001',
            latitude: 12.9716,
            longitude: 77.5946,
            position: '12.9716;77.5946',
            icbm: '12.9716, 77.5946'
          }
        };

    const siteUrl = String(window.VISTARA_SITE_URL || seoCfg.siteUrl || 'https://vistara-krafts.vercel.app').replace(/\/+$/, '');
    seoCfg.siteUrl = siteUrl;

    const toAbsImageUrl = (rawImg) => {
      const str = String(rawImg || '').trim();
      if (!str) return `${siteUrl}/vistara-krafts-logo.jpg`;
      if (/^https?:\/\//i.test(str) || str.startsWith('data:')) return str;
      return `${siteUrl}/${str.replace(/^\/+/, '')}`;
    };

    const route = AppState.currentRoute || 'home';
    let routeMeta = {
      route,
      title: seoCfg.defaultTitle,
      description: seoCfg.defaultDescription,
      keywords: seoCfg.defaultKeywords,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      canonicalUrl: `${siteUrl}/`,
      ogType: 'website',
      ogImage: `${siteUrl}/vistara-krafts-logo.jpg`,
      priceAmount: '299',
      priceCurrency: 'INR',
      availability: 'instock',
      pageSchemaType: 'WebPage',
      breadcrumbs: [
        { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` }
      ]
    };

    let activeProduct = null;
    let activeVariant = null;

    if (route === 'product') {
      activeProduct = Store.getProductById(AppState.currentProductId) || (Store.getProducts && Store.getProducts()[0]);
      if (activeProduct) {
        activeVariant = (activeProduct.variants && activeProduct.variants[AppState.selectedVariantIdx]) ||
          (activeProduct.variants && activeProduct.variants[0]) ||
          { label: 'Standard Edition', price: activeProduct.price || 1299, regularPrice: activeProduct.regularPrice || activeProduct.price || 1299 };
        const priceNum = Number(activeVariant.price || activeProduct.price || 1299);
        const canonicalUrl = `${siteUrl}/#/product/${activeProduct.id}`;
        const prodName = activeProduct.name || 'Vistāra Krafts Studio Edition';
        const prodShort = activeProduct.shortName || prodName;
        const prodSku = activeProduct.sku || `VK-${String(activeProduct.id).toUpperCase()}`;
        const prodSubtitle = activeProduct.subtitle || `${prodName} — Handcrafted by Vistāra Krafts × Resin Art Memories (@resin.art.memories)`;
        const prodRatio = activeProduct.ratio || 'Custom Studio';
        const prodDepth = activeProduct.pourDepth || 'Up to 50mm';
        const prodCure = activeProduct.cureTime || '24 hrs';
        const prodPotLife = activeProduct.potLife || '45 mins';
        const prodRating = activeProduct.rating || 4.9;
        const prodReviewsCount = activeProduct.reviewsCount || 120;
        const prodCategory = activeProduct.category || 'keepsakes';
        const varLabel = activeVariant.label || 'Standard Edition';

        routeMeta = {
          route: 'product',
          productId: activeProduct.id,
          sku: prodSku,
          variantLabel: varLabel,
          title: `${prodName} (${varLabel} — ₹${priceNum.toLocaleString('en-IN')}) | Vistāra Krafts (@resin.art.memories)`,
          description: `${prodSubtitle}. SKU: ${prodSku}. Mix Ratio: ${prodRatio}, Max Pour Depth: ${prodDepth}, Cure Time: ${prodCure}, Pot Life: ${prodPotLife}. Rated ${prodRating}/5 (${prodReviewsCount} reviews). Pan-India Express Delivery.`,
          keywords: `${prodName}, ${prodShort}, ${prodSku}, ${varLabel}, ${prodCategory} epoxy resin India, Vistara Krafts, @resin.art.memories`,
          robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          canonicalUrl,
          ogType: 'product',
          ogImage: toAbsImageUrl(activeProduct.image),
          priceAmount: String(priceNum),
          priceCurrency: 'INR',
          availability: activeProduct.inStock !== false ? 'instock' : 'oos',
          pageSchemaType: 'ItemPage',
          breadcrumbs: [
            { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
            { name: 'Epoxy & Keepsake Catalogue', url: `${siteUrl}/#/catalog` },
            { name: prodShort, url: canonicalUrl }
          ]
        };
      }
    } else if (route === 'catalog') {
      const catLabel = AppState.catalogCategory && AppState.catalogCategory !== 'all'
        ? AppState.catalogCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'All Formulations & Bridal Keepsakes';
      const canonicalUrl = `${siteUrl}/#/catalog`;
      routeMeta = {
        ...routeMeta,
        title: `Shop ${catLabel} — Epoxy Resin Kits & Varmala Keepsakes | Vistāra Krafts (@resin.art.memories)`,
        description: `Browse Vistāra Krafts (${catLabel}): ASTM D-4236 certified 3:1 casting epoxy, 2:1 deep-pour river table resin, bridal varmala preservation blocks, UV resin, chameleon mica pigments & silicone geode molds with Pan-India shipping.`,
        canonicalUrl,
        pageSchemaType: 'CollectionPage',
        breadcrumbs: [
          { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
          { name: `Catalogue (${catLabel})`, url: canonicalUrl }
        ]
      };
    } else if (route === 'custom-studio') {
      const canonicalUrl = `${siteUrl}/#/custom-studio`;
      const shapePrice = (AppState.customBuilder && AppState.customBuilder.shapePrice) || 4499;
      routeMeta = {
        ...routeMeta,
        title: `Custom Bridal Varmala Preservation & Epoxy Pour Calculator Studio | Vistāra Krafts (@resin.art.memories)`,
        description: `Commission a bespoke 50mm museum-grade bridal varmala or wedding bouquet resin block with free Pan-India BlueDart air flower pickup, or calculate exact Part A + Part B epoxy resin weight with our interactive studio calculator.`,
        canonicalUrl,
        priceAmount: String(shapePrice),
        pageSchemaType: 'WebPage',
        breadcrumbs: [
          { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
          { name: 'Custom Bridal Varmala & Pour Calculator Studio', url: canonicalUrl }
        ]
      };
    } else if (route === 'social') {
      const canonicalUrl = `${siteUrl}/#/social`;
      routeMeta = {
        ...routeMeta,
        title: `@resin.art.memories Community Feed & Shoppable Studio Reels | Vistāra Krafts India`,
        description: `Explore 50,000+ community creations, bridal varmala unboxings, ocean wave charcuterie pours, and deep-pour river table tutorials from @resin.art.memories.`,
        canonicalUrl,
        priceAmount: '1299',
        pageSchemaType: 'CollectionPage',
        breadcrumbs: [
          { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
          { name: '@resin.art.memories Community Feed', url: canonicalUrl }
        ]
      };
    } else if (route === 'wishlist' || route === 'cart' || route === 'account') {
      const canonicalUrl = `${siteUrl}/#/${route}`;
      const routeLabels = {
        wishlist: 'Saved Atelier Wishlist & Studio Reels',
        cart: 'Studio Shopping Bag & Instant GST/UPI Checkout',
        account: 'Patron Concierge Account & Live Order Tracker'
      };
      routeMeta = {
        ...routeMeta,
        title: `${routeLabels[route]} | Vistāra Krafts (@resin.art.memories)`,
        description: `Manage your ${routeLabels[route]} at Vistāra Krafts × Resin Art Memories (@resin.art.memories).`,
        robots: 'noindex, follow',
        canonicalUrl,
        breadcrumbs: [
          { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
          { name: routeLabels[route], url: canonicalUrl }
        ]
      };
    } else if (route === '404') {
      const canonicalUrl = `${siteUrl}/#/404`;
      routeMeta = {
        ...routeMeta,
        title: '404 • Page Not Found | Vistāra Krafts (@resin.art.memories)',
        description: 'The artisan keepsake or craft material page you are looking for was not found. Browse our catalogue or return to home.',
        robots: 'noindex, nofollow',
        canonicalUrl,
        breadcrumbs: [
          { name: 'Vistāra Krafts Studio Home', url: `${siteUrl}/` },
          { name: '404 Not Found', url: canonicalUrl }
        ]
      };
    }

    document.title = routeMeta.title;
    setMetaTagValue('meta-title', routeMeta.title);
    setMetaTagValue('meta-description', routeMeta.description);
    setMetaTagValue('meta-keywords', routeMeta.keywords);
    setMetaTagValue('meta-robots', routeMeta.robots);
    setMetaTagValue('meta-googlebot', routeMeta.robots);
    setMetaTagValue('meta-bingbot', routeMeta.robots);

    setLinkTagHref('link-canonical', routeMeta.canonicalUrl);
    setLinkTagHref('link-hreflang-in', routeMeta.canonicalUrl);
    setLinkTagHref('link-hreflang-en', routeMeta.canonicalUrl);
    setLinkTagHref('link-hreflang-default', routeMeta.canonicalUrl);

    setMetaTagValue('og-type', routeMeta.ogType);
    setMetaTagValue('og-url', routeMeta.canonicalUrl);
    setMetaTagValue('og-title', routeMeta.title);
    setMetaTagValue('og-description', routeMeta.description);
    setMetaTagValue('og-image', routeMeta.ogImage);
    setMetaTagValue('og-price-amount', routeMeta.priceAmount);
    setMetaTagValue('og-price-currency', routeMeta.priceCurrency);
    setMetaTagValue('og-availability', routeMeta.availability);

    setMetaTagValue('twitter-url', routeMeta.canonicalUrl);
    setMetaTagValue('twitter-title', routeMeta.title);
    setMetaTagValue('twitter-description', routeMeta.description);
    setMetaTagValue('twitter-image', routeMeta.ogImage);

    const schemaJsonObj = buildDynamicSchemaGraph(seoCfg, routeMeta, activeProduct, activeVariant);
    const schemaScriptEl = document.getElementById('vistara-schema-jsonld');
    if (schemaScriptEl) {
      schemaScriptEl.textContent = JSON.stringify(schemaJsonObj);
    }

    lastSeoSnapshot = {
      ...routeMeta,
      siteUrl,
      futureCustomDomain: seoCfg.futureCustomDomain,
      geo: seoCfg.geo,
      schemaGraph: schemaJsonObj
    };
    return lastSeoSnapshot;
  }

  window.updateRouteSeoAndSchema = updateRouteSeoAndSchema;
  window.getActiveSeoSnapshot = function () {
    return lastSeoSnapshot || updateRouteSeoAndSchema();
  };

  // =========================================================================
  // MAIN VIEW MOUNT & INTERACTION HANDLERS
  // =========================================================================
  function renderActiveView(options) {
    const root = document.getElementById('app-view-root');
    if (!root) return;
    const preserveScroll = !options || !options.resetScroll;
    const prevScrollY = preserveScroll ? window.scrollY : 0;

    try {
      switch (AppState.currentRoute) {
        case 'catalog':
          root.innerHTML = renderCatalogView();
          break;
        case 'product':
          root.innerHTML = renderPdpView();
          break;
        case 'social':
          root.innerHTML = renderSocialView();
          break;
        case 'custom-studio':
          root.innerHTML = renderCustomStudioView();
          break;
        case 'wishlist':
          root.innerHTML = renderWishlistView();
          break;
        case 'cart':
          root.innerHTML = renderCartView();
          break;
        case 'account':
          root.innerHTML = renderAccountView();
          break;
        case '404':
          root.innerHTML = render404View();
          break;
        case '500':
          root.innerHTML = render500View();
          break;
        case 'home':
        default:
          root.innerHTML = renderHomeView();
          break;
      }
    } catch (routeErr) {
      console.error('Fatal route render exception caught:', routeErr);
      root.innerHTML = render500View(routeErr?.message || 'Unexpected application render failure');
    }

    updateRouteSeoAndSchema();

    try {
      initSotdInteractions();
    } catch (_e) {}

    if (preserveScroll && prevScrollY > 0) {
      try {
        window.scrollTo({ top: prevScrollY, left: 0, behavior: 'instant' });
      } catch (_e) {
        window.scrollTo(0, prevScrollY);
      }
    } else if (!preserveScroll) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_e) {
        window.scrollTo(0, 0);
      }
    }
  }

  // Interactive Controllers Exposed to Window
  window.handleQuickAdd = function (btnEl, productId) {
    const product = Store.getProductById(productId);
    if (!product) return;
    if (product.inStock === false) {
      window.showToast('Item Out of Stock', 'This studio piece is currently unavailable.');
      return;
    }
    const varState = AppState.cardVarieties[productId] || { colorIdx: 0, shapeIdx: 0, sizeIdx: 0 };
    const colors = product.colors || [];
    const shapes = product.shapes || [];
    const sizes = product.sizes || [];
    const chosenColor = colors.length ? (colors[varState.colorIdx] || colors[0]) : null;
    const chosenShape = shapes.length ? (shapes[varState.shapeIdx] || shapes[0]) : null;
    const chosenSize = sizes.length ? (sizes[varState.sizeIdx] || sizes[0]) : null;
    const sizeDelta = chosenSize ? (chosenSize.priceDelta || 0) : 0;
    const finalPrice = product.price + sizeDelta;

    Store.addToCart({
      productId: product.id,
      name: product.name,
      variantLabel: product.variants && product.variants[0] ? product.variants[0].label : 'Standard Edition',
      color: chosenColor ? (chosenColor.label || chosenColor) : '',
      shape: chosenShape ? (chosenShape.label || chosenShape) : '',
      size: chosenSize ? (chosenSize.label || chosenSize) : '',
      price: finalPrice,
      regularPrice: product.regularPrice + sizeDelta,
      qty: 1,
      image: product.image,
      sku: product.sku
    });
    updateGlobalBadges();
    const quickSubtitle = [chosenColor ? (chosenColor.label || chosenColor) : '', formatINR(finalPrice)].filter(Boolean).join(' • ');
    window.showToast(`Added "${product.shortName || product.name}" to Bag`, quickSubtitle);

    if (btnEl) {
      sotdResinRipple({ currentTarget: btnEl });
      if (!btnEl.dataset.origHtml) {
        btnEl.dataset.origHtml = btnEl.innerHTML;
      }
      if (btnEl._quickAddTimer) {
        clearTimeout(btnEl._quickAddTimer);
      }
      btnEl.innerHTML = '<span class="material-symbols-outlined text-sm" aria-hidden="true">check</span><span>Added!</span>';
      btnEl.classList.add('bg-secondary');
      btnEl._quickAddTimer = setTimeout(() => {
        btnEl.innerHTML = btnEl.dataset.origHtml;
        btnEl.classList.remove('bg-secondary');
        btnEl._quickAddTimer = null;
      }, 1200);
    }
  };

  window.toggleProductVariety = function (productId, ev) {
    if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
    if (!AppState.cardVarieties[productId]) {
      AppState.cardVarieties[productId] = { colorIdx: 0, shapeIdx: 0, sizeIdx: 0, open: false };
    }
    const currentOpen = Boolean(AppState.cardVarieties[productId].open);
    AppState.cardVarieties[productId].open = !currentOpen;
    const drawer = document.getElementById(`variety-drawer-${productId}`);
    if (drawer) {
      drawer.classList.toggle('open', !currentOpen);
    }
    const btn = ev?.currentTarget || document.querySelector(`[onclick*="toggleProductVariety('${productId}'"]`);
    if (btn) {
      btn.setAttribute('aria-expanded', !currentOpen ? 'true' : 'false');
      const arrow = btn.querySelector('.material-symbols-outlined:last-child');
      if (arrow) arrow.classList.toggle('rotate-180', !currentOpen);
      const textSpan = btn.querySelector('span > span:last-child');
      if (textSpan) textSpan.textContent = !currentOpen ? 'Hide Varieties' : 'Select Variety (Color • Shape • Size)';
    }
  };

  window.selectCardVariety = function (productId, type, index, ev) {
    if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
    if (!AppState.cardVarieties[productId]) {
      AppState.cardVarieties[productId] = { colorIdx: 0, shapeIdx: 0, sizeIdx: 0, open: true };
    }
    if (type === 'color') AppState.cardVarieties[productId].colorIdx = index;
    if (type === 'shape') AppState.cardVarieties[productId].shapeIdx = index;
    if (type === 'size') AppState.cardVarieties[productId].sizeIdx = index;

    const prod = Store.getProductById(productId);
    if (!prod) return;
    const colors = prod.colors || [];
    const shapes = prod.shapes || [];
    const sizes = prod.sizes || [];

    const varState = AppState.cardVarieties[productId];
    const currentColor = colors[varState.colorIdx] || colors[0];
    const currentShape = shapes[varState.shapeIdx] || shapes[0];
    const currentSize = sizes[varState.sizeIdx] || sizes[0];
    const activePrice = prod.price + (currentSize?.priceDelta || 0);

    // Update labels and buttons inside drawer
    const colorLabel = document.getElementById(`var-color-label-${productId}`);
    if (colorLabel && currentColor) colorLabel.textContent = currentColor.label;
    const shapeLabel = document.getElementById(`var-shape-label-${productId}`);
    if (shapeLabel && currentShape) shapeLabel.textContent = currentShape.label;
    const sizeLabel = document.getElementById(`var-size-label-${productId}`);
    if (sizeLabel && currentSize) sizeLabel.textContent = currentSize.label;
    const ctaText = document.getElementById(`var-cta-text-${productId}`);
    if (ctaText) ctaText.textContent = `Add Selected Variety • ${formatINR(activePrice)}`;

    const cardPrice = document.getElementById(`card-price-${productId}`);
    if (cardPrice) cardPrice.textContent = formatINR(activePrice);

    // Update active swatch/chip borders
    const drawer = document.getElementById(`variety-drawer-${productId}`);
    if (drawer) {
      if (type === 'color') {
        const swatches = drawer.querySelectorAll('.variety-swatch');
        swatches.forEach((sw, idx) => {
          const isActive = idx === index;
          sw.classList.toggle('active', isActive);
          sw.classList.toggle('ring-2', isActive);
          sw.classList.toggle('ring-primary', isActive);
          sw.classList.toggle('scale-110', isActive);
          sw.innerHTML = isActive ? '<span class="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold drop-shadow">✓</span>' : '';
        });
      } else if (type === 'shape') {
        const shapeEl = drawer.querySelector(`#var-shape-label-${productId}`);
        const sContainer = shapeEl && typeof shapeEl.closest === 'function' ? shapeEl.closest('.flex-col') : null;
        if (sContainer) {
          sContainer.querySelectorAll('.variety-chip').forEach((ch, idx) => {
            const isActive = idx === index;
            ch.className = `variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${isActive ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container-low'}`;
          });
        }
      } else if (type === 'size') {
        const sizeEl = drawer.querySelector(`#var-size-label-${productId}`);
        const szContainer = sizeEl && typeof sizeEl.closest === 'function' ? sizeEl.closest('.flex-col') : null;
        if (szContainer) {
          szContainer.querySelectorAll('.variety-chip').forEach((ch, idx) => {
            const isActive = idx === index;
            ch.className = `variety-chip px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${isActive ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-[#e4e0d8] hover:bg-surface-container-low'}`;
          });
        }
      }
    }
  };

  window.addCustomVarietyToCart = function (productId) {
    const prod = Store.getProductById(productId);
    if (!prod) return;
    if (prod.inStock === false) {
      window.showToast('Item Out of Stock', 'This studio piece is currently unavailable.');
      return;
    }
    const varState = AppState.cardVarieties[productId] || { colorIdx: 0, shapeIdx: 0, sizeIdx: 0 };
    const colors = prod.colors || [];
    const shapes = prod.shapes || [];
    const sizes = prod.sizes || [];

    const chosenColor = colors.length ? (colors[varState.colorIdx] || colors[0]) : null;
    const chosenShape = shapes.length ? (shapes[varState.shapeIdx] || shapes[0]) : null;
    const chosenSize = sizes.length ? (sizes[varState.sizeIdx] || sizes[0]) : null;
    const finalPrice = prod.price + (chosenSize?.priceDelta || 0);

    const varietyParts = [
      prod.variants && prod.variants[0] ? prod.variants[0].label : 'Standard Edition',
      chosenShape ? (chosenShape.label || chosenShape) : null,
      chosenSize ? `(${chosenSize.label || chosenSize})` : null
    ].filter(Boolean);

    Store.addToCart({
      productId: prod.id,
      name: prod.name,
      variantLabel: varietyParts.join(' • '),
      color: chosenColor ? (chosenColor.label || chosenColor) : '',
      shape: chosenShape ? (chosenShape.label || chosenShape) : '',
      size: chosenSize ? (chosenSize.label || chosenSize) : '',
      price: finalPrice,
      regularPrice: prod.regularPrice + (chosenSize?.priceDelta || 0),
      qty: 1,
      image: prod.image,
      sku: prod.sku
    });
    updateGlobalBadges();
    const customSummary = [
      chosenShape ? (chosenShape.label || chosenShape) : null,
      chosenSize ? (chosenSize.label || chosenSize) : null,
      formatINR(finalPrice)
    ].filter(Boolean).join(' • ');
    window.showToast(
      `Added ${prod.shortName || prod.name}${chosenColor ? ' (' + (chosenColor.label || chosenColor) + ')' : ''}`,
      customSummary
    );
  };

  window.selectPdpVariety = function (type, index) {
    if (type === 'color') AppState.pdpSelectedColorIdx = index;
    if (type === 'shape') AppState.pdpSelectedShapeIdx = index;
    if (type === 'size') AppState.pdpSelectedSizeIdx = index;
    renderActiveView({ preserveScroll: true });
  };

  window.setFeedPersona = function (persona) {
    let target = persona;
    if (AppState.feedPersona === persona && persona !== 'all') {
      target = 'all';
    }
    const valid = ['all', 'masculine', 'feminine'].includes(target) ? target : 'all';
    AppState.feedPersona = valid;
    if (typeof Store.setPersonaPreference === 'function') {
      Store.setPersonaPreference(valid);
    }
    const label = valid === 'masculine' ? '👔 Gifts for Him' : (valid === 'feminine' ? '🌸 Gifts for Her' : 'Curated Studio Collections');
    window.showToast(`Feed Curated: ${label}`, 'Catalogue order adjusted to your preferred aesthetic & gifting style.');
    renderActiveView({ preserveScroll: false });
  };

  window.setAuthPersona = function (persona) {
    let target = persona;
    const curVal = document.getElementById('cf-auth-selected-persona')?.value;
    if (curVal === persona && persona !== 'all') {
      target = 'all';
    }
    const valid = ['all', 'masculine', 'feminine'].includes(target) ? target : 'all';
    const hiddenInput = document.getElementById('cf-auth-selected-persona');
    if (hiddenInput) hiddenInput.value = valid;
    ['masculine', 'feminine'].forEach(p => {
      const btn = document.getElementById(`cf-persona-btn-${p}`);
      if (!btn) return;
      if (p === valid) {
        btn.className = 'min-h-[44px] h-11 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border-2 border-primary bg-primary text-white cursor-pointer shadow-xs';
      } else {
        btn.className = 'min-h-[44px] h-11 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#e4e0d8] bg-white text-primary hover:border-secondary hover:bg-surface-container-low cursor-pointer';
      }
    });
    if (Store && typeof Store.setPersonaPreference === 'function') {
      Store.setPersonaPreference(valid);
    }
    AppState.feedPersona = valid;
  };

  window.handleWishlistToggle = function (ev, productId) {
    if (ev) ev.stopPropagation();
    const btnTarget = ev ? (ev.currentTarget || ev.target) : null;
    const res = Store.toggleWishlist(productId);
    const product = Store.getProductById(productId);
    updateGlobalBadges();
    renderActiveView();
    if (res.added && btnTarget) {
      sotdHeartBurst(btnTarget);
    }
    window.showToast(
      res.added ? 'Saved to Atelier Wishlist' : 'Removed from Wishlist',
      product ? product.shortName || product.name : ''
    );
  };

  window.selectPersonaGoal = function (goal) {
    AppState.quizAnswers.goal = goal;
    renderActiveView();
  };

  window.submitHomePincode = function () {
    const input = document.getElementById('home-pincode-input');
    const msgEl = document.getElementById('home-pincode-msg');
    const resBox = document.getElementById('home-pincode-result');
    if (!input || !msgEl) return;
    const res = Store.verifyPincode(input.value);
    updateGlobalBadges();
    const iconEl = resBox ? resBox.querySelector('.material-symbols-outlined') : null;
    if (!res.valid) {
      if (iconEl) {
        iconEl.textContent = 'error';
        iconEl.classList.remove('text-[#266b4e]');
        iconEl.classList.add('text-error');
      }
      msgEl.innerHTML = `<span class="text-error font-semibold">${esc(res.message)}</span>`;
      window.showToast('Invalid PIN Code', res.message);
    } else {
      if (iconEl) {
        iconEl.textContent = 'check_circle';
        iconEl.classList.remove('text-error');
        iconEl.classList.add('text-[#266b4e]');
      }
      msgEl.innerHTML = `<strong>PIN ${esc(res.pin)} (${esc(res.city)})</strong> — Express Delivery in <strong>${esc(res.days)}</strong> via ${esc(res.courier)}. Doorstep Floral Pickup &amp; COD active.`;
      window.showToast(`PIN ${res.pin} Serviceable!`, `${res.city} • ${res.courier}`);
    }
  };

  window.runHomeCalculator = function () {
    const l = parseFloat(document.getElementById('home-calc-len')?.value);
    const w = parseFloat(document.getElementById('home-calc-wid')?.value);
    const d = parseFloat(document.getElementById('home-calc-dep')?.value);
    const sys = document.getElementById('home-calc-sys')?.value || '3:1';

    const res = Store.calculateResinNeeded({ shape: 'rect', lengthCm: l, widthCm: w, depthCm: d, ratioSystem: sys });
    const out = document.getElementById('home-calc-output');

    if (!res.valid) {
      if (out) {
        out.textContent = 'Please enter positive dimensions (> 0 cm) to calculate resin mass.';
      }
      window.showToast('Invalid Dimensions', 'Length, width, and depth must be greater than 0 cm.');
      return;
    }

    AppState.calcLength = l;
    AppState.calcWidth = w;
    AppState.calcDepth = d;
    AppState.calcSystem = sys;

    if (out) {
      out.textContent = `~${res.totalGrams}g total (Part A: ${res.partAGrams}g + Part B: ${res.partBGrams}g) for ${l}×${w}×${d}cm`;
    }
    window.showToast(`Calculated: ~${res.totalGrams}g Required`, `Part A: ${res.partAGrams}g Resin + Part B: ${res.partBGrams}g Hardener`);
  };

  window.setStudioCalcShape = function (shape) {
    AppState.calcShape = shape === 'circle' ? 'circle' : 'rect';
    renderActiveView();
  };

  window.runStudioCalculator = function () {
    const d = parseFloat(document.getElementById('studio-calc-dep')?.value);
    const sys = document.getElementById('studio-calc-sys')?.value || AppState.calcSystem || '3:1';
    let l = AppState.calcLength;
    let w = AppState.calcWidth;
    let diam = AppState.calcDiameter;

    if (AppState.calcShape === 'circle') {
      diam = parseFloat(document.getElementById('studio-calc-diam')?.value);
    } else {
      l = parseFloat(document.getElementById('studio-calc-len')?.value);
      w = parseFloat(document.getElementById('studio-calc-wid')?.value);
    }

    const res = Store.calculateResinNeeded({
      shape: AppState.calcShape,
      lengthCm: l,
      widthCm: w,
      diameterCm: diam,
      depthCm: d,
      ratioSystem: sys
    });

    const out = document.getElementById('studio-calc-result');
    if (!res.valid) {
      if (out) out.textContent = 'Please enter positive dimensions (> 0 cm) to calculate resin mass.';
      window.showToast('Invalid Dimensions', 'All mould dimensions must be greater than 0 cm.');
      return;
    }

    if (AppState.calcShape === 'circle') {
      AppState.calcDiameter = diam;
    } else {
      AppState.calcLength = l;
      AppState.calcWidth = w;
    }
    AppState.calcDepth = d;
    AppState.calcSystem = sys;

    renderActiveView();
    window.showToast(`Calculated: ~${res.totalGrams}g Required`, `Part A: ${res.partAGrams}g + Part B: ${res.partBGrams}g (${sys})`);
  };

  window.addRecommendedCalcKitToCart = function () {
    const recommendedProdId = AppState.calcSystem === '2:1' ? 'vk-epx-201' : (AppState.calcSystem === '1:1' ? 'vk-res-003' : 'vk-epx-301');
    const prod = Store.getProductById(recommendedProdId);
    if (!prod) return;
    Store.addToCart(prod.id, null, 1);
    updateGlobalBadges();
    window.showToast(`Added ${prod.shortName || prod.name} to Bag`, 'Recommended for your calculated pour');
  };

  function syncGlobalFilterDrawerDom() {
    const drawer = document.getElementById('global-filter-drawer');
    if (!drawer) return;
    drawer.querySelectorAll('button[onclick^="window.setCatalogRatio"]').forEach(btn => {
      const match = (btn.getAttribute('onclick') || '').match(/'([^']+)'/);
      const btnRatio = match ? match[1] : '';
      if (btnRatio === AppState.catalogRatioFilter) {
        btn.className = 'min-h-[44px] py-2.5 rounded-lg bg-primary text-white font-spec-numeral text-xs font-semibold cursor-pointer';
      } else {
        btn.className = 'min-h-[44px] py-2.5 rounded-lg bg-surface-container-low text-primary font-spec-numeral text-xs font-semibold border border-[#e4e0d8] cursor-pointer';
      }
    });
    const rangeInput = drawer.querySelector('input[type="range"]');
    if (rangeInput) rangeInput.value = String(AppState.catalogMaxPrice);
    const labelEl = document.getElementById('drawer-price-label');
    if (labelEl) labelEl.textContent = 'Up to ' + formatINR(AppState.catalogMaxPrice);
  }

  // Catalog handlers
  window.setCatalogCategory = function (cat) {
    AppState.catalogCategory = cat;
    AppState.catalogVisibleCount = 8;
    renderActiveView();
  };

  window.setCatalogSearch = function (val) {
    AppState.catalogSearch = val;
    renderActiveView();
    const input = document.getElementById('catalog-search-input');
    if (input) {
      if (typeof input.focus === 'function') input.focus();
      if (typeof input.setSelectionRange === 'function') input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  window.setCatalogSort = function (sortVal) {
    AppState.catalogSort = sortVal;
    renderActiveView();
  };

  window.setCatalogView = function (viewMode) {
    AppState.catalogView = viewMode;
    renderActiveView();
  };

  window.setCatalogRatio = function (ratio) {
    AppState.catalogRatioFilter = ratio;
    syncGlobalFilterDrawerDom();
    renderActiveView();
  };

  window.setCatalogMaxPrice = function (price) {
    AppState.catalogMaxPrice = Number(price) || 12000;
    syncGlobalFilterDrawerDom();
    renderActiveView();
  };

  window.resetCatalogFilters = function () {
    AppState.catalogCategory = 'all';
    AppState.catalogSearch = '';
    AppState.catalogSort = 'popular';
    AppState.catalogRatioFilter = 'all';
    AppState.catalogMaxPrice = 12000;
    AppState.catalogVisibleCount = 12;
    syncGlobalFilterDrawerDom();
    renderActiveView();
    window.toggleCatalogFilterDrawer(false);
  };

  window.loadMoreCatalog = function () {
    AppState.catalogVisibleCount += 8;
    renderActiveView();
  };

  window.toggleCatalogFilterDrawer = function (show) {
    const drawer = document.getElementById('global-filter-drawer');
    if (!drawer) return;
    syncGlobalFilterDrawerDom();
    drawer.classList.toggle('hidden', !show);
    syncBodyModalLock();
  };

  // PDP handlers
  window.selectPdpGallery = function (idx) {
    AppState.pdpGalleryIdx = idx;
    renderActiveView();
  };

  window.selectPdpVariant = function (idx) {
    AppState.selectedVariantIdx = idx;
    renderActiveView();
    const prod = Store.getProductById(AppState.currentProductId);
    const v = prod && prod.variants && prod.variants[idx];
    if (v) window.showToast(`Selected ${v.label}`, `${formatINR(v.price)} • ${v.unitPrice || 'Studio Edition'}`);
  };

  window.setPdpCustomNote = function (val) {
    AppState.pdpCustomNote = val;
  };

  window.changePdpQty = function (delta) {
    AppState.pdpQty = Math.max(1, Math.min(50, AppState.pdpQty + delta));
    renderActiveView();
  };

  window.addPdpToCart = function () {
    const prod = Store.getProductById(AppState.currentProductId);
    if (!prod) return;
    if (prod.inStock === false) {
      window.showToast('Item Out of Stock', 'This studio piece is currently unavailable.');
      return;
    }
    const v = (prod.variants && prod.variants[AppState.selectedVariantIdx]) || {
      label: 'Standard Edition',
      price: prod.price,
      regularPrice: prod.regularPrice
    };

    const colors = (prod.colors || []).map((c, i) => (typeof c === 'string' ? { id: 'c' + i, label: c } : c));
    const shapes = (prod.shapes || []).map((s, i) => (typeof s === 'string' ? { id: 's' + i, label: s } : s));
    const sizes = (prod.sizes || []).map((sz, i) => (typeof sz === 'string' ? { id: 'sz' + i, label: sz, priceDelta: 0 } : sz));
    const activeColor = colors.length > 0 ? (colors[AppState.pdpSelectedColorIdx] || colors[0]) : null;
    const activeShape = shapes.length > 0 ? (shapes[AppState.pdpSelectedShapeIdx] || shapes[0]) : null;
    const activeSize = sizes.length > 0 ? (sizes[AppState.pdpSelectedSizeIdx] || sizes[0]) : null;
    const sizeDelta = activeSize?.priceDelta || 0;
    const finalPrice = v.price + sizeDelta;

    const varietyParts = [v.label, activeShape?.label, activeSize?.label ? `(${activeSize.label})` : ''].filter(Boolean);

    Store.addToCart({
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      variantLabel: varietyParts.join(' • '),
      color: activeColor ? activeColor.label : '',
      shape: activeShape ? activeShape.label : '',
      size: activeSize ? activeSize.label : '',
      price: finalPrice,
      regularPrice: (v.regularPrice || v.price) + sizeDelta,
      qty: AppState.pdpQty,
      image: prod.image,
      customNote: AppState.pdpCustomNote
    });
    updateGlobalBadges();
    const detailSubtitle = [activeColor?.label, activeShape?.label, activeSize?.label ? `(${activeSize.label})` : ''].filter(Boolean).join(' • ');
    window.showToast(
      `Added ${AppState.pdpQty} × ${prod.shortName || prod.name} to Bag`,
      detailSubtitle ? `${detailSubtitle} • Ready for checkout` : 'Ready for checkout'
    );
  };

  window.buyNowPdp = function () {
    const prod = Store.getProductById(AppState.currentProductId);
    if (!prod || prod.inStock === false) {
      window.showToast('Item Out of Stock', 'This studio piece is currently unavailable.');
      return;
    }
    window.addPdpToCart();
    window.navigateTo('cart');
    window.openCheckoutModal();
  };

  window.addStudioBundle = function () {
    Store.addToCart({ productId: 'vk-epx-301', variantLabel: '1.2kg Kit (Bundle)', price: 1149, regularPrice: 1299, qty: 1 });
    Store.addToCart({ productId: 'vk-mld-geo', variantLabel: 'Set of 4 Geode Molds (Bundle)', price: 399, regularPrice: 449, qty: 1 });
    Store.addToCart({ productId: 'vk-pig-cham', variantLabel: '12 Shades Mica Set (Bundle)', price: 750, regularPrice: 899, qty: 1 });
    updateGlobalBadges();
    window.showToast('Added 3-Piece Studio Bundle to Bag!', 'Saved ₹349 on combo');
  };

  window.verifyPdpPincode = function () {
    const val = document.getElementById('pdp-pincode-input')?.value;
    const res = Store.verifyPincode(val);
    updateGlobalBadges();
    const box = document.getElementById('pdp-pincode-result');
    if (box) {
      if (!res.valid) {
        box.innerHTML = `<span class="material-symbols-outlined text-error text-base shrink-0 mt-0.5" aria-hidden="true">error</span><span class="text-error font-semibold">${esc(res.message)}</span>`;
      } else {
        box.innerHTML = `<span class="material-symbols-outlined text-[#266b4e] text-base shrink-0 mt-0.5" aria-hidden="true">verified_user</span><span><strong>${esc(res.pin)} (${esc(res.city)})</strong> — Delivery in <strong>${esc(res.days)}</strong> via ${esc(res.courier)}. COD &amp; UPI available.</span>`;
      }
    }
  };

  window.toggleReviewForm = function () {
    const form = document.getElementById('pdp-review-form');
    if (form) form.classList.toggle('hidden');
  };

  window.submitPdpReview = function (productId) {
    const author = document.getElementById('rev-author')?.value.trim();
    const rating = parseInt(document.getElementById('rev-rating')?.value || '5', 10);
    const text = document.getElementById('rev-text')?.value.trim();
    if (!author || !text) return;

    if (!AppState.reviews[productId]) AppState.reviews[productId] = [];
    AppState.reviews[productId].unshift({
      author,
      rating,
      date: 'Just now',
      verified: true,
      text
    });
    renderActiveView();
    window.showToast('Thank you for your review!', 'Published to verified studio feed');
  };

  window.shareCurrentProduct = function (productId) {
    const prod = Store.getProductById(productId);
    const shareUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    window.showToast('Link Copied to Clipboard!', `${prod.name} (@resin.art.memories)`);
  };

  // Social Feed Handlers
  window.setSocialTagFilter = function (tag) {
    AppState.socialTagFilter = tag;
    renderActiveView();
  };

  window.handleSocialLike = function (postId) {
    const updated = Store.toggleLikePost(postId);
    renderActiveView();
    if (updated && updated.liked) {
      window.showToast('Liked @resin.art.memories Reel ❤️', `${updated.likes.toLocaleString('en-IN')} likes`);
    }
  };

  window.handleSocialSave = function (postId) {
    const updated = Store.toggleSavePost(postId);
    renderActiveView();
    window.showToast(updated && updated.saved ? 'Post Saved to Bookmarks' : 'Removed from Bookmarks');
  };

  window.handleSocialComment = function (postId, formEl) {
    const input = formEl.querySelector('input[name="commentText"]');
    if (!input || !input.value.trim()) return;
    Store.addComment(postId, '@studio.patron', input.value.trim());
    input.value = '';
    renderActiveView();
    window.showToast('Comment Posted!', 'Shared on @resin.art.memories community wall');
  };

  // Custom Studio Builder Handlers
  window.updateCustomBuilder = function (field, label, priceVal) {
    if (field === 'shape') {
      AppState.customBuilder.shape = label;
      AppState.customBuilder.shapePrice = Number(priceVal);
    } else if (field === 'flowerSource') {
      AppState.customBuilder.flowerSource = label;
      AppState.customBuilder.sourceAddon = Number(priceVal);
    } else if (field === 'metallic') {
      AppState.customBuilder.metallic = label;
      AppState.customBuilder.metallicAddon = Number(priceVal);
    } else if (field === 'secondaryKeepsake') {
      AppState.customBuilder.secondaryKeepsake = label;
      AppState.customBuilder.secondaryAddon = Number(priceVal);
    }
    renderActiveView();
  };

  window.updateCustomBuilderSchedule = function (field, val) {
    if (field === 'eventDate' || field === 'pickupSlot') {
      AppState.customBuilder[field] = val;
      renderActiveView();
    }
  };

  window.updateCustomBuilderText = function (val) {
    AppState.customBuilder.engraving = val;
    const preview = document.getElementById('custom-preview-engraving');
    if (preview) preview.textContent = `“${val || 'Your Forever Memory'}”`;
  };

  window.updateCustomBuilderLed = function (checked) {
    AppState.customBuilder.ledBase = checked;
    renderActiveView();
  };

  window.addCustomCommissionToCart = function () {
    const b = AppState.customBuilder;
    const secondaryCost = Number(b.secondaryAddon) || 0;
    const total = b.shapePrice + b.sourceAddon + b.metallicAddon + secondaryCost + (b.ledBase ? 499 : 0);
    const addonSuffix = b.secondaryKeepsake && !b.secondaryKeepsake.startsWith('None') ? ` + ${b.secondaryKeepsake}` : '';
    Store.addToCart({
      productId: 'ram-keep-001',
      sku: 'RAM-CUSTOM-KEEP',
      name: `Custom Preserved Keepsake (${b.shape})`,
      variantLabel: `${b.metallic}${addonSuffix}${b.ledBase ? ' + Warm LED Stand' : ''}`,
      price: total,
      regularPrice: total + 1000,
      qty: 1,
      image: Store.IMAGES.floralCube,
      customNote: `${b.engraving} | Source: ${b.flowerSource} | Pickup: ${b.eventDate} (${b.pickupSlot})`
    });
    updateGlobalBadges();
    window.showToast('Custom Keepsake Added to Bag!', `${formatINR(total)} • Doorstep pickup slot reserved`);
    window.navigateTo('cart');
  };

  // Wishlist Handlers
  window.moveAllWishlistToCart = function () {
    const ids = Store.getWishlist();
    ids.forEach(id => {
      const p = Store.getProductById(id);
      if (p) {
        Store.addToCart({
          productId: p.id,
          name: p.name,
          variantLabel: p.variants && p.variants[0] ? p.variants[0].label : 'Standard Edition',
          price: p.price,
          regularPrice: p.regularPrice,
          qty: 1,
          image: p.image,
          sku: p.sku
        });
      }
    });
    updateGlobalBadges();
    window.showToast(`Added ${ids.length} Saved Items to Studio Bag!`);
    window.navigateTo('cart');
  };

  // Cart & Checkout Handlers
  window.handleCartQty = function (cartItemId, delta) {
    Store.updateCartQty(cartItemId, delta, false);
    updateGlobalBadges();
    renderActiveView();
  };

  window.handleCartRemove = function (cartItemId) {
    Store.removeFromCart(cartItemId);
    updateGlobalBadges();
    renderActiveView();
    window.showToast('Item Removed from Studio Bag');
  };

  window.handleSaveForLater = function (cartItemId, productId) {
    if (!Store.isWishlisted(productId)) {
      Store.toggleWishlist(productId);
    }
    Store.removeFromCart(cartItemId);
    updateGlobalBadges();
    renderActiveView();
    window.showToast('Saved for Later', 'Moved item to your Atelier Wishlist');
  };

  window.handleApplyCoupon = function () {
    const code = document.getElementById('cart-coupon-input')?.value || '';
    const res = Store.applyCoupon(code);
    renderActiveView();
    window.showToast(res.valid ? 'Voucher Applied!' : 'Voucher Notice', res.message);
  };

  window.quickSelectCoupon = function (code) {
    const res = Store.applyCoupon(code);
    renderActiveView();
    window.showToast(res.valid ? `Applied ${code}!` : 'Coupon Notice', res.message);
  };

  window.toggleGstClaim = function (checked) {
    Store.saveGstInfo({ enabled: checked });
    renderActiveView();
  };

  window.saveGstField = function () {
    const gstin = document.getElementById('cart-gstin-input')?.value.trim().toUpperCase() || '';
    const tradeName = document.getElementById('cart-tradename-input')?.value.trim() || '';
    Store.saveGstInfo({ gstin, tradeName });
    window.showToast('GST Invoice Details Updated', gstin);
  };

  window.promptChangePincode = function () {
    const errEl = document.getElementById('modal-pincode-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const modal = document.getElementById('global-pincode-modal');
    if (modal) modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.saveModalPincode = function () {
    const val = document.getElementById('modal-pincode-input')?.value;
    const res = Store.verifyPincode(val);
    const errEl = document.getElementById('modal-pincode-error');
    if (!res.valid) {
      if (errEl) {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
      }
      window.showToast('Invalid PIN Code', res.message);
      return;
    }
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    document.getElementById('global-pincode-modal')?.classList.add('hidden');
    syncBodyModalLock();
    updateGlobalBadges();
    renderActiveView();
    window.showToast(`Delivering to PIN ${res.pin}`, `${res.city} • ${res.courier}`);
  };

  // Story Modal Viewer
  window.openStoryModal = function (idx) {
    const st = Store.DEFAULT_STORIES[idx];
    if (!st) return;
    AppState.activeStoryIdx = idx;
    const modal = document.getElementById('story-viewer-modal');
    const img = document.getElementById('story-modal-img');
    const title = document.getElementById('story-modal-title');
    const sub = document.getElementById('story-modal-sub');
    const cap = document.getElementById('story-modal-caption');
    const cta = document.getElementById('story-modal-cta');
    if (!modal) return;

    img.src = st.image;
    title.textContent = st.title;
    sub.textContent = st.subtitle;
    cap.textContent = st.caption;
    cta.textContent = st.ctaText;
    cta.onclick = function () {
      window.closeStoryModal();
      window.navigateTo('product', st.productId);
    };

    modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.closeStoryModal = function () {
    document.getElementById('story-viewer-modal')?.classList.add('hidden');
    syncBodyModalLock();
  };

  // Lightbox Modal
  window.openLightbox = function (imgSrc, caption) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!modal || !img) return;
    img.src = imgSrc;
    if (cap) cap.textContent = caption || '';
    modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  // TDS / SDS / Wholesale Spec Modal
  window.openTdsModal = function (docType) {
    const modal = document.getElementById('tds-spec-modal');
    const title = document.getElementById('tds-modal-title');
    const body = document.getElementById('tds-modal-body');
    if (!modal || !title || !body) return;

    if (docType === 'sds') {
      title.textContent = 'ISO 11014 Material Safety Data Sheet (SDS)';
      body.innerHTML = `
        <p class="text-xs text-on-surface-variant"><strong>Formulation:</strong> Vistāra Krafts Zero-VOC Archival Epoxy System (HSN 39073010)</p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-on-surface mt-2">
          <li><strong>VOC Content:</strong> 0.0 g/L (100% reactive solids, solvent-free).</li>
          <li><strong>Flash Point:</strong> &gt; 150°C (Non-flammable air &amp; surface cargo certified).</li>
          <li><strong>PPE Recommendation:</strong> Nitrile gloves and splash eyewear in studio ventilation.</li>
          <li><strong>Food Contact Safety:</strong> Complies with FDA 21 CFR 175.300 once fully cured for 72 hours at 25°C.</li>
        </ul>
      `;
    } else if (docType === 'wholesale') {
      title.textContent = '2026 Studio & B2B Wholesale Slab Pricing';
      body.innerHTML = `
        <p class="text-xs text-on-surface-variant">Official GST Input Tax Credit (18%) invoices provided on all studio tiers:</p>
        <div class="mt-2 border border-[#e4e0d8] rounded-lg overflow-hidden text-xs">
          <div class="flex justify-between p-2 bg-surface-container-low font-bold"><span>Volume Tier</span><span>Rate per kg (3:1 / 2:1)</span></div>
          <div class="flex justify-between p-2 border-t border-surface-container"><span>12 kg Commercial Barrel</span><span class="font-spec-numeral font-bold">₹833 / kg</span></div>
          <div class="flex justify-between p-2 border-t border-surface-container"><span>36 kg Studio Pallet</span><span class="font-spec-numeral font-bold">₹740 / kg</span></div>
          <div class="flex justify-between p-2 border-t border-surface-container"><span>200 kg Industrial Drum</span><span class="font-spec-numeral font-bold">₹645 / kg</span></div>
        </div>
      `;
    } else {
      title.textContent = 'Technical Data Sheet (TDS) — Batch #VK-26-C38';
      body.innerHTML = `
        <p class="text-xs text-on-surface-variant"><strong>Optical Transmission:</strong> 99.4% per ASTM D1003 • <strong>Shore D Hardness:</strong> 82D–85D</p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-on-surface mt-2">
          <li><strong>Weighing Protocol:</strong> Always weigh Part A and Part B on a digital gram scale (3:1 by weight or 2:1 for Deep Pour).</li>
          <li><strong>Mixing Cadence:</strong> Stir slowly for 3–4 minutes scraping beaker walls and base corners twice.</li>
          <li><strong>Ambient Cure Window:</strong> Ideal studio temperature 22°C – 30°C with &lt; 65% relative humidity.</li>
        </ul>
      `;
    }
    modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.closeTdsModal = function () {
    window.closeModalById('tds-spec-modal');
  };

  // Share Your Memory Upload Modal
  window.openShareMemoryModal = function () {
    document.getElementById('share-memory-modal')?.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.submitShareMemoryForm = function (ev) {
    ev.preventDefault();
    const authorName = document.getElementById('mem-author-name')?.value.trim();
    const handle = document.getElementById('mem-author-handle')?.value.trim();
    const tag = document.getElementById('mem-tag')?.value || 'ClientLove';
    const caption = document.getElementById('mem-caption')?.value.trim();
    const productId = document.getElementById('mem-product')?.value || 'ram-keep-001';

    Store.addCustomerPost({
      authorName,
      handle,
      tag,
      caption,
      productId,
      image: Store.IMAGES.floralCube
    });
    document.getElementById('share-memory-modal')?.classList.add('hidden');
    syncBodyModalLock();
    window.navigateTo('social');
    window.showToast('Your Memory is Live!', 'Published to @resin.art.memories community feed');
  };

  // Customer Account, Order Lookup, Mockup Approval & GST Invoice Handlers
  window.toggleAccountProfileEdit = function () {
    AppState.editingAccountProfile = !AppState.editingAccountProfile;
    renderActiveView();
  };

  window.saveAccountProfile = function (ev) {
    if (ev) ev.preventDefault();
    const name = document.getElementById('acc-prof-name')?.value.trim() || '';
    const phone = document.getElementById('acc-prof-phone')?.value.trim() || '';
    const email = document.getElementById('acc-prof-email')?.value.trim() || '';
    const defaultAddress = document.getElementById('acc-prof-address')?.value.trim() || '';
    if (!name || !defaultAddress) {
      window.showToast('Missing Details', 'Please enter your full name and delivery address.');
      return;
    }
    Store.savePatronProfile({ name, phone, email, defaultAddress });
    AppState.editingAccountProfile = false;
    updateGlobalBadges();
    renderActiveView();
    window.showToast('Patron Profile Saved!', `${name} • Dispatch address updated`);
  };

  // Top-Bar Account & Saved Shipping Popup Drawer Controllers
  window.openAccountBarModal = function () {
    updateGlobalBadges();
    const modal = document.getElementById('account-bar-modal');
    if (modal) modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.saveBarAccountDetails = function (ev) {
    if (ev) ev.preventDefault();
    const name = document.getElementById('bar-prof-name')?.value.trim() || '';
    const phone = document.getElementById('bar-prof-phone')?.value.trim() || '';
    const email = document.getElementById('bar-prof-email')?.value.trim() || '';
    const defaultAddress = document.getElementById('bar-prof-address')?.value.trim() || '';
    if (!name || !defaultAddress) {
      window.showToast('Missing Details', 'Please enter your full name and shipping address.');
      return;
    }
    Store.savePatronProfile({ name, phone, email, defaultAddress });
    updateGlobalBadges();
    renderActiveView();
    window.showToast('Account & Shipping Updated!', `${name} • Saved to session`);
  };

  // Authentication Controllers (Step 1: 1-Click Google, Apple, or Email Sign-In / Create Account)
  let gisInitialized = false;
  let appleSdkInitialized = false;
  let lastGisCredential = '';
  let activeOAuthChooserProvider = 'google';

  function isPlaceholderClientId(clientId) {
    const val = String(clientId || '').trim();
    if (!val) return true;
    const upper = val.toUpperCase();
    return (
      upper.startsWith('YOUR_') ||
      upper.startsWith('DEV_') ||
      upper.startsWith('CLIENT_') ||
      upper.startsWith('REPLACE_WITH_') ||
      upper.includes('REPLACE_WITH_REAL_CLIENT_ID')
    );
  }

  function getOAuthProviderConfig(provider) {
    const root = window.VistaraCloudflareConfig || {};
    if (provider === 'apple') {
      return (root.oauth && root.oauth.apple) || root.appleOAuth || null;
    }
    return (root.oauth && root.oauth.google) || root.googleOAuth || null;
  }

  function initGoogleIdentityServicesIfConfigured() {
    try {
      const cfg = getOAuthProviderConfig('google');
      if (!cfg || cfg.enabled === false || isPlaceholderClientId(cfg.clientId)) {
        return false;
      }
      if (!document.getElementById('vk-google-gis-script')) {
        const script = document.createElement('script');
        script.id = 'vk-google-gis-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setupGoogleGisClient(cfg.clientId);
        document.head.appendChild(script);
      } else if (window.google && window.google.accounts && window.google.accounts.id) {
        setupGoogleGisClient(cfg.clientId);
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function setupGoogleGisClient(clientId) {
    if (gisInitialized || !(window.google && window.google.accounts && window.google.accounts.id)) return;
    gisInitialized = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      context: 'signin',
      ux_mode: 'popup',
      auto_select: false,
      itp_support: true,
      callback: (response) => {
        if (response && response.credential) {
          lastGisCredential = response.credential;
          try {
            const parts = response.credential.split('.');
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload && payload.email) {
              window.completeOAuthChooserAccount('google', payload.email, payload.name || '');
              return;
            }
          } catch (_e) { /* ignore */ }
        }
      }
    });
    const slot = document.getElementById('cf-google-gis-button-slot');
    if (slot) {
      slot.classList.remove('hidden');
      slot.classList.add('flex');
      window.google.accounts.id.renderButton(slot, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 280
      });
    }
  }

  function initAppleSignInIfConfigured() {
    try {
      const cfg = getOAuthProviderConfig('apple');
      if (!cfg || cfg.enabled === false || isPlaceholderClientId(cfg.clientId)) {
        return false;
      }
      const setupAppleClient = () => {
        if (appleSdkInitialized || !(window.AppleID && window.AppleID.auth)) return;
        appleSdkInitialized = true;
        window.AppleID.auth.init({
          clientId: cfg.clientId,
          scope: cfg.scope || 'name email',
          redirectURI: cfg.redirectURI || window.location.origin,
          usePopup: true
        });
      };
      if (!document.getElementById('vk-apple-auth-script') && !(window.AppleID && window.AppleID.auth)) {
        const script = document.createElement('script');
        script.id = 'vk-apple-auth-script';
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;
        script.onload = setupAppleClient;
        document.head.appendChild(script);
      } else if (window.AppleID && window.AppleID.auth) {
        setupAppleClient();
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  let isForgotAuthMode = false;

  window.toggleAuthPasswordVisibility = function () {
    const pwd = document.getElementById('cf-auth-password');
    const icon = document.getElementById('cf-auth-pwd-toggle-icon');
    if (!pwd) return;
    if (pwd.type === 'password') {
      pwd.type = 'text';
      if (icon) icon.textContent = 'visibility_off';
    } else {
      pwd.type = 'password';
      if (icon) icon.textContent = 'visibility';
    }
  };

  window.toggleAuthRememberMe = function () {
    const input = document.getElementById('cf-auth-remember');
    const box = document.getElementById('cf-auth-remember-box');
    const btn = document.getElementById('cf-auth-remember-btn');
    if (!input || !box) return;
    const isChecked = input.value === '1';
    if (isChecked) {
      input.value = '0';
      box.textContent = '';
      box.className = 'w-4 h-4 rounded border border-[#e4e0d8] bg-white flex items-center justify-center text-[10px]';
      if (btn) btn.setAttribute('aria-checked', 'false');
    } else {
      input.value = '1';
      box.textContent = '✓';
      box.className = 'w-4 h-4 rounded border border-primary bg-primary text-white flex items-center justify-center text-[10px] font-black leading-none';
      if (btn) btn.setAttribute('aria-checked', 'true');
    }
  };

  window.setAuthForgotMode = function (enable) {
    isForgotAuthMode = Boolean(enable);
    const regWrap = document.getElementById('cf-register-fields-wrap');
    const pwdWrap = document.getElementById('cf-auth-password-wrap');
    const rememberRow = document.getElementById('cf-auth-remember-row');
    const personaBox = document.getElementById('cf-auth-persona-box');
    const socialDivider = document.getElementById('cf-auth-social-divider');
    const socialRow = document.getElementById('cf-auth-social-row');
    const titleEl = document.getElementById('cloudflare-auth-modal-title');
    const subtitleEl = document.getElementById('cloudflare-auth-modal-subtitle');
    const submitBtn = document.getElementById('cf-auth-submit-btn');
    const footerText = document.getElementById('cf-auth-footer-text');
    const footerBtn = document.getElementById('cf-auth-footer-btn');
    const errEl = document.getElementById('cf-auth-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }

    if (isForgotAuthMode) {
      if (titleEl) titleEl.textContent = 'Forgot Password?';
      if (subtitleEl) subtitleEl.textContent = "Enter your email address and we'll send a password recovery link.";
      if (regWrap) regWrap.classList.add('hidden');
      if (pwdWrap) pwdWrap.classList.add('hidden');
      if (rememberRow) rememberRow.classList.add('hidden');
      if (personaBox) personaBox.classList.add('hidden');
      if (socialDivider) socialDivider.classList.add('hidden');
      if (socialRow) socialRow.classList.add('hidden');
      if (submitBtn) submitBtn.textContent = 'Send Reset Link';
      if (footerText) footerText.textContent = 'Remembered your password?';
      if (footerBtn) footerBtn.textContent = 'Sign In';
    } else {
      if (socialDivider) socialDivider.classList.remove('hidden');
      if (socialRow) socialRow.classList.remove('hidden');
      window.setEmailAuthTab('signin');
    }
  };

  window.handleAuthFooterSwitch = function () {
    if (isForgotAuthMode) {
      window.setAuthForgotMode(false);
    } else {
      const mode = document.getElementById('cf-auth-mode')?.value;
      window.setEmailAuthTab(mode === 'register' ? 'signin' : 'register');
    }
  };

  window.handleAuthModalBack = function () {
    if (isForgotAuthMode) {
      window.setAuthForgotMode(false);
    } else {
      const mode = document.getElementById('cf-auth-mode')?.value;
      if (mode === 'register') {
        window.setEmailAuthTab('signin');
      } else {
        window.closeModalById('cloudflare-auth-modal');
      }
    }
  };

  window.setEmailAuthTab = function (mode) {
    isForgotAuthMode = false;
    const cleanMode = mode === 'register' ? 'register' : 'signin';
    const modeInput = document.getElementById('cf-auth-mode');
    if (modeInput) modeInput.value = cleanMode;

    const provInput = document.getElementById('cf-auth-provider');
    if (provInput) provInput.value = 'email';

    const tabSignin = document.getElementById('cf-tab-signin');
    const tabRegister = document.getElementById('cf-tab-register');
    const regWrap = document.getElementById('cf-register-fields-wrap');
    const nameInput = document.getElementById('cf-auth-name');
    const submitBtn = document.getElementById('cf-auth-submit-btn');
    const titleEl = document.getElementById('cloudflare-auth-modal-title');
    const subtitleEl = document.getElementById('cloudflare-auth-modal-subtitle');
    const pwdWrap = document.getElementById('cf-auth-password-wrap');
    const rememberRow = document.getElementById('cf-auth-remember-row');
    const personaBox = document.getElementById('cf-auth-persona-box');
    const socialDivider = document.getElementById('cf-auth-social-divider');
    const socialRow = document.getElementById('cf-auth-social-row');
    const footerText = document.getElementById('cf-auth-footer-text');
    const footerBtn = document.getElementById('cf-auth-footer-btn');

    if (tabSignin && tabRegister) {
      if (cleanMode === 'signin') {
        tabSignin.className = 'min-h-[44px] h-11 rounded-lg bg-primary text-white text-xs font-bold shadow-xs transition cursor-pointer';
        tabRegister.className = 'min-h-[44px] h-11 rounded-lg bg-transparent text-primary hover:bg-white/70 text-xs font-bold transition cursor-pointer';
      } else {
        tabRegister.className = 'min-h-[44px] h-11 rounded-lg bg-primary text-white text-xs font-bold shadow-xs transition cursor-pointer';
        tabSignin.className = 'min-h-[44px] h-11 rounded-lg bg-transparent text-primary hover:bg-white/70 text-xs font-bold transition cursor-pointer';
      }
    }

    if (pwdWrap) pwdWrap.classList.remove('hidden');
    if (personaBox) personaBox.classList.remove('hidden');
    if (socialDivider) socialDivider.classList.remove('hidden');
    if (socialRow) socialRow.classList.remove('hidden');

    if (regWrap) {
      if (cleanMode === 'register') {
        regWrap.classList.remove('hidden');
        regWrap.classList.add('grid');
      } else {
        regWrap.classList.add('hidden');
        regWrap.classList.remove('grid');
      }
    }
    if (nameInput) {
      nameInput.required = cleanMode === 'register';
    }

    if (cleanMode === 'signin') {
      if (titleEl) titleEl.textContent = 'Welcome Back!';
      if (subtitleEl) subtitleEl.textContent = 'Sign in to access your bespoke keepsakes and curated feed.';
      if (submitBtn) submitBtn.textContent = 'Sign In';
      if (rememberRow) rememberRow.classList.remove('hidden');
      if (footerText) footerText.textContent = "Don't have an account?";
      if (footerBtn) footerBtn.textContent = 'Sign Up';
    } else {
      if (titleEl) titleEl.textContent = 'Create Your Account';
      if (subtitleEl) subtitleEl.textContent = 'Join Vistāra Krafts to unlock tailored keepsake collections.';
      if (submitBtn) submitBtn.textContent = 'Create Account';
      if (rememberRow) rememberRow.classList.add('hidden');
      if (footerText) footerText.textContent = 'Already have an account?';
      if (footerBtn) footerBtn.textContent = 'Sign In';
    }
  };

  window.closeOAuthChooser = function () {
    const sheet = document.getElementById('cf-oauth-chooser-sheet');
    if (sheet) sheet.classList.add('hidden');
  };

  window.completeOAuthChooserAccount = function (provider, email, name) {
    const cleanProvider = provider === 'apple' ? 'apple' : 'google';
    const personaPreference = document.getElementById('cf-auth-selected-persona')?.value || 'all';
    const res = Store.loginPatron({
      provider: cleanProvider,
      email: String(email || '').trim(),
      name: String(name || '').trim(),
      personaPreference,
      credential: lastGisCredential
    });
    const errEl = document.getElementById('cf-auth-error');
    if (!res.valid) {
      if (errEl) {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
      }
      window.showToast('Sign-In Notice', res.message);
      return;
    }
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    window.closeOAuthChooser();
    document.getElementById('cloudflare-auth-modal')?.classList.add('hidden');
    syncBodyModalLock();
    AppState.feedPersona = Store.getPersonaPreference() || personaPreference;
    updateGlobalBadges();
    renderActiveView();

    const shouldOpenCheckout = AppState.pendingCheckoutAfterAuth;
    AppState.pendingCheckoutAfterAuth = false;
    const providerLabel = cleanProvider === 'apple' ? 'Apple ID' : 'Google';
    window.showToast(`Signed in as ${res.session.name}`, `Verified via ${providerLabel}`);
    if (shouldOpenCheckout) {
      window.openCheckoutModal();
    }
  };

  window.submitOAuthChooserCustom = function () {
    const emailEl = document.getElementById('cf-oauth-custom-email');
    const nameEl = document.getElementById('cf-oauth-custom-name');
    const email = emailEl?.value.trim() || '';
    const name = nameEl?.value.trim() || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.showToast('Enter Valid Email', 'Please enter a valid Google or Apple email address to continue.');
      if (emailEl && typeof emailEl.focus === 'function') emailEl.focus();
      return;
    }
    window.completeOAuthChooserAccount(activeOAuthChooserProvider, email, name);
  };

  window.onAuthEmailInput = function (emailInput) {
    if (typeof Store.lookupSavedPatronByEmail !== 'function') return;
    const saved = Store.lookupSavedPatronByEmail(emailInput);
    if (!saved) return;
    const nameEl = document.getElementById('cf-auth-name');
    const phoneEl = document.getElementById('cf-auth-phone');
    if (nameEl && !nameEl.value && saved.name) nameEl.value = saved.name;
    if (phoneEl && !phoneEl.value && saved.phone) phoneEl.value = saved.phone;
  };

  window.openCloudflareAuthModal = function (fromCheckout = false) {
    AppState.pendingCheckoutAfterAuth = Boolean(fromCheckout);
    isForgotAuthMode = false;
    const pwd = document.getElementById('cf-auth-password');
    const icon = document.getElementById('cf-auth-pwd-toggle-icon');
    if (pwd) pwd.type = 'password';
    if (icon) icon.textContent = 'visibility';

    const errEl = document.getElementById('cf-auth-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    window.closeOAuthChooser();
    window.setEmailAuthTab('signin');
    if (typeof window.setAuthPersona === 'function') {
      window.setAuthPersona(Store.getPersonaPreference() || AppState.feedPersona || 'all');
    }
    initGoogleIdentityServicesIfConfigured();
    initAppleSignInIfConfigured();

    const bannerEl = document.getElementById('cloudflare-auth-reason-banner');
    if (bannerEl) {
      bannerEl.innerHTML = fromCheckout
        ? '🔒 <strong>Sign In to Continue:</strong> Sign in with <strong>Google</strong>, <strong>Apple</strong>, or your <strong>Email</strong>. You will add your delivery address next.'
        : 'Sign in with <strong>Google</strong>, <strong>Apple</strong>, or your <strong>Email</strong> to save your favorites, personalize your feed, and track orders.';
    }

    const modal = document.getElementById('cloudflare-auth-modal');
    if (modal) modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.startCloudflareOAuth = function (provider) {
    const cleanProvider = ['google', 'apple', 'email'].includes(provider) ? provider : 'google';
    const provInput = document.getElementById('cf-auth-provider');
    if (provInput) provInput.value = cleanProvider;

    if (cleanProvider === 'email') {
      window.closeOAuthChooser();
      const emailEl = document.getElementById('cf-auth-email');
      if (emailEl && typeof emailEl.focus === 'function') emailEl.focus();
      return;
    }

    if (cleanProvider === 'google') {
      const hasProdGoogle = initGoogleIdentityServicesIfConfigured();
      if (hasProdGoogle && window.google && window.google.accounts && window.google.accounts.id && typeof window.google.accounts.id.prompt === 'function') {
        try { window.google.accounts.id.prompt(); } catch (_e) { /* continue to chooser */ }
      }
    } else if (cleanProvider === 'apple') {
      const hasProdApple = initAppleSignInIfConfigured();
      if (hasProdApple && window.AppleID && window.AppleID.auth && typeof window.AppleID.auth.signIn === 'function') {
        try {
          window.AppleID.auth.signIn().then((res) => {
            if (res && res.authorization && res.authorization.id_token) {
              lastGisCredential = res.authorization.id_token;
              const parts = res.authorization.id_token.split('.');
              const payload = parts.length > 1 ? JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
              const userObj = res.user || {};
              const fullName = userObj.name ? `${userObj.name.firstName || ''} ${userObj.name.lastName || ''}`.trim() : '';
              const email = userObj.email || payload.email || '';
              if (email) {
                window.completeOAuthChooserAccount('apple', email, fullName);
              }
            }
          }).catch(() => { /* fall back to interactive account chooser */ });
        } catch (_e) { /* fall back to interactive account chooser */ }
      }
    }

    // Open the interactive 1-click Google / Apple Account Chooser sheet
    activeOAuthChooserProvider = cleanProvider;
    const sheet = document.getElementById('cf-oauth-chooser-sheet');
    const titleEl = document.getElementById('cf-oauth-chooser-title');
    const accountsContainer = document.getElementById('cf-oauth-chooser-accounts');
    const customEmailEl = document.getElementById('cf-oauth-custom-email');

    const isApple = cleanProvider === 'apple';
    if (titleEl) {
      titleEl.textContent = isApple
        ? 'Sign in with Apple ID to Vistāra Krafts'
        : 'Choose a Google Account to continue to Vistāra Krafts';
    }
    if (customEmailEl) {
      customEmailEl.placeholder = isApple ? 'you@icloud.com' : 'you@gmail.com';
    }

    const defaultAccounts = isApple
      ? [
          { name: 'Aarav Mehta', email: 'aarav.mehta@icloud.com', badge: 'Apple ID • Hide My Email Supported' },
          { name: 'Meera Kapoor', email: 'meera.kapoor@icloud.com', badge: 'iCloud Keychain Verified' }
        ]
      : [
          { name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', badge: 'Google Account' },
          { name: 'Meera Kapoor', email: 'meera.kapoor@gmail.com', badge: 'Google Workspace' }
        ];

    let savedAccounts = [];
    try {
      const rawUsers = localStorage.getItem('ram_vk_cf_users_v2');
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers) || {};
        savedAccounts = Object.values(parsed)
          .filter(u => u && u.email && (!u.provider || u.provider === cleanProvider))
          .map(u => ({
            name: u.name || u.email.split('@')[0],
            email: u.email,
            badge: isApple ? 'Saved Apple ID' : 'Saved Google Account'
          }));
      }
    } catch (_e) { /* ignore */ }

    const seenEmails = new Set();
    const chooserAccounts = [...savedAccounts, ...defaultAccounts].filter(acc => {
      const key = String(acc.email || '').toLowerCase();
      if (!key || seenEmails.has(key)) return false;
      seenEmails.add(key);
      return true;
    });

    if (accountsContainer) {
      accountsContainer.innerHTML = chooserAccounts.map(acc => `
        <button type="button" onclick="window.completeOAuthChooserAccount('${cleanProvider}', '${esc(acc.email)}', '${esc(acc.name)}')" style="min-height: 48px; height: 48px;" class="w-full min-h-[48px] h-12 px-3 py-2 rounded-xl bg-white hover:bg-surface-container-low border border-[#e4e0d8] flex items-center justify-between gap-2 text-left transition cursor-pointer shadow-2xs">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">${esc(acc.name.charAt(0))}</span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-primary truncate">${esc(acc.name)}</p>
              <p class="text-[11px] text-on-surface-variant truncate">${esc(acc.email)}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold text-secondary shrink-0">1-Click Sign In →</span>
        </button>
      `).join('');
    }

    if (sheet) {
      sheet.classList.remove('hidden');
    }
  };

  window.submitCloudflareAuthForm = function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (isForgotAuthMode) {
      const email = document.getElementById('cf-auth-email')?.value.trim() || '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        window.showToast('Enter Valid Email', 'Please enter your registered email address to receive password reset instructions.');
        return;
      }
      window.showToast('Reset Link Sent', `If an account exists for ${email}, recovery instructions have been sent.`);
      window.setAuthForgotMode(false);
      return;
    }

    const provider = document.getElementById('cf-auth-provider')?.value || 'email';
    const mode = document.getElementById('cf-auth-mode')?.value || 'signin';
    const email = document.getElementById('cf-auth-email')?.value.trim() || '';
    const password = document.getElementById('cf-auth-password')?.value || '';
    const name = document.getElementById('cf-auth-name')?.value.trim() || '';
    const phone = document.getElementById('cf-auth-phone')?.value.trim() || '';
    const address = document.getElementById('cf-auth-address')?.value.trim() || '';
    const pincode = document.getElementById('cf-auth-pincode')?.value.trim() || '';
    const personaPreference = document.getElementById('cf-auth-selected-persona')?.value || 'all';

    const errEl = document.getElementById('cf-auth-error');
    const res = Store.loginPatron({
      provider,
      mode,
      email,
      password,
      name,
      phone,
      address,
      pincode,
      personaPreference,
      credential: lastGisCredential
    });

    if (!res.valid) {
      if (errEl) {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
      }
      window.showToast('Sign-In Notice', res.message);
      return;
    }

    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }

    window.closeOAuthChooser();
    document.getElementById('cloudflare-auth-modal')?.classList.add('hidden');
    syncBodyModalLock();
    AppState.feedPersona = Store.getPersonaPreference() || personaPreference;
    updateGlobalBadges();
    renderActiveView();

    const shouldOpenCheckout = AppState.pendingCheckoutAfterAuth;
    AppState.pendingCheckoutAfterAuth = false;

    window.showToast(`Signed in as ${res.session.name}`, `Verified via ${provider.toUpperCase()}`);
    if (shouldOpenCheckout) {
      window.openCheckoutModal();
    }
  };

  window.handlePatronLogout = function () {
    Store.logoutPatron();
    AppState.pendingCheckoutAfterAuth = false;
    lastGisCredential = '';
    window.closeOAuthChooser();
    document.getElementById('account-bar-modal')?.classList.add('hidden');
    document.getElementById('mobile-menu-drawer')?.classList.add('hidden');
    // Clear checkout & auth modal inputs so no stale customer details remain after sign-out
    const inputIdsToClear = [
      'chk-name',
      'chk-phone',
      'chk-address',
      'chk-pincode',
      'cf-auth-email',
      'cf-auth-password',
      'cf-auth-name',
      'cf-auth-phone',
      'cf-oauth-custom-email',
      'cf-oauth-custom-name'
    ];
    inputIdsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    syncBodyModalLock();
    updateGlobalBadges();
    renderActiveView();
    window.showToast('Signed Out', 'You are now browsing in Guest Mode');
  };

  window.setAccountOrderSearch = function (val) {
    AppState.orderSearchQuery = val;
    renderActiveView();
    const input = document.getElementById('account-order-search');
    if (input) {
      if (typeof input.focus === 'function') input.focus();
      if (typeof input.setSelectionRange === 'function') input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  window.handleApproveOrderMockup = function (orderId) {
    const updated = Store.approveOrderMockup(orderId);
    updateGlobalBadges();
    renderActiveView();
    if (updated) {
      window.showToast(`Order #${orderId} Layout Approved! ✨`, 'Moved to Stage 4: Multi-Layer Crystal Resin Pour');
    }
  };

  window.openOrderInvoiceModal = function (orderId) {
    const ord = Store.getOrders().find(o => o.orderId === orderId);
    if (!ord) return;
    const gstInfo = Store.getGstInfo();
    const modal = document.getElementById('tds-spec-modal');
    const title = document.getElementById('tds-modal-title');
    const body = document.getElementById('tds-modal-body');
    if (!modal || !title || !body) return;

    const gstAmt = Number(ord.gstAmount) || Number((ord.total * (18 / 118)).toFixed(2));
    title.textContent = `GST Tax Invoice — Order #${ord.orderId}`;
    body.innerHTML = `
      <div class="flex flex-col gap-3 text-xs text-primary">
        <div class="flex flex-wrap justify-between gap-2 p-3 rounded-lg bg-surface-container-low border border-[#e4e0d8]">
          <div>
            <p class="font-bold">Vistāra Krafts Chemical &amp; Keepsake Atelier</p>
            <p class="text-[11px] text-on-surface-variant">Supplier GSTIN: 29AABCV4820K1Z5 • HSN: 39073010</p>
          </div>
          <div class="text-right">
            <p class="font-spec-numeral font-bold">Date: ${esc(ord.date)}</p>
            <p class="text-[11px] text-on-surface-variant">Buyer GSTIN: ${esc(gstInfo.gstin || 'Unregistered B2C')}</p>
          </div>
        </div>
        <div class="border border-[#e4e0d8] rounded-lg overflow-hidden">
          <div class="flex justify-between p-2.5 bg-surface-container-low font-bold">
            <span>Item Description</span>
            <span>Amount</span>
          </div>
          ${(ord.items || []).map(it => `
            <div class="flex justify-between p-2.5 border-t border-surface-container">
              <div>
                <span>${it.qty}× ${esc(it.name)}</span>
                ${(it.color || it.shape || it.size) ? `
                  <p class="text-[10px] text-on-surface-variant font-medium mt-0.5">
                    ${[it.color ? 'Color: ' + esc(it.color) : '', it.shape ? 'Shape: ' + esc(it.shape) : '', it.size ? 'Size: ' + esc(it.size) : ''].filter(Boolean).join(' • ')}
                  </p>
                ` : ''}
              </div>
              <span class="font-spec-numeral font-semibold">${formatINR((it.price || ord.total) * (it.qty || 1))}</span>
            </div>
          `).join('')}
          <div class="flex justify-between p-2.5 border-t border-surface-container bg-surface-container-low/50 text-on-surface-variant">
            <span>Included IGST / CGST+SGST (18%)</span>
            <span class="font-spec-numeral">₹${gstAmt.toFixed(2)}</span>
          </div>
          <div class="flex justify-between p-2.5 border-t border-[#e4e0d8] bg-surface-container-low font-bold text-sm">
            <span>Total Paid (${esc(ord.paymentMethod || 'UPI Instant')})</span>
            <span class="font-spec-numeral text-secondary">${formatINR(ord.total)}</span>
          </div>
        </div>
        <p class="text-[11px] text-on-surface-variant">Shipped to: <strong>${esc(ord.customerName || 'Verified Studio Patron')}</strong> — ${esc(ord.address || 'Bengaluru, KA 560001')} (${esc(ord.courier)})</p>
      </div>
    `;
    modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.handleReorder = function (orderId) {
    const ord = Store.getOrders().find(o => o.orderId === orderId);
    if (!ord || !ord.items) return;
    const catalog = Store.getProducts();
    ord.items.forEach(it => {
      const match = catalog.find(p => p.id === it.productId || p.name === it.name || p.shortName === it.name) || catalog[0];
      if (match) {
        Store.addToCart({
          productId: match.id,
          sku: match.sku,
          name: match.name,
          variantLabel: it.variantLabel || (match.variants && match.variants[0] ? match.variants[0].label : 'Standard Edition'),
          color: it.color,
          shape: it.shape,
          size: it.size,
          price: it.price || match.price,
          regularPrice: match.regularPrice,
          qty: it.qty || 1,
          image: match.image
        });
      }
    });
    updateGlobalBadges();
    window.showToast(`Reordered #${orderId} Items to Studio Bag!`);
    window.navigateTo('cart');
  };

  // Helpers for Checkout Form Validation & Draft Persistence
  function persistCurrentCheckoutDraft() {
    if (typeof document === 'undefined' || !Store || typeof Store.saveCheckoutDraft !== 'function') return;
    const name = document.getElementById('chk-name')?.value || '';
    const phone = document.getElementById('chk-phone')?.value || '';
    const address = document.getElementById('chk-address')?.value || '';
    const pincode = document.getElementById('chk-pincode')?.value || '';
    const paymentMethod = document.getElementById('chk-payment')?.value || 'UPI Instant (GPay / PhonePe)';
    const giftWrap = Boolean(document.getElementById('chk-gift-wrap')?.checked);
    Store.saveCheckoutDraft({ name, phone, address, pincode, paymentMethod, giftWrap });
  }

  function clearCheckoutFieldError(inputId, errId) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) {
      if (typeof input.removeAttribute === 'function') {
        input.removeAttribute('aria-invalid');
      }
      if (input.classList && typeof input.classList.remove === 'function') {
        input.classList.remove('border-[#9e3322]', 'focus:border-[#9e3322]', 'focus:ring-[#9e3322]');
        input.classList.add('border-[#e4e0d8]');
      }
    }
    if (err) {
      err.textContent = '';
      if (err.classList && typeof err.classList.add === 'function') {
        err.classList.add('hidden');
      }
    }
  }

  function setCheckoutFieldError(inputId, errId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) {
      if (typeof input.setAttribute === 'function') {
        input.setAttribute('aria-invalid', 'true');
      }
      if (input.classList && typeof input.classList.add === 'function') {
        input.classList.remove('border-[#e4e0d8]');
        input.classList.add('border-[#9e3322]');
      }
    }
    if (err) {
      err.textContent = message;
      if (err.classList && typeof err.classList.remove === 'function') {
        err.classList.remove('hidden');
      }
    }
  }

  // Checkout Modal (Step 2: Collect Delivery Address & Confirm Payment after Sign-In)
  window.openCheckoutModal = function () {
    const summary = Store.getCartSummary();
    if (summary.itemsCount === 0) {
      window.showToast('Your Studio Bag is Empty');
      return;
    }

    if (typeof Store.isAuthenticated === 'function' && !Store.isAuthenticated()) {
      window.openCloudflareAuthModal(true);
      window.showToast('Sign In Required to Place Order', 'Sign in with Google, Apple, or Email to continue to checkout');
      return;
    }

    const auth = (typeof Store.getAuthSession === 'function' && Store.getAuthSession()) || {};
    const profile = Store.getPatronProfile();
    const draft = (typeof Store.getCheckoutDraft === 'function' && Store.getCheckoutDraft()) || {};

    const nameEl = document.getElementById('chk-name');
    const phoneEl = document.getElementById('chk-phone');
    const addrEl = document.getElementById('chk-address');
    const pinEl = document.getElementById('chk-pincode');
    const payEl = document.getElementById('chk-payment');
    const giftEl = document.getElementById('chk-gift-wrap');

    // Clear previous inline errors
    clearCheckoutFieldError('chk-name', 'chk-name-err');
    clearCheckoutFieldError('chk-phone', 'chk-phone-err');
    clearCheckoutFieldError('chk-address', 'chk-address-err');
    clearCheckoutFieldError('chk-pincode', 'chk-pincode-err');

    const resolvedName = draft.name || (auth.name && auth.name !== 'Vistāra Studio Guest' ? auth.name : '') || (profile.name && profile.name !== 'Vistāra Studio Guest' ? profile.name : '');
    const resolvedPhone = draft.phone || auth.phone || profile.phone || '';
    const resolvedAddr = draft.address || auth.address || profile.defaultAddress || profile.address || '';
    const pinMatch = resolvedAddr.match(/\b([1-9][0-9]{5})\b/);
    const resolvedPin = draft.pincode || auth.pincode || profile.pincode || (pinMatch ? pinMatch[1] : '') || '';

    if (nameEl) nameEl.value = resolvedName;
    if (phoneEl) phoneEl.value = resolvedPhone;
    if (addrEl) addrEl.value = resolvedAddr;
    if (pinEl) pinEl.value = resolvedPin;
    if (payEl && draft.paymentMethod) payEl.value = draft.paymentMethod;
    if (giftEl && typeof draft.giftWrap === 'boolean') giftEl.checked = draft.giftWrap;

    // Attach real-time input listeners to persist draft and clear errors as customer types
    [
      { inputId: 'chk-name', errId: 'chk-name-err' },
      { inputId: 'chk-phone', errId: 'chk-phone-err' },
      { inputId: 'chk-address', errId: 'chk-address-err' },
      { inputId: 'chk-pincode', errId: 'chk-pincode-err' }
    ].forEach(({ inputId, errId }) => {
      const el = document.getElementById(inputId);
      if (el && !el.dataset.draftBound) {
        el.dataset.draftBound = 'true';
        el.addEventListener('input', () => {
          clearCheckoutFieldError(inputId, errId);
          persistCurrentCheckoutDraft();
        });
      }
    });

    if (payEl && !payEl.dataset.draftBound) {
      payEl.dataset.draftBound = 'true';
      payEl.addEventListener('change', persistCurrentCheckoutDraft);
    }
    if (giftEl && !giftEl.dataset.draftBound) {
      giftEl.dataset.draftBound = 'true';
      giftEl.addEventListener('change', persistCurrentCheckoutDraft);
    }

    const modal = document.getElementById('checkout-modal');
    const amountEl = document.getElementById('checkout-modal-payable');
    if (amountEl) amountEl.textContent = formatINR(summary.payable);
    if (modal) modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  let activePaymentTimeoutId = null;
  let isPaymentSubmissionPending = false;
  let lastCheckoutSubmissionPayload = null;

  window.submitCheckoutOrder = async function (ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (isPaymentSubmissionPending) return;

    const modal = document.getElementById('checkout-modal');
    const submitBtn = modal ? modal.querySelector('button[type="submit"]') : null;

    if (typeof Store.isAuthenticated === 'function' && !Store.isAuthenticated()) {
      if (modal) modal.classList.add('hidden');
      syncBodyModalLock();
      window.openCloudflareAuthModal(true);
      window.showToast('Sign In Required', 'Please sign in before placing an order');
      return;
    }

    const auth = (typeof Store.getAuthSession === 'function' && Store.getAuthSession()) || {};
    const profile = Store.getPatronProfile();
    const name = document.getElementById('chk-name')?.value.trim() || auth.name || profile.name || '';
    const phone = document.getElementById('chk-phone')?.value.trim() || auth.phone || profile.phone || '';
    const address = document.getElementById('chk-address')?.value.trim() || auth.address || profile.defaultAddress || '';
    const pincode = document.getElementById('chk-pincode')?.value.trim() || auth.pincode || profile.pincode || '';
    const paymentMethod = document.getElementById('chk-payment')?.value || 'UPI Instant (GPay / PhonePe)';
    const giftWrap = Boolean(document.getElementById('chk-gift-wrap')?.checked);

    // Validate inputs with accessible inline errors
    let hasError = false;
    let firstInvalidEl = null;

    if (!name || name.length < 2) {
      setCheckoutFieldError('chk-name', 'chk-name-err', 'Please enter recipient name (at least 2 letters)');
      hasError = true;
      if (!firstInvalidEl) firstInvalidEl = document.getElementById('chk-name');
    } else {
      clearCheckoutFieldError('chk-name', 'chk-name-err');
    }

    const phoneClean = phone.replace(/[\s\-\+]/g, '');
    const isPhoneValid = /^(91)?[6-9]\d{9}$/.test(phoneClean) || /^\d{10}$/.test(phoneClean);
    if (!phone || !isPhoneValid) {
      setCheckoutFieldError('chk-phone', 'chk-phone-err', 'Please enter a valid 10-digit mobile number');
      hasError = true;
      if (!firstInvalidEl) firstInvalidEl = document.getElementById('chk-phone');
    } else {
      clearCheckoutFieldError('chk-phone', 'chk-phone-err');
    }

    if (!address || address.length < 6) {
      setCheckoutFieldError('chk-address', 'chk-address-err', 'Please enter your street address and building/landmark');
      hasError = true;
      if (!firstInvalidEl) firstInvalidEl = document.getElementById('chk-address');
    } else {
      clearCheckoutFieldError('chk-address', 'chk-address-err');
    }

    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
      setCheckoutFieldError('chk-pincode', 'chk-pincode-err', 'Please enter a valid 6-digit Indian PIN code');
      hasError = true;
      if (!firstInvalidEl) firstInvalidEl = document.getElementById('chk-pincode');
    } else {
      clearCheckoutFieldError('chk-pincode', 'chk-pincode-err');
    }

    if (hasError) {
      persistCurrentCheckoutDraft();
      if (firstInvalidEl) firstInvalidEl.focus();
      window.showToast('Incomplete Address Details', 'Please correct the highlighted fields.');
      return;
    }

    // Persist draft and prepare payload
    persistCurrentCheckoutDraft();
    const payload = { name, phone, address, pincode, paymentMethod, giftWrap };
    lastCheckoutSubmissionPayload = payload;

    // Show Payment Processing State & disable submit to prevent duplicate submissions
    isPaymentSubmissionPending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    if (modal) modal.classList.add('hidden');
    const procModal = document.getElementById('payment-processing-modal');
    const timeoutBox = document.getElementById('pay-timeout-actions');
    const statusEl = document.getElementById('pay-proc-status');
    if (timeoutBox) timeoutBox.classList.add('hidden');
    if (statusEl) {
      statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-secondary animate-ping"></span><span>Verifying Studio Order...</span>';
    }
    if (procModal) procModal.classList.remove('hidden');
    syncBodyModalLock();

    // Emergency safety timeout (10 seconds)
    if (activePaymentTimeoutId) clearTimeout(activePaymentTimeoutId);
    activePaymentTimeoutId = setTimeout(() => {
      if (isPaymentSubmissionPending && timeoutBox) {
        timeoutBox.classList.remove('hidden');
        if (statusEl) {
          statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-[#9e3322] animate-ping"></span><span class="text-[#9e3322]">Gateway Response Delayed</span>';
        }
      }
    }, 10000);

    try {
      const placeFn = (Store && typeof Store.placeOrderAsync === 'function')
        ? Store.placeOrderAsync.bind(Store)
        : (Store && typeof Store.placeOrder === 'function')
          ? async (p) => Store.placeOrder(p)
          : async () => ({ success: false, message: 'Store unavailable' });

      const res = await placeFn(payload);

      if (activePaymentTimeoutId) {
        clearTimeout(activePaymentTimeoutId);
        activePaymentTimeoutId = null;
      }
      isPaymentSubmissionPending = false;

      // Close processing modal
      if (procModal) procModal.classList.add('hidden');
      syncBodyModalLock();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      }

      if (res.success) {
        if (Store && typeof Store.clearCheckoutDraft === 'function') {
          Store.clearCheckoutDraft();
        }
        updateGlobalBadges();

        if (res.isOfflineBackup) {
          window.showToast(
            `Order #${res.order.orderId} Saved Locally (Offline Mode)`,
            `Payment recorded locally via ${paymentMethod}. Will sync to Cloudflare KV once reconnected.`
          );
        } else {
          window.showToast(
            `Order #${res.order.orderId} Confirmed! 🎉`,
            `Total Paid: ${formatINR(res.order.total)} via ${paymentMethod}`
          );
        }
        window.navigateTo('account');
      } else if (res.requiresAuth) {
        if (modal) modal.classList.remove('hidden');
        syncBodyModalLock();
        window.openCloudflareAuthModal(true);
        window.showToast('Sign In Required', res.message || 'Please sign in to place your order.');
      } else {
        // Recoverable error: preserve inputs and keep checkout modal open
        if (modal) modal.classList.remove('hidden');
        syncBodyModalLock();
        window.showToast('Payment Processing Notice', res.message || 'Unable to finalize order. Your draft has been preserved.');
      }
    } catch (_err) {
      if (activePaymentTimeoutId) {
        clearTimeout(activePaymentTimeoutId);
        activePaymentTimeoutId = null;
      }
      isPaymentSubmissionPending = false;
      if (procModal) procModal.classList.add('hidden');
      if (modal) modal.classList.remove('hidden');
      syncBodyModalLock();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      }
      window.showToast('Payment / Network Issue', 'We could not complete your transaction right now. Your cart & draft address are safely preserved.');
    }
  };

  window.retryPaymentSubmission = function () {
    if (lastCheckoutSubmissionPayload) {
      const timeoutBox = document.getElementById('pay-timeout-actions');
      if (timeoutBox) timeoutBox.classList.add('hidden');
      const statusEl = document.getElementById('pay-proc-status');
      if (statusEl) {
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-secondary animate-ping"></span><span>Re-attempting Edge Verification...</span>';
      }
      isPaymentSubmissionPending = false;
      window.submitCheckoutOrder(new Event('submit'));
    } else {
      window.cancelPaymentSubmission();
      window.openCheckoutModal();
    }
  };

  window.cancelPaymentSubmission = function () {
    if (activePaymentTimeoutId) {
      clearTimeout(activePaymentTimeoutId);
      activePaymentTimeoutId = null;
    }
    isPaymentSubmissionPending = false;
    const procModal = document.getElementById('payment-processing-modal');
    if (procModal) procModal.classList.add('hidden');
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const submitBtn = modal.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      }
    }
    syncBodyModalLock();
    window.showToast('Payment Cancelled', 'Your bag items and address entries are preserved.');
  };

  // Network Offline / Online Monitor with Retry and Auto-Recovery
  let wasNetworkOffline = false;

  function showOfflineBanner() {
    const banner = document.getElementById('offline-atelier-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    requestAnimationFrame(() => {
      banner.classList.remove('is-hidden');
    });
  }

  function hideOfflineBanner() {
    const banner = document.getElementById('offline-atelier-banner');
    if (!banner) return;
    banner.classList.add('is-hidden');
    setTimeout(() => {
      if (banner.classList.contains('is-hidden')) {
        banner.classList.add('hidden');
      }
    }, 400);
  }

  window.dismissOfflineBanner = function () {
    hideOfflineBanner();
  };

  window.retryConnection = async function () {
    const btn = document.getElementById('offline-retry-btn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin" aria-hidden="true">sync</span><span>Checking...</span>';
    }

    let isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isConnected && typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        await fetch(window.location.origin + '/?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        isConnected = true;
      } catch (_e) {
        if (!navigator.onLine) isConnected = false;
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml || '<span class="material-symbols-outlined text-sm" aria-hidden="true">refresh</span><span>Retry Connection</span>';
    }

    if (isConnected) {
      hideOfflineBanner();
      wasNetworkOffline = false;
      window.showToast('Connection Restored', 'Atelier online. Synchronizing studio queue with Cloudflare Edge.');
      if (Store && typeof Store.syncPendingEdgeState === 'function') {
        Store.syncPendingEdgeState();
      }
    } else {
      window.showToast('Still Offline', 'Internet connection not detected yet. Operating in local resilient cache mode.');
    }
  };

  function initNetworkMonitor() {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      wasNetworkOffline = true;
      showOfflineBanner();
      window.showToast('Offline Mode Activated', 'Network lost. Your Studio Bag and checkout forms are saved locally.');
    };

    const handleOnline = () => {
      hideOfflineBanner();
      if (wasNetworkOffline) {
        wasNetworkOffline = false;
        window.showToast('Connection Restored', 'Studio Atelier reconnected. Edge state synchronized.');
        if (Store && typeof Store.syncPendingEdgeState === 'function') {
          Store.syncPendingEdgeState();
        }
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }
  }
  window.initNetworkMonitor = initNetworkMonitor;

  // Programmatic Bridge Live Catalog / Social Drop Helper (Zero owner/admin UI strings)
  window.simulateExternalStudioPush = function () {
    const newId = 'ram-lotus-drop-' + Math.floor(100 + Math.random() * 899);
    Store.receiveStudioPush({
      type: 'STUDIO_LIVE_DROP',
      summary: `Studio Edition "Rose-Gold Anniversary Lotus Clock (${newId})" + New Reel`,
      product: {
        id: newId,
        sku: 'RAM-LOTUS-' + Math.floor(10 + Math.random() * 89),
        name: '24K Rose-Gold Preserved Lotus & Pearl Wall Clock (Atelier Edition)',
        shortName: 'Rose-Gold Lotus Clock',
        subtitle: 'Limited Atelier Edition • Real Preserved Pink Lotus in 3:1 Crystal Resin',
        category: 'keepsakes',
        subCategory: 'floral_preservation',
        relatedCategories: ['casting', 'deep_pour'],
        badge: 'New Studio Edition',
        price: 3499,
        regularPrice: 4299,
        unitPriceLabel: '16" Brass Sweep',
        ratio: '3:1',
        viscosity: 'low',
        pourDepth: '20mm',
        cureTime: '24h',
        potLife: '45m',
        rating: 5.0,
        reviewsCount: 19,
        inStock: true,
        isCustomizable: true,
        image: Store.IMAGES.jewelryBezel,
        gallery: [Store.IMAGES.jewelryBezel, Store.IMAGES.floralCube, Store.IMAGES.coasterSet, Store.IMAGES.geodeCanvas],
        variants: [
          { id: 'lotus-16', label: '16" Lotus Keepsake Clock', desc: 'Silent sweep brass hands + real preserved lotus', price: 3499, regularPrice: 4299, unitPrice: '16 inch', popular: true }
        ],
        specs: {
          mixRatioWeight: '3 : 1 Optical Cast',
          mixRatioVolume: '2.6 : 1',
          workingPotLife: '45 Minutes',
          demoldDuration: '24 Hours',
          fullGlassCure: '72 Hours',
          dynamicViscosity: '650 mPa·s',
          maxDepth: '20mm',
          hardness: '83D',
          uvStability: 'HALS 5+ Yrs'
        }
      },
      socialPost: {
        id: 'post-studio-' + Date.now(),
        handle: '@resin.art.memories',
        authorName: 'Resin Art Memories Atelier',
        avatar: Store.IMAGES.avatarPatron,
        location: 'Bengaluru Preservation Lab',
        timeAgo: 'Just now',
        tag: 'BridalVarmala',
        badge: 'New Studio Reel',
        image: Store.IMAGES.jewelryBezel,
        caption: '✨ NEW ATELIER EDITION: Just finished curing this 24K Rose-Gold Lotus & Bridal Pearl keepsake clock! Available immediately in our studio catalogue.',
        likes: 128,
        saved: false,
        liked: true,
        productId: newId,
        comments: []
      }
    });
    renderActiveView();
    window.showToast('New Atelier Edition Live!', 'Rose-Gold Lotus Clock added to catalogue & community feed');
  };

  window.simulateExternalAdminPush = window.simulateExternalStudioPush;

  // Subscribe to StorefrontBridge programmatic events so external cross-tab / postMessage updates re-render live
  if (Store && typeof Store.subscribe === 'function') {
    Store.subscribe((event) => {
      if (event === 'studio_push_received' || event === 'admin_push_received' || event === 'catalog_reset') {
        renderActiveView();
        updateGlobalBadges();
      }
    });
  }

  // Vistāra Krafts (VK) Vector Splash Screen Controller
  let vkSplashTimer = null;

  window.dismissVkSplash = function () {
    if (vkSplashTimer) {
      clearTimeout(vkSplashTimer);
      vkSplashTimer = null;
    }
    const splash = document.getElementById('vkSplashContainer');
    if (splash) {
      splash.classList.add('splash-dismissed');
    }
  };

  window.replayVkSplash = function () {
    if (vkSplashTimer) {
      clearTimeout(vkSplashTimer);
      vkSplashTimer = null;
    }
    const splash = document.getElementById('vkSplashContainer');
    const logoRoot = document.getElementById('vkLogoRoot');
    if (splash) {
      splash.classList.remove('splash-dismissed');
    }
    if (logoRoot) {
      logoRoot.classList.remove('is-animated');
      // Trigger DOM reflow to restart CSS animations cleanly
      void logoRoot.offsetWidth;
      logoRoot.classList.add('is-animated');
    }
    vkSplashTimer = setTimeout(() => {
      window.dismissVkSplash();
    }, 1000);
  };

  // Digital Personal Data Protection (DPDP) Act 2023 Controller Functions
  window.openDpdpModal = function (tab) {
    ['dpdp-notice-modal', 'dpdp-preferences-modal', 'dpdp-grievance-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const targetId = tab === 'preferences' ? 'dpdp-preferences-modal' :
                     tab === 'grievance' ? 'dpdp-grievance-modal' : 'dpdp-notice-modal';
    const modal = document.getElementById(targetId);
    if (!modal) return;

    if (tab === 'preferences') {
      const consent = ResinStore.getDpdpConsent();
      const analyticsEl = document.getElementById('dpdp-pref-analytics');
      const marketingEl = document.getElementById('dpdp-pref-marketing');
      const ageEl = document.getElementById('dpdp-pref-age');
      if (analyticsEl) analyticsEl.checked = Boolean(consent.categories && consent.categories.analyticsSession);
      if (marketingEl) marketingEl.checked = Boolean(consent.categories && consent.categories.marketingPromos);
      if (ageEl) ageEl.checked = Boolean(consent.age18PlusVerified);
    }

    if (tab === 'grievance') {
      window.renderDpdpTickets();
    }

    modal.classList.remove('hidden');
    syncBodyModalLock();
  };

  window.acceptDpdpBanner = function () {
    ResinStore.saveDpdpConsent({
      categories: { orderFulfillment: true, analyticsSession: true, marketingPromos: false },
      age18PlusVerified: true
    });
    const banner = document.getElementById('dpdp-consent-banner');
    if (banner) banner.classList.add('hidden');
    window.showToast('DPDP Consent Saved', 'Your privacy choices have been updated.');
  };

  window.saveDpdpPreferencesForm = function (ev) {
    if (ev) ev.preventDefault();
    const analyticsEl = document.getElementById('dpdp-pref-analytics');
    const marketingEl = document.getElementById('dpdp-pref-marketing');
    const ageEl = document.getElementById('dpdp-pref-age');

    ResinStore.saveDpdpConsent({
      categories: {
        orderFulfillment: true,
        analyticsSession: Boolean(analyticsEl ? analyticsEl.checked : true),
        marketingPromos: Boolean(marketingEl ? marketingEl.checked : false)
      },
      age18PlusVerified: Boolean(ageEl ? ageEl.checked : true)
    });

    window.closeModalById('dpdp-preferences-modal');
    const banner = document.getElementById('dpdp-consent-banner');
    if (banner) banner.classList.add('hidden');
    window.showToast('Preferences Saved', 'DPDP Act 2023 consent preferences updated.');
  };

  window.withdrawDpdpConsent = function () {
    ResinStore.saveDpdpConsent({
      categories: { orderFulfillment: true, analyticsSession: false, marketingPromos: false },
      age18PlusVerified: true
    });
    const analyticsEl = document.getElementById('dpdp-pref-analytics');
    const marketingEl = document.getElementById('dpdp-pref-marketing');
    if (analyticsEl) analyticsEl.checked = false;
    if (marketingEl) marketingEl.checked = false;

    window.closeModalById('dpdp-preferences-modal');
    window.showToast('Consents Withdrawn', 'Optional processing consents have been revoked.');
  };

  window.toggleDpdpNoticeLang = function (lang) {
    const enContainer = document.getElementById('dpdp-notice-content-en');
    const hiContainer = document.getElementById('dpdp-notice-content-hi');
    const enBtn = document.getElementById('dpdp-lang-en-btn');
    const hiBtn = document.getElementById('dpdp-lang-hi-btn');

    if (lang === 'hi') {
      if (enContainer) enContainer.classList.add('hidden');
      if (hiContainer) hiContainer.classList.remove('hidden');
      if (enBtn) {
        enBtn.className = 'min-h-[36px] px-3 rounded-lg bg-white border border-[#e4e0d8] text-primary hover:bg-surface-container text-[11px] font-bold cursor-pointer transition';
      }
      if (hiBtn) {
        hiBtn.className = 'min-h-[36px] px-3 rounded-lg bg-primary text-white text-[11px] font-bold cursor-pointer transition';
      }
    } else {
      if (hiContainer) hiContainer.classList.add('hidden');
      if (enContainer) enContainer.classList.remove('hidden');
      if (hiBtn) {
        hiBtn.className = 'min-h-[36px] px-3 rounded-lg bg-white border border-[#e4e0d8] text-primary hover:bg-surface-container text-[11px] font-bold cursor-pointer transition';
      }
      if (enBtn) {
        enBtn.className = 'min-h-[36px] px-3 rounded-lg bg-primary text-white text-[11px] font-bold cursor-pointer transition';
      }
    }
  };

  window.submitDpdpGrievanceForm = function (ev) {
    if (ev) ev.preventDefault();
    const typeEl = document.getElementById('dpdp-req-type');
    const nameEl = document.getElementById('dpdp-req-name');
    const emailEl = document.getElementById('dpdp-req-email');
    const mobileEl = document.getElementById('dpdp-req-mobile');
    const orderIdEl = document.getElementById('dpdp-req-orderid');
    const detailsEl = document.getElementById('dpdp-req-details');

    const ticket = ResinStore.submitDpdpTicket({
      requestType: typeEl ? typeEl.value : 'Grievance Redressal',
      fullName: nameEl ? nameEl.value : '',
      email: emailEl ? emailEl.value : '',
      mobile: mobileEl ? mobileEl.value : '',
      orderId: orderIdEl ? orderIdEl.value : '',
      details: detailsEl ? detailsEl.value : ''
    });

    window.renderDpdpTickets();
    window.showToast('Grievance Ticket Raised', `Ticket ${ticket.ticketId} assigned (7-Day SLA)`);
    if (ev && ev.target && ev.target.reset) ev.target.reset();
  };

  window.renderDpdpTickets = function () {
    const listEl = document.getElementById('dpdp-ticket-list');
    const slotEl = document.getElementById('dpdp-ticket-history-slot');
    if (!listEl || !slotEl) return;

    const tickets = ResinStore.getDpdpTickets();
    if (tickets.length === 0) {
      slotEl.classList.add('hidden');
      return;
    }

    slotEl.classList.remove('hidden');
    listEl.innerHTML = tickets.map(t => `
      <div class="p-3 rounded-xl bg-surface-container-low border border-[#e4e0d8] space-y-1">
        <div class="flex items-center justify-between gap-2">
          <span class="font-bold text-primary text-xs font-spec-numeral">${esc(t.ticketId)}</span>
          <span class="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">${esc(t.status)}</span>
        </div>
        <p class="text-[11px] font-semibold text-primary truncate">${esc(t.requestType)}</p>
        <p class="text-[10px] text-on-surface-variant line-clamp-2">${esc(t.details)}</p>
        <div class="text-[10px] text-on-surface-variant/80 pt-1 border-t border-surface-container flex items-center justify-between gap-2">
          <span>Submitted: ${esc(t.timestamp)}</span>
          <span>DPO SLA: 7 Days</span>
        </div>
      </div>
    `).join('');
  };

  window.exportDpdpUserData = function () {
    const data = ResinStore.exportUserDataSummary();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vistara_krafts_dpdp_user_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast('Data Export Complete', 'Downloaded your DPDP Act 2023 summary file.');
  };

  window.eraseDpdpUserData = function () {
    if (!confirm('DPDP Section 12 Deletion Confirmation:\nAre you sure you want to erase all your saved profile details, cart, and wishlist from this browser session?')) {
      return;
    }
    ResinStore.eraseUserData();
    window.closeModalById('dpdp-grievance-modal');
    const banner = document.getElementById('dpdp-consent-banner');
    if (banner) banner.classList.remove('hidden');
    window.showToast('Personal Data Erased', 'Your local session profile & saved items were cleared.');
  };

  // Global Escape key listener + Keyboard Tab Focus Trap inside active modals
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      const splash = document.getElementById('vkSplashContainer');
      if (splash && !splash.classList.contains('splash-dismissed')) {
        window.dismissVkSplash();
        return;
      }
      let closedAny = false;
      MODAL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) {
          el.classList.add('hidden');
          closedAny = true;
        }
      });
      if (closedAny) syncBodyModalLock();
      return;
    }

    if (ev.key === 'Tab') {
      const openModalId = MODAL_IDS.find(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
      });
      if (!openModalId) return;
      const modalEl = document.getElementById(openModalId);
      if (!modalEl) return;
      const focusable = Array.from(
        modalEl.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (ev.shiftKey) {
        if (document.activeElement === firstEl || !modalEl.contains(document.activeElement)) {
          ev.preventDefault();
          lastEl.focus({ preventScroll: true });
        }
      } else {
        if (document.activeElement === lastEl || !modalEl.contains(document.activeElement)) {
          ev.preventDefault();
          firstEl.focus({ preventScroll: true });
        }
      }
    }
  });

  // Global image fallback handler to prevent raw broken image icons
  document.addEventListener('error', (ev) => {
    const target = ev.target;
    if (target && target.tagName === 'IMG' && !target.dataset.fallbackApplied) {
      target.dataset.fallbackApplied = 'true';
      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f4f0e8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='serif' font-size='20' fill='%23002444'%3EVist%C4%81ra Krafts%3C/text%3E%3C/svg%3E";
    }
  }, true);

  // Initialize on DOMContentLoaded
  window.addEventListener('hashchange', handleRouteChange);
  document.addEventListener('DOMContentLoaded', () => {
    initNetworkMonitor();
    handleRouteChange();
    // Start auto-dismiss timer for Vistāra Krafts vector splash animation (1.0s animation + 0.3s fade = 1.3s total)
    vkSplashTimer = setTimeout(() => {
      window.dismissVkSplash();
    }, 1000);

    // Check DPDP Consent State on initial load
    try {
      const dpdpConsent = ResinStore.getDpdpConsent();
      if (!dpdpConsent.accepted) {
        const banner = document.getElementById('dpdp-consent-banner');
        if (banner) banner.classList.remove('hidden');
      }
    } catch (e) {
      console.warn('DPDP consent init:', e);
    }

    // Live store subscriptions (products, orders, carts updated from admin)
    Store.subscribe((event) => {
      if (event === 'products_updated' || event === 'studio_push_received') {
        renderActiveView({ preserveScroll: true });
      }
    });
  });
})();

