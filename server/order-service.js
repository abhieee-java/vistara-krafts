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
  static async supabaseRequest(endpoint, method = 'GET', body = null, customHeaders = {}) {
    const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': (CONFIG.SUPABASE_SERVICE_ROLE_KEY && method === 'POST')
          ? 'return=representation'
          : 'return=minimal',
        ...customHeaders
      };
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        return { error: await res.text(), status: res.status };
      }
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
      return { data, status: res.status };
    } catch (err) {
      return { error: err.message, status: 500 };
    }
  }

  /**
   * Helper to invoke Supabase RPC stored procedures safely
   */
  static async supabaseRpc(fnName, params = {}) {
    const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        return { error: await res.text(), status: res.status };
      }
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      return { error: err.message, status: 500 };
    }
  }

  /**
   * Checks whether a customer account has been suspended/blocked by administration.
   */
  static async checkIfCustomerBlocked(email, userId) {
    try {
      if (!email && !userId) return false;
      const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
      const rpcRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/is_customer_blocked`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_email: email ? String(email).trim().toLowerCase() : null,
          p_user_id: userId || null
        })
      });
      if (rpcRes.ok) {
        const isBlocked = await rpcRes.json();
        return Boolean(isBlocked);
      }
      return false;
    } catch (_e) {
      return false;
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

    // 1. Validate customer input and sanitize (OWASP XSS & buffer cap)
    const customerName = String(name || '').replace(/<[^>]*>?/gm, '').slice(0, 60).trim();
    const customerEmail = String(email || '').replace(/<[^>]*>?/gm, '').slice(0, 100).trim().toLowerCase();
    const customerPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const rawAddress = String(address || '').replace(/<[^>]*>?/gm, '').slice(0, 200).trim();
    const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6).trim();
    const cleanNotes = String(notes || '').replace(/<[^>]*>?/gm, '').slice(0, 250).trim();

    // Strict account suspension check (Unbypassable by client DevTools)
    if (customerEmail || userId) {
      const isBlocked = await this.checkIfCustomerBlocked(customerEmail, userId);
      if (isBlocked) {
        throw new Error('This account has been suspended by administration. If you believe this is a mistake, please email support@vistarakrafts.com.');
      }
    }

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
    const entropy = `${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const orderNumber = `VK-${year}-${entropy}`;
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
      courier: null,
      tracking_number: rzpOrder.id,
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

    // 4. Locate Internal Order (In-memory or Supabase RPC)
    let order = inMemoryOrders.get(orderId) ||
                inMemoryOrders.get(razorpay_order_id) ||
                null;

    if (!order) {
      const rpcLookup = await this.supabaseRpc('get_order_by_identifier', {
        p_identifier: orderId || razorpay_order_id
      });
      if (rpcLookup.data) {
        order = rpcLookup.data;
      } else {
        const lookup = await this.supabaseRequest(`orders?or=(order_number.eq.${encodeURIComponent(orderId || '')},tracking_number.eq.${encodeURIComponent(razorpay_order_id)})&select=*`);
        if (lookup.data && Array.isArray(lookup.data) && lookup.data.length > 0) {
          order = lookup.data[0];
        }
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

    // 6. ACID Cross-Instance Reconciliation via Supabase Stored Procedure
    const recon = await this.supabaseRpc('reconcile_order_payment', {
      p_order_number: order.order_number,
      p_payment_id: razorpay_payment_id,
      p_razorpay_order_id: razorpay_order_id,
      p_amount: Number(order.total),
      p_signature: razorpay_signature || '',
      p_method: gatewayPayment.method || 'upi'
    });

    if (recon.error) {
      throw new Error(`Database error reconciling payment: ${recon.error}`);
    }

    const reconData = recon.data || {};
    if (reconData.success === false) {
      if (reconData.code === 'OUT_OF_STOCK') {
        return {
          success: false,
          verified: true,
          status: 'out_of_stock',
          error: 'Product went out of stock during payment completion. Automatic refund scheduled.',
          orderId: order.order_number,
          paymentId: razorpay_payment_id
        };
      }
      throw new Error(`Reconciliation failure: ${reconData.error || reconData.code}`);
    }

    // 7. Update in-memory cache
    const updatedOrder = {
      ...order,
      payment_status: 'paid',
      order_status: 'processing',
      tracking_number: order.tracking_number || razorpay_order_id,
      notes: `${order.notes || ''} | PAID:${razorpay_payment_id}`.trim(),
      updated_at: new Date().toISOString()
    };
    inMemoryOrders.set(updatedOrder.order_number, updatedOrder);
    inMemoryOrders.set(updatedOrder.id, updatedOrder);
    inMemoryOrders.set(razorpay_order_id, updatedOrder);

    return {
      success: true,
      verified: true,
      status: 'paid',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      alreadyProcessed: Boolean(reconData.already_paid),
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
    if (!order || !Array.isArray(order.items)) return { success: true };

    const orderNumber = order.order_number || order.orderId;
    if (!orderNumber) return { success: true };

    // Cross-instance idempotency check: check if inventory for this order was already deducted in Supabase
    try {
      const logCheck = await this.supabaseRequest(`inventory_logs?notes=like.*Order%20%23${encodeURIComponent(orderNumber)}*&select=id`);
      if (logCheck.data && Array.isArray(logCheck.data) && logCheck.data.length > 0) {
        return { success: true, alreadyDeducted: true };
      }
    } catch (_e) {}

    for (const item of order.items) {
      const productId = item.productId || item.id;
      const qty = Number(item.qty || item.quantity || 1);
      const sku = item.sku || 'VK-STD';

      if (!productId) continue;

      const rpcRes = await this.supabaseRpc('deduct_product_stock_atomic', {
        p_product_id: productId,
        p_qty: qty,
        p_order_number: orderNumber,
        p_sku: sku
      });

      if (rpcRes.error || (rpcRes.data && rpcRes.data.success === false)) {
        const failure = rpcRes.data || { error: rpcRes.error };
        console.error('[OrderService] Atomic inventory deduction failed:', failure);
        return {
          success: false,
          error: failure.error || 'Inventory deduction failed',
          code: failure.code || 'OUT_OF_STOCK',
          details: failure
        };
      }
    }

    return { success: true, deducted: true };
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

    // Deduplicate webhook event in memory
    if (processedWebhookEvents.has(eventId)) {
      return { success: true, duplicate: true, message: 'Event already processed.' };
    }

    const eventType = event.event;
    const payload = event.payload || {};

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const rzpOrderId = paymentEntity ? paymentEntity.order_id : (payload.order && payload.order.entity ? payload.order.entity.id : null);

      if (rzpOrderId) {
        let order = inMemoryOrders.get(rzpOrderId);
        if (!order) {
          const rpcLookup = await this.supabaseRpc('get_order_by_identifier', {
            p_identifier: rzpOrderId
          });
          if (rpcLookup.data) {
            order = rpcLookup.data;
          } else {
            const lookup = await this.supabaseRequest(`orders?tracking_number=eq.${encodeURIComponent(rzpOrderId)}&select=*`);
            if (lookup.data && Array.isArray(lookup.data) && lookup.data.length > 0) {
              order = lookup.data[0];
            }
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

          const paymentId = paymentEntity ? paymentEntity.id : `pay_wh_${rzpOrderId}`;

          // ACID Cross-Instance Reconciliation via Supabase Stored Procedure
          const recon = await this.supabaseRpc('reconcile_order_payment', {
            p_order_number: order.order_number,
            p_payment_id: paymentId,
            p_razorpay_order_id: rzpOrderId,
            p_amount: Number(order.total),
            p_signature: signature || '',
            p_method: (paymentEntity && paymentEntity.method) || 'webhook'
          });

          if (recon.error) {
            throw new Error(`Database write error processing webhook order: ${recon.error}`);
          }

          const reconData = recon.data || {};
          if (reconData.success === false && reconData.code !== 'OUT_OF_STOCK') {
            throw new Error(`Webhook reconciliation failure: ${reconData.error || reconData.code}`);
          }

          // Update in-memory cache
          order.payment_status = 'paid';
          order.order_status = 'processing';
          order.updated_at = new Date().toISOString();
          inMemoryOrders.set(order.order_number, order);
          inMemoryOrders.set(order.id, order);

          // Mark event as processed only upon confirmed database success
          processedWebhookEvents.add(eventId);

          return { success: true, processed: true, event: eventType, recon: reconData };
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

    processedWebhookEvents.add(eventId);
    return { success: true, processed: true, event: eventType };
  }
}

OrderService.razorpayService = razorpayService;
