import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../server/config.js';
import { OrderService } from '../server/order-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKER_SCRIPT = path.resolve(__dirname, 'payment-worker.mjs');

let passedCount = 0;
let failedCount = 0;

/**
 * Execute worker action in an independent OS process (zero shared heap/memory)
 */
function runWorkerInstance(action, payload) {
  return new Promise((resolve, reject) => {
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const child = fork(WORKER_SCRIPT, [
      `--action=${action}`,
      `--payload=${encodedPayload}`
    ], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      const marker = '__WORKER_RESULT__';
      const idx = stdout.indexOf(marker);
      if (idx !== -1) {
        try {
          const jsonStr = stdout.substring(idx + marker.length).trim();
          const parsed = JSON.parse(jsonStr);
          return resolve(parsed);
        } catch (e) {
          return reject(new Error('Failed to parse worker output: ' + stdout));
        }
      }
      if (code !== 0) {
        return reject(new Error(`Worker exited with code ${code}: ${stderr || stdout}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Direct Supabase helpers
 */
async function getSupabaseOrder(identifier) {
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_order_by_identifier`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_identifier: identifier })
  });
  if (!res.ok) throw new Error('Failed to query order: ' + await res.text());
  return await res.json();
}

async function getSupabasePayments(identifier) {
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_payments_by_order`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_order_id: identifier })
  });
  if (!res.ok) throw new Error('Failed to query payments: ' + await res.text());
  return await res.json();
}

async function querySupabaseRest(endpoint) {
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  if (!res.ok) throw new Error(`Supabase query failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

async function test(title, fn) {
  console.log(`\n======================================================`);
  console.log(`RUNNING: ${title}`);
  console.log(`======================================================`);
  try {
    await fn();
    console.log(`>>> PASS: ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`>>> FAIL: ${title}`);
    console.error(err);
    failedCount++;
  }
}

// ============================================================================
// CASE 1: BROWSER CLOSED BEFORE VERIFICATION (WEBHOOK-ONLY COMPLETION)
// ============================================================================
await test('CASE 1: Browser closed before verification (Webhook fulfills order & writes payment/inventory to Supabase)', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Aarav Singhania',
    phone: '9876543210',
    address: 'Flat 402, Royal Residency, Indiranagar',
    pincode: '560038',
    email: 'aarav.webhook.only@vistarakrafts.com',
    items: [{ productId: 'vk-cat-acc-stnd', qty: 1 }]
  });

  const rzpOrderId = orderRes.razorpayOrderId;
  const orderNumber = orderRes.orderId;
  const paymentId = 'pay_case1_' + Date.now();

  console.log(`[Case 1] Order created: ${orderNumber} | RZP: ${rzpOrderId}`);

  // Initial DB check: Order must exist and start pending
  const initialOrder = await getSupabaseOrder(orderNumber);
  assert.ok(initialOrder, 'Initial order must exist in Supabase');
  assert.strictEqual(initialOrder.payment_status, 'pending', 'Initial payment status must be pending');

  // Customer paid on gateway, but BROWSER WAS CLOSED (verifyPayment is NEVER called!)
  console.log('[Case 1] Browser tab was closed by user immediately after payment. Zero client verify called.');

  // Razorpay delivers asynchronous webhook to independent server instance
  const webhookBody = JSON.stringify({
    id: 'evt_case1_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: rzpOrderId,
          amount: orderRes.amount,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  });

  const webhookSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');

  // Process in a separate worker instance (zero memory shared with caller)
  const workerResult = await runWorkerInstance('handleWebhook', {
    rawBody: webhookBody,
    signature: webhookSig
  });

  assert.strictEqual(workerResult.success, true, 'Webhook must process successfully in worker instance');

  // VERIFY ACTUAL SUPABASE ROWS
  const supaOrder = await getSupabaseOrder(orderNumber);
  assert.ok(supaOrder, 'Order must exist in Supabase');
  assert.strictEqual(supaOrder.payment_status, 'paid', 'Supabase orders row must transition to paid');
  assert.strictEqual(supaOrder.order_status, 'processing', 'Supabase orders row order_status must be processing');

  const supaPayments = await getSupabasePayments(paymentId);
  assert.strictEqual(supaPayments.length, 1, 'Supabase payments row must be inserted by webhook');
  assert.strictEqual(supaPayments[0].status, 'captured', 'Supabase payments row status must be captured');
  assert.strictEqual(supaPayments[0].order_id, supaOrder.id, 'Supabase payment must link to correct order id');

  const supaLogs = await querySupabaseRest(`inventory_logs?notes=like.*${encodeURIComponent(orderNumber)}*&select=*`);
  assert.strictEqual(supaLogs.length, 1, 'Supabase inventory_logs must record exactly 1 sale for this order');
  assert.strictEqual(supaLogs[0].change, -1, 'Supabase inventory_logs change must be -1');

  console.log(`[Case 1 Verified] Order: ${supaOrder.order_number} (${supaOrder.payment_status}) | Payment: ${supaPayments[0].payment_id} (${supaPayments[0].status}) | Inv Log: ${supaLogs[0].change} units`);
});

// ============================================================================
// CASE 2: REPLAY WEBHOOK WHILE VERIFICATION IS RUNNING (CROSS-INSTANCE CONCURRENCY)
// ============================================================================
await test('CASE 2: Replay webhook while verification is running across separate OS instances (Idempotent exactly-once state)', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Diya Sen',
    phone: '9123456780',
    address: '88 Park Street, Kolkata',
    pincode: '700016',
    email: 'diya.concurrent@vistarakrafts.com',
    items: [{ productId: 'vk-cat-acc-stnd', qty: 1 }]
  });

  const rzpOrderId = orderRes.razorpayOrderId;
  const orderNumber = orderRes.orderId;
  const paymentId = 'pay_case2_race_' + Date.now();

  const clientSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
    .update(`${rzpOrderId}|${paymentId}`)
    .digest('hex');

  const webhookBody = JSON.stringify({
    id: 'evt_case2_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: rzpOrderId,
          amount: orderRes.amount,
          currency: 'INR',
          status: 'captured',
          method: 'netbanking'
        }
      }
    }
  });

  const webhookSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');

  console.log(`[Case 2] Firing verification (Instance A) and Webhook (Instance B) simultaneously across separate OS processes...`);

  // Run in TWO SEPARATE OS INSTANCES concurrently
  const [verifyResult, webhookResult] = await Promise.all([
    runWorkerInstance('verifyPayment', {
      orderId: orderNumber,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: clientSig,
      mockGatewayPayment: { amount: orderRes.amount, method: 'netbanking' }
    }),
    runWorkerInstance('handleWebhook', {
      rawBody: webhookBody,
      signature: webhookSig
    })
  ]);

  console.log('[Case 2] Instance A (verifyPayment):', verifyResult.success ? 'SUCCESS' : verifyResult.error);
  console.log('[Case 2] Instance B (handleWebhook):', webhookResult.success ? 'SUCCESS' : webhookResult.error);

  assert.strictEqual(verifyResult.success || webhookResult.success, true, 'At least one handler must succeed');

  // VERIFY ACTUAL SUPABASE ROWS
  const supaOrder = await getSupabaseOrder(orderNumber);
  assert.ok(supaOrder, 'Supabase orders row must exist');
  assert.strictEqual(supaOrder.payment_status, 'paid', 'Supabase order must be marked paid');

  const supaPayments = await getSupabasePayments(paymentId);
  assert.strictEqual(supaPayments.length, 1, 'Supabase payments table must have EXACTLY 1 row (zero duplicate payments)');

  const supaLogs = await querySupabaseRest(`inventory_logs?notes=like.*${encodeURIComponent(orderNumber)}*&select=*`);
  assert.strictEqual(supaLogs.length, 1, 'Supabase inventory_logs must have EXACTLY 1 deduction (no double-deduction under race condition)');

  console.log(`[Case 2 Verified] Orders: 1 (${supaOrder.payment_status}) | Payments: ${supaPayments.length} | Inv Deductions: ${supaLogs.length}`);
});

// ============================================================================
// CASE 3: SIMULATE A FAILED DATABASE WRITE & RETRY RECOVERY
// ============================================================================
await test('CASE 3: Simulate a failed database write and recover via webhook replay', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Kavita Pillai',
    phone: '9845012345',
    address: '42 Marine Drive, Kochi',
    pincode: '682001',
    email: 'kavita.dbfailure@vistarakrafts.com',
    items: [{ productId: 'vk-cat-acc-stnd', qty: 1 }]
  });

  const rzpOrderId = orderRes.razorpayOrderId;
  const orderNumber = orderRes.orderId;
  const paymentId = 'pay_case3_dberr_' + Date.now();

  const webhookBody = JSON.stringify({
    id: 'evt_case3_retryable_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: rzpOrderId,
          amount: orderRes.amount,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  });

  const webhookSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');

  // Step 1: Simulate transient database write outage
  console.log('[Case 3] Simulating transient DB write failure during webhook processing...');
  const originalRpc = OrderService.supabaseRpc;
  OrderService.supabaseRpc = async function(fnName, params) {
    if (fnName === 'reconcile_order_payment') {
      return { error: 'Simulated 503: Postgres connection timeout / transient write barrier', status: 503 };
    }
    return originalRpc.call(this, fnName, params);
  };

  // Webhook must fail cleanly with error (informing Razorpay to retry)
  await assert.rejects(
    async () => {
      await OrderService.handleWebhook(webhookBody, webhookSig);
    },
    /Database write error/,
    'Webhook must propagate database write error instead of hiding failure'
  );

  // Verify that the order remains pending in Supabase (not corrupted)
  const pendingOrder = await getSupabaseOrder(orderNumber);
  assert.strictEqual(pendingOrder.payment_status, 'pending', 'Order must remain pending after failed DB write');

  // Step 2: Database recovers
  console.log('[Case 3] Database restored. Replaying webhook (Razorpay exponential backoff retry)...');
  OrderService.supabaseRpc = originalRpc;

  // Replay the webhook on recovered database
  const retryResult = await OrderService.handleWebhook(webhookBody, webhookSig);
  assert.strictEqual(retryResult.success, true, 'Webhook retry must succeed upon database recovery');

  // VERIFY ACTUAL SUPABASE ROWS
  const supaOrder = await getSupabaseOrder(orderNumber);
  assert.strictEqual(supaOrder.payment_status, 'paid', 'Order successfully transitioned to paid after retry');

  const supaPayments = await getSupabasePayments(paymentId);
  assert.strictEqual(supaPayments.length, 1, 'Payment ledger entry successfully written on recovery');

  const supaLogs = await querySupabaseRest(`inventory_logs?notes=like.*${encodeURIComponent(orderNumber)}*&select=*`);
  assert.strictEqual(supaLogs.length, 1, 'Inventory log written on recovery');

  console.log(`[Case 3 Verified] DB Write Failure handled safely -> Webhook replay successfully recovered Order ${orderNumber} to paid!`);
});

// ============================================================================
// CASE 4: TWO BUYERS COMPETE FOR THE LAST UNIT (ATOMIC CONCURRENCY & OVERSELL PREVENTION)
// ============================================================================
await test('CASE 4: Two buyers compete for the last unit (Atomic Postgres lock prevents oversell)', async () => {
  const TEST_PRODUCT_ID = 'prod_test_compete_1unit';

  // 1. Force exact stock = 1 in Supabase (upsert test product)
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: TEST_PRODUCT_ID,
      sku: 'SKU-COMPETE-1UNIT',
      name: 'Limited Edition Competitor Piece',
      brand: 'Vistāra Krafts',
      category: 'keepsakes',
      price: 1500,
      stock: 1,
      low_stock_threshold: 1,
      in_stock: true,
      status: 'active',
      featured: false,
      is_customizable: false,
      image: 'https://res.cloudinary.com/ecugysfd/image/upload/v1/test.jpg',
      gallery: [],
      variants: [],
      specs: {},
      colors: [],
      shapes: [],
      sizes: [],
      gender: 'all',
      gender_affinity: 'neutral',
      gifting_tags: [],
      is_active: true
    })
  });

  const checkInitialProd = await querySupabaseRest(`products?id=eq.${TEST_PRODUCT_ID}&select=id,stock,in_stock`);
  assert.strictEqual(checkInitialProd[0].stock, 1, 'Product must have exactly 1 unit remaining');
  assert.strictEqual(checkInitialProd[0].in_stock, true, 'Product in_stock must be true');

  console.log(`[Case 4] Product ${TEST_PRODUCT_ID} confirmed initialized with stock = 1.`);

  // 2. Buyer A and Buyer B both initiate checkout
  const [buyerA_Order, buyerB_Order] = await Promise.all([
    OrderService.createCheckoutOrder({
      name: 'Buyer A (Arjun)',
      phone: '9811122233',
      address: 'Suite 101, Delhi',
      pincode: '110001',
      email: 'buyer.a.race@vistarakrafts.com',
      items: [{ productId: TEST_PRODUCT_ID, qty: 1 }]
    }),
    OrderService.createCheckoutOrder({
      name: 'Buyer B (Bhavna)',
      phone: '9822233344',
      address: 'Suite 202, Mumbai',
      pincode: '400001',
      email: 'buyer.b.race@vistarakrafts.com',
      items: [{ productId: TEST_PRODUCT_ID, qty: 1 }]
    })
  ]);

  const payA = 'pay_compete_A_' + Date.now();
  const payB = 'pay_compete_B_' + Date.now();

  const sigA = crypto.createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET).update(`${buyerA_Order.razorpayOrderId}|${payA}`).digest('hex');
  const sigB = crypto.createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET).update(`${buyerB_Order.razorpayOrderId}|${payB}`).digest('hex');

  console.log('[Case 4] Buyer A and Buyer B simultaneously complete payment and attempt to claim last unit...');

  // 3. Both compete simultaneously for the last unit across separate instances
  const [resultA, resultB] = await Promise.all([
    runWorkerInstance('verifyPayment', {
      orderId: buyerA_Order.orderId,
      razorpay_order_id: buyerA_Order.razorpayOrderId,
      razorpay_payment_id: payA,
      razorpay_signature: sigA,
      mockGatewayPayment: { amount: buyerA_Order.amount, method: 'upi' }
    }),
    runWorkerInstance('verifyPayment', {
      orderId: buyerB_Order.orderId,
      razorpay_order_id: buyerB_Order.razorpayOrderId,
      razorpay_payment_id: payB,
      razorpay_signature: sigB,
      mockGatewayPayment: { amount: buyerB_Order.amount, method: 'upi' }
    })
  ]);

  console.log('[Case 4 Result Buyer A]:', resultA);
  console.log('[Case 4 Result Buyer B]:', resultB);

  // Exactly one must succeed with confirmed paid status, and the other must be out of stock
  const isOnePaid = (resultA.paymentStatus === 'paid' && resultB.status === 'out_of_stock') ||
                    (resultB.paymentStatus === 'paid' && resultA.status === 'out_of_stock') ||
                    (resultA.paymentStatus === 'paid' && resultB.success === false) ||
                    (resultB.paymentStatus === 'paid' && resultA.success === false);

  assert.strictEqual(isOnePaid, true, 'Exactly ONE buyer must claim the last unit; the other must fail with OUT_OF_STOCK');

  // VERIFY ACTUAL SUPABASE ROWS
  const finalProd = await querySupabaseRest(`products?id=eq.${TEST_PRODUCT_ID}&select=id,stock,in_stock`);
  console.log('[Case 4 Final Product in Supabase]:', finalProd[0]);

  assert.strictEqual(finalProd[0].stock, 0, 'Supabase stock must be exactly 0 (never negative)');
  assert.strictEqual(finalProd[0].in_stock, false, 'Supabase in_stock must automatically be false');

  const winningOrderNumber = resultA.paymentStatus === 'paid' ? buyerA_Order.orderId : buyerB_Order.orderId;
  const losingOrderNumber = resultA.paymentStatus === 'paid' ? buyerB_Order.orderId : buyerA_Order.orderId;

  const winningLogs = await querySupabaseRest(`inventory_logs?notes=like.*${encodeURIComponent(winningOrderNumber)}*&select=*`);
  const losingLogs = await querySupabaseRest(`inventory_logs?notes=like.*${encodeURIComponent(losingOrderNumber)}*&select=*`);

  console.log(`[Case 4 Inventory Logs Count]: ${winningLogs.length} sale recorded for winning order ${winningOrderNumber}, ${losingLogs.length} for rejected order ${losingOrderNumber}`);
  assert.strictEqual(winningLogs.length, 1, 'Supabase inventory_logs must contain exactly 1 sale deduction for winning buyer');
  assert.strictEqual(losingLogs.length, 0, 'Supabase inventory_logs must contain 0 deductions for rejected buyer');

  console.log(`[Case 4 Verified] Zero overselling: 1 Buyer won, 1 Buyer rejected, Stock = 0, in_stock = false!`);
});

console.log('\n======================================================');
console.log(`ALL 4 LIFECYCLE, CONCURRENCY & RECOVERY CASES COMPLETED!`);
console.log(`PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
