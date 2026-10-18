import fs from 'node:fs';
import path from 'node:path';

const fixturesPath = path.resolve('test-fixtures.js');
const catalogPath = path.resolve('../catalog_extracted/catalog_products.json');

const catalogProducts = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let content = fs.readFileSync(fixturesPath, 'utf8');

// Read existing TEST_PRODUCTS
const { TEST_PRODUCTS } = await import('../test-fixtures.js');
const existingIds = new Set(TEST_PRODUCTS.map(p => p.id));

const productsToAdd = catalogProducts.filter(p => !existingIds.has(p.id));

if (productsToAdd.length === 0) {
  console.log('All catalog products already present in test-fixtures.js');
  process.exit(0);
}

console.log(`Adding ${productsToAdd.length} products to test-fixtures.js...`);

// Format additions as JS objects
const additionsStr = ',\n' + productsToAdd.map(p => {
  return `    ${JSON.stringify(p, null, 2).replace(/\n/g, '\n    ')}`;
}).join(',\n');

// Insert right before `  ];\nexport default TEST_PRODUCTS;`
const targetIdx = content.lastIndexOf('  ];\nexport default TEST_PRODUCTS;');
if (targetIdx !== -1) {
  const newContent = content.slice(0, targetIdx) + additionsStr + '\n' + content.slice(targetIdx);
  fs.writeFileSync(fixturesPath, newContent, 'utf8');
  console.log(`✅ Successfully updated test-fixtures.js with ${productsToAdd.length} products!`);
} else {
  console.error('❌ Could not locate insertion point in test-fixtures.js');
}
