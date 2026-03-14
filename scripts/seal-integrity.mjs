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
 *   - 演算法、鹽值、檔案清單存在於此腳本與 verify 腳本（均為公開來源）
 *   - 只封印關鍵程式內容，不把 version_name 本身納入摘要
 *   - 目的是偵測意外或本地修改，而非對擁有原始碼存取權的攻擊者提供防護
 *
 * 開發提醒：
 *   - 這個腳本是用來確認「預期中的變更」後更新封印，不是用來掩蓋未知 drift
 *   - 重跑前請先看 diff，確認變更的是你打算修改的檔案
 *   - 建議封印後立刻執行 npm run integrity:verify 或 npm run basw:verify
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXT = join(ROOT, 'extension');

// ── 固定參數（存在於此腳本與 verify 腳本，原始碼可見）──

// 固定前綴／鹽值（SALT）：與檔案內容混合，使摘要與專案綁定；為公開、非機密值，不提供對原始碼可存取者的防護
const SALT = 'SP::integrity::v1::7f3a9c2e';

// 關鍵檔案清單（順序固定，影響雜湊結果）
const CRITICAL_FILES = [
  'manifest.json',
  'background.js',
  'sidepanel.js',
  'sidepanel.html',
  'js/connection-controller.js',
  'js/mode-manager.js',
  'js/sdk-client.js',
  'js/link-guard.js',
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
// 16 hex chars = 64 bits，提供足夠的碰撞抵抗力
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
