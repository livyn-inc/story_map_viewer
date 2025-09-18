/**
 * FolderWatcher - ローカルフォルダ監視機能
 * File System Access APIを使用してフォルダ内のYAMLファイルを検出・監視
 */

import FileManager from './FileManager.js';
// js-yamlはグローバル変数として使用

class FolderWatcher {
  constructor() {
    this.directoryHandle = null;
    this.watchInterval = null;
    this.fileMap = new Map(); // ファイル名 -> {handle, lastModified}
    this.changeCallback = null;
    this.errorCallback = null;
    this.isSupported = this.checkSupport();
  }

  /**
   * File System Access APIのサポートチェック
   */
  checkSupport() {
    return 'showDirectoryPicker' in window;
  }

  /**
   * フォルダ監視の初期化
   * @param {Function} onChange - ファイル変更時のコールバック
   * @param {Function} onError - エラー時のコールバック
   */
  init(onChange, onError) {
    if (!this.isSupported) {
      onError('File System Access APIはこのブラウザでサポートされていません。Chrome/Edgeをお使いください。');
      return false;
    }

    this.changeCallback = onChange;
    this.errorCallback = onError;
    return true;
  }

  /**
   * フォルダ選択ダイアログを開く
   */
  async selectFolder() {
    try {
      // フォルダ選択ダイアログ
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      });

      // 初回スキャン
      await this.scanDirectory();
      
      // 監視開始
      this.startWatching();

      return {
        name: this.directoryHandle.name,
        fileCount: this.fileMap.size
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        // ユーザーがキャンセル
        return null;
      }
      throw error;
    }
  }

  /**
   * ディレクトリのスキャン
   */
  async scanDirectory() {
    const newFileMap = new Map();
    await this.scanDirectoryRecursive(this.directoryHandle, '', newFileMap);

    // 新規ファイルの検出
    for (const [path, fileInfo] of newFileMap) {
      const existingFile = this.fileMap.get(path);
      
      if (!existingFile || existingFile.lastModified < fileInfo.lastModified) {
        // 新規または更新されたファイル
        await this.processFile(path, fileInfo);
      }
    }

    // 削除されたファイルの検出
    for (const [path] of this.fileMap) {
      if (!newFileMap.has(path)) {
        await this.handleFileDeleted(path);
      }
    }

    this.fileMap = newFileMap;
  }

  /**
   * ディレクトリを再帰的にスキャン
   */
  async scanDirectoryRecursive(dirHandle, basePath, fileMap) {
    try {
      for await (const entry of dirHandle.values()) {
        const path = basePath ? `${basePath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file' && this.isYamlFile(entry.name)) {
          const file = await entry.getFile();
          fileMap.set(path, {
            handle: entry,
            lastModified: file.lastModified,
            size: file.size
          });
        } else if (entry.kind === 'directory') {
          // サブディレクトリを再帰的にスキャン
          await this.scanDirectoryRecursive(entry, path, fileMap);
        }
      }
    } catch (error) {
      console.error(`Directory scan error: ${error.message}`);
    }
  }

  /**
   * YAMLファイルかどうかの判定
   */
  isYamlFile(filename) {
    return filename.endsWith('.yaml') || filename.endsWith('.yml');
  }

  /**
   * ファイルの処理
   */
  async processFile(path, fileInfo) {
    try {
      const file = await fileInfo.handle.getFile();
      const content = await file.text();
      
      // YAMLパース
      const parsedData = window.jsyaml.load(content);
      
      // 既存のファイルを検索
      const existingFiles = await FileManager.searchByName(path);
      
      if (existingFiles.length > 0) {
        // 更新
        const existingFile = existingFiles[0];
        const updatedFile = await FileManager.updateFile(existingFile.id, {
          content: content,
          parsedData: parsedData,
          size: file.size,
          localPath: path
        });
        
        if (this.changeCallback) {
          this.changeCallback({
            type: 'updated',
            file: updatedFile,
            path: path
          });
        }
      } else {
        // 新規作成
        const savedFile = await FileManager.saveFile({
          name: path,
          content: content,
          parsedData: parsedData,
          size: file.size,
          localPath: path
        });
        
        if (this.changeCallback) {
          this.changeCallback({
            type: 'added',
            file: savedFile,
            path: path
          });
        }
      }
      
    } catch (error) {
      if (this.errorCallback) {
        this.errorCallback(`${path}: ${error.message}`);
      }
    }
  }

  /**
   * ファイル削除の処理
   */
  async handleFileDeleted(path) {
    try {
      const existingFiles = await FileManager.searchByName(path);
      
      if (existingFiles.length > 0) {
        await FileManager.deleteFile(existingFiles[0].id);
        
        if (this.changeCallback) {
          this.changeCallback({
            type: 'deleted',
            path: path
          });
        }
      }
    } catch (error) {
      console.error(`Delete handling error: ${error.message}`);
    }
  }

  /**
   * 監視の開始
   */
  startWatching() {
    if (this.watchInterval) {
      this.stopWatching();
    }

    // 定期的にディレクトリをスキャン（5秒ごと）
    this.watchInterval = setInterval(() => {
      this.scanDirectory();
    }, 5000);
  }

  /**
   * 監視の停止
   */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * 手動リフレッシュ
   */
  async refresh() {
    if (this.directoryHandle) {
      await this.scanDirectory();
    }
  }

  /**
   * 監視状態の取得
   */
  isWatching() {
    return this.watchInterval !== null;
  }

  /**
   * 監視中のフォルダ名を取得
   */
  getFolderName() {
    return this.directoryHandle ? this.directoryHandle.name : null;
  }

  /**
   * 監視中のファイル数を取得
   */
  getFileCount() {
    return this.fileMap.size;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.stopWatching();
    this.directoryHandle = null;
    this.fileMap.clear();
  }
}

// シングルトンインスタンスとしてエクスポート
export default new FolderWatcher();