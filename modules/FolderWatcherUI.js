/**
 * FolderWatcherUI - フォルダ監視機能のUI
 * フォルダ選択、監視状態表示、同期状態の管理
 */

import FolderWatcher from './FolderWatcher.js';

class FolderWatcherUI {
  constructor() {
    this.container = null;
    this.statusCallback = null;
  }

  /**
   * UIの初期化
   * @param {HTMLElement} container - UIを表示するコンテナ
   * @param {Function} onStatusChange - ステータス変更時のコールバック
   */
  init(container, onStatusChange) {
    this.container = container;
    this.statusCallback = onStatusChange;
    
    this.render();
    this.setupFolderWatcher();
  }

  /**
   * UIのレンダリング
   */
  render() {
    const isSupported = FolderWatcher.checkSupport();
    
    this.container.innerHTML = `
      <div class="folder-watcher-panel">
        <div class="folder-watcher-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9.5L12 2l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 21V12h6v9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ローカルフォルダ同期
          </h3>
          ${!isSupported ? '<span class="unsupported-badge">非対応</span>' : ''}
        </div>
        
        ${isSupported ? this.renderSupportedUI() : this.renderUnsupportedUI()}
      </div>
    `;

    if (isSupported) {
      this.attachEventListeners();
    }
  }

  /**
   * サポートされている場合のUI
   */
  renderSupportedUI() {
    const isWatching = FolderWatcher.isWatching();
    const folderName = FolderWatcher.getFolderName();
    const fileCount = FolderWatcher.getFileCount();
    
    if (isWatching) {
      return `
        <div class="folder-watcher-content">
          <div class="watching-status">
            <div class="status-indicator active"></div>
            <div class="status-info">
              <p class="folder-name">${this.escapeHtml(folderName)}</p>
              <p class="file-count">${fileCount} YAMLファイルを監視中</p>
            </div>
          </div>
          
          <div class="watcher-actions">
            <button class="btn-secondary refresh-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 4v6h-6M1 20v-6h6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              更新
            </button>
            <button class="btn-secondary stop-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" stroke-width="2"/>
              </svg>
              停止
            </button>
          </div>
          
          <div class="sync-log">
            <h4>同期ログ</h4>
            <ul class="sync-log-list"></ul>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="folder-watcher-content">
        <p class="watcher-description">
          ローカルフォルダ内のYAMLファイルを自動的に検出し、同期します。
        </p>
        
        <button class="btn-primary select-folder-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          フォルダを選択
        </button>
        
        <div class="feature-list">
          <div class="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            新規ファイルの自動検出
          </div>
          <div class="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ファイル変更の自動同期
          </div>
          <div class="feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            サブフォルダ対応
          </div>
        </div>
      </div>
    `;
  }

  /**
   * サポートされていない場合のUI
   */
  renderUnsupportedUI() {
    return `
      <div class="folder-watcher-content">
        <div class="unsupported-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="warning-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          <h4>このブラウザは非対応です</h4>
          <p>
            ローカルフォルダ同期機能を使用するには、
            Chrome または Edge ブラウザをお使いください。
          </p>
          
          <div class="browser-links">
            <a href="https://www.google.com/chrome/" target="_blank" class="browser-link">
              Chrome をダウンロード
            </a>
            <a href="https://www.microsoft.com/edge" target="_blank" class="browser-link">
              Edge をダウンロード
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * フォルダ監視の設定
   */
  setupFolderWatcher() {
    const initialized = FolderWatcher.init(
      this.handleFileChange.bind(this),
      this.handleError.bind(this)
    );

    if (!initialized) {
      console.log('FolderWatcher is not supported');
    }
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    // フォルダ選択ボタン
    const selectBtn = this.container.querySelector('.select-folder-btn');
    if (selectBtn) {
      selectBtn.addEventListener('click', this.selectFolder.bind(this));
    }

    // 更新ボタン
    const refreshBtn = this.container.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.refresh.bind(this));
    }

    // 停止ボタン
    const stopBtn = this.container.querySelector('.stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', this.stopWatching.bind(this));
    }
  }

  /**
   * フォルダ選択
   */
  async selectFolder() {
    try {
      const result = await FolderWatcher.selectFolder();
      
      if (result) {
        this.render();
        this.addLogEntry('info', `フォルダ "${result.name}" の監視を開始しました（${result.fileCount} ファイル）`);
        
        if (this.statusCallback) {
          this.statusCallback({
            type: 'watching_started',
            folder: result.name,
            fileCount: result.fileCount
          });
        }
      }
    } catch (error) {
      this.handleError(`フォルダ選択エラー: ${error.message}`);
    }
  }

  /**
   * 手動更新
   */
  async refresh() {
    try {
      await FolderWatcher.refresh();
      this.addLogEntry('info', '手動更新を実行しました');
    } catch (error) {
      this.handleError(`更新エラー: ${error.message}`);
    }
  }

  /**
   * 監視停止
   */
  stopWatching() {
    FolderWatcher.cleanup();
    this.render();
    
    if (this.statusCallback) {
      this.statusCallback({
        type: 'watching_stopped'
      });
    }
  }

  /**
   * ファイル変更ハンドラー
   */
  handleFileChange(change) {
    let message;
    let type = 'info';
    
    switch (change.type) {
      case 'added':
        message = `新規ファイル: ${change.path}`;
        type = 'success';
        break;
      case 'updated':
        message = `更新: ${change.path}`;
        type = 'info';
        break;
      case 'deleted':
        message = `削除: ${change.path}`;
        type = 'warning';
        break;
    }
    
    this.addLogEntry(type, message);
    
    if (this.statusCallback) {
      this.statusCallback(change);
    }
  }

  /**
   * エラーハンドラー
   */
  handleError(error) {
    this.addLogEntry('error', error);
  }

  /**
   * ログエントリの追加
   */
  addLogEntry(type, message) {
    const logList = this.container.querySelector('.sync-log-list');
    if (!logList) return;
    
    const entry = document.createElement('li');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
      <span class="log-time">${new Date().toLocaleTimeString('ja-JP')}</span>
      <span class="log-message">${this.escapeHtml(message)}</span>
    `;
    
    logList.insertBefore(entry, logList.firstChild);
    
    // 最大20件まで
    while (logList.children.length > 20) {
      logList.removeChild(logList.lastChild);
    }
  }

  /**
   * HTMLエスケープ
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export default FolderWatcherUI;