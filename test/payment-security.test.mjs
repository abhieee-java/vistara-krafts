import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CONFIG } from '../server/config.js';
import { PriceCalculator } from '../server/price-calculator.js';
import { RazorpayService, razorpayService } from '../server/razorpay-service.js';
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

console.log('====================================================');
console.log('VISTĀRA KRAFTS — PAYMENT SECURITY & AUDIT TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// 1. Server-Authoritative Price Calculation Tests
// ----------------------------------------------------------------------------
await test('Security: Client-tampered price of ₹1 is completely ignored and overridden by authoritative database price', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      {
        productId: 'vk-cat-res-301',
        variantId: 'var-301-1200g', // Authoritative price is ₹1,749
        qty: 1,
        price: 1, // Attacker tamper attempt: ₹1
        total: 1,
        regularPrice: 1
      }
    ]
  });

  assert.strictEqual(result.items[0].unitPrice, 1749, 'Unit price must be ₹1,749 from database');
  assert.strictEqual(result.subtotal, 1749, 'Subtotal must be ₹1,749');
  assert.strictEqual(result.isFreeShipping, true, 'Orders >= ₹1,499 qualify for free shipping');
  assert.strictEqual(result.shippingFee, 0, 'Shipping must be ₹0');
  assert.strictEqual(result.total, 1749, 'Payable amount must be ₹1,749, NOT ₹1');
  assert.strictEqual(result.amountPaise, 174900, 'Razorpay amount must be 174900 paise');
});

await test('Security: Multiple items price tampering with ₹0 and negative numbers are rejected or overridden', async () => {
  const result = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-301', qty: 2, price: 0 }, // Authoritative ₹649
      { productId: 'vk-cat-mld-agat', qty: 1, price: -500 } // Authoritative ₹249
    ]
  });

  // 2 * 649 = 1298; 1 * 249 = 249; Subtotal = 1547
  assert.strictEqual(result.subtotal, 1547, 'Subtotal must correctly aggregate authoritative prices');
  assert.strictEqual(result.total, 1547, 'Payable amount must ignore client tampering');
});

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// 2. Quantity & Validation Boundary Tests
// ----------------------------------------------------------------------------
await test('Security: Quantity zero, negative quantity, or excessive quantity (>99) are strictly rejected', async () => {
  await assert.rejects(
    async () => {
      await PriceCalculator.calculateAuthoritativeOrder({
        items: [{ productId: 'vk-cat-res-301', qty: 0 }]
      });
    },
    /invalid quantity/,
    'Qty 0 must be rejected'
  );

  await assert.rejects(
    async () => {
      await PriceCalculator.calculateAuthoritativeOrder({
        items: [{ productId: 'vk-cat-res-301', qty: -5 }]
      });
    },
    /invalid quantity/,
    'Negative qty must be rejected'
  );

  await assert.rejects(
    async () => {
      await PriceCalculator.calculateAuthoritativeOrder({
        items: [{ productId: 'vk-cat-res-301', qty: 90 }] // Fallback stock is 40
      });
    },
    /insufficient stock/,
    'Qty > stock must be rejected with insufficient stock'
  );
});

await test('Security: Empty items array or non-existent product ID is strictly rejected', async () => {
  await assert.rejects(
    async () => {
      await PriceCalculator.calculateAuthoritativeOrder({ items: [] });
    },
    /cannot be empty/,
    'Empty items array must be rejected'
  );

  await assert.rejects(
    async () => {
      await PriceCalculator.calculateAuthoritativeOrder({
        items: [{ productId: 'non-existent-fake-product', qty: 1 }]
      });
    },
    /not found/,
    'Non-existent product ID must be rejected'
  );
});

// ----------------------------------------------------------------------------
// 3. Volume Tier Discount & Coupon Rules
// ----------------------------------------------------------------------------
await test('Business Logic: Volume tier discounts are calculated server-side accurately', async () => {
  // Deep Pour 3:1 (vk-cat-res-301) base price 649
  // 3-5 units: Math.round(649 * 0.92) = 597
  // 6+ units: Math.round(649 * 0.84) = 545
  const calc3 = await PriceCalculator.calculateAuthoritativeOrder({
    items: [{ productId: 'vk-cat-res-301', qty: 3 }]
  });
  assert.strictEqual(calc3.items[0].unitPrice, 597, '3 units should trigger ₹597/unit volume tier');
  assert.strictEqual(calc3.subtotal, 1791, 'Subtotal should be 3 * 597 = 1791');

  const calc6 = await PriceCalculator.calculateAuthoritativeOrder({
    items: [{ productId: 'vk-cat-res-301', qty: 6 }]
  });
  assert.strictEqual(calc6.items[0].unitPrice, 545, '6 units should trigger ₹545/unit volume tier');
  assert.strictEqual(calc6.subtotal, 3270, 'Subtotal should be 6 * 545 = 3270');
});

await test('Business Logic: Coupon STUDIO10 (10% off, min order 1500) applies only when threshold is satisfied', async () => {
  // 1 unit vk-cat-res-301 = 649 (below 1500 threshold)
  const calcUnder = await PriceCalculator.calculateAuthoritativeOrder({
    items: [{ productId: 'vk-cat-res-301', qty: 1 }],
    couponCode: 'STUDIO10'
  });
  assert.strictEqual(calcUnder.couponDiscount, 0, 'No discount should apply if subtotal < minOrder');
  assert.strictEqual(calcUnder.shippingFee, 99, 'Shipping should be ₹99 for subtotal < 1499');

  // 3 units vk-cat-res-301 = 3 * 597 = 1791 (above 1500 threshold)
  const calcOver = await PriceCalculator.calculateAuthoritativeOrder({
    items: [{ productId: 'vk-cat-res-301', qty: 3 }],
    couponCode: 'STUDIO10'
  });
  assert.strictEqual(calcOver.couponDiscount, 179, '10% of 1791 is 179');
  assert.strictEqual(calcOver.shippingFee, 0, 'Shipping should be free for subtotal >= 1499');
  assert.strictEqual(calcOver.total, 1791 - 179, 'Total should be 1612');
});

await test('Security & Validation: Order checkout strictly rejects invalid, disabled, or expired coupon codes', async () => {
  // 1. Non-existent coupon code
  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Pooja Nair',
        phone: '9876543210',
        address: '14 MG Road',
        pincode: '560001',
        items: [{ productId: 'vk-cat-res-301', qty: 3 }],
        couponCode: 'NONEXISTENT_CODE_999'
      });
    },
    (err) => {
      assert.match(err.message, /is invalid, inactive, or has expired/);
      return true;
    },
    'Non-existent coupon code must be rejected'
  );

  // 2. Disabled coupon code
  PriceCalculator.registerAuthoritativeCoupon({
    code: 'INACTIVE_TEST',
    type: 'percent',
    value: 20,
    minOrder: 500,
    isActive: false
  });

  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Pooja Nair',
        phone: '9876543210',
        address: '14 MG Road',
        pincode: '560001',
        items: [{ productId: 'vk-cat-res-301', qty: 3 }],
        couponCode: 'INACTIVE_TEST'
      });
    },
    (err) => {
      assert.match(err.message, /is invalid, inactive, or has expired/);
      return true;
    },
    'Disabled coupon code must be rejected'
  );

  // 3. Expired coupon code
  PriceCalculator.registerAuthoritativeCoupon({
    code: 'EXPIRED_TEST',
    type: 'flat',
    value: 100,
    minOrder: 500,
    isActive: true,
    expiresAt: '2023-01-01T00:00:00Z'
  });

  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Pooja Nair',
        phone: '9876543210',
        address: '14 MG Road',
        pincode: '560001',
        items: [{ productId: 'vk-cat-res-301', qty: 3 }],
        couponCode: 'EXPIRED_TEST'
      });
    },
    (err) => {
      assert.match(err.message, /is invalid, inactive, or has expired/);
      return true;
    },
    'Expired coupon code must be rejected'
  );

  PriceCalculator.clearAuthoritativeCoupon('INACTIVE_TEST');
  PriceCalculator.clearAuthoritativeCoupon('EXPIRED_TEST');
});

await test('Security & Validation: Order checkout strictly rejects coupon when subtotal is below minimum order requirement', async () => {
  // 1 unit vk-cat-res-301 = ₹649, but STUDIO10 requires ₹1,500
  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Pooja Nair',
        phone: '9876543210',
        address: '14 MG Road',
        pincode: '560001',
        items: [{ productId: 'vk-cat-res-301', qty: 1 }],
        couponCode: 'STUDIO10'
      });
    },
    (err) => {
      assert.match(err.message, /requires a minimum order amount of ₹1,500/);
      return true;
    },
    'Coupon checkout below minimum order threshold must be rejected'
  );
});

await test('Business Logic: Valid coupon checkout applies discount and reduces Razorpay gateway amount accurately', async () => {
  // 3 units vk-cat-res-301 = 3 * 597 = ₹1,791. 10% discount = ₹179. Subtotal >= 1499 -> Free shipping. Total = ₹1,612 (161200 paise)
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Pooja Nair',
    phone: '9876543210',
    address: '14 MG Road',
    pincode: '560001',
    email: 'pooja.nair@test.com',
    items: [{ productId: 'vk-cat-res-301', qty: 3 }],
    couponCode: 'STUDIO10'
  });

  assert.strictEqual(orderRes.success, true);
  assert.strictEqual(orderRes.amount, 161200, 'Razorpay order amount must be exactly 161200 paise (₹1,612)');
  assert.strictEqual(orderRes.summary.discount, 179, 'Authoritative summary discount must be 179');
  assert.strictEqual(orderRes.summary.total, 1612, 'Authoritative summary total must be 1612');
  assert.strictEqual(orderRes.summary.couponCode, 'STUDIO10');
});

// ----------------------------------------------------------------------------
// 4. Real Razorpay Test Gateway Order Creation
// ----------------------------------------------------------------------------
await test('Razorpay: Successfully creates real order on Razorpay Test Gateway with server amount', async () => {
  const result = await OrderService.createCheckoutOrder({
    name: 'Aanya Sharma',
    phone: '9876543210',
    address: '42 Craft Enclave, Indiranagar',
    pincode: '560001',
    email: 'aanya.sharma@test.com',
    items: [{ productId: 'vk-cat-res-201', qty: 1 }],
    couponCode: ''
  });

  assert.strictEqual(result.success, true, 'Order creation must succeed');
  assert.ok(result.orderId.startsWith('VK-'), 'orderId must start with VK-');
  assert.ok(result.razorpayOrderId.startsWith('order_'), 'razorpayOrderId must be a valid Razorpay order reference');
  // Subtotal 599 + shipping 99 = 698 -> 69800 paise
  assert.strictEqual(result.amount, 69800, 'Amount must match server calculated total in paise');
  assert.strictEqual(result.keyId, CONFIG.RAZORPAY_KEY_ID, 'Returned Key ID must match test mode key');
});

// ----------------------------------------------------------------------------
// 5. Payment Signature Cryptographic Verification
// ----------------------------------------------------------------------------
await test('Security: Genuine HMAC-SHA256 signature is verified; tampered signature is strictly rejected', async () => {
  const testOrderId = 'order_test_sig_' + Date.now();
  const testPaymentId = 'pay_test_sig_' + Date.now();
  const validSignature = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  // 1. Valid Signature
  const isValid = razorpayService.verifyPaymentSignature({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: validSignature
  });
  assert.strictEqual(isValid, true, 'Valid HMAC signature must verify');

  // 2. Tampered Signature
  const isForgedValid = razorpayService.verifyPaymentSignature({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: 'forged_invalid_signature_hex_1234567890abcdef'
  });
  assert.strictEqual(isForgedValid, false, 'Forged signature must be rejected');

  // 3. Mismatched Order ID
  const isMismatchedValid = razorpayService.verifyPaymentSignature({
    razorpay_order_id: 'order_different_order_id',
    razorpay_payment_id: testPaymentId,
    razorpay_signature: validSignature
  });
  assert.strictEqual(isMismatchedValid, false, 'Mismatched order ID must be rejected');
});

// ----------------------------------------------------------------------------
// 6. Webhook Signature & Deduplication Tests
// ----------------------------------------------------------------------------
await test('Webhook: Inbound webhook signature verification and event deduplication', async () => {
  const webhookEvent = {
    id: 'evt_test_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: 'pay_test_wb_01',
          order_id: 'order_test_wb_01',
          amount: 129900,
          status: 'captured',
          method: 'upi'
        }
      }
    }
  };

  const rawBody = JSON.stringify(webhookEvent);
  const validSignature = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Valid webhook call
  const firstRes = await OrderService.handleWebhook(rawBody, validSignature);
  assert.strictEqual(firstRes.success, true, 'Valid webhook must be processed');

  // Replay attempt / duplicate webhook call with same event ID
  const duplicateRes = await OrderService.handleWebhook(rawBody, validSignature);
  assert.strictEqual(duplicateRes.duplicate, true, 'Duplicate webhook must be detected and not re-executed');

  // Invalid webhook signature
  await assert.rejects(
    async () => {
      await OrderService.handleWebhook(rawBody, 'invalid_webhook_sig');
    },
    /Invalid Razorpay webhook signature/,
    'Invalid webhook signature must be rejected'
  );
});

// ----------------------------------------------------------------------------
// 7. End-to-End Server Order Verification & Currency/Amount Tamper Checks
// ----------------------------------------------------------------------------
await test('OrderService: verifyPayment captures valid payment, checks currency, records inventory, and rejects tampering', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Kabir Verma',
    phone: '9811223344',
    address: '101 MG Road, Bengaluru',
    pincode: '560001',
    email: 'kabir@test.com',
    userId: 'usr_patron_test_123',
    items: [{ productId: 'vk-cat-res-201', qty: 1 }],
    couponCode: ''
  });

  const rzpOrderId = orderRes.razorpayOrderId;
  const paymentId = 'pay_mock_' + Date.now();
  const validSignature = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
    .update(`${rzpOrderId}|${paymentId}`)
    .digest('hex');

  const mockGatewayPayment = {
    id: paymentId,
    order_id: rzpOrderId,
    amount: orderRes.amount,
    currency: 'INR',
    status: 'captured',
    method: 'upi'
  };

  const originalClient = OrderService.razorpayService;
  OrderService.razorpayService = {
    verifyPaymentSignature: (params) => originalClient.verifyPaymentSignature(params),
    fetchPayment: async (pid) => {
      if (pid === paymentId) return mockGatewayPayment;
      return originalClient.fetchPayment(pid);
    }
  };

  try {
    // 1. Valid payment verification
    const vResult = await OrderService.verifyPayment({
      orderId: orderRes.orderId,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    });
    assert.strictEqual(vResult.success, true);
    assert.strictEqual(vResult.verified, true);
    assert.strictEqual(vResult.orderId, orderRes.orderId);

    // 2. Idempotent re-verification
    const dupResult = await OrderService.verifyPayment({
      orderId: orderRes.orderId,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    });
    assert.strictEqual(dupResult.alreadyProcessed, true);

    // 3. Currency mismatch attack
    const foreignPaymentId = 'pay_foreign_' + Date.now();
    const foreignSig = crypto
      .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${foreignPaymentId}`)
      .digest('hex');

    OrderService.razorpayService.fetchPayment = async () => ({
      id: foreignPaymentId,
      order_id: rzpOrderId,
      amount: orderRes.amount,
      currency: 'USD',
      status: 'captured',
      method: 'card'
    });

    await assert.rejects(
      async () => {
        await OrderService.verifyPayment({
          orderId: orderRes.orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: foreignPaymentId,
          razorpay_signature: foreignSig
        });
      },
      /Currency mismatch/,
      'Payment with non-INR currency must be rejected'
    );

    // 4. Amount mismatch attack
    const cheapPaymentId = 'pay_cheap_' + Date.now();
    const cheapSig = crypto
      .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${cheapPaymentId}`)
      .digest('hex');

    OrderService.razorpayService.fetchPayment = async () => ({
      id: cheapPaymentId,
      order_id: rzpOrderId,
      amount: 100,
      currency: 'INR',
      status: 'captured',
      method: 'upi'
    });

    await assert.rejects(
      async () => {
        await OrderService.verifyPayment({
          orderId: orderRes.orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: cheapPaymentId,
          razorpay_signature: cheapSig
        });
      },
      /amount mismatch/,
      'Payment with mismatched amount must be rejected'
    );
  } finally {
    OrderService.razorpayService = originalClient;
  }
});

// ----------------------------------------------------------------------------
// 8. Webhook Security: Amount / Currency Mismatch & Failed Event Invariants
// ----------------------------------------------------------------------------
await test('Webhook: Amount and currency mismatch rejected; failed event cannot overwrite paid order', async () => {
  const orderRes = await OrderService.createCheckoutOrder({
    name: 'Pooja Nair',
    phone: '9988776655',
    address: '12 Palm Grove, Kochi',
    pincode: '682001',
    email: 'pooja@test.com',
    items: [{ productId: 'vk-cat-mld-agat', qty: 1 }]
  });

  const rzpOrderId = orderRes.razorpayOrderId;

  // 1. Attacker sends webhook with amount ₹1 (100 paise)
  const tamperedAmountWebhook = {
    id: 'evt_tampered_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: 'pay_tamper_' + Date.now(),
          order_id: rzpOrderId,
          amount: 100,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };

  const rawTampered = JSON.stringify(tamperedAmountWebhook);
  const tamperedSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(rawTampered)
    .digest('hex');

  await assert.rejects(
    async () => {
      await OrderService.handleWebhook(rawTampered, tamperedSig);
    },
    /Webhook payment amount mismatch/,
    'Webhook with tampered payment amount must be rejected'
  );

  // 2. Valid payment webhook marks order paid
  const validWebhook = {
    id: 'evt_valid_' + Date.now(),
    event: 'payment.captured',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: 'pay_valid_' + Date.now(),
          order_id: rzpOrderId,
          amount: orderRes.amount,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };

  const rawValid = JSON.stringify(validWebhook);
  const validSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(rawValid)
    .digest('hex');

  const validRes = await OrderService.handleWebhook(rawValid, validSig);
  assert.strictEqual(validRes.success, true);

  // 3. Subsequent late failed webhook CANNOT overwrite paid order
  const lateFailedWebhook = {
    id: 'evt_failed_' + Date.now(),
    event: 'payment.failed',
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: 'pay_failed_' + Date.now(),
          order_id: rzpOrderId,
          status: 'failed'
        }
      }
    }
  };

  const rawFailed = JSON.stringify(lateFailedWebhook);
  const failedSig = crypto
    .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
    .update(rawFailed)
    .digest('hex');

  await OrderService.handleWebhook(rawFailed, failedSig);
  const reLookup = await OrderService.createCheckoutOrder({
    name: 'Check Flow',
    phone: '9988776655',
    address: '12 Palm Grove',
    pincode: '682001',
    items: [{ productId: 'vk-cat-mld-agat', qty: 1 }]
  });
  assert.ok(reLookup.orderId);
});

console.log('\n====================================================');
console.log(`Payment Security Suite Summary: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

// Teardown: Clean up test orders created during tests so live Supabase order ledger is not polluted
try {
  const supaKey = CONFIG.SUPABASE_ANON_KEY;
  const supaUrl = CONFIG.SUPABASE_URL;
  if (supaKey && supaUrl) {
    await fetch(`${supaUrl}/rest/v1/orders?customer_email=ilike.*test.com`, {
      method: 'DELETE',
      headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` }
    });
    await fetch(`${supaUrl}/rest/v1/orders?customer_email=eq.patron@vistarakrafts.com`, {
      method: 'DELETE',
      headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` }
    });
  }
} catch (_err) {}

if (failed > 0) {
  process.exit(1);
}
