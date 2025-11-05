/**
 * FileManager - IndexedDBを使用したファイル管理
 * YAMLファイルのメタデータとコンテンツを永続化
 */

// idbライブラリをCDNから使用
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';
import FolderWatcher from './FolderWatcher.js';

class FileManager {
  constructor() {
    this.dbName = 'StoryMapViewer';
    this.storeName = 'files';
    this.dbVersion = 1;
    this.db = null;
    this.autoWriteBack = false; // 双方向同期モード
  }

  /**
   * IndexedDBの初期化
   */
  async init() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        // ファイルストアの作成
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('name', 'name');
          store.createIndex('projectName', 'projectName');
          store.createIndex('updatedAt', 'updatedAt');
        }
      }
    });

    return this.db;
  }

  /**
   * DBクローズ中エラー時の再試行ラッパ
   */
  async withDbRetry(fn) {
    try {
      await this.init();
      return await fn();
    } catch (e) {
      const msg = (e && (e.message || e.toString())) || '';
      if (msg.includes('database connection is closing') || msg.includes('The database connection is closing')) {
        try {
          // 再初期化して一度だけ再試行
          this.db = null;
          await this.init();
          return await fn();
        } catch (e2) {
          throw e2;
        }
      }
      throw e;
    }
  }

  /**
   * ファイルの保存
   */
  async saveFile(file) {
    const op = async () => {
      const db = await this.init();
      const fileRecord = {
        id: file.id || this.generateId(),
        name: file.name,
        content: file.content,
        parsedData: file.parsedData,
        projectName: file.projectName || this.extractProjectName(file.parsedData),
        size: new Blob([file.content]).size,
        createdAt: file.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        localPath: file.localPath || null,
        syncEnabled: !!file.syncEnabled
      };
      await db.put(this.storeName, fileRecord);
      return fileRecord;
    };
    return await this.withDbRetry(op);
  }

  /**
   * ファイルの取得
   */
  async getFile(id) {
    return await this.withDbRetry(async () => {
      const db = await this.init();
      const file = await db.get(this.storeName, id);
      if (file) {
        file.lastAccessed = new Date().toISOString();
        await db.put(this.storeName, file);
      }
      return file;
    });
  }

  /**
   * ファイル一覧の取得
   */
  async listFiles(options = {}) {
    const { sortBy = 'updatedAt', order = 'desc' } = options;
    return await this.withDbRetry(async () => {
      const db = await this.init();
      const files = await db.getAllFromIndex(this.storeName, sortBy);
      if (order === 'desc') files.reverse();
      return files;
    });
  }

  /**
   * ファイルの削除
   */
  async deleteFile(id) {
    return await this.withDbRetry(async () => {
      const db = await this.init();
      await db.delete(this.storeName, id);
    });
  }

  /**
   * ファイルの更新
   */
  async updateFile(id, updates) {
    return await this.withDbRetry(async () => {
      const db = await this.init();
      const file = await this.getFile(id);
      if (!file) throw new Error(`File not found: ${id}`);
      const updatedFile = { ...file, ...updates, updatedAt: new Date().toISOString() };
      await db.put(this.storeName, updatedFile);
      // 双方向同期（無効が既定）
      try {
        if (this.autoWriteBack && updatedFile.syncEnabled && updatedFile.localPath && typeof FolderWatcher !== 'undefined' && FolderWatcher.isWatching()) {
          const yamlText = updatedFile.content || (updatedFile.parsedData ? window.jsyaml.dump(updatedFile.parsedData, { lineWidth: 120 }) : '');
          if (yamlText) await FolderWatcher.writeFile(updatedFile.localPath, yamlText);
        }
      } catch (e) { console.error('Auto write-back failed:', e); }
      return updatedFile;
    });
  }

  /**
   * プロジェクト名でファイルを検索
   */
  async findByProject(projectName) {
    return await this.withDbRetry(async () => {
      const db = await this.init();
      const index = db.transaction(this.storeName).store.index('projectName');
      return await index.getAll(projectName);
    });
  }

  /**
   * ファイル名で検索
   */
  async searchByName(name) {
    const allFiles = await this.listFiles();
    const searchTerm = name.toLowerCase();
    return allFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
  }

  /**
   * ストレージ使用量の取得
   */
  async getStorageInfo() {
    const files = await this.listFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return {
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * 全ファイルの削除
   */
  async clearAll() {
    return await this.withDbRetry(async () => {
      const db = await this.init();
      await db.clear(this.storeName);
    });
  }

  /**
   * ファイルIDの生成
   */
  generateId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * パース済みデータからプロジェクト名を抽出
   */
  extractProjectName(parsedData) {
    if (!parsedData || !parsedData.integrated_story_map) {
      return 'Unknown Project';
    }
    const storyMap = parsedData.integrated_story_map;
    return storyMap.meta?.project_name || storyMap.project_info?.name || 'Unknown Project';
  }

  /**
   * ファイルのエクスポート（バックアップ用）
   */
  async exportAllFiles() {
    const files = await this.listFiles();
    return { exportDate: new Date().toISOString(), version: this.dbVersion, files };
  }

  /**
   * ファイルのインポート（リストア用）
   */
  async importFiles(exportData) {
    if (!exportData.files || !Array.isArray(exportData.files)) {
      throw new Error('Invalid export data format');
    }
    for (const file of exportData.files) {
      await this.saveFile({ ...file, id: this.generateId(), createdAt: file.createdAt || new Date().toISOString() });
    }
    return { imported: exportData.files.length, timestamp: new Date().toISOString() };
  }
}

// シングルトンインスタンスとしてエクスポート
export default new FileManager();