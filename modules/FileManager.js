/**
 * FileManager - IndexedDBを使用したファイル管理
 * YAMLファイルのメタデータとコンテンツを永続化
 */

// idbライブラリをCDNから使用
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

class FileManager {
  constructor() {
    this.dbName = 'StoryMapViewer';
    this.storeName = 'files';
    this.dbVersion = 1;
    this.db = null;
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
   * ファイルの保存
   * @param {Object} file - ファイルオブジェクト
   * @param {string} file.name - ファイル名
   * @param {string} file.content - YAMLコンテンツ
   * @param {Object} file.parsedData - パース済みデータ
   * @param {string} file.projectName - プロジェクト名
   */
  async saveFile(file) {
    await this.init();
    
    const fileRecord = {
      id: file.id || this.generateId(),
      name: file.name,
      content: file.content,
      parsedData: file.parsedData,
      projectName: file.projectName || this.extractProjectName(file.parsedData),
      size: new Blob([file.content]).size,
      createdAt: file.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    await this.db.put(this.storeName, fileRecord);
    return fileRecord;
  }

  /**
   * ファイルの取得
   * @param {string} id - ファイルID
   */
  async getFile(id) {
    await this.init();
    const file = await this.db.get(this.storeName, id);
    
    if (file) {
      // アクセス日時を更新
      file.lastAccessed = new Date().toISOString();
      await this.db.put(this.storeName, file);
    }
    
    return file;
  }

  /**
   * ファイル一覧の取得
   * @param {Object} options - オプション
   * @param {string} options.sortBy - ソート基準
   * @param {string} options.order - ソート順序
   */
  async listFiles(options = {}) {
    await this.init();
    
    const { sortBy = 'updatedAt', order = 'desc' } = options;
    const files = await this.db.getAllFromIndex(this.storeName, sortBy);
    
    // ソート順序の調整
    if (order === 'desc') {
      files.reverse();
    }
    
    return files;
  }

  /**
   * ファイルの削除
   * @param {string} id - ファイルID
   */
  async deleteFile(id) {
    await this.init();
    await this.db.delete(this.storeName, id);
  }

  /**
   * ファイルの更新
   * @param {string} id - ファイルID
   * @param {Object} updates - 更新内容
   */
  async updateFile(id, updates) {
    await this.init();
    
    const file = await this.getFile(id);
    if (!file) {
      throw new Error(`File not found: ${id}`);
    }

    const updatedFile = {
      ...file,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.db.put(this.storeName, updatedFile);
    return updatedFile;
  }

  /**
   * プロジェクト名でファイルを検索
   * @param {string} projectName - プロジェクト名
   */
  async findByProject(projectName) {
    await this.init();
    
    const index = this.db.transaction(this.storeName).store.index('projectName');
    const files = await index.getAll(projectName);
    
    return files;
  }

  /**
   * ファイル名で検索
   * @param {string} name - ファイル名（部分一致）
   */
  async searchByName(name) {
    await this.init();
    
    const allFiles = await this.listFiles();
    const searchTerm = name.toLowerCase();
    
    return allFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * ストレージ使用量の取得
   */
  async getStorageInfo() {
    await this.init();
    
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
    await this.init();
    await this.db.clear(this.storeName);
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
    return storyMap.meta?.project_name || 
           storyMap.project_info?.name || 
           'Unknown Project';
  }

  /**
   * ファイルのエクスポート（バックアップ用）
   */
  async exportAllFiles() {
    const files = await this.listFiles();
    return {
      exportDate: new Date().toISOString(),
      version: this.dbVersion,
      files: files
    };
  }

  /**
   * ファイルのインポート（リストア用）
   */
  async importFiles(exportData) {
    if (!exportData.files || !Array.isArray(exportData.files)) {
      throw new Error('Invalid export data format');
    }

    for (const file of exportData.files) {
      // IDを再生成して保存
      await this.saveFile({
        ...file,
        id: this.generateId(),
        createdAt: file.createdAt || new Date().toISOString()
      });
    }

    return {
      imported: exportData.files.length,
      timestamp: new Date().toISOString()
    };
  }
}

// シングルトンインスタンスとしてエクスポート
export default new FileManager();