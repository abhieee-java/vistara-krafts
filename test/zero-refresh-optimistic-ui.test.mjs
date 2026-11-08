import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

test('Zero-Refresh Optimistic UI & Micro-Reconciliation Suite', async (t) => {
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  await t.test('1. Static Code Analysis: Strict Zero-Refresh Architectural Invariants', () => {
    // 1a. Verify handleCartRemove does NOT call renderActiveView() directly
    const cartRemoveMatch = appJs.match(/window\.handleCartRemove\s*=\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\};/);
    assert.ok(cartRemoveMatch, 'window.handleCartRemove function definition must exist in app.js');
    const cartRemoveBody = cartRemoveMatch[1];
    
    // Check that renderActiveView is only called during empty cart fallback or rollback, never as a primary step
    assert.ok(
      !cartRemoveBody.includes('Store.removeFromCart(cartItemId);\n    updateGlobalBadges();\n    renderActiveView();'),
      'window.handleCartRemove must NOT execute synchronous renderActiveView() after item removal'
    );
    assert.ok(cartRemoveBody.includes('reconcileCartInvoiceDom'), 'handleCartRemove must call reconcileCartInvoiceDom');
    assert.ok(cartRemoveBody.includes('card.style.maxHeight'), 'handleCartRemove must apply maxHeight transition for smooth collapse');
    assert.ok(cartRemoveBody.includes('card.style.opacity'), 'handleCartRemove must apply opacity transition');
    assert.ok(cartRemoveBody.includes("client.from('cart').delete()"), 'handleCartRemove must execute background Supabase deletion');
    assert.ok(cartRemoveBody.includes('Could not remove item. Please check your connection.'), 'handleCartRemove must have defensive rollback toast');

    // 1b. Verify handleWishlistToggle does NOT call renderActiveView()
    const wishlistToggleMatch = appJs.match(/window\.handleWishlistToggle\s*=\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\};/);
    assert.ok(wishlistToggleMatch, 'window.handleWishlistToggle function definition must exist in app.js');
    const wishlistToggleBody = wishlistToggleMatch[1];
    assert.ok(!wishlistToggleBody.includes('renderActiveView();\n    if (res.added'), 'handleWishlistToggle must NOT re-render active view on toggle');
    assert.ok(wishlistToggleBody.includes('mutateWishlistButtonsDom'), 'handleWishlistToggle must call mutateWishlistButtonsDom');
    assert.ok(wishlistToggleBody.includes("client.from('wishlist')"), 'handleWishlistToggle must sync with Supabase in background');
    assert.ok(wishlistToggleBody.includes('Could not update wishlist. Please check your connection.'), 'handleWishlistToggle must have defensive rollback toast');
  });

  await t.test('2. DOM Semantic IDs: Cart View markup contains exact micro-reconciliation anchors', () => {
    assert.ok(appJs.includes('id="cart-header-count"'), 'app.js must render #cart-header-count for bag count');
    assert.ok(appJs.includes('id="cart-free-shipping-strip"'), 'app.js must render #cart-free-shipping-strip');
    assert.ok(appJs.includes('id="cart-free-shipping-bar"'), 'app.js must render #cart-free-shipping-bar');
    assert.ok(appJs.includes('id="cart-line-items-container"'), 'app.js must render #cart-line-items-container');
    assert.ok(appJs.includes('id="cart-subtotal"'), 'app.js must render #cart-subtotal for in-place subtotal');
    assert.ok(appJs.includes('id="cart-gst"'), 'app.js must render #cart-gst for in-place GST text');
    assert.ok(appJs.includes('id="total-payable"'), 'app.js must render #total-payable for in-place invoice total');
    assert.ok(appJs.includes('id="cart-sticky-total-payable"'), 'app.js must render #cart-sticky-total-payable for mobile bar');
  });

  await t.test('3. Wishlist Heart Attributes: Product cards & PDP render data-wishlist-btn', () => {
    assert.ok(appJs.includes('data-wishlist-btn="${esc(p.id)}"'), 'Product cards must render data-wishlist-btn attribute');
    assert.ok(appJs.includes('data-wishlist-btn="${esc(product.id)}"'), 'PDP must render data-wishlist-btn attribute');
  });
});
