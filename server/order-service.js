import { CONFIG } from './config.js';
import { PriceCalculator } from './price-calculator.js';
import { razorpayService } from './razorpay-service.js';

// In-memory persistent storage for server sessions & offline mock compatibility
const inMemoryOrders = new Map();
const inMemoryPayments = new Map();
const processedWebhookEvents = new Set();

export class OrderService {
  /**
   * Helper to execute Supabase query safely
   */
  static async supabaseRequest(endpoint, method = 'GET', body = null) {
    const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`, {
        method,
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': method === 'POST' ? 'return=representation' : (method === 'PATCH' ? 'return=representation' : undefined)
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        return { error: await res.text(), status: res.status };
      }
      return { data: await res.json(), status: res.status };
    } catch (err) {
      return { error: err.message, status: 500 };
    }
  }

  /**
   * Step 1: Create an authorized checkout order.
   * Calculates prices server-side, enforces limits, creates Razorpay order, saves pending order.
   */
  static async createCheckoutOrder(payload = {}) {
    const {
      name,
      phone,
      address,
      pincode,
      email = '',
      userId = null,
      items = [],
      couponCode = '',
      giftWrap = true,
      notes = '',
      paymentMethod = 'UPI / Razorpay'
    } = payload;

    // 1. Validate customer input
    const customerName = String(name || '').trim();
    const customerEmail = String(email || '').trim().toLowerCase();
    const customerPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const rawAddress = String(address || '').trim();
    const cleanPin = String(pincode || '').trim();

    if (!customerName || customerName.length < 2) {
      throw new Error('Please enter a valid recipient name (minimum 2 characters).');
    }

    if (!customerPhone || customerPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    if (!rawAddress || rawAddress.length < 5) {
      throw new Error('Please enter your complete shipping street address.');
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      throw new Error('Please enter a valid 6-digit Indian delivery PIN code.');
    }

    // 2. Server-Authoritative Price Calculation
    const calc = await PriceCalculator.calculateAuthoritativeOrder({
      items,
      couponCode
    });

    if (calc.total <= 0) {
      throw new Error('Order total must be greater than zero.');
    }

    // Explicitly validate promotional code if supplied by client
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const couponObj = await PriceCalculator.fetchAuthoritativeCoupon(cleanCoupon);
      if (!couponObj) {
        throw new Error(`Promotional voucher "${cleanCoupon}" is invalid, inactive, or has expired.`);
      }
      if (calc.subtotal < couponObj.minOrder) {
        throw new Error(`Voucher "${couponObj.code}" requires a minimum order amount of ₹${couponObj.minOrder.toLocaleString('en-IN')}.`);
      }
    }

    // 3. Generate Canonical Identifiers
    const year = new Date().getFullYear();
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VK-${year}-${random4}`;
    const uniqueId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    // 4. Create Order on Razorpay
    const rzpOrder = await (this.razorpayService || razorpayService).createOrder({
      amountPaise: calc.amountPaise,
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerName,
        phone: customerPhone,
        pincode: cleanPin
      }
    });

    // 5. Construct Order Record (payment_status: 'pending' — never trusted from client!)
    // Strictly contains columns matching public.orders table in Supabase
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
    const orderRecord = {
      id: uniqueId,
      order_number: orderNumber,
      user_id: isUUID(userId) ? userId.trim() : null,
      customer_name: customerName,
      customer_email: customerEmail || 'patron@vistarakrafts.com',
      phone: customerPhone,
      address: rawAddress,
      city: '',
      state: '',
      pincode: cleanPin,
      subtotal: calc.subtotal,
      discount: calc.couponDiscount,
      coupon_code: calc.couponCode || '',
      gst_amount: calc.gstAmount,
      shipping_fee: calc.shippingFee,
      total: calc.total,
      payment_method: paymentMethod,
      payment_status: 'pending', // Starts strictly pending
      order_status: 'new', // Valid constraint in orders_order_status_check
      stage_index: 1,
      gift_wrap: Boolean(giftWrap),
      mockup_approved: false,
      items: calc.items,
      courier: `BlueDart Priority Air • PIN ${cleanPin}`,
      tracking_number: rzpOrder.id, // Stores authoritative Razorpay Order ID for reconciliation
      notes: notes ? `${String(notes).substring(0, 400)} | RZP:${rzpOrder.id}` : `RZP:${rzpOrder.id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to memory store
    inMemoryOrders.set(orderNumber, orderRecord);
    inMemoryOrders.set(uniqueId, orderRecord);
    inMemoryOrders.set(rzpOrder.id, orderRecord);

    // Persist to Supabase
    const supaInsert = await this.supabaseRequest('orders', 'POST', orderRecord);
    if (supaInsert && supaInsert.error) {
      console.warn('[OrderService] Note: Pending order Supabase insert response:', supaInsert.error);
    }

    return {
      success: true,
      orderId: orderNumber,
      internalId: uniqueId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      amountFormatted: `₹${calc.total.toLocaleString('en-IN')}`,
      currency: CONFIG.CURRENCY,
      keyId: CONFIG.RAZORPAY_KEY_ID,
      summary: {
        subtotal: calc.subtotal,
        discount: calc.couponDiscount,
        couponCode: calc.couponCode,
        shippingFee: calc.shippingFee,
        gstAmount: calc.gstAmount,
        total: calc.total,
        itemsCount: calc.itemsCount,
        items: calc.items
      }
    };
  }

  /**
   * Step 2: Verify Razorpay Payment Callback
   * Cryptographically verifies HMAC signature and cross-checks with Razorpay REST API.
   */
  static async verifyPayment(payload = {}) {
    const orderId = payload.orderId;
    const razorpay_order_id = payload.razorpay_order_id || payload.razorpayOrderId;
    const razorpay_payment_id = payload.razorpay_payment_id || payload.razorpayPaymentId;
    const razorpay_signature = payload.razorpay_signature || payload.razorpaySignature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing required Razorpay verification parameters (order_id, payment_id, or signature).');
    }

    // 1. Verify HMAC-SHA256 Signature
    const rzpClient = this.razorpayService || razorpayService;
    const isSignatureValid = rzpClient.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isSignatureValid) {
      throw new Error('Payment signature verification failed. Possible payload tampering detected.');
    }

    // 2. Fetch Real Payment from Razorpay Gateway
    let gatewayPayment = null;
    try {
      gatewayPayment = await rzpClient.fetchPayment(razorpay_payment_id);
    } catch (err) {
      throw new Error(`Unable to verify payment with Razorpay: ${err.message}`);
    }

    if (!gatewayPayment) {
      throw new Error('Razorpay payment record not found.');
    }

    // 3. Validate Gateway Payment Attributes
    if (gatewayPayment.order_id !== razorpay_order_id) {
      throw new Error(`Order ID mismatch: Gateway (${gatewayPayment.order_id}) vs Client (${razorpay_order_id})`);
    }

    if (gatewayPayment.status !== 'captured' && gatewayPayment.status !== 'authorized') {
      throw new Error(`Payment is not in captured or authorized state: ${gatewayPayment.status}`);
    }

    if (gatewayPayment.currency !== CONFIG.CURRENCY) {
      throw new Error(`Currency mismatch: Gateway (${gatewayPayment.currency}) vs Expected (${CONFIG.CURRENCY})`);
    }

    // 4. Locate Internal Order (In-memory or Supabase via valid columns)
    let order = inMemoryOrders.get(orderId) ||
                inMemoryOrders.get(razorpay_order_id) ||
                null;

    if (!order) {
      // Query valid columns: order_number or tracking_number (which stores razorpay_order_id)
      const lookup = await this.supabaseRequest(`orders?or=(order_number.eq.${encodeURIComponent(orderId || '')},tracking_number.eq.${encodeURIComponent(razorpay_order_id)})&select=*`);
      if (lookup.data && Array.isArray(lookup.data) && lookup.data.length > 0) {
        order = lookup.data[0];
      }
    }

    if (!order) {
      throw new Error(`Associated internal order not found for Razorpay Order "${razorpay_order_id}".`);
    }

    // 5. Authoritative Amount Cross-Check
    const expectedPaise = Math.round(Number(order.total) * 100);
    if (gatewayPayment.amount !== expectedPaise) {
      throw new Error(`Payment amount mismatch! Expected: ${expectedPaise} paise, Paid: ${gatewayPayment.amount} paise.`);
    }

    // 6. Idempotency Check — If order is already paid, return safely without duplicating side-effects
    if (order.payment_status === 'paid') {
      return {
        success: true,
        verified: true,
        alreadyProcessed: true,
        orderId: order.order_number,
        total: order.total,
        paymentId: razorpay_payment_id,
        items: order.items
      };
    }

    // 7. Transition Order State to Paid ('processing' status complies with orders_order_status_check)
    const updatedOrder = {
      ...order,
      payment_status: 'paid',
      order_status: 'processing',
      stage_index: 1,
      tracking_number: order.tracking_number || razorpay_order_id,
      notes: `${order.notes || ''} | PAID:${razorpay_payment_id}`.trim(),
      payment_method: gatewayPayment.method ? `Razorpay (${gatewayPayment.method.toUpperCase()})` : 'Razorpay Instant',
      updated_at: new Date().toISOString()
    };

    inMemoryOrders.set(updatedOrder.order_number, updatedOrder);
    inMemoryOrders.set(updatedOrder.id, updatedOrder);
    inMemoryOrders.set(razorpay_order_id, updatedOrder);

    // Update in Supabase orders table
    await this.supabaseRequest(
      `orders?order_number=eq.${encodeURIComponent(updatedOrder.order_number)}`,
      'PATCH',
      {
        payment_status: 'paid',
        order_status: 'processing',
        tracking_number: updatedOrder.tracking_number,
        notes: updatedOrder.notes,
        updated_at: updatedOrder.updated_at
      }
    );

    // 8. Record Ledger Entry in Payments Table (id generated by gen_random_uuid in postgres)
    const paymentRecord = {
      payment_id: razorpay_payment_id,
      order_id: updatedOrder.id,
      amount: order.total,
      currency: CONFIG.CURRENCY,
      status: 'captured',
      method: gatewayPayment.method || 'upi',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      created_at: new Date().toISOString()
    };

    inMemoryPayments.set(razorpay_payment_id, paymentRecord);
    await this.supabaseRequest('payments', 'POST', paymentRecord);

    // 9. Idempotent inventory deduction and logging
    await this.recordInventorySale(updatedOrder);

    return {
      success: true,
      verified: true,
      status: 'paid',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      orderId: updatedOrder.order_number,
      total: updatedOrder.total,
      paymentId: razorpay_payment_id,
      items: updatedOrder.items
    };
  }

  /**
   * Idempotently deduct stock and record ledger entry in inventory_logs table
   */
  static async recordInventorySale(order) {
    if (!order || !Array.isArray(order.items) || order.inventory_deducted) return;
    order.inventory_deducted = true;

    // Do not mutate live database on mock/test orders
    if (order.order_number && (order.order_number.startsWith('VK-TEST') || order.order_number.includes('MOCK'))) {
      return;
    }

    for (const item of order.items) {
      const productId = item.productId || item.id;
      const qty = item.qty || item.quantity || 1;
      const sku = item.sku || 'VK-STD';
      const variantKey = item.variantId || item.variant_id || item.variantLabel;

      if (!productId) continue;

      try {
        const prodLookup = await this.supabaseRequest(`products?id=eq.${encodeURIComponent(productId)}&select=id,stock,in_stock,variants`);
        let currentStock = 50;
        let variants = [];
        if (prodLookup.data && Array.isArray(prodLookup.data) && prodLookup.data.length > 0) {
          currentStock = Number(prodLookup.data[0].stock ?? 50);
          variants = Array.isArray(prodLookup.data[0].variants) ? prodLookup.data[0].variants : [];
        }
        const newStock = Math.max(0, currentStock - qty);

        // Deduct specific variant stock if found
        if (variantKey && variants.length > 0) {
          variants = variants.map(v => {
            if (v.id === variantKey || v.label === variantKey) {
              const vStock = Math.max(0, (Number(v.stock) || 0) - qty);
              return { ...v, stock: vStock };
            }
            return v;
          });
        }

        const anyVariantInStock = variants.length > 0 && variants.some(v => (Number(v.stock) || 0) > 0);
        const isStillInStock = newStock > 0 || anyVariantInStock;

        // Update authoritative product stock in database
        const updatePayload = {
          stock: newStock,
          in_stock: isStillInStock,
          updated_at: new Date().toISOString()
        };
        if (variants.length > 0) {
          updatePayload.variants = variants;
        }

        await this.supabaseRequest(
          `products?id=eq.${encodeURIComponent(productId)}`,
          'PATCH',
          updatePayload
        );

        const logRecord = {
          product_id: productId,
          sku: sku,
          change: -qty,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: 'SALE',
          notes: `Order #${order.order_number} confirmed paid via Razorpay`,
          created_by: 'system',
          created_at: new Date().toISOString()
        };

        await this.supabaseRequest('inventory_logs', 'POST', logRecord);
      } catch (_e) {}
    }
  }

  /**
   * Step 3: Handle Inbound Razorpay Webhook Event
   * Validates webhook signature, deduplicates event, idempotently reconciles payment.
   */
  static async handleWebhook(rawBody, signature) {
    if (!signature) {
      throw new Error('Missing x-razorpay-signature header.');
    }

    const rzpClient = this.razorpayService || razorpayService;
    const isValid = rzpClient.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid Razorpay webhook signature.');
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = event.id || `${event.event}_${event.created_at}`;

    // Deduplicate webhook event
    if (processedWebhookEvents.has(eventId)) {
      return { success: true, duplicate: true, message: 'Event already processed.' };
    }
    processedWebhookEvents.add(eventId);

    const eventType = event.event;
    const payload = event.payload || {};

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const rzpOrderId = paymentEntity ? paymentEntity.order_id : (payload.order && payload.order.entity ? payload.order.entity.id : null);

      if (rzpOrderId) {
        let order = inMemoryOrders.get(rzpOrderId);
        if (!order) {
          const lookup = await this.supabaseRequest(`orders?tracking_number=eq.${encodeURIComponent(rzpOrderId)}&select=*`);
          if (lookup.data && Array.isArray(lookup.data) && lookup.data.length > 0) {
            order = lookup.data[0];
          }
        }

        if (order) {
          // Strictly validate payment amount and currency if payment entity is provided
          if (paymentEntity) {
            const expectedPaise = Math.round(Number(order.total) * 100);
            if (paymentEntity.amount !== expectedPaise) {
              throw new Error(`Webhook payment amount mismatch! Expected: ${expectedPaise} paise, Received: ${paymentEntity.amount} paise.`);
            }
            if (paymentEntity.currency && paymentEntity.currency !== CONFIG.CURRENCY) {
              throw new Error(`Webhook currency mismatch! Expected: ${CONFIG.CURRENCY}, Received: ${paymentEntity.currency}.`);
            }
          }

          if (order.payment_status !== 'paid') {
            order.payment_status = 'paid';
            order.order_status = 'processing';
            order.updated_at = new Date().toISOString();

            inMemoryOrders.set(order.order_number, order);
            inMemoryOrders.set(order.id, order);

            await this.supabaseRequest(
              `orders?order_number=eq.${encodeURIComponent(order.order_number)}`,
              'PATCH',
              {
                payment_status: 'paid',
                order_status: 'processing',
                updated_at: order.updated_at
              }
            );

            // Record inventory deduction
            await this.recordInventorySale(order);
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const rzpOrderId = paymentEntity ? paymentEntity.order_id : null;
      if (rzpOrderId) {
        let order = inMemoryOrders.get(rzpOrderId);
        // Never allow a failed event to overwrite an already paid order!
        if (order && order.payment_status !== 'paid') {
          order.payment_status = 'failed';
          order.updated_at = new Date().toISOString();
          inMemoryOrders.set(order.order_number, order);
          await this.supabaseRequest(
            `orders?order_number=eq.${encodeURIComponent(order.order_number)}`,
            'PATCH',
            { payment_status: 'failed', updated_at: order.updated_at }
          );
        }
      }
    }

    return { success: true, processed: true, event: eventType };
  }
}

OrderService.razorpayService = razorpayService;
