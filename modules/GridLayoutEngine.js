/**
 * GridLayoutEngine - グリッドレイアウトの制御を担当
 * Requirements: 2.1, 2.3
 */
class GridLayoutEngine {
    /**
     * CSS Grid の列数を設定
     * @param {number} cols - 列数
     */
    static applyGridColumns(cols) {
        if (!cols || cols < 1 || !Number.isInteger(cols)) {
            throw new Error('Invalid column count: must be a positive integer');
        }
        
        console.log(`Setting grid columns to: ${cols}`);
        // :root に設定
        document.documentElement.style.setProperty('--cols', cols);
        // メインスクロール領域にも直接設定（反映の確実化）
        const mapContent = document.getElementById('mapContent');
        if (mapContent && mapContent.style) {
            mapContent.style.setProperty('--cols', cols);
        }
        // ラッパーおよび各レーンにも設定（フォールバック）
        const wrapper = document.querySelector('.story-map-wrapper');
        if (wrapper && wrapper instanceof HTMLElement) {
            wrapper.style.setProperty('--cols', cols);
        }
        document.querySelectorAll('.row-content').forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('--cols', cols);
            }
        });
    }
    
    /**
     * 左端ラベルをカード形式に変換
     */
    static applyLabelCardStyles() {
        const labels = document.querySelectorAll('.row-label');
        
        labels.forEach(label => {
            if (!label.classList.contains('label-card')) {
                label.classList.add('label-card');
                const text = label.textContent;
                label.innerHTML = `<div class="label-card-content">${text}</div>`;
            }
        });
    }
    
    /**
     * グリッド構造を初期化（列数設定＋ラベルカード化）
     * @param {number} columnCount - 列数
     */
    static setupGridStructure(columnCount) {
        this.applyGridColumns(columnCount);
        this.applyLabelCardStyles();
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default GridLayoutEngine;
