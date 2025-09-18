/**
 * YAMLエディタモジュール
 */
class YamlEditor {
  constructor() {
    this.modal = null;
    this.currentFile = null;
    this.saveCallback = null;
  }

  /**
   * エディタを開く
   */
  open(file, onSave) {
    this.currentFile = file;
    this.saveCallback = onSave;
    
    // モーダルの作成
    this.createModal();
    
    // コンテンツの設定
    const textarea = this.modal.querySelector('#yamlEditorTextarea');
    textarea.value = file.content || '';
    
    // モーダルを表示
    document.body.appendChild(this.modal);
  }

  /**
   * モーダルの作成
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'yaml-editor-modal';
    this.modal.innerHTML = `
      <div class="yaml-editor-content">
        <div class="yaml-editor-header">
          <h2>YAMLエディタ - ${this.currentFile.name}</h2>
          <button class="close-btn" id="yamlEditorClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="yaml-editor-body">
          <textarea id="yamlEditorTextarea" 
                    class="yaml-editor-textarea"
                    spellcheck="false"
                    placeholder="YAMLコンテンツを入力..."></textarea>
        </div>
        
        <div class="yaml-editor-footer">
          <div class="editor-status">
            <span id="editorStatus"></span>
          </div>
          <div class="editor-actions">
            <button class="btn btn-secondary" id="yamlEditorCancel">キャンセル</button>
            <button class="btn btn-primary" id="yamlEditorSave">保存</button>
          </div>
        </div>
      </div>
    `;

    // イベントリスナーの設定
    this.attachEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    // 閉じるボタン
    const closeBtn = this.modal.querySelector('#yamlEditorClose');
    closeBtn.addEventListener('click', () => this.close());

    // キャンセルボタン
    const cancelBtn = this.modal.querySelector('#yamlEditorCancel');
    cancelBtn.addEventListener('click', () => this.close());

    // 保存ボタン
    const saveBtn = this.modal.querySelector('#yamlEditorSave');
    saveBtn.addEventListener('click', () => this.save());

    // ESCキーで閉じる
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // テキストエリアのタブ対応
    const textarea = this.modal.querySelector('#yamlEditorTextarea');
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        // タブを挿入
        textarea.value = value.substring(0, start) + '  ' + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    });

    // 変更検出
    textarea.addEventListener('input', () => {
      this.validateYaml(textarea.value);
    });
  }

  /**
   * YAMLの検証
   */
  validateYaml(content) {
    const statusEl = this.modal.querySelector('#editorStatus');
    
    try {
      if (content.trim()) {
        window.jsyaml.load(content);
        statusEl.textContent = '✓ 有効なYAML';
        statusEl.style.color = '#48bb78';
      } else {
        statusEl.textContent = '';
      }
    } catch (error) {
      statusEl.textContent = `✗ YAMLエラー: ${error.message}`;
      statusEl.style.color = '#f56565';
    }
  }

  /**
   * 保存処理
   */
  save() {
    const textarea = this.modal.querySelector('#yamlEditorTextarea');
    const content = textarea.value;

    try {
      // YAMLの検証
      const parsedData = window.jsyaml.load(content);

      // ファイルの更新
      this.currentFile.content = content;
      this.currentFile.parsedData = parsedData;
      this.currentFile.updatedAt = new Date().toISOString();

      // コールバックの実行
      if (this.saveCallback) {
        this.saveCallback(this.currentFile);
      }

      // モーダルを閉じる
      this.close();
    } catch (error) {
      alert(`YAMLエラー: ${error.message}`);
    }
  }

  /**
   * モーダルを閉じる
   */
  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
    this.currentFile = null;
    this.saveCallback = null;
  }
}

// ES6 export
export default YamlEditor;