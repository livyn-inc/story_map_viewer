/**
 * サイドバー開閉機能モジュール
 */
class SidebarToggle {
  constructor() {
    this.sidebar = null;
    this.toggleInner = null;
    this.toggleOuter = null;
    this.isCollapsed = false;
  }

  /**
   * 初期化
   */
  init() {
    // 要素の取得
    this.sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    
    if (!this.sidebar) {
      console.warn('Sidebar element not found');
      return;
    }

    // トグルボタンの作成と追加
    this.createToggleButtons();
    
    // 初期状態の設定（ローカルストレージから復元）
    this.restoreState();
  }

  /**
   * トグルボタンの作成
   */
  createToggleButtons() {
    // サイドバー内のトグルボタン（閉じる用）
    this.toggleInner = document.createElement('button');
    this.toggleInner.className = 'sidebar-toggle-inner';
    this.toggleInner.setAttribute('aria-label', 'サイドバーを閉じる');
    this.toggleInner.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    `;
    
    // サイドバー外のトグルボタン（開く用）
    this.toggleOuter = document.createElement('button');
    this.toggleOuter.className = 'sidebar-toggle-outer';
    this.toggleOuter.setAttribute('aria-label', 'サイドバーを開く');
    this.toggleOuter.style.display = 'none';
    this.toggleOuter.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;
    
    // ヘッダーの修正
    const header = this.sidebar.querySelector('.sidebar-header');
    if (header) {
      const h1 = header.querySelector('h1');
      if (h1) {
        // タイトル行のラッパーを作成
        const titleRow = document.createElement('div');
        titleRow.className = 'sidebar-title-row';
        
        // h1を移動
        h1.parentNode.insertBefore(titleRow, h1);
        titleRow.appendChild(h1);
        titleRow.appendChild(this.toggleInner);
      }
    }
    
    // 外側のトグルボタンをapp-containerの最初に追加
    const appContainer = this.sidebar.parentElement;
    if (appContainer && appContainer.classList.contains('app-container')) {
      appContainer.insertBefore(this.toggleOuter, appContainer.firstChild);
    }
    
    // イベントリスナーの設定
    this.toggleInner.addEventListener('click', () => this.toggle());
    this.toggleOuter.addEventListener('click', () => this.toggle());
  }

  /**
   * サイドバーの開閉
   */
  toggle() {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      this.sidebar.classList.add('collapsed');
      this.toggleOuter.style.display = 'block';
    } else {
      this.sidebar.classList.remove('collapsed');
      this.toggleOuter.style.display = 'none';
    }
    
    // 状態を保存
    this.saveState();
  }

  /**
   * 状態の保存
   */
  saveState() {
    localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());
  }

  /**
   * 状態の復元
   */
  restoreState() {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      this.isCollapsed = true;
      this.sidebar.classList.add('collapsed');
      this.toggleOuter.style.display = 'block';
    }
  }
}

// ES6 export
export default SidebarToggle;