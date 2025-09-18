/**
 * InlineEditor - インライン編集機能
 * Web Componentsを使用したストーリーカードの直接編集
 */

class EditableStoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isEditing = false;
    this.originalData = null;
    this.changeCallback = null;
  }

  /**
   * コンポーネントの初期化
   * @param {Object} storyData - ストーリーデータ
   * @param {Function} onChange - 変更時のコールバック
   */
  init(storyData, onChange) {
    this.originalData = { ...storyData };
    this.changeCallback = onChange;
    this.render();
  }

  /**
   * コンポーネントのレンダリング
   */
  render() {
    const style = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        .story-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background: white;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }

        .story-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .story-card.editing {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
          cursor: default;
        }

        .edit-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .story-card:hover .edit-indicator {
          opacity: 1;
        }

        .story-card.editing .edit-indicator {
          background: #f6ad55;
          opacity: 1;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .persona-tag {
          display: inline-block;
          padding: 4px 12px;
          background: var(--persona-color, #3182ce);
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .story-content {
          font-size: 14px;
          color: #2d3748;
          line-height: 1.6;
        }

        .story-field {
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 12px;
          color: #718096;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .field-value {
          color: #2d3748;
        }

        /* 編集モード */
        .edit-form {
          display: none;
        }

        .story-card.editing .story-content {
          display: none;
        }

        .story-card.editing .edit-form {
          display: block;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 4px;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save {
          background: #48bb78;
          color: white;
        }

        .btn-save:hover {
          background: #38a169;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-cancel:hover {
          background: #cbd5e0;
        }

        .acceptance-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .acceptance-item {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }

        .acceptance-input {
          flex: 1;
        }

        .btn-remove {
          padding: 4px 8px;
          background: #fed7d7;
          color: #c53030;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e6fffa;
          color: #234e52;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 4px;
        }
      </style>
    `;

    const displayContent = `
      <div class="story-content">
        <span class="persona-tag" style="--persona-color: ${this.getPersonaColor()}">${this.originalData.personaName}</span>
        
        <div class="story-field">
          <div class="field-value">${this.escapeHtml(this.originalData.story)}</div>
        </div>
        
        ${this.originalData.acceptance_criteria ? `
          <div class="story-field">
            <div class="field-label">受け入れ条件:</div>
            <ul style="margin: 4px 0 0 20px; padding: 0;">
              ${this.originalData.acceptance_criteria.map(ac => 
                `<li style="font-size: 13px; color: #4a5568; margin-bottom: 2px;">${this.escapeHtml(ac)}</li>`
              ).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="story-field">
          <span style="font-size: 12px; color: #a0aec0;">
            優先度: ${this.originalData.priority || 3} | バージョン: ${this.originalData.version || 'MVP'}
          </span>
        </div>
      </div>
    `;

    const editForm = `
      <div class="edit-form">
        <form>
          <div class="form-group">
            <label class="form-label">ペルソナ</label>
            <select class="form-input" name="personaKey">
              ${(this.originalData.personaOptions || []).map(opt => `
                <option value="${opt.key}" ${opt.key === this.originalData.personaKey ? 'selected' : ''}>${opt.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">実現したいこと (I want)</label>
            <textarea class="form-textarea" name="want" required>${this.escapeHtml(this.originalData.want || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">価値 (So that)</label>
            <textarea class="form-textarea" name="soThat">${this.escapeHtml(this.originalData.soThat || '')}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">受け入れ条件</label>
            <ul class="acceptance-list">
              ${(this.originalData.acceptance_criteria || []).map((ac, index) => `
                <li class="acceptance-item">
                  <input type="text" class="form-input acceptance-input" name="ac_${index}" value="${this.escapeHtml(ac)}">
                  <button type="button" class="btn-remove" data-index="${index}">削除</button>
                </li>
              `).join('')}
            </ul>
            <button type="button" class="btn-add">+ 条件を追加</button>
          </div>
          
          <div class="form-group" style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <label class="form-label">優先度 (1-5)</label>
              <input type="number" class="form-input" name="priority" min="1" max="5" value="${this.originalData.priority || 3}">
            </div>
            <div style="flex: 1;">
              <label class="form-label">バージョン</label>
              <input type="text" class="form-input" name="version" value="${this.originalData.version || 'MVP'}">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-cancel">キャンセル</button>
            <button type="submit" class="btn btn-save">保存</button>
          </div>
        </form>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <div class="story-card ${this.isEditing ? 'editing' : ''}">
        <div class="edit-indicator"></div>
        ${displayContent}
        ${editForm}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    const card = this.shadowRoot.querySelector('.story-card');
    const form = this.shadowRoot.querySelector('form');
    const cancelBtn = this.shadowRoot.querySelector('.btn-cancel');
    const addBtn = this.shadowRoot.querySelector('.btn-add');
    
    // カードクリックで編集モード
    card.addEventListener('click', (e) => {
      if (!this.isEditing && !e.target.closest('form')) {
        this.enterEditMode();
      }
    });
    
    // フォーム送信
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveChanges();
    });
    
    // キャンセル
    cancelBtn.addEventListener('click', () => {
      this.exitEditMode();
    });
    
    // 受け入れ条件の追加
    addBtn.addEventListener('click', () => {
      this.addAcceptanceCriteria();
    });
    
    // 受け入れ条件の削除
    this.shadowRoot.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeAcceptanceCriteria(parseInt(btn.dataset.index));
      });
    });
  }

  /**
   * 編集モードに入る
   */
  enterEditMode() {
    this.isEditing = true;
    this.shadowRoot.querySelector('.story-card').classList.add('editing');
    
    // 最初の入力フィールドにフォーカス
    setTimeout(() => {
      this.shadowRoot.querySelector('textarea').focus();
    }, 100);
  }

  /**
   * 編集モードを終了
   */
  exitEditMode() {
    this.isEditing = false;
    this.render();
  }

  /**
   * 変更を保存
   */
  saveChanges() {
    const form = this.shadowRoot.querySelector('form');
    const formData = new FormData(form);
    
    // 受け入れ条件を収集
    const acceptanceCriteria = [];
    this.shadowRoot.querySelectorAll('.acceptance-input').forEach(input => {
      if (input.value.trim()) {
        acceptanceCriteria.push(input.value.trim());
      }
    });
    
    let want = (formData.get('want') || '').toString().trim();
    // 末尾のカンマや句読点を除去
    want = want.replace(/[\s,、，。]+$/g, '');
    const soThat = (formData.get('soThat') || '').toString().trim();
    // ユーザーストーリーを組み立て
    // YAMLにはペルソナを含めず保存（I want/So that形式のみ）
    const storyText = `I want ${want}${soThat ? ', So that ' + soThat : ''}`;

    const updatedData = {
      ...this.originalData,
      story: storyText,
      want: want,
      soThat: soThat || null,
      priority: parseInt(formData.get('priority')),
      version: formData.get('version'),
      acceptance_criteria: acceptanceCriteria,
      personaKey: formData.get('personaKey') || this.originalData.personaKey
    };
    
    // 変更をコールバックで通知
    if (this.changeCallback) {
      this.changeCallback(updatedData);
    }
    
    // データを更新して表示モードに戻る（ペルソナ名称も即時反映）
    this.originalData = {
      ...updatedData,
      personaName: this.resolvePersonaName(updatedData.personaKey)
    };
    this.exitEditMode();
  }

  /**
   * 受け入れ条件を追加
   */
  addAcceptanceCriteria() {
    const list = this.shadowRoot.querySelector('.acceptance-list');
    const index = list.children.length;
    
    const li = document.createElement('li');
    li.className = 'acceptance-item';
    li.innerHTML = `
      <input type="text" class="form-input acceptance-input" name="ac_${index}" placeholder="新しい条件">
      <button type="button" class="btn-remove" data-index="${index}">削除</button>
    `;
    
    list.appendChild(li);
    
    // 削除ボタンのイベント設定
    li.querySelector('.btn-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      li.remove();
    });
    
    // 新しい入力フィールドにフォーカス
    li.querySelector('input').focus();
  }

  /**
   * 受け入れ条件を削除
   */
  removeAcceptanceCriteria(index) {
    const items = this.shadowRoot.querySelectorAll('.acceptance-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  /**
   * ペルソナカラーの取得
   */
  getPersonaColor() {
    const name = (this.originalData.personaName || '').toString();
    if (!name) return '#7f8c8d';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 45%)`;
  }

  /**
   * ペルソナ名解決（選択肢から）
   */
  resolvePersonaName(key) {
    if (key === 'CROSS') return '全ユーザー';
    const list = this.originalData.personaOptions || (window.__storyMapPersonas__ || []);
    const hit = list.find(p => p.key === key);
    return hit ? hit.name : this.originalData.personaName;
  }

  /**
   * HTMLエスケープ
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

// カスタム要素の登録
customElements.define('editable-story-card', EditableStoryCard);

/**
 * InlineEditor - インライン編集機能のマネージャー
 */
class InlineEditor {
  constructor() {
    this.enabled = false;
    this.changeCallback = null;
    this.editableCards = new Map();
    this.originalNodes = new Map();
  }

  /**
   * インライン編集の有効化
   * @param {Function} onChange - 変更時のコールバック
   */
  enable(onChange) {
    this.enabled = true;
    this.changeCallback = onChange;
    this.originalNodes = new Map();
    this.convertExistingCards();
  }

  /**
   * インライン編集の無効化
   */
  disable() {
    this.enabled = false;
    this.revertToStaticCards();
  }

  /**
   * 既存のストーリーカードを編集可能に変換
   */
  convertExistingCards() {
    const storyCards = document.querySelectorAll('.story-card[data-story-id]');
    
    storyCards.forEach(card => {
      const storyId = card.getAttribute('data-story-id');
      const storyData = this.extractStoryData(card);
      
      if (storyData) {
        const editableCard = document.createElement('editable-story-card');
        // ペルソナ候補を生成（画面にあるlegendは使わず、DataComposer結果から取得するためにDOMから推定）
        const personaOptions = [];
        try {
          // personasは index.html 側からは参照できないため、カードからは取得不可。
          // 代替として、mapContentに一時的に埋め込まれたデータ属性を後で導入することも可能。
        } catch {}
        const baseOptions = window.__storyMapPersonas__ || storyData.personaOptions || [];
        // 特殊選択肢: CrossPersona（常に表示）
        const crossOption = { key: 'CROSS', name: '全ユーザー（CrossPersona）' };
        const hasCross = baseOptions.some(o => o.key === 'CROSS');
        storyData.personaOptions = hasCross ? baseOptions : [...baseOptions, crossOption];
        editableCard.init(storyData, (updatedData) => {
          this.handleStoryChange(storyId, updatedData);
        });
        
        // 元のカードを保存して置き換え
        this.originalNodes.set(storyId, card);
        card.parentNode.replaceChild(editableCard, card);
        this.editableCards.set(storyId, editableCard);
      }
    });
  }

  /**
   * 編集可能カードを静的カードに戻す
   */
  revertToStaticCards() {
    // 編集可能カードを元の静的カードに戻す
    this.editableCards.forEach((editableCard, storyId) => {
      const original = this.originalNodes.get(storyId);
      if (editableCard && original && editableCard.parentNode) {
        editableCard.parentNode.replaceChild(original, editableCard);
      }
    });
    this.editableCards.clear();
    this.originalNodes.clear();
  }

  /**
   * ストーリーデータの抽出
   */
  extractStoryData(card) {
    // カードからデータを抽出（DOMの特定要素のみ参照して崩れを防止）
    const personaTag = card.querySelector('.story-tag');
    const wantEl = card.querySelector('.story-want .story-text');
    const benefitEl = card.querySelector('.story-benefit .story-text');
    const priorityEl = card.querySelector('.priority-badge');
    const versionEl = card.querySelector('.version-badge');
    const personaKeyAttr = card.getAttribute('data-persona-key');

    const personaName = personaTag ? personaTag.textContent.trim() : '';
    const want = wantEl ? wantEl.textContent.trim() : '';
    const soThat = benefitEl ? benefitEl.textContent.trim() : null;
    const priority = priorityEl ? parseInt(priorityEl.textContent.replace(/^P/i, '')) : 3;
    const version = versionEl ? versionEl.textContent.trim() : 'MVP';

    // 抽出した値からユーザーストーリー文（ペルソナなし）を組み立て
    const storyText = `I want ${want}${soThat ? ', So that ' + soThat : ''}`;
    
    return {
      id: card.getAttribute('data-story-id'),
      personaName,
      personaKey: personaKeyAttr || '',
      story: storyText,
      want,
      soThat,
      acceptance_criteria: [],
      priority,
      version
    };
  }

  /**
   * ストーリー変更のハンドリング
   */
  handleStoryChange(storyId, updatedData) {
    console.log('Story changed:', storyId, updatedData);
    
    if (this.changeCallback) {
      this.changeCallback({
        storyId,
        updatedData,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 編集モードの切り替え
   */
  toggleEditMode() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable(this.changeCallback);
    }
    
    return this.enabled;
  }
}

export default InlineEditor;