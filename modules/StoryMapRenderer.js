/**
 * StoryMapRenderer - DOM描画を担当
 * Requirements: 2.1, 2.2, 4.1, 4.2, 5.1, 5.2
 */
import PersonaTagColorMap from './PersonaTagColorMap.js';

class StoryMapRenderer {
    /**
     * ストーリーマップを描画
     * @param {Object} grid - DataComposerからの描画用データ
     * @param {Object} mounts - 描画先のDOM要素
     */
    static render(grid, mounts) {
        // アクティビティ行を描画
        this._renderActivityRow(grid, mounts.activities);
        
        // バックボーン行を描画
        this._renderBackboneRow(grid, mounts.backbones);
        
        // ストーリー行を描画（Versionスライス対応）
        this._renderStoryRowsWithSlices(grid.rows, grid.slices || [], mounts.stories, 'stories');
    }
    
    /**
     * アクティビティ行を描画
     * @private
     */
    static _renderActivityRow(grid, container) {
        container.innerHTML = '';

        const activities = grid.activityByColumn;
        for (let i = 0; i < activities.length; ) {
            const activity = activities[i];
            if (!activity) {
                const emptyCard = this._createEmptyCard();
                container.appendChild(emptyCard);
                i += 1;
                continue;
            }
            // 連続する同一アクティビティの幅をまとめて表示
            let span = 1;
            while (
                i + span < activities.length &&
                activities[i + span] &&
                activities[i + span].id === activity.id
            ) {
                span += 1;
            }
            const card = this._createActivityCard(activity, i);
            card.style.gridColumn = `span ${span}`;
            container.appendChild(card);
            i += span;
        }
    }
    
    /**
     * バックボーン行を描画
     * @private
     */
    static _renderBackboneRow(grid, container) {
        container.innerHTML = '';
        
        grid.columns.forEach(backbone => {
            const card = this._createBackboneCard(backbone);
            container.appendChild(card);
        });
    }
    
    /**
     * ストーリー行を描画
     * @private
     */
    static _renderStoryRows(rows, container, priorityClass) {
        container.innerHTML = '';
        
        let lastVersion = null;
        rows.forEach((row) => {
            const rowVersion = this._detectRowVersion(row);
            if (lastVersion !== null && rowVersion !== null && rowVersion !== lastVersion) {
                // バージョン境界に水平の区切り線を挿入（テキストなし）
                const divider = document.createElement('div');
                divider.className = 'slice-divider';
                divider.style.gridColumn = '1 / -1';
                container.appendChild(divider);
            }
            if (rowVersion !== null) {
                lastVersion = rowVersion;
            }
            
            row.forEach((story) => {
                if (story) {
                    const card = this._createStoryCard(story);
                    card.classList.add(priorityClass);
                    container.appendChild(card);
                } else {
                    // 不可視カードで空白セルを保持
                    const emptyCard = this._createEmptyCard();
                    container.appendChild(emptyCard);
                }
            });
        });
    }

    /**
     * Versionスライスに対応した描画
     * @private
     */
    static _renderStoryRowsWithSlices(rows, slices, container, priorityClass) {
        container.innerHTML = '';
        const sliceSet = new Set(slices);
        rows.forEach((row, rowIndex) => {
            if (sliceSet.has(rowIndex)) {
                const divider = document.createElement('div');
                divider.className = 'slice-divider';
                divider.style.gridColumn = '1 / -1';
                container.appendChild(divider);
            }
            row.forEach((story) => {
                if (story) {
                    const card = this._createStoryCard(story);
                    card.classList.add(priorityClass);
                    container.appendChild(card);
                } else {
                    const emptyCard = this._createEmptyCard();
                    container.appendChild(emptyCard);
                }
            });
        });
    }

    /**
     * 行内の主要Versionを推定（最多出現）
     * @private
     */
    static _detectRowVersion(row) {
        const versions = row.filter(Boolean).map(s => s.version || 'MVP');
        if (versions.length === 0) return null;
        const counts = new Map();
        versions.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
        let best = null;
        let bestCount = -1;
        counts.forEach((cnt, v) => {
            if (cnt > bestCount) { best = v; bestCount = cnt; }
        });
        return best;
    }
    
    /**
     * アクティビティカードを作成
     * @private
     */
    static _createActivityCard(activity, startIndex = 0) {
        const card = document.createElement('div');
        card.className = 'card activity-card';
        card.setAttribute('data-activity-id', activity.id);
        card.innerHTML = `
            <h3>${this._escapeHtml(activity.name)}</h3>
            ${activity.description ? `<p>${this._escapeHtml(activity.description)}</p>` : ''}
        `;
        card.style.position = 'relative';

        // 追加: バックボーン追加 / 編集 / 削除 ボタン
        const addBb = document.createElement('button');
        addBb.title = 'このアクティビティにバックボーンを追加';
        addBb.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const editBtn = document.createElement('button');
        editBtn.title = 'アクティビティを編集';
        editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const delBtn = document.createElement('button');
        delBtn.title = 'アクティビティを削除';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        ;[addBb, editBtn, delBtn].forEach((btn, idx) => {
            btn.style.position = 'absolute';
            btn.style.top = '6px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
            btn.style.zIndex = '10';
        });
        addBb.style.right = '8px';
        editBtn.style.right = '32px';
        delBtn.style.right = '56px';

        addBb.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                console.log('[UI] requestAddBackbone click for activity', activity.id, 'startIndex', startIndex);
                const ev = new CustomEvent('requestAddBackbone', { bubbles: true, detail: { activityId: activity.id, insertAt: startIndex } });
                card.dispatchEvent(ev);
            } catch (err) { console.error(err); }
        });
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const ev = new CustomEvent('requestEditActivity', { bubbles: true, detail: { activityId: activity.id } });
                card.dispatchEvent(ev);
            } catch (err) { console.error(err); }
        });
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const ev = new CustomEvent('requestDeleteActivity', { bubbles: true, detail: { activityId: activity.id } });
                card.dispatchEvent(ev);
            } catch (err) { console.error(err); }
        });

        card.appendChild(addBb);
        card.appendChild(editBtn);
        card.appendChild(delBtn);
        return card;
    }
    
    /**
     * バックボーンカードを作成
     * @private
     */
    static _createBackboneCard(backbone) {
        const card = document.createElement('div');
        card.className = 'card backbone-card';
        card.setAttribute('data-backbone-id', backbone.id);
        card.innerHTML = `
            <h4>${this._escapeHtml(backbone.name)}</h4>
            ${backbone.description ? `<p>${this._escapeHtml(backbone.description)}</p>` : ''}
        `;

        // 追加ボタン（バックボーン右上）
        const addBtn = document.createElement('button');
        addBtn.className = 'backbone-add-btn';
        addBtn.title = '新規ストーリーを追加';
        addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const ev = new CustomEvent('requestAddStory', { bubbles: true, detail: { backboneId: backbone.id } });
                card.dispatchEvent(ev);
            } catch (err) { console.error(err); }
        });

        card.style.position = 'relative';
        addBtn.style.position = 'absolute';
        addBtn.style.top = '6px';
        addBtn.style.right = '6px';
        addBtn.style.border = 'none';
        addBtn.style.background = 'transparent';
        addBtn.style.cursor = 'pointer';
        addBtn.style.opacity = '0.7';
        addBtn.style.zIndex = '10';
        card.appendChild(addBtn);

        // 左右移動ボタン（← →）
        const leftBtn = document.createElement('button');
        leftBtn.className = 'backbone-move-btn backbone-move-left';
        leftBtn.title = '左へ';
        leftBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const rightBtn = document.createElement('button');
        rightBtn.className = 'backbone-move-btn backbone-move-right';
        rightBtn.title = '右へ';
        rightBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        [leftBtn, rightBtn].forEach(btn => {
            btn.style.position = 'absolute';
            btn.style.top = '6px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
            btn.style.zIndex = '10';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const direction = btn.classList.contains('backbone-move-left') ? 'left' : 'right';
                try {
                    const ev = new CustomEvent('requestMoveBackbone', { bubbles: true, detail: { backboneId: backbone.id, direction } });
                    card.dispatchEvent(ev);
                } catch (err) { console.error(err); }
            });
        });
        leftBtn.style.right = '32px';
        rightBtn.style.right = '20px';
        // 編集/削除
        const editBtn = document.createElement('button');
        editBtn.title = 'バックボーンを編集';
        editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const delBtn = document.createElement('button');
        delBtn.title = 'バックボーンを削除';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        ;[editBtn, delBtn].forEach(btn => {
            btn.style.position = 'absolute';
            btn.style.top = '6px';
            btn.style.right = (btn === editBtn) ? '44px' : '58px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
            btn.style.zIndex = '10';
        });
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // インライン編集UI
            const wrap = document.createElement('div');
            wrap.style.padding = '8px';
            wrap.style.display = 'grid';
            wrap.style.gap = '6px';
            wrap.innerHTML = `
                <label>名称<input type="text" value="${this._escapeHtml(backbone.name)}" style="width:100%"/></label>
                <label>アクティビティ<select style="width:100%"></select></label>
                <div style="display:flex; gap:8px; justify-content:flex-end">
                  <button class="bb-cancel">キャンセル</button>
                  <button class="bb-delete" style="color:#c00">削除</button>
                  <button class="bb-save" style="font-weight:bold">保存</button>
                </div>
            `;
            const nameInput = wrap.querySelector('input');
            const sel = wrap.querySelector('select');
            const options = (window.__storyMapActivities__ || []).map(a=>`<option value="${a.id}" ${a.id===backbone.activity_id?'selected':''}>${this._escapeHtml(a.name)}</option>`).join('');
            sel.innerHTML = options;
            // 元DOMを一時置換
            const original = card.innerHTML;
            card.innerHTML = '';
            card.appendChild(wrap);
            wrap.querySelector('.bb-cancel').addEventListener('click', (ev)=>{ ev.stopPropagation(); card.innerHTML = original; });
            wrap.querySelector('.bb-delete').addEventListener('click', (ev)=>{
                ev.stopPropagation();
                const ev2 = new CustomEvent('requestDeleteBackbone', { bubbles:true, detail:{ backboneId: backbone.id } });
                card.dispatchEvent(ev2);
            });
            wrap.querySelector('.bb-save').addEventListener('click', (ev)=>{
                ev.stopPropagation();
                const ev2 = new CustomEvent('requestEditBackbone', { bubbles:true, detail:{ backboneId: backbone.id, newName: nameInput.value, newActivityId: sel.value } });
                card.dispatchEvent(ev2);
            });
        });
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ev = new CustomEvent('requestDeleteBackbone', { bubbles: true, detail: { backboneId: backbone.id } });
            card.dispatchEvent(ev);
        });

        card.appendChild(leftBtn);
        card.appendChild(rightBtn);
        card.appendChild(editBtn);
        card.appendChild(delBtn);
        return card;
    }
    
    /**
     * ストーリーカードを作成
     * @private
     */
    static _createStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'card story-card';
        card.setAttribute('data-story-id', story.id);
        if (story.personaKey) {
            card.setAttribute('data-persona-key', story.personaKey);
        }
        
        // ペルソナタグ（色適用）
        const personaTag = document.createElement('span');
        personaTag.className = 'story-tag';
        personaTag.setAttribute('data-persona', story.personaName);
        personaTag.textContent = story.personaName;
        const personaColor = PersonaTagColorMap.colorOf(story.personaName);
        personaTag.style.backgroundColor = personaColor.bg;
        personaTag.style.color = personaColor.fg;
        
        // ストーリー内容を分解して表示
        const content = document.createElement('div');
        content.className = 'story-content';
        
        // "I want" と "So that" を分解
        const storyParts = this._parseUserStory(story.story);
        
        content.innerHTML = `
            <div class="story-priority">
                <span class="priority-badge priority-${story.priority || 3}">P${story.priority || 3}</span>
                <span class="version-badge">${story.version || 'MVP'}</span>
                <span class="status-badge status-${(story.status || 'TODO').toLowerCase()}">${story.status || 'TODO'}</span>
            </div>
            <div class="story-want">
                <span class="story-label">実現したいこと:</span>
                <span class="story-text">${this._escapeHtml(storyParts.want)}</span>
            </div>
            ${storyParts.soThat ? `
            <div class="story-benefit">
                <span class="story-label">価値:</span>
                <span class="story-text">${this._escapeHtml(storyParts.soThat)}</span>
            </div>
            ` : ''}
        `;
        
        // 右上アクションを統一（狭い間隔に合わせる）: [削除][編集][上][下][＋]（右端に＋）
        const delIconBtn = document.createElement('button');
        delIconBtn.className = 'story-delete-btn';
        delIconBtn.title = '削除';
        delIconBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const editBtn = document.createElement('button');
        editBtn.className = 'story-edit-btn';
        editBtn.title = '編集';
        editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        [delIconBtn, editBtn].forEach((btn) => {
            btn.style.position = 'absolute';
            btn.style.top = '6px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
            btn.style.zIndex = '10';
        });
        // 右から一定間隔で配置
        delIconBtn.style.right = '58px';
        editBtn.style.right = '44px';

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // StaticカードをEditableWebComponentに置き換え
            try {
                const data = {
                    id: story.id,
                    personaName: story.personaName,
                    personaKey: story.personaKey,
                    story: story.story,
                    want: this._parseUserStory(story.story).want,
                    soThat: this._parseUserStory(story.story).soThat,
                    acceptance_criteria: story.acceptance_criteria || [],
                    priority: story.priority || 3,
                    version: story.version || 'MVP',
                    backbone_id: story.backbone_id,
                    status: story.status || 'TODO',
                    personaOptions: (window.__storyMapPersonas__ || [])
                };
                const editable = document.createElement('editable-story-card');
                editable.init(data, (updated) => {
                    // 直接イベントはInlineEditor内でdispatchされる
                    // ここでは何もしない
                });
                card.parentNode.replaceChild(editable, card);
                // 即座に編集モードへ
                setTimeout(() => {
                    editable.enterEditMode && editable.enterEditMode();
                }, 50);
            } catch (err) {
                console.error('failed to enter inline edit:', err);
            }
        });

        // 並び替えボタン（右上 Up/Down）— BackBoneのボタンと同等の扱い/サイズ

        const addBtn = document.createElement('button');
        addBtn.className = 'story-add-btn';
        addBtn.title = 'この下に追加';
        addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const upBtn = document.createElement('button');
        upBtn.className = 'story-move-btn story-move-up';
        upBtn.title = '上へ';
        upBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 15l7-7 7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const downBtn = document.createElement('button');
        downBtn.className = 'story-move-btn story-move-down';
        downBtn.title = '下へ';
        downBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        [addBtn, upBtn, downBtn].forEach((btn) => {
            btn.style.position = 'absolute';
            btn.style.top = '6px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
            btn.style.zIndex = '10';
        });
        // 右からの位置: [+]=6, [下]=20, [上]=32 に固定
        addBtn.style.right = '6px';
        downBtn.style.right = '20px';
        upBtn.style.right = '32px';

        // クリックハンドラ
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // StaticカードをEditableWebComponentに置き換え（既存処理）
            try {
                const data = {
                    id: story.id,
                    personaName: story.personaName,
                    personaKey: story.personaKey,
                    story: story.story,
                    want: this._parseUserStory(story.story).want,
                    soThat: this._parseUserStory(story.story).soThat,
                    acceptance_criteria: story.acceptance_criteria || [],
                    priority: story.priority || 3,
                    version: story.version || 'MVP',
                    backbone_id: story.backbone_id,
                    status: story.status || 'TODO',
                    personaOptions: (window.__storyMapPersonas__ || [])
                };
                const editable = document.createElement('editable-story-card');
                editable.init(data, () => {});
                card.parentNode.replaceChild(editable, card);
                setTimeout(() => { editable.enterEditMode && editable.enterEditMode(); }, 50);
            } catch (err) { console.error('failed to enter inline edit:', err); }
        });

        delIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const ok = confirm('このストーリーを削除しますか？');
                if (!ok) return;
                const ev = new CustomEvent('storyDelete', { bubbles: true, composed: true, detail: { storyId: story.id } });
                card.dispatchEvent(ev);
                // 念のためグローバルにも通知（ShadowDOM越えの保険）
                window.dispatchEvent(new CustomEvent('storyDelete', { detail: { storyId: story.id } }));
            } catch (err) { console.error(err); }
        });

        [addBtn, upBtn, downBtn].forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                try {
                    if (btn.classList.contains('story-move-up') || btn.classList.contains('story-move-down')) {
                        const direction = btn.classList.contains('story-move-up') ? 'up' : 'down';
                        const ev = new CustomEvent('requestMoveStory', { bubbles: true, detail: { storyId: story.id, direction } });
                        card.dispatchEvent(ev);
                    } else {
                        const ev = new CustomEvent('requestAddStoryBelow', { bubbles: true, detail: { storyId: story.id } });
                        card.dispatchEvent(ev);
                    }
                } catch (err) { console.error(err); }
            });
        });

        // 絶対配置のため順序は任意
        card.appendChild(delIconBtn);
        card.appendChild(editBtn);
        card.appendChild(upBtn);
        card.appendChild(downBtn);
        card.appendChild(addBtn);
        card.appendChild(personaTag);
        card.appendChild(content);
        
        // クリックイベントを追加
        card.addEventListener('click', () => {
            this._showStoryDetail(story);
        });
        
        return card;
    }
    
    /**
     * ユーザーストーリーを解析
     * @private
     */
    static _parseUserStory(storyText) {
        // ペルソナはYAMLに含めない前提。万一含まれても除去。
        let text = storyText.replace(/^As\s+an?\s+[^,]+,\s*/i, '');
        
        // "I want" と "So that" を分解
        const wantMatch = text.match(/I\s+want\s+(.+?)(?:\s*,?\s*so\s+that\s+|$)/i);
        const soThatMatch = text.match(/so\s+that\s+(.+)$/i);
        
        let want = wantMatch ? wantMatch[1] : text;
        // 末尾の句読点・カンマ等を除去
        want = want.replace(/[\s,、，。]+$/g, '');
        
        return {
            want,
            soThat: soThatMatch ? soThatMatch[1] : null
        };
    }
    
    /**
     * ストーリー詳細を表示
     * @private
     */
    static _showStoryDetail(story) {
        // 詳細モーダルを作成
        const modal = document.createElement('div');
        modal.className = 'story-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>${this._escapeHtml(story.id)}</h3>
                <div class="modal-persona-tag">
                    <span class="story-tag" data-persona="${story.personaName}">${story.personaName}</span>
                </div>
                <div class="modal-story">
                    <p>${this._escapeHtml(story.story)}</p>
                    ${story.status ? `<div class="modal-status"><strong>ステータス:</strong> <span class="status-badge status-${story.status.toLowerCase()}">${story.status}</span></div>` : ''}
                </div>
                ${story.acceptance_criteria ? `
                <div class="modal-section">
                    <h4>受け入れ条件:</h4>
                    <ul>
                        ${story.acceptance_criteria.map(ac => `<li>${this._escapeHtml(ac)}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${story.ui_screens ? `
                <div class="modal-section">
                    <h4>関連画面:</h4>
                    <ul>
                        ${story.ui_screens.map(screen => `<li>${this._escapeHtml(screen)}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${story.code_refs ? `
                <div class="modal-section">
                    <h4>コード参照:</h4>
                    <ul>
                        ${story.code_refs.map(ref => `<li><code>${this._escapeHtml(ref)}</code></li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // クローズイベント
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // ペルソナタグの色を適用
        const tag = modal.querySelector('.story-tag');
        const color = PersonaTagColorMap.colorOf(story.personaName);
        tag.style.backgroundColor = color.bg;
        tag.style.color = color.fg;
    }
    
    /**
     * 空カードを作成（不可視プレースホルダー）
     * @private
     */
    static _createEmptyCard() {
        const card = document.createElement('div');
        card.className = 'card empty-card';
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        return card;
    }
    
    /**
     * HTMLエスケープ
     * @private
     */
    static _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default StoryMapRenderer;
