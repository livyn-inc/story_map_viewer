/**
 * PersonaLegend - ペルソナ凡例の描画を担当
 * Requirements: 6.1
 */
import PersonaTagColorMap from './PersonaTagColorMap.js';

class PersonaLegend {
    /**
     * ペルソナ凡例をマウント
     * @param {HTMLElement} container - 凡例を描画するコンテナ
     */
    static legendMount(container) {
        if (!container) {
            console.error('Legend container not found');
            return;
        }
        
        const personas = [
            '組織管理者',
            'プロジェクト利用者',
            'AIアシスタント利用者',
            '認証ユーザー',
            '全ユーザー'
        ];
        
        container.innerHTML = '';
        
        // 凡例タイトル
        const title = document.createElement('div');
        title.className = 'legend-title';
        title.textContent = 'ペルソナ:';
        container.appendChild(title);
        
        // ペルソナチップを生成
        personas.forEach(persona => {
            const chip = this._createPersonaChip(persona);
            container.appendChild(chip);
        });
    }
    
    /**
     * ペルソナチップを作成
     * @private
     */
    static _createPersonaChip(persona) {
        const chip = document.createElement('div');
        chip.className = 'persona-chip';
        
        const color = PersonaTagColorMap.colorOf(persona);
        chip.style.backgroundColor = color.bg;
        chip.style.color = color.fg;
        
        const dot = document.createElement('span');
        dot.className = 'chip-dot';
        dot.style.backgroundColor = color.bg;
        
        const label = document.createElement('span');
        label.className = 'chip-label';
        label.textContent = persona;
        
        chip.appendChild(dot);
        chip.appendChild(label);
        
        return chip;
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default PersonaLegend;
