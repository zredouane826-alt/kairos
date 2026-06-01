#!/usr/bin/env node
// Patches @supabase/supabase-js to remove `import(/* webpackIgnore */...)` syntax
// that hermesc (Hermes compiler) cannot parse when building with Expo.
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../node_modules/@supabase/supabase-js/dist/index.cjs'),
  path.join(__dirname, '../node_modules/@supabase/supabase-js/dist/index.mjs'),
];

const pattern = /otelModulePromise\s*=\s*import\(\s*(?:\/\*[\s\S]*?\*\/\s*)*OTEL_PKG\s*\)/g;
const replacement = 'otelModulePromise = Promise.resolve(null)';

files.forEach((file) => {
  if (!fs.existsSync(file)) return;
  const original = fs.readFileSync(file, 'utf8');
  if (!pattern.test(original)) return;
  pattern.lastIndex = 0;
  const patched = original.replace(pattern, replacement);
  fs.writeFileSync(file, patched);
  console.log(`[patch-supabase] Patched ${path.basename(file)}`);
});
