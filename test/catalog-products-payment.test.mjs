import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CONFIG } from '../server/config.js';
import { PriceCalculator } from '../server/price-calculator.js';
import { razorpayService } from '../server/razorpay-service.js';
import { OrderService } from '../server/order-service.js';

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

console.log('================================================================');
console.log('VISTĀRA KRAFTS — CATALOG PRODUCTS END-TO-END PAYMENT TEST SUITE');
console.log('================================================================\n');

// 1. Authoritative price resolution for new catalog items
await test('Catalog Products: Authoritative price resolution from Supabase/catalog for 2:1 Epoxy Resin Set', async () => {
  const prod = await PriceCalculator.fetchAuthoritativeProduct('vk-cat-res-201');
  assert.ok(prod, 'Product vk-cat-res-201 must exist');
  assert.strictEqual(prod.sku, 'VK-RES-201-SET');
  assert.strictEqual(prod.price, 599, 'Base price must be ₹599');
  assert.strictEqual(prod.inStock, true, 'Product must be in stock');
});

await test('Catalog Products: Authoritative price resolution for DecoColor Metallic Markers', async () => {
  const prod = await PriceCalculator.fetchAuthoritativeProduct('vk-cat-acc-deco');
  assert.ok(prod, 'Product vk-cat-acc-deco must exist');
  assert.strictEqual(prod.sku, 'VK-ACC-DECO-MRK');
  assert.strictEqual(prod.price, 299, 'Base price must be ₹299');
});

await test('Catalog Products: Authoritative price resolution for Small Flowers Inclusions', async () => {
  const prod = await PriceCalculator.fetchAuthoritativeProduct('vk-cat-acc-smfl');
  assert.ok(prod, 'Product vk-cat-acc-smfl must exist');
  assert.strictEqual(prod.sku, 'VK-ACC-SML-FLWR');
  assert.strictEqual(prod.price, 199, 'Base price must be ₹199');
});

// 2. Order calculation with new catalog products
await test('Price Calculation: Subtotal under ₹1499 includes standard ₹99 shipping', async () => {
  const calc = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-201', qty: 1 } // ₹599
    ]
  });

  assert.strictEqual(calc.subtotal, 599);
  assert.strictEqual(calc.isFreeShipping, false);
  assert.strictEqual(calc.shippingFee, 99);
  assert.strictEqual(calc.total, 698);
  assert.strictEqual(calc.amountPaise, 69800);
});

await test('Price Calculation: Cart with multiple new catalog items qualifying for Free Shipping (>= ₹1499)', async () => {
  const calc = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-201', qty: 1 }, // ₹599
      { productId: 'vk-cat-res-301', qty: 1 }, // ₹649
      { productId: 'vk-cat-acc-trch', qty: 1 }  // ₹499
    ]
  });
  // 599 + 649 + 499 = 1747
  assert.strictEqual(calc.subtotal, 1747);
  assert.strictEqual(calc.isFreeShipping, true);
  assert.strictEqual(calc.shippingFee, 0);
  assert.strictEqual(calc.total, 1747);
  assert.strictEqual(calc.amountPaise, 174700);
});

// 3. Coupon application on new catalog products
await test('Coupons: STUDIO10 (10% off, min order 1500) applies accurately on new catalog products', async () => {
  const calc = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-301', qty: 2 }, // 2 * 649 = 1298
      { productId: 'vk-cat-acc-deco', qty: 1 }  // 299 -> total 1597
    ],
    couponCode: 'STUDIO10'
  });

  assert.strictEqual(calc.subtotal, 1597);
  assert.strictEqual(calc.couponDiscount, 160); // Math.round(1597 * 0.10) = 160
  assert.strictEqual(calc.isFreeShipping, true);
  assert.strictEqual(calc.total, 1597 - 160); // 1437
  assert.strictEqual(calc.amountPaise, 143700);
});

// 4. Live Razorpay Test Gateway Order Creation for new catalog items
await test('Razorpay: Successfully creates real order on Razorpay for new catalog items', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Kabir Varma',
    phone: '9876543210',
    address: '15 Lotus Boulevard, Sector 100',
    pincode: '201304',
    email: 'kabir.varma@test.com',
    items: [
      { productId: 'vk-cat-res-201', qty: 1 },
      { productId: 'vk-cat-acc-sili', qty: 1 }
    ]
  });

  assert.strictEqual(orderRes.success, true);
  assert.ok(orderRes.orderId.startsWith('VK-'));
  assert.ok(orderRes.razorpayOrderId.startsWith('order_'));
  // Subtotal = 599 + 599 = 1198. Shipping = 99. Total = 1297 -> 129700 paise
  assert.strictEqual(orderRes.amount, 129700);
  assert.strictEqual(orderRes.keyId, CONFIG.RAZORPAY_KEY_ID);
});

// 5. Signature verification and payment completion
await test('Razorpay: HMAC-SHA256 signature verification and order capture for new items', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Meera Sen',
    phone: '9123456780',
    address: '77 Residency Road, Shanthala Nagar',
    pincode: '560025',
    email: 'meera.sen@test.com',
    items: [
      { productId: 'vk-cat-acc-smfl', qty: 2 } // 2 * 199 = 398 + 99 ship = 497 -> 49700 paise
    ]
  });

  const razorpayOrderId = orderRes.razorpayOrderId;
  const razorpayPaymentId = `pay_test_${Date.now()}`;
  const generatedSignature = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const originalService = OrderService.razorpayService || razorpayService;
  OrderService.razorpayService = {
    verifyPaymentSignature: (params) => originalService.verifyPaymentSignature(params),
    fetchPayment: async (pid) => {
      if (pid === razorpayPaymentId) {
        return {
          id: razorpayPaymentId,
          order_id: razorpayOrderId,
          amount: orderRes.amount,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        };
      }
      return originalService.fetchPayment(pid);
    }
  };

  const verifyRes = await OrderService.verifyPayment({
    orderId: orderRes.orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: generatedSignature,
    customerEmail: 'meera.sen@test.com'
  });

  OrderService.razorpayService = originalService;

  assert.strictEqual(verifyRes.success, true, 'Payment verification must succeed');
  assert.strictEqual(verifyRes.status, 'paid', 'Order status must be updated to paid');
  assert.strictEqual(verifyRes.paymentId, razorpayPaymentId);
});

// 6. Security: Anti-tamper on signature
await test('Security: Tampered payment signature for new catalog item is strictly rejected', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Rohan Mehra',
    phone: '9888877777',
    address: '12 Linking Road, Bandra West',
    pincode: '400050',
    items: [{ productId: 'vk-cat-mld-flw4', qty: 1 }]
  });

  await assert.rejects(
    async () => {
      await OrderService.verifyPayment({
        orderId: orderRes.orderId,
        razorpayOrderId: orderRes.razorpayOrderId,
        razorpayPaymentId: 'pay_tamper_123',
        razorpaySignature: 'invalid_fraudulent_signature_hash'
      });
    },
    /Payment signature verification failed/i
  );
});

// 7. Input validation error cases
await test('Validation: Invalid mobile number is rejected', async () => {
  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Anita Roy',
        phone: '123', // invalid phone
        address: 'Valid address street 123',
        pincode: '110001',
        items: [{ productId: 'vk-cat-res-201', qty: 1 }]
      });
    },
    /Indian mobile number/i
  );
});

await test('Validation: Invalid PIN code is rejected', async () => {
  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Anita Roy',
        phone: '9876543210',
        address: 'Valid address street 123',
        pincode: '01234', // invalid PIN
        items: [{ productId: 'vk-cat-res-201', qty: 1 }]
      });
    },
    /Indian delivery PIN code/i
  );
});

console.log('\n================================================================');
console.log(`Catalog Payment Suite: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) process.exit(1);
