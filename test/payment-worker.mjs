import { OrderService } from '../server/order-service.js';

async function main() {
  const args = process.argv.slice(2);
  const actionArg = args.find(a => a.startsWith('--action='));
  const payloadArg = args.find(a => a.startsWith('--payload='));

  if (!actionArg || !payloadArg) {
    console.error(JSON.stringify({ success: false, error: 'Missing action or payload' }));
    process.exit(1);
  }

  const action = actionArg.split('=')[1];
  const payload = JSON.parse(decodeURIComponent(payloadArg.substring('--payload='.length)));

  try {
    if (action === 'verifyPayment') {
      if (payload.mockGatewayPayment) {
        OrderService.razorpayService.fetchPayment = async (payId) => ({
          id: payId,
          order_id: payload.razorpay_order_id,
          amount: payload.mockGatewayPayment.amount,
          currency: payload.mockGatewayPayment.currency || 'INR',
          status: 'captured',
          method: payload.mockGatewayPayment.method || 'upi'
        });
      }
      const result = await OrderService.verifyPayment(payload);
      console.log('__WORKER_RESULT__' + JSON.stringify(result));
    } else if (action === 'handleWebhook') {
      const { rawBody, signature } = payload;
      const result = await OrderService.handleWebhook(rawBody, signature);
      console.log('__WORKER_RESULT__' + JSON.stringify(result));
    } else {
      console.error(JSON.stringify({ success: false, error: 'Unknown action: ' + action }));
      process.exit(1);
    }
  } catch (err) {
    console.log('__WORKER_RESULT__' + JSON.stringify({ success: false, error: err.message }));
  }
}

main();
