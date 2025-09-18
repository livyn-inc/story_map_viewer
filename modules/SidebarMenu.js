/**
 * サイドバーメニュー管理モジュール
 */
class SidebarMenu {
  constructor() {
    this.activeTab = 'files';
    this.menuContainer = null;
  }

  /**
   * メニューの初期化
   */
  init(container) {
    this.menuContainer = container;
    this.render();
    this.attachEventListeners();
  }

  /**
   * メニューのレンダリング
   */
  render() {
    this.menuContainer.innerHTML = `
      <div class="sidebar-menu">
        <!-- メインタブ -->
        <div class="sidebar-tabs">
          <button class="sidebar-tab active" data-tab="files" title="ファイル">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </button>
          <button class="sidebar-tab" data-tab="upload" title="アップロード">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          <button class="sidebar-tab" data-tab="folder" title="フォルダ同期">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="2" y1="10" x2="22" y2="10"></line>
              <path d="M14 13l-2 2l-2-2"></path>
              <path d="M10 17l2 2l2-2"></path>
            </svg>
          </button>
          <button class="sidebar-tab" data-tab="settings" title="設定" style="display:none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1"></path>
            </svg>
          </button>
          <button class="sidebar-tab" data-tab="help" title="ヘルプ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
        </div>

        <!-- タブコンテンツ -->
        <div class="sidebar-content">
          <div class="tab-content active" data-content="files">
            <div class="content-header">
              <h3>ファイル一覧</h3>
            </div>
            <div id="fileListContainer">
              <!-- ファイルリストがここに表示される -->
            </div>
          </div>

          <div class="tab-content" data-content="upload">
            <div class="content-header">
              <h3>アップロード</h3>
            </div>
            <div id="uploadContainer">
              <div id="fileDropZone"></div>
            </div>
          </div>

          <div class="tab-content" data-content="folder">
            <div class="content-header">
              <h3>フォルダ同期</h3>
            </div>
            <div id="folderSyncContainer">
              <div id="folderWatcherContainer"></div>
            </div>
          </div>

          <div class="tab-content" data-content="settings" style="display:none;">
            <div class="content-header">
              <h3>設定</h3>
            </div>
            <div class="settings-content">
              <div class="setting-item">
                <label>テーマ</label>
                <select id="themeSelector">
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                </select>
              </div>
              <div class="setting-item">
                <label>自動保存</label>
                <input type="checkbox" id="autoSaveToggle" checked>
              </div>
            </div>
          </div>
          
          <div class="tab-content" data-content="help">
            <div class="content-header">
              <h3>ヘルプ＆ドキュメント</h3>
            </div>
            <div id="helpContainer" class="help-content">
              <!-- ヘルプコンテンツはHelpViewモジュールで管理 -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    // タブクリック
    const tabs = this.menuContainer.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // 新規ファイルボタンは削除済み
  }

  /**
   * タブの切り替え
   */
  switchTab(tabName) {
    // アクティブタブの更新
    const tabs = this.menuContainer.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // コンテンツの切り替え
    const contents = this.menuContainer.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.dataset.content === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    this.activeTab = tabName;

    // タブ切り替えイベントを発火
    window.dispatchEvent(new CustomEvent('sidebarTabChanged', {
      detail: { tab: tabName }
    }));
  }

  /**
   * 新規ファイルの作成
   */
  createNewFile() {
    const fileName = prompt('新規ファイル名を入力してください:', 'new-story-map.yaml');
    if (fileName) {
      window.dispatchEvent(new CustomEvent('createNewFile', {
        detail: { fileName }
      }));
    }
  }

  /**
   * ファイルコンテナの取得
   */
  getFileListContainer() {
    return this.menuContainer.querySelector('#fileListContainer');
  }

  /**
   * アップロードコンテナの取得
   */
  getUploadContainer() {
    return this.menuContainer.querySelector('#fileDropZone');
  }

  /**
   * フォルダ同期コンテナの取得
   */
  getFolderSyncContainer() {
    return this.menuContainer.querySelector('#folderWatcherContainer');
  }
  
  /**
   * ヘルプコンテナの取得
   */
  getHelpContainer() {
    return this.menuContainer.querySelector('#helpContainer');
  }
}

// ES6 export
export default SidebarMenu;