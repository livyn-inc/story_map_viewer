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
            const card = this._createActivityCard(activity);
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
    static _createActivityCard(activity) {
        const card = document.createElement('div');
        card.className = 'card activity-card';
        card.innerHTML = `
            <h3>${this._escapeHtml(activity.name)}</h3>
            ${activity.description ? `<p>${this._escapeHtml(activity.description)}</p>` : ''}
        `;
        return card;
    }
    
    /**
     * バックボーンカードを作成
     * @private
     */
    static _createBackboneCard(backbone) {
        const card = document.createElement('div');
        card.className = 'card backbone-card';
        card.innerHTML = `
            <h4>${this._escapeHtml(backbone.name)}</h4>
            ${backbone.description ? `<p>${this._escapeHtml(backbone.description)}</p>` : ''}
        `;
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
