import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeBridgePath = path.join(__dirname, '..', 'store-bridge.js');
const appJsPath = path.join(__dirname, '..', 'app.js');

const storeBridgeCode = fs.readFileSync(storeBridgePath, 'utf8');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

test('PDP "Buy Now" Isolation vs Cart Order Suite', async (t) => {
  await t.test('1. Static Invariant: buyNowPdp never calls addPdpToCart', () => {
    const buyNowMatch = appJsCode.match(/window\.buyNowPdp\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(buyNowMatch, 'window.buyNowPdp function must exist in app.js');
    const fnBody = buyNowMatch[0];
    assert.ok(
      !fnBody.includes('addPdpToCart'),
      'buyNowPdp must NEVER call addPdpToCart — Buy Now must isolate the single item without adding to cart'
    );
    assert.ok(
      fnBody.includes("AppState.checkoutMode = 'buy_now'") || fnBody.includes('AppState.checkoutMode = "buy_now"'),
      'buyNowPdp must set AppState.checkoutMode to buy_now'
    );
    assert.ok(
      fnBody.includes('AppState.buyNowItem = item'),
      'buyNowPdp must store the isolated item in AppState.buyNowItem'
    );
  });

  await t.test('2. Static Invariant: openCheckoutModal computes summary for override item when in buy_now mode', () => {
    assert.ok(
      appJsCode.includes('Store.getCartSummary([AppState.buyNowItem])'),
      'openCheckoutModal must call Store.getCartSummary([AppState.buyNowItem]) in buy_now mode'
    );
    assert.ok(
      appJsCode.includes('Instant Checkout'),
      'openCheckoutModal must set modal title to Instant Checkout for Buy Now'
    );
  });

  await t.test('3. Static Invariant: placeOrder & placeOrderAsync do not clear cart for Buy Now', () => {
    assert.ok(
      storeBridgeCode.includes('if (!isBuyNow) {\n        this.clearCart();\n      }') ||
      storeBridgeCode.includes('if (!isBuyNow) {\r\n        this.clearCart();\r\n      }'),
      'placeOrder must only call this.clearCart() when !isBuyNow'
    );
    assert.ok(
      storeBridgeCode.includes('if (!isBuyNow) {\n                  this.clearCart();\n                }') ||
      storeBridgeCode.includes('if (!isBuyNow) {\r\n                  this.clearCart();\r\n                }'),
      'placeOrderAsync must only call this.clearCart() when !isBuyNow'
    );
  });

  await t.test('4. Runtime Functional Verification: Buy Now isolates order without touching existing cart', async () => {
    // Set up mock browser environment
    global.__VK_TEST_ENV__ = true;
    global.window = global;
    global.localStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };
    global.sessionStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    };
    global.document = {
      getElementById() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      head: { appendChild() {} }
    };

    // Evaluate store-bridge in test environment
    const evalCode = storeBridgeCode.replace(/\(function \(global\) \{/, '(function (global) {\n');
    new Function('global', evalCode)(global);

    const Store = global.ResinStore;
    assert.ok(Store, 'ResinStore must be initialized');

    // Authenticate test user
    Store.loginPatron({
      provider: 'google',
      email: 'patron.buynow@vistarakrafts.com',
      name: 'Aditi Sharma',
      phone: '+919876543210'
    });

    // Clear any previous cart
    Store.clearCart();
    assert.strictEqual(Store.getCart().length, 0);

    // Step A: Add 3 items to the customer cart
    Store.addToCart({ productId: 'vk-cat-res-301', name: 'Ocean Geode Table', price: 8499, qty: 1 });
    Store.addToCart({ productId: 'vk-cat-clk-ocean', name: 'Artisan Clock', price: 3499, qty: 2 });
    Store.addToCart({ productId: 'vk-cat-cst-sq', name: 'Agate Coasters', price: 1299, qty: 1 });

    assert.strictEqual(Store.getCart().length, 3, 'Cart should hold 3 products');
    const generalSummary = Store.getCartSummary();
    assert.strictEqual(generalSummary.itemsCount, 4, 'Cart total qty should be 4 (1 + 2 + 1)');

    // Step B: Customer views a 4th product on PDP and clicks "Buy Now"
    const buyNowItem = {
      productId: 'vk-cat-pdr-glod',
      name: 'Gold Leaf Flakes Single Piece',
      variantLabel: 'Standard Edition',
      price: 799,
      regularPrice: 999,
      qty: 1
    };

    // Verify Buy Now summary is 100% isolated to only the 4th product
    const buyNowSummary = Store.getBuyNowSummary(buyNowItem);
    assert.strictEqual(buyNowSummary.itemsCount, 1, 'Buy Now summary must contain ONLY 1 item');
    assert.strictEqual(buyNowSummary.subtotal, 799, 'Buy Now subtotal must reflect only the single product price');
    assert.strictEqual(buyNowSummary.cart[0].productId, 'vk-cat-pdr-glod', 'Buy Now item must match selected product');

    // Verify user cart is completely untouched
    assert.strictEqual(Store.getCart().length, 3, 'General cart MUST still hold 3 products');

    // Step C: Execute Buy Now checkout
    const orderResult = Store.placeOrder({
      name: 'Aditi Sharma',
      phone: '9876543210',
      address: '22 Bandra West, Mumbai 400050',
      pincode: '400050',
      isBuyNow: true,
      buyNowItem: buyNowItem
    });

    assert.ok(orderResult.success, 'Buy Now order must succeed');
    assert.strictEqual(orderResult.order.items.length, 1, 'Placed order must contain ONLY 1 item');
    assert.strictEqual(orderResult.order.items[0].productId, 'vk-cat-pdr-glod', 'Placed order item must be the Buy Now product');
    assert.strictEqual(orderResult.order.subtotal, 799, 'Order subtotal must equal only the Buy Now item price');

    // Step D: CRITICAL INVARIANT: The customer general cart MUST remain 100% intact with 3 items!
    const postBuyNowCart = Store.getCart();
    assert.strictEqual(postBuyNowCart.length, 3, 'General cart must NOT be wiped or merged after Buy Now order');
    assert.strictEqual(postBuyNowCart[0].productId, 'vk-cat-res-301');
    assert.strictEqual(postBuyNowCart[1].productId, 'vk-cat-clk-ocean');
    assert.strictEqual(postBuyNowCart[2].productId, 'vk-cat-cst-sq');

    // Step E: Regular cart checkout continues to work normally and clears the cart on cart purchase
    const regularOrderResult = Store.placeOrder({
      name: 'Aditi Sharma',
      phone: '9876543210',
      address: '22 Bandra West, Mumbai 400050',
      pincode: '400050',
      isBuyNow: false
    });

    assert.ok(regularOrderResult.success, 'Regular cart order must succeed');
    assert.strictEqual(regularOrderResult.order.items.length, 3, 'Regular order must contain all 3 cart items');
    assert.strictEqual(Store.getCart().length, 0, 'Cart should be cleared after regular cart checkout');
  });
});
