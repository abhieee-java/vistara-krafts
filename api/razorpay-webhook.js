import { OrderService } from '../server/order-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header.' });
  }

  try {
    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const result = await OrderService.handleWebhook(rawBody, signature);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[API razorpay-webhook Error]:', err.message);
    return res.status(400).json({
      success: false,
      error: err.message || 'Webhook processing failed.'
    });
  }
}
