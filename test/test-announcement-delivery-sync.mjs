import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = process.cwd();

async function run() {
  console.log('========================================================================');
  console.log('VISTĀRA KRAFTS — ANNOUNCEMENT BAR DELIVERY PRICE SYNCHRONIZATION TEST');
  console.log('========================================================================\n');

  const storageMap = new Map();
  const mockLocalStorage = {
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear()
  };

  const elementsById = new Map();
  const elementsByClass = new Map();

  function makeMockElement(id = '', classesList = []) {
    const classes = new Set(classesList);
    const el = {
      id,
      innerHTML: '',
      textContent: '',
      style: {},
      classList: {
        add: (...c) => c.forEach(x => classes.add(x)),
        remove: (...c) => c.forEach(x => classes.delete(x)),
        contains: (c) => classes.has(c)
      }
    };
    if (id) elementsById.set(id, el);
    classesList.forEach(c => {
      if (!elementsByClass.has(c)) elementsByClass.set(c, []);
      elementsByClass.get(c).push(el);
    });
    return el;
  }

  const topBar = makeMockElement('top-announcement-bar');
  const annText = makeMockElement('announcement-text', ['js-announcement-headline']);
  const annDup = makeMockElement('announcement-text-dup', ['js-announcement-headline']);

  const mockDocument = {
    getElementById: (id) => elementsById.get(id) || null,
    querySelectorAll: (selector) => {
      if (selector.includes('.js-announcement-headline') || selector.includes('#announcement-text')) {
        return [annText, annDup];
      }
      return [];
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const sandbox = {
    window: {},
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    URLSearchParams,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    __VK_DISABLE_SUPABASE_AUTO_SYNC__: true
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);

  const bridgeSrc = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
  vm.runInContext(bridgeSrc, sandbox);

  const Store = sandbox.StorefrontBridge;
  assert(Store, 'StorefrontBridge must be initialized');

  console.log('Test 1: applyAnnouncementBar with raw text containing ₹1,999 and threshold 2500');
  Store.applyAnnouncementBar('✨ Festive Atelier Drop: Free Pan-India Express Delivery on Orders Over ₹1,999', true, 2500);
  console.log('Announcement HTML:', annText.innerHTML);
  assert(annText.innerHTML.includes('₹2,500'), 'Announcement must contain ₹2,500');
  console.log('✅ PASS: Custom promotion announcement synced to ₹2,500');

  console.log('Test 2: applyAnnouncementBar with threshold 999');
  Store.applyAnnouncementBar('✨ Festive Atelier Drop: Free Pan-India Express Delivery on Orders Over ₹1,999', true, 999);
  console.log('Announcement HTML:', annText.innerHTML);
  assert(annText.innerHTML.includes('₹999'), 'Announcement must contain ₹999');
  console.log('✅ PASS: Custom promotion announcement synced to ₹999');

  console.log('Test 3: applyAnnouncementBar with marquee format and threshold 3500');
  Store.applyAnnouncementBar('Vistāra Krafts • 24h Bridal Varmala Pickup • Free Express Shipping > ₹999 • 18% GST ITC', true, 3500);
  console.log('Announcement HTML:', annText.innerHTML);
  assert(annText.innerHTML.includes('₹3,500'), 'Announcement must contain ₹3,500');
  console.log('✅ PASS: Marquee announcement synced to ₹3,500');

  console.log('Test 4: Supabase syncSettingsFromSupabase syncs threshold to announcement bar');
  sandbox.fetch = async (url) => {
    if (url.includes('/rest/v1/settings')) {
      return {
        ok: true,
        json: async () => [
          {
            key: 'shipping',
            value: { free_shipping_threshold: 2500, default_courier: 'Delhivery Express' }
          },
          {
            key: 'announcement_bar',
            value: { text: '✨ Festive Atelier Drop: Free Pan-India Express Delivery on Orders Over ₹1,999', enabled: true }
          },
          {
            key: 'store_info',
            value: { name: 'Vistāra Krafts' }
          }
        ]
      };
    }
    return { ok: true, json: async () => [] };
  };

  await Store.syncSettingsFromSupabase();
  console.log('Announcement HTML after Supabase sync:', annText.innerHTML);
  assert(annText.innerHTML.includes('₹2,500'), 'Announcement must contain ₹2,500 after Supabase sync');
  console.log('✅ PASS: Supabase syncSettingsFromSupabase strictly updated announcement bar with ₹2,500');

  console.log('\n========================================================================');
  console.log('ALL ANNOUNCEMENT BAR DELIVERY PRICE TESTS PASSED! (4/4 Passed)');
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
