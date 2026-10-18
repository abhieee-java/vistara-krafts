import { OrderService } from '../server/order-service.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_e) {
        return res.status(400).json({ success: false, error: 'Malformed JSON payload.' });
      }
    }

    const orderData = await OrderService.createCheckoutOrder(body || {});
    return res.status(200).json(orderData);
  } catch (err) {
    console.error('[API create-order Error]:', err.message);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to initiate secure checkout.'
    });
  }
}
