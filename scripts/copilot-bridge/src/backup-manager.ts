// ============================================
// Backup Manager
// Manages full and settings backups for SidePilot
// Supports automatic scheduling and manual triggers
// ============================================

import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'node:fs';
import schedule, { type Job } from 'node-schedule';
import { randomUUID } from 'node:crypto';

export type BackupMode = 'full' | 'settings';
export type BackupFrequency = 'h' | 'd' | 'w' | 'm';

export interface BackupConfig {
  mode: BackupMode;
  frequency?: BackupFrequency;
  interval?: number;
  savePath: string;
  enabled?: boolean;
}

export interface BackupMetadata {
  id: string;
  type: BackupMode;
  timestamp: number;
  size: number;
  filename: string;
  status: 'success' | 'failed' | 'pending';
  nextScheduled?: number;
  error?: string;
}

export interface SchedulerState {
  enabled: boolean;
  config: BackupConfig;
  nextRun?: number;
  lastRun?: number;
  jobId?: string;
}

const EXTENSION_DIR = resolve(process.cwd(), '..', '..', 'extension');
const DEFAULT_BACKUP_DIR = resolve(process.cwd(), '..', '..', '..', 'SidePilot-Backups');

export class BackupManager {
  private backups: Map<string, BackupMetadata> = new Map();
  private scheduledJobs: Map<string, Job> = new Map();
  private currentConfig: BackupConfig | null = null;

  constructor() {
    this.loadBackupMetadata();
  }

  /**
   * 載入備份元數據
   */
  private async loadBackupMetadata(): Promise<void> {
    try {
      const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
      await fs.mkdir(backupDir, { recursive: true });
      const metadataPath = join(backupDir, '.backups.json');

      try {
        const data = await fs.readFile(metadataPath, 'utf-8');
        const parsed = JSON.parse(data) as BackupMetadata[];
        parsed.forEach(m => this.backups.set(m.id, m));
      } catch (err) {
        // 首次執行，元數據檔案不存在
      }
    } catch (err) {
      console.error('[BackupManager] Failed to load metadata:', err);
    }
  }

  /**
   * 儲存備份元數據
   */
  private async saveBackupMetadata(): Promise<void> {
    try {
      const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
      await fs.mkdir(backupDir, { recursive: true });
      const metadataPath = join(backupDir, '.backups.json');
      const metadata = Array.from(this.backups.values());
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BackupManager] Failed to save metadata:', err);
    }
  }

  /**
   * 取得備份設定
   */
  getConfig(): BackupConfig | null {
    return this.currentConfig;
  }

  /**
   * 設定備份配置
   */
  setConfig(config: BackupConfig): void {
    this.currentConfig = config;
  }

  /**
   * 建立完整備份（擴充全部 + Chrome Storage）
   */
  async createFullBackup(): Promise<BackupMetadata> {
    const backupId = randomUUID();
    const timestamp = Date.now();
    const filename = `SidePilot-full-${new Date(timestamp).toISOString().split('T')[0]}-${backupId.substring(0, 8)}.zip`;
    const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
    const backupPath = join(backupDir, filename);

    try {
      await fs.mkdir(backupDir, { recursive: true });

      // 建立 zip 檔案
      const output = createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      const archivePromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
        archive.on('error', reject);
      });

      archive.pipe(output);

      // 將 extension 目錄加入備份（排除 node_modules, dist 等）
      archive.directory(EXTENSION_DIR, 'extension', (entry: { name: string }) => {
        const excludeDirs = ['node_modules', 'dist', '.git', '__pycache__'];
        return !excludeDirs.some(dir => entry.name.includes(dir));
      });

      // 建立備份資訊檔案
      const backupInfo = {
        backupId,
        timestamp,
        type: 'full',
        extensionVersion: '0.5.0',
        createdAt: new Date(timestamp).toISOString(),
      };
      archive.append(JSON.stringify(backupInfo, null, 2), { name: 'BACKUP_INFO.json' });

      await archive.finalize();
      await archivePromise;

      // 取得檔案大小
      const stat = await fs.stat(backupPath);
      const metadata: BackupMetadata = {
        id: backupId,
        type: 'full',
        timestamp,
        size: stat.size,
        filename,
        status: 'success',
      };

      this.backups.set(backupId, metadata);
      await this.saveBackupMetadata();

      console.log(`[BackupManager] Full backup created: ${filename} (${this.formatSize(stat.size)})`);
      return metadata;
    } catch (err: any) {
      console.error('[BackupManager] Full backup failed:', err);
      const metadata: BackupMetadata = {
        id: backupId,
        type: 'full',
        timestamp,
        size: 0,
        filename,
        status: 'failed',
        error: err?.message || String(err),
      };
      this.backups.set(backupId, metadata);
      await this.saveBackupMetadata();
      throw err;
    }
  }

  /**
   * 建立設定備份（Rules + Memory + Settings）
   */
  async createSettingsBackup(): Promise<BackupMetadata> {
    const backupId = randomUUID();
    const timestamp = Date.now();
    const filename = `SidePilot-settings-${new Date(timestamp).toISOString().split('T')[0]}-${backupId.substring(0, 8)}.zip`;
    const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
    const backupPath = join(backupDir, filename);

    try {
      await fs.mkdir(backupDir, { recursive: true });

      const output = createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      const archivePromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
        archive.on('error', reject);
      });

      archive.pipe(output);

      // 加入 Rules 與 Memory 相關檔案
      const settingsFiles = [
        'rules.json',
        'templates/default-rules.md',
        'templates/extension-dev-rules.md',
        'templates/react-rules.md',
        'templates/safety-rules.md',
        'templates/self-iteration-rules.md',
        'templates/typescript-rules.md',
      ];

      for (const file of settingsFiles) {
        const filePath = join(EXTENSION_DIR, file);
        try {
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            const content = await fs.readFile(filePath, 'utf-8');
            archive.append(content, { name: file });
          }
        } catch (err) {
          // 某些檔案可能不存在
        }
      }

      const backupInfo = {
        backupId,
        timestamp,
        type: 'settings',
        extensionVersion: '0.5.0',
        createdAt: new Date(timestamp).toISOString(),
      };
      archive.append(JSON.stringify(backupInfo, null, 2), { name: 'BACKUP_INFO.json' });

      await archive.finalize();
      await archivePromise;

      const stat = await fs.stat(backupPath);
      const metadata: BackupMetadata = {
        id: backupId,
        type: 'settings',
        timestamp,
        size: stat.size,
        filename,
        status: 'success',
      };

      this.backups.set(backupId, metadata);
      await this.saveBackupMetadata();

      console.log(`[BackupManager] Settings backup created: ${filename} (${this.formatSize(stat.size)})`);
      return metadata;
    } catch (err: any) {
      console.error('[BackupManager] Settings backup failed:', err);
      const metadata: BackupMetadata = {
        id: backupId,
        type: 'settings',
        timestamp,
        size: 0,
        filename,
        status: 'failed',
        error: err?.message || String(err),
      };
      this.backups.set(backupId, metadata);
      await this.saveBackupMetadata();
      throw err;
    }
  }

  /**
   * 列出所有備份
   */
  listBackups(): BackupMetadata[] {
    return Array.from(this.backups.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 還原備份
   */
  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const metadata = this.backups.get(backupId);
    if (!metadata) {
      return { success: false, message: `Backup ${backupId} not found` };
    }

    if (metadata.status !== 'success') {
      return { success: false, message: `Backup ${backupId} is not in success state` };
    }

    try {
      const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
      const backupPath = join(backupDir, metadata.filename);

      // 驗證備份檔案存在
      await fs.stat(backupPath);

      // 此處僅返回備份資訊，實際還原交由前端處理（需下載 + 手動匯入）
      return {
        success: true,
        message: `Backup ${metadata.filename} is ready for restore. Download and import manually.`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * 刪除備份
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const metadata = this.backups.get(backupId);
    if (!metadata) {
      return { success: false, message: `Backup ${backupId} not found` };
    }

    try {
      const backupDir = this.currentConfig?.savePath || DEFAULT_BACKUP_DIR;
      const backupPath = join(backupDir, metadata.filename);
      await fs.unlink(backupPath);
      this.backups.delete(backupId);
      await this.saveBackupMetadata();
      return { success: true, message: `Backup ${metadata.filename} deleted` };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * 啟用定時備份任務
   */
  startSchedule(config: BackupConfig): { success: boolean; nextRun?: number; message: string } {
    if (!config.enabled || !config.frequency || config.interval === undefined) {
      return { success: false, message: 'Invalid schedule config' };
    }

    try {
      // 取消現有任務
      this.stopSchedule();

      const cronExpression = this.generateCronExpression(config.frequency, config.interval);
      const jobId = `backup-${randomUUID().substring(0, 8)}`;

      const job = schedule.scheduleJob(cronExpression, async () => {
        console.log(`[BackupManager] Running scheduled ${config.mode} backup`);
        try {
          if (config.mode === 'full') {
            await this.createFullBackup();
          } else {
            await this.createSettingsBackup();
          }
        } catch (err) {
          console.error('[BackupManager] Scheduled backup failed:', err);
        }
      });

      this.scheduledJobs.set(jobId, job);
      this.currentConfig = config;

      const nextRun = job.nextInvocation()?.getTime();
      console.log(`[BackupManager] Scheduled ${config.mode} backup with cron: ${cronExpression}`);

      return { success: true, nextRun, message: `Backup scheduled (next run: ${new Date(nextRun!).toISOString()})` };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * 停止定時備份任務
   */
  stopSchedule(): { success: boolean; message: string } {
    try {
      for (const job of this.scheduledJobs.values()) {
        job.cancel();
      }
      this.scheduledJobs.clear();
      return { success: true, message: 'All scheduled backups stopped' };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * 產生 cron 表達式
   */
  private generateCronExpression(frequency: BackupFrequency, interval: number): string {
    switch (frequency) {
      case 'h': // 每 N 小時
        return `0 */${interval} * * * *`;
      case 'd': // 每 N 天
        return `0 0 */${interval} * *`;
      case 'w': // 每 N 週（每週一 00:00）
        return `0 0 * * ${1 * interval % 7}`;
      case 'm': // 每 N 個月（每月 1 號 00:00）
        return `0 0 1 */${interval} *`;
      default:
        return '0 0 * * *'; // 預設每天
    }
  }

  /**
   * 格式化檔案大小
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 清理資源（關閉時調用）
   */
  destroy(): void {
    this.stopSchedule();
  }
}
