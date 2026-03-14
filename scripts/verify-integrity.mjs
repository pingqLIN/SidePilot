#!/usr/bin/env node
/**
 * verify-integrity.mjs — 擴充完整性驗證器
 *
 * 重新計算關鍵檔案雜湊，與 manifest.json 中的封印比對。
 * 此腳本不應被包含在擴充套件中。
 *
 * 用法：
 *   node scripts/verify-integrity.mjs
 *
 * 輸出：
 *   ✅ PASS — 封印吻合，檔案未被竄改
 *   ❌ FAIL — 封印不符，檔案可能已被修改
 *   ⚠️ NO SEAL — manifest.json 中沒有 version_name 封印
 *
 * 開發提醒：
 *   - 若 FAIL 發生在你剛修改 extension 關鍵檔案之後，先確認 diff 是否符合預期
 *   - 確認是預期變更後，再執行 npm run integrity:seal 更新封印
 *   - 若不是預期變更，請不要直接重跑 seal，先找出 drift 來源
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXT = join(ROOT, 'extension');

// ── 固定參數（必須與 seal-integrity.mjs 完全一致，均為公開來源，非機密）──

// 固定前綴／鹽值（SALT）：與檔案內容混合，使摘要與專案綁定；為公開、非機密值，不提供對原始碼可存取者的防護
const SALT = 'SP::integrity::v1::7f3a9c2e';

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

const DIGEST_LENGTH = 16;

// ── 計算封印（與 seal 腳本邏輯完全一致）──

function computeSeal() {
  const hash = createHash('sha256');
  hash.update(SALT);

  // 重要：計算時需排除 version_name 本身，否則會循環依賴
  // seal 腳本寫入 version_name 是在計算之後，所以我們需要讀取
  // manifest 時暫時移除 version_name 再計算
  let fileCount = 0;
  for (const filepath of CRITICAL_FILES) {
    try {
      let content = readFileSync(filepath, 'utf-8');

      // manifest.json 特殊處理：移除 version_name 欄位後再計算
      if (filepath.endsWith('manifest.json')) {
        const obj = JSON.parse(content);
        delete obj.version_name;
        content = JSON.stringify(obj, null, 2) + '\n';
      }

      const normalized = content.replace(/\r\n/g, '\n');
      hash.update(`\x00${filepath.split('extension')[1]}\x00`);
      hash.update(normalized);
      fileCount++;
    } catch {
      hash.update(`\x00${filepath}\x00MISSING\x00`);
    }
  }

  return { digest: hash.digest('hex').slice(0, DIGEST_LENGTH), fileCount };
}

// ── 驗證 ──

const manifestPath = join(EXT, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

if (!manifest.version_name) {
  console.log('⚠️  NO SEAL — manifest.json 中沒有 version_name 封印');
  console.log('   執行 node scripts/seal-integrity.mjs 產生封印');
  console.log('   開發時建議先確認目前 worktree 是否就是你預期的內容');
  process.exit(2);
}

const sealedVersion = manifest.version_name;
const plusIdx = sealedVersion.indexOf('+');
if (plusIdx === -1) {
  console.log('⚠️  NO SEAL — version_name 格式不含封印');
  process.exit(2);
}

const sealedDigest = sealedVersion.slice(plusIdx + 1);
const { digest: computed, fileCount } = computeSeal();

console.log(`🔍 Integrity Verification`);
console.log(`   Sealed:    ${sealedDigest}`);
console.log(`   Computed:  ${computed}`);
console.log(`   Files:     ${fileCount}/${CRITICAL_FILES.length}`);

if (sealedDigest === computed) {
  console.log(`\n   ✅ PASS — 封印吻合，檔案完整`);
  process.exit(0);
} else {
  console.log(`\n   ❌ FAIL — 封印不符，檔案可能已被修改`);
  console.log(`   若這是預期中的開發修改：先檢查 diff，再執行 npm run integrity:seal`);
  console.log(`   若不是預期修改：請先找出變更來源，不要直接重跑 seal`);
  process.exit(1);
}
