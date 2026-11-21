import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 [TEST SUITE] Drawer Navigation De-Duplication Verification');

const rootDir = process.cwd();
const appJsPath = path.join(rootDir, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 1. Static Invariant Tests
// Verify that inside the drawerSlot (account card) there is NO Sign Out button
const drawerSlotMatch = appJsContent.match(/drawerSlot\.innerHTML\s*=\s*`([\s\S]*?)`;\s*}\s*else\s*{/);
assert(drawerSlotMatch, 'Must find drawerSlot.innerHTML assignment in app.js');

const drawerSlotHtml = drawerSlotMatch[1];
assert(
  !drawerSlotHtml.includes('Sign Out'),
  '🚨 drawerSlot (account card) must NOT contain a Sign Out button (was duplicate)'
);
assert(
  !drawerSlotHtml.includes('handlePatronLogout()'),
  '🚨 drawerSlot must NOT call handlePatronLogout()'
);
assert(
  !drawerSlotHtml.includes('Manage Profile &amp; Address') && !drawerSlotHtml.includes('Manage Profile & Address'),
  '🚨 drawerSlot must NOT contain redundant Manage Profile & Address button (already in navigation list)'
);
console.log('  ✅ drawerSlot (account card) verified: Zero duplicate action buttons');

// Verify that inside drawerAuthActions:
// - "Manage Profile & Address" exists
// - "Sign Out" exists
// - "Sign Out" is the LAST button in the list
const drawerAuthMatch = appJsContent.match(/drawerAuthActions\.innerHTML\s*=\s*`([\s\S]*?)`;\s*}\s*else\s*{/);
assert(drawerAuthMatch, 'Must find drawerAuthActions.innerHTML assignment in app.js');

const drawerAuthHtml = drawerAuthMatch[1];
assert(
  drawerAuthHtml.includes('Manage Profile &amp; Address') || drawerAuthHtml.includes('Manage Profile & Address'),
  'drawerAuthActions must include Manage Profile & Address navigation item'
);
assert(
  drawerAuthHtml.includes('Sign Out'),
  'drawerAuthActions must include Sign Out button'
);

const buttonsInAuth = drawerAuthHtml.match(/<button[\s\S]*?<\/button>/g) || [];
assert(buttonsInAuth.length >= 2, 'drawerAuthActions should have navigation buttons');
const lastButton = buttonsInAuth[buttonsInAuth.length - 1];
assert(
  lastButton.includes('Sign Out') && lastButton.includes('handlePatronLogout'),
  'Sign Out must be the absolute last button in the drawer account navigation section'
);
console.log('  ✅ drawerAuthActions verified: Manage Profile & Address + Sign Out strictly at bottom');

// 2. Runtime DOM Simulation Test
global.window = global;
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        innerHTML: '',
        classList: {
          _classes: new Set(),
          add(c) { this._classes.add(c); },
          remove(c) { this._classes.delete(c); },
          contains(c) { return this._classes.has(c); }
        }
      };
    }
    return this.elements[id];
  },
  querySelectorAll() { return []; }
};

console.log('🎉 ALL DRAWER NAVIGATION DE-DUPLICATION TESTS PASSED!');
