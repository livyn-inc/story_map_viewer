/**
 * FileListView - ファイル一覧表示UI
 * アップロード済みファイルの管理インターフェース
 */

import FileManager from './FileManager.js';

class FileListView {
  constructor() {
    this.container = null;
    this.fileSelectedCallback = null;
    this.fileDeletedCallback = null;
    this.fileEditCallback = null;
    this.currentFileId = null;
    this.sortBy = 'updatedAt';
    this.sortOrder = 'desc';
    this.searchTerm = '';
  }

  /**
   * ファイルリストビューの初期化
   * @param {HTMLElement} container - コンテナ要素
   * @param {Function} onFileSelected - ファイル選択時のコールバック
   * @param {Function} onFileDeleted - ファイル削除時のコールバック
   */
  init(container, onFileSelected, onFileDeleted, onFileEdit) {
    this.container = container;
    this.fileSelectedCallback = onFileSelected;
    this.fileDeletedCallback = onFileDeleted;
    this.fileEditCallback = onFileEdit;

    this.render();
    this.loadFiles();
  }

  /**
   * 基本UIのレンダリング
   */
  render() {
    this.container.innerHTML = `
      <div class="file-list-header">
        <div class="file-list-controls">
          <input type="text" 
                 class="file-search" 
                 placeholder="ファイル名で検索..." 
                 value="${this.searchTerm}">
          <select class="file-sort">
            <option value="updatedAt-desc">更新日時 (新しい順)</option>
            <option value="updatedAt-asc">更新日時 (古い順)</option>
            <option value="name-asc">名前 (昇順)</option>
            <option value="name-desc">名前 (降順)</option>
            <option value="size-desc">サイズ (大きい順)</option>
            <option value="size-asc">サイズ (小さい順)</option>
          </select>
        </div>
      </div>
      <div class="file-list-content">
        <div class="file-list-loading">
          読み込み中...
        </div>
      </div>
      <div class="file-list-footer">
        <span class="storage-info"></span>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // 検索入力
    const searchInput = this.container.querySelector('.file-search');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.loadFiles();
    });

    // ソート選択
    const sortSelect = this.container.querySelector('.file-sort');
    sortSelect.addEventListener('change', (e) => {
      const [sortBy, order] = e.target.value.split('-');
      this.sortBy = sortBy;
      this.sortOrder = order;
      this.loadFiles();
    });
  }

  /**
   * ファイル一覧の読み込みと表示
   */
  async loadFiles() {
    const contentEl = this.container.querySelector('.file-list-content');
    
    try {
      // ファイル一覧を取得
      let files = await FileManager.listFiles({
        sortBy: this.sortBy,
        order: this.sortOrder
      });

      // 検索フィルタリング
      if (this.searchTerm) {
        files = files.filter(file => 
          file.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          file.projectName.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // ファイルリストの表示
      if (files.length === 0) {
        contentEl.innerHTML = this.renderEmptyState();
      } else {
        contentEl.innerHTML = this.renderFileList(files);
        this.attachFileEventListeners();
      }

      // ストレージ情報の更新
      await this.updateStorageInfo();

    } catch (error) {
      contentEl.innerHTML = `
        <div class="file-list-error">
          エラーが発生しました: ${error.message}
        </div>
      `;
    }
  }

  /**
   * 空状態の表示
   */
  renderEmptyState() {
    if (this.searchTerm) {
      return `
        <div class="file-list-empty">
          <p>「${this.searchTerm}」に一致するファイルが見つかりません</p>
        </div>
      `;
    }
    
    return `
      <div class="file-list-empty">
        <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>まだファイルがありません</p>
        <p class="text-muted">YAMLファイルをアップロードしてください</p>
      </div>
    `;
  }

  /**
   * ファイルリストの表示
   */
  renderFileList(files) {
    return `
      <ul class="file-list">
        ${files.map(file => this.renderFileItem(file)).join('')}
      </ul>
    `;
  }

  /**
   * ファイルアイテムの表示
   */
  renderFileItem(file) {
    const isActive = file.id === this.currentFileId;
    const fileSize = this.formatFileSize(file.size);
    const updatedAt = this.formatDate(file.updatedAt);
    
    return `
      <li class="file-item ${isActive ? 'active' : ''}" data-file-id="${file.id}">
        <div class="file-item-content">
          <div class="file-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="file-info">
            <h4 class="file-name">${this.escapeHtml(file.name)}</h4>
            <div class="file-meta">
              <span class="file-project">${this.escapeHtml(file.projectName)}</span>
              <span class="file-size">${fileSize}</span>
              <span class="file-date">${updatedAt}</span>
            </div>
          </div>
          <div class="file-actions">
            <button class="file-action-btn view-btn" 
                    data-file-id="${file.id}" 
                    title="YAMLを表示">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="file-action-btn delete-btn" 
                    data-file-id="${file.id}" 
                    title="削除">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </li>
    `;
  }

  /**
   * ファイルイベントリスナーの設定
   */
  attachFileEventListeners() {
    // ファイルアイテムのクリック
    const fileItems = this.container.querySelectorAll('.file-item');
    fileItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        // 削除ボタンのクリックは除外
        if (e.target.closest('.delete-btn')) return;
        
        const fileId = item.dataset.fileId;
        await this.selectFile(fileId);
      });
    });

    // 表示ボタンのクリック
    const viewButtons = this.container.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.fileId;
        await this.viewFile(fileId);
      });
    });

    // 編集ボタンのクリック（将来の拡張用）
    const editButtons = this.container.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.fileId;
        await this.editFile(fileId);
      });
    });

    // 削除ボタンのクリック
    const deleteButtons = this.container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.fileId;
        await this.deleteFile(fileId);
      });
    });
  }

  /**
   * ファイルの選択
   */
  async selectFile(fileId) {
    try {
      const file = await FileManager.getFile(fileId);
      
      if (file) {
        this.currentFileId = fileId;
        
        // アクティブ状態の更新
        this.updateActiveState(fileId);
        
        // コールバックの実行
        if (this.fileSelectedCallback) {
          this.fileSelectedCallback(file);
        }
      }
    } catch (error) {
      console.error('ファイルの選択に失敗しました:', error);
    }
  }

  /**
   * ファイルの表示
   */
  async viewFile(fileId) {
    try {
      const file = await FileManager.getFile(fileId);
      
      if (file) {
        this.showYamlModal(file);
      }
    } catch (error) {
      console.error('ファイルの表示に失敗しました:', error);
      alert(`表示に失敗しました: ${error.message}`);
    }
  }

  /**
   * YAMLモーダルの表示
   */
  showYamlModal(file) {
    // 既存のモーダルがあれば削除
    const existingModal = document.querySelector('.yaml-view-modal');
    if (existingModal) {
      existingModal.remove();
    }

    let isEditMode = false;

    // モーダルの作成
    const modal = document.createElement('div');
    modal.className = 'yaml-view-modal';
    modal.innerHTML = `
      <div class="yaml-modal-content">
        <div class="yaml-modal-header">
          <h3>${this.escapeHtml(file.name)}</h3>
          <button class="yaml-modal-close">&times;</button>
        </div>
        <div class="yaml-modal-body">
          <pre class="yaml-content" contenteditable="false"><code>${this.escapeHtml(file.content)}</code></pre>
        </div>
        <div class="yaml-modal-footer">
          <div class="yaml-modal-info">
            <span>サイズ: ${this.formatFileSize(file.size)}</span>
            <span>更新日: ${this.formatDate(file.updatedAt)}</span>
          </div>
          <button class="yaml-edit-btn">編集</button>
          <button class="yaml-save-btn" style="display: none;">保存</button>
          <button class="yaml-cancel-btn" style="display: none;">キャンセル</button>
          <button class="yaml-copy-btn">YAMLをコピー</button>
        </div>
      </div>
    `;

    // モーダルをbodyに追加
    document.body.appendChild(modal);

    // DOM要素の参照
    const yamlContent = modal.querySelector('.yaml-content');
    const codeElement = yamlContent.querySelector('code');
    const editBtn = modal.querySelector('.yaml-edit-btn');
    const saveBtn = modal.querySelector('.yaml-save-btn');
    const cancelBtn = modal.querySelector('.yaml-cancel-btn');
    const copyBtn = modal.querySelector('.yaml-copy-btn');
    const closeBtn = modal.querySelector('.yaml-modal-close');
    let originalContent = file.content;

    // 編集モードの切り替え
    const toggleEditMode = (enable) => {
      isEditMode = enable;
      codeElement.contentEditable = enable;
      yamlContent.style.background = enable ? '#f8f8f8' : 'transparent';
      yamlContent.style.outline = enable ? '1px solid #e2e8f0' : 'none';
      
      editBtn.style.display = enable ? 'none' : 'inline-block';
      saveBtn.style.display = enable ? 'inline-block' : 'none';
      cancelBtn.style.display = enable ? 'inline-block' : 'none';
      copyBtn.style.display = enable ? 'none' : 'inline-block';
    };

    // イベントリスナーの設定
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    editBtn.addEventListener('click', () => {
      toggleEditMode(true);
      codeElement.focus();
    });

    cancelBtn.addEventListener('click', () => {
      codeElement.textContent = originalContent;
      toggleEditMode(false);
    });

    saveBtn.addEventListener('click', async () => {
      const newContent = codeElement.textContent;
      
      // YAMLの検証
      try {
        window.jsyaml.load(newContent);
      } catch (error) {
        alert(`YAML構文エラー: ${error.message}`);
        return;
      }

      // ファイルを更新
      try {
        const updatedFile = {
          ...file,
          content: newContent,
          parsedData: window.jsyaml.load(newContent),
          updatedAt: new Date().toISOString(),
          size: new Blob([newContent]).size
        };

        await FileManager.updateFile(file.id, updatedFile);
        
        // 現在表示中のファイルなら再表示
        if (this.currentFileId === file.id && this.fileSelectedCallback) {
          await this.fileSelectedCallback(updatedFile);
        }

        // ファイルリストを更新
        await this.refresh();
        
        originalContent = newContent;
        toggleEditMode(false);
        
        // 成功メッセージ
        saveBtn.textContent = '保存しました！';
        setTimeout(() => {
          saveBtn.textContent = '保存';
        }, 2000);
      } catch (error) {
        console.error('保存に失敗しました:', error);
        alert(`保存に失敗しました: ${error.message}`);
      }
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeElement.textContent);
        copyBtn.textContent = 'コピーしました！';
        setTimeout(() => {
          copyBtn.textContent = 'YAMLをコピー';
        }, 2000);
      } catch (err) {
        console.error('コピーに失敗しました:', err);
        alert('クリップボードへのコピーに失敗しました');
      }
    });

    // モーダルの外側クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (isEditMode) {
          if (confirm('編集内容を破棄しますか？')) {
            modal.remove();
          }
        } else {
          modal.remove();
        }
      }
    });
  }

  /**
   * ファイルの編集
   */
  async editFile(fileId) {
    try {
      const file = await FileManager.getFile(fileId);
      
      if (file && this.fileEditCallback) {
        this.fileEditCallback(file);
      }
    } catch (error) {
      console.error('ファイルの編集に失敗しました:', error);
      alert(`編集に失敗しました: ${error.message}`);
    }
  }

  /**
   * ファイルの削除
   */
  async deleteFile(fileId) {
    const confirmDelete = confirm('このファイルを削除してもよろしいですか？');
    
    if (!confirmDelete) return;
    
    try {
      await FileManager.deleteFile(fileId);
      
      // 現在選択中のファイルが削除された場合
      if (this.currentFileId === fileId) {
        this.currentFileId = null;
      }
      
      // リストの再読み込み
      await this.loadFiles();
      
      // コールバックの実行
      if (this.fileDeletedCallback) {
        this.fileDeletedCallback(fileId);
      }
      
    } catch (error) {
      alert(`削除に失敗しました: ${error.message}`);
    }
  }

  /**
   * アクティブ状態の更新
   */
  updateActiveState(fileId) {
    const fileItems = this.container.querySelectorAll('.file-item');
    fileItems.forEach(item => {
      if (item.dataset.fileId === fileId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * ストレージ情報の更新
   */
  async updateStorageInfo() {
    try {
      const info = await FileManager.getStorageInfo();
      const infoEl = this.container.querySelector('.storage-info');
      
      infoEl.textContent = `${info.fileCount} ファイル (${info.totalSizeMB} MB)`;
      
    } catch (error) {
      console.error('ストレージ情報の取得に失敗しました:', error);
    }
  }

  /**
   * ファイルサイズのフォーマット
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 日時のフォーマット
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 1時間以内
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分前`;
    }
    
    // 24時間以内
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}時間前`;
    }
    
    // それ以外
    return date.toLocaleDateString('ja-JP');
  }

  /**
   * HTMLエスケープ
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * ファイルリストのリフレッシュ
   */
  async refresh() {
    await this.loadFiles();
  }

  /**
   * 現在選択中のファイルIDを取得
   */
  getCurrentFileId() {
    return this.currentFileId;
  }
}

export default FileListView;