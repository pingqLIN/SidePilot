/**
 * Bundle Defuddle + Turndown into a single browser-compatible IIFE
 * for use in Chrome extension content script injection.
 *
 * Licenses:
 *   Defuddle — MIT © 2025 Steph Ango (https://github.com/kepano/defuddle)
 *   Turndown — MIT © 2017 Dom Christie (https://github.com/mixmark-io/turndown)
 */
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.join(__dirname, 'vendor-entry.mjs')],
  bundle: true,
  format: 'iife',
  globalName: '__SidePilotVendor',
  outfile: path.join(__dirname, '..', 'extension', 'js', 'vendor-content-cleaner.js'),
  minify: true,
  target: ['chrome120'],
  banner: {
    js: [
      '/* SidePilot vendor bundle — content cleaning utilities',
      ' * Defuddle (MIT) © 2025 Steph Ango — https://github.com/kepano/defuddle',
      ' * Turndown (MIT) © 2017 Dom Christie — https://github.com/mixmark-io/turndown',
      ' */',
    ].join('\n'),
  },
});

console.log('✅ vendor-content-cleaner.js built');
