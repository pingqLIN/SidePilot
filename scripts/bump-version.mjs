#!/usr/bin/env node
/**
 * bump-version.mjs — 版本同步與 git tag 工具
 *
 * 用法：
 *   npm run version:bump             → patch (0.5.0 → 0.5.1)
 *   npm run version:bump -- minor    → minor (0.5.1 → 0.6.0)
 *   npm run version:bump -- major    → major (0.6.0 → 1.0.0)
 *   npm run version:bump -- 0.7.2    → 指定版本號
 *
 * 執行內容：
 *   1. 更新 package.json 版本
 *   2. 同步至 extension/manifest.json
 *   3. 追加 CHANGELOG.md 條目（從最近 git log 摘取）
 *   4. 重新計算並驗證 integrity seal
 *   5. git commit + tag
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PKG_PATH = join(ROOT, 'package.json');
const MANIFEST_PATH = join(ROOT, 'extension', 'manifest.json');
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');
const SEAL_SCRIPT_PATH = join(ROOT, 'scripts', 'seal-integrity.mjs');
const VERIFY_SCRIPT_PATH = join(ROOT, 'scripts', 'verify-integrity.mjs');

function run(command, options = {}) {
  return execSync(command, {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: options.stdio || 'pipe',
    shell: options.shell || false,
  });
}

// ── Parse args ──
const arg = process.argv[2] || 'patch';

// ── Read current version ──
const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));
const current = pkg.version;
const [major, minor, patch] = current.split('.').map(Number);

// ── Compute next version ──
let next;
if (/^\d+\.\d+\.\d+$/.test(arg)) {
  next = arg;
} else if (arg === 'major') {
  next = `${major + 1}.0.0`;
} else if (arg === 'minor') {
  next = `${major}.${minor + 1}.0`;
} else {
  next = `${major}.${minor}.${patch + 1}`;
}

console.log(`📦 Version: ${current} → ${next}`);

// ── 1. Update package.json ──
pkg.version = next;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
console.log('  ✅ package.json');

// ── 2. Sync manifest.json ──
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
manifest.version = next;
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
console.log('  ✅ manifest.json');

// ── 3. Update CHANGELOG.md ──
const date = new Date().toISOString().slice(0, 10);
let recentCommits = '';
try {
  // Get commits since last tag, or last 10 if no tags
  const lastTag = run('git describe --tags --abbrev=0 2>nul || echo ""', {
    shell: true,
  }).trim();

  const range = lastTag ? `${lastTag}..HEAD` : '-10';
  recentCommits = run(
    `git --no-pager log ${range} --oneline --no-decorate`,
  ).trim();
} catch {
  recentCommits = '(no git history available)';
}

const changelogEntry = [
  `## [${next}] — ${date}`,
  '',
  ...recentCommits.split('\n').map(line => {
    const msg = line.replace(/^[a-f0-9]+ /, '');
    return `- ${msg}`;
  }),
  '',
  '---',
  ''
].join('\n');

if (existsSync(CHANGELOG_PATH)) {
  const existing = readFileSync(CHANGELOG_PATH, 'utf-8');
  const unreleasedHeading = '## [Unreleased]';
  const unreleasedIndex = existing.indexOf(unreleasedHeading);

  if (unreleasedIndex > -1) {
    const afterUnreleased = existing.indexOf('\n---', unreleasedIndex);
    if (afterUnreleased > -1) {
      const insertPos = afterUnreleased + '\n---\n'.length;
      const before = existing.slice(0, insertPos);
      const after = existing.slice(insertPos);
      writeFileSync(CHANGELOG_PATH, before + '\n' + changelogEntry + after, 'utf-8');
    } else {
      const before = existing.slice(0, unreleasedIndex);
      const after = existing.slice(unreleasedIndex);
      writeFileSync(CHANGELOG_PATH, before + changelogEntry + after, 'utf-8');
    }
  } else {
    const insertPos = existing.indexOf('\n## ');
    if (insertPos > -1) {
      const before = existing.slice(0, insertPos + 1);
      const after = existing.slice(insertPos + 1);
      writeFileSync(CHANGELOG_PATH, before + changelogEntry + after, 'utf-8');
    } else {
      writeFileSync(CHANGELOG_PATH, existing + '\n' + changelogEntry, 'utf-8');
    }
  }
} else {
  const header = `# Changelog\n\n> 自動產生，每次 \`npm run version:bump\` 時追加。\n\n`;
  writeFileSync(CHANGELOG_PATH, header + changelogEntry, 'utf-8');
}
console.log('  ✅ CHANGELOG.md');

// ── 4. Re-seal + verify integrity ──
try {
  run(`node "${SEAL_SCRIPT_PATH}"`, { stdio: 'inherit' });
  run(`node "${VERIFY_SCRIPT_PATH}"`, { stdio: 'inherit' });
  console.log('  ✅ integrity seal + verify');
} catch (err) {
  console.error('  ⚠️ Integrity seal/verify failed:', err.message);
  process.exit(1);
}

// ── 5. Git commit + tag ──
try {
  run(`git add package.json extension/manifest.json CHANGELOG.md`);
  run(`git commit -m "chore: bump version to v${next}"`, { stdio: 'inherit' });
  run(`git tag -a v${next} -m "Release v${next}"`);
  console.log(`  ✅ git commit + tag v${next}`);
} catch (err) {
  console.error('  ⚠️ Git commit/tag failed:', err.message);
  console.log('  You can manually run:');
  console.log(`    git add package.json extension/manifest.json CHANGELOG.md`);
  console.log(`    git commit -m "chore: bump version to v${next}"`);
  console.log(`    git tag -a v${next} -m "Release v${next}"`);
}

console.log(`\n🎉 Done! v${next} is ready.`);
