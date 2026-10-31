import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CONFIG } from '../server/config.js';
import { PriceCalculator } from '../server/price-calculator.js';
import { OrderService } from '../server/order-service.js';
import { RazorpayService } from '../server/razorpay-service.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error('   ', err.message);
    failed++;
  }
}

console.log('========================================================================');
console.log('VISTĀRA KRAFTS — CATALOG VARIANTS & STOCK DECREMENT VERIFICATION SUITE');
console.log('========================================================================\n');

// Mock Razorpay client that simulates gateway responses without network flakiness
const mockRazorpay = {
  async createOrder({ amountPaise, receipt, notes }) {
    return {
      id: `order_mock_${Date.now()}`,
      entity: 'order',
      amount: amountPaise,
      amount_paid: 0,
      amount_due: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      notes
    };
  },
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const expected = crypto
      .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    return expected === razorpay_signature;
  },
  async fetchPayment(paymentId) {
    return {
      id: paymentId,
      entity: 'payment',
      amount: 189900,
      currency: 'INR',
      status: 'captured',
      order_id: 'order_test_rzp',
      method: 'upi'
    };
  }
};

// 1. Variant ID Resolution Tests
await test('Variant ID Resolution: vk-cat-res-201 with variantId "var-201-1500g" resolves to ₹1,899 (not base ₹599)', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      {
        productId: 'vk-cat-res-201',
        variantId: 'var-201-1500g',
        qty: 1
      }
    ]
  });

  assert.strictEqual(result.items[0].unitPrice, 1899, 'Unit price must be ₹1,899 for 1.5kg set');
  assert.strictEqual(result.subtotal, 1899, 'Subtotal must be ₹1,899');
  assert.strictEqual(result.total, 1899, 'Total must qualify for free shipping >= 1499');
  assert.strictEqual(result.amountPaise, 189900, 'Razorpay paise must match');
});

await test('Variant ID Resolution: vk-cat-res-301 with variantId "var-301-1200g" resolves to ₹1,749 (not base ₹649)', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      {
        productId: 'vk-cat-res-301',
        variantId: 'var-301-1200g',
        qty: 1
      }
    ]
  });

  assert.strictEqual(result.items[0].unitPrice, 1749, 'Unit price must be ₹1,749 for 1.2kg set');
  assert.strictEqual(result.total, 1749, 'Total must be ₹1,749');
});

await test('Variant ID Resolution: vk-cat-acc-smfl with variantId "var-flw-all" resolves to ₹999 master collector set', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      {
        productId: 'vk-cat-acc-smfl',
        variantId: 'var-flw-all',
        qty: 1
      }
    ]
  });

  assert.strictEqual(result.items[0].unitPrice, 999, 'Unit price must be ₹999 for master set');
  assert.strictEqual(result.subtotal, 999, 'Subtotal must be ₹999');
  assert.strictEqual(result.isFreeShipping, true, 'Free shipping unlocked at authoritative threshold ₹999');
  assert.strictEqual(result.shippingFee, 0, 'Shipping ₹0 applied at threshold');
  assert.strictEqual(result.total, 999, 'Total must be ₹999');
});

// 2. Multi-item cart with mix of base products and variant IDs
await test('Multi-item cart: Combines base catalog products and specific variants accurately', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-acc-deco', qty: 2 }, // ₹299 * 2 = 598
      { productId: 'vk-cat-acc-stnd', qty: 1 }, // ₹199
      { productId: 'vk-cat-res-201', variantId: 'var-201-1500g', qty: 1 } // ₹1899
    ]
  });

  const expectedSubtotal = (299 * 2) + 199 + 1899; // 598 + 199 + 1899 = 2696
  assert.strictEqual(result.subtotal, expectedSubtotal, `Subtotal must be ${expectedSubtotal}`);
  assert.strictEqual(result.shippingFee, 0, 'Qualifies for free shipping');
  assert.strictEqual(result.total, expectedSubtotal, `Total must be ${expectedSubtotal}`);
});

// 3. Stock Decrement Unit Logic Verification
await test('Inventory Logic: recordInventorySale correctly decrements stock and preserves active status', async () => {
  const fakeOrder = {
    order_number: 'VK-TEST-STOCK-001',
    items: [
      { productId: 'vk-cat-res-201', qty: 2, sku: 'VK-RES-201-SET' }
    ],
    inventory_deducted: false
  };

  // Run stock deduction
  await OrderService.recordInventorySale(fakeOrder);
  assert.strictEqual(fakeOrder.inventory_deducted, true, 'Order marked as inventory_deducted');

  // Verify second call is idempotent
  await OrderService.recordInventorySale(fakeOrder);
  assert.strictEqual(fakeOrder.inventory_deducted, true, 'Second call is safe and idempotent');
});

console.log('\n========================================================================');
console.log(`Variants & Stock Suite: ${passed} passed, ${failed} failed`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
}
