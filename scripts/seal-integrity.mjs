#!/usr/bin/env node
/**
 * seal-integrity.mjs — 擴充完整性封印產生器
 *
 * 計算關鍵擴充檔案的雜湊值，寫入 manifest.json 的 version_name 欄位。
 * 擴充程式本身不知道此演算法的存在，無法反推或偽造。
 *
 * 用法：
 *   node scripts/seal-integrity.mjs          → 封印當前版本
 *   node scripts/seal-integrity.mjs --dry    → 僅顯示，不寫入
 *
 * 設計原則：
 *   - 演算法、鹽值、檔案清單僅存在於此腳本與 verify 腳本
 *   - 只封印關鍵程式內容，不把 version_name 本身納入摘要
 *   - 即使攻擊者讀取擴充所有檔案，也難以在不修改外部腳本下偽造封印
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXT = join(ROOT, 'extension');

// ── 機密參數（僅存在於此腳本與 verify 腳本）──

// 鹽值：與檔案內容混合，防止彩虹表攻擊
const SALT = 'SP::integrity::v1::7f3a9c2e';

// 關鍵檔案清單（順序固定，影響雜湊結果）
const CRITICAL_FILES = [
  'manifest.json',
  'background.js',
  'sidepanel.js',
  'sidepanel.html',
  'js/sdk-client.js',
  'js/rules-manager.js',
  'js/memory-bank.js',
  'templates/default-rules.md',
  'templates/self-iteration-rules.md',
  'templates/safety-rules.md',
  'templates/extension-dev-rules.md',
  'templates/typescript-rules.md',
  'templates/react-rules.md',
  'styles.css',
].map(f => join(EXT, f));

// 摘要長度（從 SHA-256 hex 取前 N 字元）
const DIGEST_LENGTH = 16;

// ── 計算封印 ──

function computeSeal() {
  const hash = createHash('sha256');
  hash.update(SALT);

  let fileCount = 0;
  for (const filepath of CRITICAL_FILES) {
    try {
      let content = readFileSync(filepath, 'utf-8');
      if (filepath.endsWith('manifest.json')) {
        const obj = JSON.parse(content);
        delete obj.version_name;
        content = JSON.stringify(obj, null, 2) + '\n';
      }
      // 正規化換行，避免 CRLF/LF 差異影響雜湊
      const normalized = content.replace(/\r\n/g, '\n');
      hash.update(`\x00${filepath.split('extension')[1]}\x00`);
      hash.update(normalized);
      fileCount++;
    } catch {
      // 檔案不存在時以佔位符代替，確保結構一致
      hash.update(`\x00${filepath}\x00MISSING\x00`);
    }
  }

  const digest = hash.digest('hex').slice(0, DIGEST_LENGTH);
  return { digest, fileCount };
}

// ── 主程式 ──

const dryRun = process.argv.includes('--dry');

const { digest, fileCount } = computeSeal();

// 讀取當前版本號
const manifestPath = join(EXT, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const version = manifest.version;

const versionName = `${version}+${digest}`;

console.log(`🔏 Integrity Seal`);
console.log(`   Version:    ${version}`);
console.log(`   Digest:     ${digest}`);
console.log(`   Seal:       ${versionName}`);
console.log(`   Files:      ${fileCount}/${CRITICAL_FILES.length} hashed`);

if (dryRun) {
  console.log(`\n   (dry run — not written)`);
} else {
  manifest.version_name = versionName;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`\n   ✅ Written to manifest.json → version_name: "${versionName}"`);
}
