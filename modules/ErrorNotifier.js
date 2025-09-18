/**
 * ErrorNotifier - エラー通知を担当
 * Requirements: 7.1, 7.2
 */
class ErrorNotifier {
    /**
     * スキーマ検証エラーを表示
     * @param {Array<{path: string, message: string}>} errors - エラーリスト
     */
    static showErrors(errors) {
        const container = document.getElementById('mapContent');
        if (!container) {
            console.error('Error container not found');
            return;
        }
        
        let html = '<div class="error-banner">';
        html += '<h3>スキーマ検証エラー</h3>';
        html += '<p>YAMLデータに以下の問題が見つかりました。修正後、再読み込みしてください。</p>';
        html += '<ul class="error-list">';
        
        errors.forEach(error => {
            html += `<li><strong>${error.path}</strong>: ${error.message}</li>`;
        });
        
        html += '</ul>';
        html += '</div>';
        
        container.innerHTML = html;
        container.classList.remove('loading');
        container.classList.add('error');
    }
    
    /**
     * ランタイムエラーを表示
     * @param {string} message - エラーメッセージ
     * @param {string} [ref] - エラー識別子
     */
    static showRuntimeError(message, ref) {
        const container = document.getElementById('mapContent');
        if (!container) {
            console.error('Error container not found');
            return;
        }
        
        let html = '<div class="runtime-error-banner">';
        html += '<h3>エラーが発生しました</h3>';
        html += `<p>${message}</p>`;
        if (ref) {
            html += `<p class="error-ref">エラー識別子: ${ref}</p>`;
        }
        html += '<button onclick="location.reload()">ページを再読み込み</button>';
        html += '</div>';
        
        container.innerHTML = html;
        container.classList.remove('loading');
        container.classList.add('error');
        
        // コンソールにも出力
        console.error(`Runtime Error [${ref || 'no-ref'}]: ${message}`);
    }
    
    /**
     * エラーバナーをクリア
     */
    static clearErrors() {
        const container = document.getElementById('mapContent');
        if (container) {
            container.classList.remove('error');
            container.innerHTML = '';
        }
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default ErrorNotifier;
