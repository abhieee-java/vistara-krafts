import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('.');

function setupStorefrontEnvironment(initialOrders = []) {
  const storeBridgeCode = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
  const supabaseConfigCode = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');

  const storageMock = {};
  if (initialOrders && initialOrders.length > 0) {
    storageMock['ram_vk_orders_v2'] = JSON.stringify(initialOrders);
  }

  const mockLocalStorage = {
    getItem: (k) => (k in storageMock ? storageMock[k] : null),
    setItem: (k, v) => { storageMock[k] = String(v); },
    removeItem: (k) => { delete storageMock[k]; },
    clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
  };

  const remoteDb = new Map();

  const mockSupabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    rpc: async (fnName, params) => {
      if (fnName === 'get_storefront_orders') {
        const orderNumbers = params?.p_order_numbers || [];
        const matches = Array.from(remoteDb.values()).filter(o =>
          orderNumbers.includes(o.order_number) || orderNumbers.includes(o.id)
        );
        return { data: matches, error: null };
      }
      return { data: [], error: null };
    },
    from: (table) => ({
      select: () => ({
        order: () => ({
          in: (col, list) => {
            const matches = Array.from(remoteDb.values()).filter(o => list.includes(o[col]));
            return Promise.resolve({ data: matches, error: null });
          }
        })
      })
    })
  };

  const sandbox = {
    window: {},
    document: {
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null
    },
    localStorage: mockLocalStorage,
    console: { log: () => {}, warn: () => {}, info: () => {}, error: () => {} },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    BroadcastChannel: class { postMessage() {} close() {} },
    __VK_TEST_ENV__: true
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(supabaseConfigCode, sandbox);
  sandbox.VistaraSupabase.getClient = () => mockSupabaseClient;
  sandbox.VistaraSupabase.isConfigured = () => true;
  vm.runInContext(storeBridgeCode, sandbox);

  return { Store: sandbox.StorefrontBridge, remoteDb, storageMock };
}

test('Admin to Storefront Order Status Sync: Full Lifecycle', async () => {
  const initialLocalOrder = {
    orderId: 'VK-2026-9090',
    orderNumber: 'VK-2026-9090',
    total: 1299,
    orderStatus: 'new',
    status: 'Order Confirmed',
    date: '18 Nov 2026'
  };

  const { Store, remoteDb } = setupStorefrontEnvironment([initialLocalOrder]);

  // Initial state in remote Supabase database
  remoteDb.set('VK-2026-9090', {
    id: 'ord_sync_test_01',
    order_number: 'VK-2026-9090',
    order_status: 'new',
    stage_index: 1,
    total: 1299,
    customer_name: 'Pooja Nair',
    customer_email: 'pooja.nair@example.com',
    items: [{ productName: 'Deep Pour Epoxy Resin 2:1', quantity: 1, unitPrice: 1299 }],
    created_at: new Date().toISOString()
  });

  // 1. Initial sync: order status is 'new'
  let synced = await Store.syncOrdersFromSupabase();
  assert.strictEqual(synced[0].orderStatus, 'new');
  assert.ok(synced[0].status.includes('Confirmed'));

  // 2. Admin advances status to 'processing'
  remoteDb.set('VK-2026-9090', {
    ...remoteDb.get('VK-2026-9090'),
    order_status: 'processing',
    stage_index: 2
  });
  synced = await Store.syncOrdersFromSupabase();
  assert.strictEqual(synced[0].orderStatus, 'processing');
  assert.strictEqual(synced[0].stageIndex, 1);
  assert.ok(synced[0].status.includes('Prepped in Studio'));

  // 3. Admin advances status to 'packed'
  remoteDb.set('VK-2026-9090', {
    ...remoteDb.get('VK-2026-9090'),
    order_status: 'packed',
    stage_index: 4
  });
  synced = await Store.syncOrdersFromSupabase();
  assert.strictEqual(synced[0].orderStatus, 'packed');
  assert.ok(synced[0].status.includes('Packed & Ready'));

  // 4. Admin advances status to 'shipped' with tracking number
  remoteDb.set('VK-2026-9090', {
    ...remoteDb.get('VK-2026-9090'),
    order_status: 'shipped',
    stage_index: 5,
    courier: 'BlueDart Air Express',
    tracking_number: 'BLUEDART-882910'
  });
  synced = await Store.syncOrdersFromSupabase();
  assert.strictEqual(synced[0].orderStatus, 'shipped');
  assert.strictEqual(synced[0].trackingNumber, 'BLUEDART-882910');
  assert.strictEqual(synced[0].courier, 'BlueDart Air Express');
  assert.ok(synced[0].status.includes('Dispatched via BlueDart Air Express'));

  // 5. Admin advances status to 'delivered'
  remoteDb.set('VK-2026-9090', {
    ...remoteDb.get('VK-2026-9090'),
    order_status: 'delivered',
    stage_index: 6
  });
  synced = await Store.syncOrdersFromSupabase();
  assert.strictEqual(synced[0].orderStatus, 'delivered');
  assert.ok(synced[0].status.includes('Delivered'));
});
