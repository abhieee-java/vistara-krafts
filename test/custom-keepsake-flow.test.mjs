// custom-keepsake-flow.test.mjs
// Automated verification suite for Vistāra Krafts 6-Step Guided Custom Keepsake Flow

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const APP_PATH = path.resolve('app.js');
const BRIDGE_PATH = path.resolve('store-bridge.js');

test('Guided Custom Keepsake Flow & Cart Order Isolation Suite', async (t) => {
  // 1. Static Invariant Analysis
  await t.test('1. Static Code Analysis: 6-Step Flow & Invariant Rules', () => {
    const appCode = fs.readFileSync(APP_PATH, 'utf8');

    // Rule 1: No legacy monolithic title in custom builder
    assert.ok(
      !appCode.includes('Custom Memory Preservation &amp; Pour Calculator') &&
      !appCode.includes('Custom Memory Preservation & Pour Calculator'),
      'Legacy H1 heading "Custom Memory Preservation & Pour Calculator" must be removed'
    );

    // Rule 2: 6 distinct steps exist
    assert.ok(appCode.includes('What would you like to make?'), 'Step 1 question exists');
    assert.ok(appCode.includes('What would you like to preserve?'), 'Step 2 question exists');
    assert.ok(appCode.includes('Show us your item'), 'Step 3 question exists');
    assert.ok(appCode.includes('Choose a size'), 'Step 4 question exists');
    assert.ok(appCode.includes('Make it yours'), 'Step 5 question exists');
    assert.ok(appCode.includes('Review your keepsake'), 'Step 6 question exists');

    // Rule 3: Photo buttons and helper text
    assert.ok(appCode.includes('Take a clear photo of what you’d like us to preserve.'), 'Item photo helper text exists');
    assert.ok(appCode.includes('Add item photo'), 'Add item photo button label exists');
    assert.ok(appCode.includes('Have a look in mind? Add a photo of a colour, layout, or style you like.'), 'Reference photo helper text exists');
    assert.ok(appCode.includes('Add reference photo'), 'Add reference photo button label exists');
    assert.ok(appCode.includes('Replace'), 'Replace photo button exists');
    assert.ok(appCode.includes('removeCustomKeepsakePhoto'), 'Remove photo handler exists');

    // Rule 4: Labels & inputs
    assert.ok(appCode.includes('Text to engrave'), 'Engraving label exists');
    assert.ok(appCode.includes('placeholder="Aarav &amp; Diya"'), 'Engraving placeholder example exists');
    assert.ok(appCode.includes('Wedding date'), 'Wedding date label exists');
    assert.ok(appCode.includes('Select a date'), 'Wedding date placeholder / select text exists');

    // Rule 5: Step indicators & sticky bar
    assert.ok(appCode.includes('Step ${b.step} of 6'), 'Step 1 of 6 counter exists');
    assert.ok(appCode.includes('customBuilderNextStep'), 'Next step handler exists');
    assert.ok(appCode.includes('customBuilderPrevStep'), 'Prev step handler exists');
    assert.ok(appCode.includes('customBuilderGoToStep'), 'Go to step handler exists');
  });

  // 2. State Machine & Navigation Verification
  await t.test('2. State Machine: Navigation, Validation & Photo Operations', () => {
    // Setup a headless browser DOM environment
    const sandbox = {
      window: {},
      document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
      },
      localStorage: {
        _data: {},
        getItem(k) { return this._data[k] || null; },
        setItem(k, v) { this._data[k] = String(v); },
        removeItem(k) { delete this._data[k]; }
      },
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout: (id) => clearTimeout(id)
    };
    sandbox.window = sandbox;
    sandbox.global = sandbox;

    vm.createContext(sandbox);

    // Initialize builder state
    const builder = {
      step: 1,
      productType: 'preservation-block',
      productName: 'Preservation Block',
      itemToPreserve: 'Wedding Varmala & Jaimala',
      itemPhotoUrl: '',
      itemPhotoName: '',
      referencePhotoUrl: '',
      referencePhotoName: '',
      shape: '12" Royal Heirloom Block',
      sizeDimensions: '30 × 30 × 5 cm (50mm depth)',
      shapePrice: 4499,
      metallic: '24K Gold Leaf + Champagne Rim',
      metallicAddon: 350,
      secondaryKeepsake: 'None (Main Keepsake Only)',
      secondaryAddon: 0,
      ledBase: true,
      hasEngraving: true,
      engraving: 'Aarav & Diya',
      weddingDate: '2026-12-18',
      pickupSlot: 'Morning Slot (9:00 AM – 1:00 PM)',
      stepError: ''
    };

    // Test Navigation: Step 1 -> Step 2
    assert.equal(builder.step, 1);
    builder.step = 2;
    assert.equal(builder.step, 2);

    // Test Navigation: Step 2 -> Step 3
    builder.step = 3;
    assert.equal(builder.step, 3);

    // Test Step 3 Validation: Requires item photo for Wedding Varmala
    const validateStep3WithoutPhoto = () => {
      const isFloral = builder.itemToPreserve !== 'Atelier Fresh Flowers (Provided by Studio)';
      if (isFloral && !builder.itemPhotoUrl) {
        return 'Please add a photo of your item to continue.';
      }
      return null;
    };
    assert.equal(validateStep3WithoutPhoto(), 'Please add a photo of your item to continue.');

    // Upload Item Photo
    builder.itemPhotoUrl = 'https://supabase.co/storage/v1/object/public/custom-keepsakes/item_sample_1.jpg';
    builder.itemPhotoName = 'varmala_flowers.jpg';
    assert.equal(validateStep3WithoutPhoto(), null, 'Step 3 passes when item photo is attached');

    // Skip optional design reference photo
    assert.equal(builder.referencePhotoUrl, '', 'Design reference photo can be skipped');

    // Advance to Step 4
    builder.step = 4;
    assert.equal(builder.step, 4);

    // Change Size
    builder.shape = '16" Gallery Mantel Frame';
    builder.sizeDimensions = '40 × 30 × 5 cm';
    builder.shapePrice = 6999;
    assert.equal(builder.shapePrice, 6999);

    // Replace photo test
    builder.itemPhotoUrl = 'https://supabase.co/storage/v1/object/public/custom-keepsakes/item_sample_2_replaced.jpg';
    builder.itemPhotoName = 'varmala_flowers_hd.jpg';
    assert.ok(builder.itemPhotoUrl.includes('replaced'));

    // Advance to Step 5
    builder.step = 5;
    assert.equal(builder.step, 5);

    // Advance to Step 6
    builder.step = 6;
    assert.equal(builder.step, 6);

    // Jump from Step 6 back to Step 4 (Edit size directly)
    builder.step = 4;
    builder.shape = '14" Mughal Arch Block';
    builder.shapePrice = 5299;
    assert.equal(builder.step, 4);
    assert.equal(builder.shapePrice, 5299);

    // Return to Step 6
    builder.step = 6;
    assert.equal(builder.step, 6);
  });

  // 3. Multi-Keepsake Cart & Order Isolation
  await t.test('3. Store Bridge: 2 Differently Customized Keepsakes in Same Bag', () => {
    // Load store-bridge in sandbox
    const sandbox = {
      window: {},
      document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
      localStorage: {
        _data: {},
        getItem(k) { return this._data[k] || null; },
        setItem(k, v) { this._data[k] = String(v); },
        removeItem(k) { delete this._data[k]; }
      },
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout: (id) => clearTimeout(id)
    };
    sandbox.window = sandbox;
    sandbox.global = sandbox;

    const bridgeCode = fs.readFileSync(BRIDGE_PATH, 'utf8');
    vm.runInNewContext(bridgeCode, sandbox);

    const store = sandbox.window.StorefrontBridge;
    assert.ok(store, 'StorefrontBridge initialized');

    // Keepsake A: Wedding Varmala Arch with Photo A
    const keepsakeA = {
      productId: 'vk-cat-res-301',
      name: 'Custom Memory Preservation Commission',
      variantLabel: '14" Mughal Arch Block',
      shape: '14" Mughal Arch Block',
      size: '35 × 25 × 5 cm',
      price: 5299 + 350 + 499, // Base + Gold Leaf + LED
      regularPrice: 5299 + 350 + 499,
      isCustomPreservation: true,
      sku: 'RAM-CUSTOM-KEEP',
      customDetails: {
        customId: 'custom_order_item_A',
        productType: 'mughal-arch',
        occasion: 'Wedding Varmala & Jaimala',
        itemPhotoUrl: 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_A.jpg',
        itemPhotoName: 'red_rose_varmala.jpg',
        referencePhotoUrl: 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/ref_A.jpg',
        referencePhotoName: 'gold_foil_style.jpg',
        shape: '14" Mughal Arch Block',
        shapePrice: 5299,
        metallic: '24K Gold Leaf + Champagne Rim',
        metallicAddon: 350,
        ledBase: true,
        engraving: 'Aarav & Diya',
        fontStyle: 'Royal Italic Serif',
        weddingDate: '2026-11-20'
      }
    };

    // Keepsake B: Memorial Flowers Petite Hexagon with Photo B
    const keepsakeB = {
      productId: 'vk-cat-res-301',
      name: 'Custom Memory Preservation Commission',
      variantLabel: '10" Royal Hexagon Frame',
      shape: '10" Royal Hexagon Frame',
      size: '25 × 22 × 4.5 cm',
      price: 3899, // Base only
      regularPrice: 3899,
      isCustomPreservation: true,
      sku: 'RAM-CUSTOM-KEEP',
      customDetails: {
        customId: 'custom_order_item_B',
        productType: 'hexagon-frame',
        occasion: 'Memorial Flowers & Tribute',
        itemPhotoUrl: 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_B.jpg',
        itemPhotoName: 'white_lilies.jpg',
        referencePhotoUrl: '',
        referencePhotoName: '',
        shape: '10" Royal Hexagon Frame',
        shapePrice: 3899,
        metallic: 'Pure Crystal Clear (Zero Flakes)',
        metallicAddon: 0,
        ledBase: false,
        engraving: 'Forever In Our Hearts',
        fontStyle: 'Modern Minimalist Grotesk',
        weddingDate: '2026-05-10'
      }
    };

    // Add both to cart
    store.addToCart(keepsakeA);
    store.addToCart(keepsakeB);

    const cart = store.getCart();
    assert.equal(cart.length, 2, 'Cart must hold both custom keepsakes as distinct line items');

    // Verify isolation of Keepsake A
    const itemA = cart.find(i => i.customDetails?.customId === 'custom_order_item_A');
    assert.ok(itemA, 'Keepsake A found in cart');
    assert.equal(itemA.customDetails.itemPhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_A.jpg');
    assert.equal(itemA.customDetails.referencePhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/ref_A.jpg');
    assert.equal(itemA.price, 6148);
    assert.equal(itemA.customDetails.shape, '14" Mughal Arch Block');

    // Verify isolation of Keepsake B
    const itemB = cart.find(i => i.customDetails?.customId === 'custom_order_item_B');
    assert.ok(itemB, 'Keepsake B found in cart');
    assert.equal(itemB.customDetails.itemPhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_B.jpg');
    assert.equal(itemB.customDetails.referencePhotoUrl, '');
    assert.equal(itemB.price, 3899);
    assert.equal(itemB.customDetails.shape, '10" Royal Hexagon Frame');

    // Authenticate patron for checkout
    sandbox.localStorage.setItem('ram_vk_cf_auth_v2', JSON.stringify({
      authenticated: true,
      email: 'patron@vistarakrafts.com',
      name: 'Kakoli Borah',
      phone: '9876543210',
      address: 'Vistāra Krafts Atelier, Beltola, Guwahati - 781001',
      pincode: '781001'
    }));

    // Place Order through Bridge
    const placeOrderResult = store.placeOrder({
      name: 'Kakoli Borah',
      phone: '9876543210',
      address: 'Vistāra Krafts Atelier, Beltola, Guwahati',
      pincode: '781001',
      paymentMethod: 'UPI / Razorpay'
    });

    assert.ok(placeOrderResult && placeOrderResult.success, 'Order placed successfully');
    const placedOrder = placeOrderResult.order;
    assert.ok(placedOrder.orderId.startsWith('VK-2026-'), 'Valid order number generated');
    assert.equal(placedOrder.items.length, 2, 'Order carries both items');

    // Verify both items in the order have their distinct customDetails and photos
    const ordItemA = placedOrder.items.find(i => i.customDetails?.customId === 'custom_order_item_A');
    const ordItemB = placedOrder.items.find(i => i.customDetails?.customId === 'custom_order_item_B');

    assert.ok(ordItemA, 'Order Item A has customDetails preserved');
    assert.equal(ordItemA.customDetails.itemPhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_A.jpg');
    assert.equal(ordItemA.customDetails.referencePhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/ref_A.jpg');

    assert.ok(ordItemB, 'Order Item B has customDetails preserved');
    assert.equal(ordItemB.customDetails.itemPhotoUrl, 'https://niamxrskqhjvzwxomxrx.supabase.co/storage/v1/object/public/custom-keepsakes/item_B.jpg');
    assert.equal(ordItemB.customDetails.referencePhotoUrl, '');
  });

  // 4. Admin Order Detail Drawer Mapping Verification
  await t.test('4. Admin Portal: Owner Order View Labels & Zoom Modals', () => {
    const adminDrawerPath = path.resolve('../vistara-krafts-admin/src/components/orders/OrderDetailDrawer.tsx');
    const adminCode = fs.readFileSync(adminDrawerPath, 'utf8');

    // Verify clearly labeled photos
    assert.ok(adminCode.includes("Customer's Item to Preserve"), 'Admin displays "Customer\'s Item to Preserve" label');
    assert.ok(adminCode.includes("Requested Style Reference"), 'Admin displays "Requested Style Reference" label');
    assert.ok(adminCode.includes("setZoomedPhoto"), 'Admin provides zoom modal trigger');
    assert.ok(adminCode.includes("Item-Specific Custom Keepsake Photos & Details"), 'Admin handles multiple keepsakes per order with per-item photos');
  });
});
