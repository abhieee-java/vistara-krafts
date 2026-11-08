import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.join(__dirname, '..', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

test('Cart Quantity Zero-Refresh & Luxury Wishlist Suite', async (t) => {
  await t.test('1. Invariant: handleCartQty contains ZERO calls to renderActiveView()', () => {
    const handleQtyMatch = appJsContent.match(/window\.handleCartQty\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(handleQtyMatch, 'window.handleCartQty function must exist in app.js');
    const fnBody = handleQtyMatch[0];
    assert.ok(
      !fnBody.includes('renderActiveView()'),
      'window.handleCartQty must NEVER call renderActiveView() — in-place micro-reconciliation required'
    );
    assert.ok(
      fnBody.includes('.js-cart-item-qty'),
      'handleCartQty must target .js-cart-item-qty in-place'
    );
    assert.ok(
      fnBody.includes('reconcileCartInvoiceDom'),
      'handleCartQty must call reconcileCartInvoiceDom for instant invoice calculation'
    );
  });

  await t.test('2. Layout Fix: Volume tier applied has dedicated stacked container with whitespace-nowrap', () => {
    assert.ok(
      appJsContent.includes('js-cart-item-tier-badge'),
      'Markup must provide .js-cart-item-tier-badge anchor'
    );
    assert.ok(
      appJsContent.includes('whitespace-nowrap') && appJsContent.includes('Volume Tier Applied'),
      'Volume tier badge must include whitespace-nowrap to prevent 3-line word wrapping on mobile'
    );
  });

  await t.test('3. Copy Fix: Duplicate PIN code in delivery card is sanitized', () => {
    assert.ok(
      appJsContent.includes('Pan-India Express Hub') || appJsContent.includes('cleanCity'),
      'Delivery card city label must sanitize redundant Zone PIN numbers'
    );
  });

  await t.test('4. Invariant: Coupon and GST handlers use in-place reconciliation without renderActiveView()', () => {
    const applyMatch = appJsContent.match(/window\.handleApplyCoupon\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(applyMatch, 'window.handleApplyCoupon must exist');
    assert.ok(!applyMatch[0].includes('renderActiveView()'), 'handleApplyCoupon must not call renderActiveView()');

    const removeMatch = appJsContent.match(/window\.handleRemoveCoupon\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(removeMatch, 'window.handleRemoveCoupon must exist');
    assert.ok(!removeMatch[0].includes('renderActiveView()'), 'handleRemoveCoupon must not call renderActiveView()');

    const quickMatch = appJsContent.match(/window\.quickSelectCoupon\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(quickMatch, 'window.quickSelectCoupon must exist');
    assert.ok(!quickMatch[0].includes('renderActiveView()'), 'quickSelectCoupon must not call renderActiveView()');

    const gstMatch = appJsContent.match(/window\.toggleGstClaim\s*=\s*function[\s\S]*?\n  \};/);
    assert.ok(gstMatch, 'window.toggleGstClaim must exist');
    assert.ok(!gstMatch[0].includes('renderActiveView()'), 'toggleGstClaim must not call renderActiveView()');
  });

  await t.test('5. Wishlist Architecture: Bespoke luxury card with 1-click Add to Bag and zero area waste', () => {
    assert.ok(
      appJsContent.includes('function renderWishlistItemCard(p)'),
      'Must define dedicated renderWishlistItemCard function'
    );
    assert.ok(
      appJsContent.includes('window.handleWishlistAddToCart'),
      'Must define window.handleWishlistAddToCart for 1-click move to bag'
    );
    assert.ok(
      appJsContent.includes('data-wishlist-card-id'),
      'Wishlist cards must have data-wishlist-card-id attribute for surgical collapse'
    );
    assert.ok(
      appJsContent.includes('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'),
      'Wishlist items must render in a compact 2-column mobile / 3-4 column desktop luxury grid'
    );
  });

  await t.test('6. Mobile Architecture: In-card checkout button has hidden lg:flex to eliminate duplicate checkout buttons on mobile', () => {
    assert.ok(
      appJsContent.includes('desktop-cart-checkout-btn hidden lg:flex'),
      'In-card checkout button must have hidden lg:flex to prevent duplicate buttons on mobile viewports'
    );
  });

  await t.test('7. Wishlist Mobile Polish: Unified compact header with zero dead space above/below back button', () => {
    assert.ok(
      appJsContent.includes('Back to Shopping') && appJsContent.includes('Personal Atelier'),
      'Wishlist header must feature unified top bar with Back to Shopping and Personal Atelier badge'
    );
    assert.ok(
      appJsContent.includes('wishlist-header-count'),
      'Wishlist must preserve #wishlist-header-count micro-reconciliation anchor'
    );
  });

  await t.test('8. Footer ASCII Magic Integration: Animated balloon-valley-sunrise piece at final footer position', () => {
    const indexHtmlPath = path.join(__dirname, '..', 'index.html');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    assert.ok(
      indexHtmlContent.includes('https://www.ascii-magic.com/ascii/ascii.js'),
      'index.html must load ASCII Magic module script once in the browser'
    );
    assert.ok(
      indexHtmlContent.includes('<ascii-art piece="balloon-valley-sunrise"'),
      'index.html footer must embed the balloon-valley-sunrise ASCII art piece'
    );
    assert.ok(
      indexHtmlContent.includes('Atelier Sunrise') && indexHtmlContent.includes('Guwahati, Assam'),
      'Footer must provide real accompanying heading and text next to the ASCII art'
    );

    // Verify order: Legal/DPDP badges appear BEFORE ASCII art piece
    const dpdpIdx = indexHtmlContent.indexOf('DPDP Act 2023 Compliant');
    const isoIdx = indexHtmlContent.indexOf('ISO 9001:2015 Certified');
    const asciiIdx = indexHtmlContent.indexOf('<ascii-art piece="balloon-valley-sunrise"');
    assert.ok(dpdpIdx !== -1 && isoIdx !== -1 && asciiIdx !== -1, 'All footer elements must be present');
    assert.ok(
      dpdpIdx < asciiIdx && isoIdx < asciiIdx,
      'ASCII art piece must be positioned at the very end of the footer after DPDP & ISO compliance notes'
    );
  });

  await t.test('9. Catalog Search Zero-Refresh & Fine-Grained DOM Reconciliation', () => {
    assert.ok(
      appJsContent.includes('function reconcileCatalogDom()') || appJsContent.includes('window.reconcileCatalogDom ='),
      'app.js must provide reconcileCatalogDom for in-place surgical catalog updates'
    );
    assert.ok(
      appJsContent.includes('id="catalog-products-container"'),
      'app.js must render #catalog-products-container anchor for zero-refresh updates'
    );
    assert.ok(
      appJsContent.includes('id="catalog-search-clear-btn"'),
      'app.js must render #catalog-search-clear-btn for toggleable search clear'
    );
    assert.ok(
      appJsContent.includes('id="catalog-active-filter-tags-container"'),
      'app.js must render #catalog-active-filter-tags-container for active filter pills'
    );
    assert.ok(
      appJsContent.includes('reconcileCatalogDom()'),
      'window.setCatalogSearch must call reconcileCatalogDom() when on catalog page'
    );
  });
});
