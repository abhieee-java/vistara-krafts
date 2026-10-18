import crypto from 'node:crypto';
import { CONFIG } from './config.js';

export class RazorpayService {
  constructor(keyId = CONFIG.RAZORPAY_KEY_ID, keySecret = CONFIG.RAZORPAY_KEY_SECRET, webhookSecret = CONFIG.RAZORPAY_WEBHOOK_SECRET) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.baseUrl = 'https://api.razorpay.com/v1';
  }

  getAuthHeader() {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  /**
   * Create an authoritative order on Razorpay with server-calculated amount
   * @param {Object} params
   * @param {number} params.amountPaise - Amount in Indian Paise (e.g. 10000 for ₹100.00)
   * @param {string} params.receipt - Internal order identifier (e.g. VK-2026-1049)
   * @param {Object} [params.notes] - Operational metadata
   */
  async createOrder({ amountPaise, receipt, notes = {} }) {
    if (!amountPaise || typeof amountPaise !== 'number' || amountPaise <= 0) {
      throw new Error(`Invalid Razorpay order amount: ${amountPaise}. Amount must be positive integer in paise.`);
    }

    const payload = {
      amount: Math.round(amountPaise),
      currency: CONFIG.CURRENCY,
      receipt: String(receipt || `rcpt_${Date.now()}`),
      payment_capture: 1,
      notes: {
        platform: 'Vistara Krafts E-Commerce',
        ...notes
      }
    };

    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Razorpay Order Creation Failed [HTTP ${res.status}]: ${errBody}`);
    }

    const data = await res.json();
    return data;
  }

  /**
   * Fetch payment details directly from Razorpay to verify server-side status
   * @param {string} paymentId
   */
  async fetchPayment(paymentId) {
    if (!paymentId) throw new Error('paymentId is required');

    const res = await fetch(`${this.baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Razorpay Fetch Payment Failed [HTTP ${res.status}]: ${errBody}`);
    }

    return await res.json();
  }

  /**
   * Constant-time HMAC-SHA256 signature verification for frontend checkout callbacks
   * @param {Object} params
   * @param {string} params.razorpay_order_id
   * @param {string} params.razorpay_payment_id
   * @param {string} params.razorpay_signature
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    try {
      const bufExpected = Buffer.from(expected, 'utf8');
      const bufReceived = Buffer.from(String(razorpay_signature).trim(), 'utf8');
      if (bufExpected.length !== bufReceived.length) {
        return false;
      }
      return crypto.timingSafeEqual(bufExpected, bufReceived);
    } catch (_err) {
      return false;
    }
  }

  /**
   * Constant-time HMAC-SHA256 signature verification for inbound Razorpay webhooks
   * @param {string|Buffer} rawBody
   * @param {string} signature
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!rawBody || !signature) return false;

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyString)
      .digest('hex');

    try {
      const bufExpected = Buffer.from(expected, 'utf8');
      const bufReceived = Buffer.from(String(signature).trim(), 'utf8');
      if (bufExpected.length !== bufReceived.length) {
        return false;
      }
      return crypto.timingSafeEqual(bufExpected, bufReceived);
    } catch (_err) {
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
