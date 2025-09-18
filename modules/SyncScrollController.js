/**
 * SyncScrollController - 行間同期スクロールを担当
 * Requirements: 3.1, 3.2
 */
class SyncScrollController {
    /**
     * 複数のスクロールコンテナを同期
     * @param {HTMLElement[]} containers - 同期対象のコンテナ配列
     */
    static bindSynchronizedScroll(containers) {
        if (!containers || containers.length < 2) {
            return; // 同期する必要がない
        }
        
        let isScrolling = false;
        
        containers.forEach(container => {
            container.addEventListener('scroll', (event) => {
                if (isScrolling) return; // 循環を防ぐ
                
                isScrolling = true;
                const scrollLeft = event.target.scrollLeft;
                
                // 他のすべてのコンテナのscrollLeftを同期
                containers.forEach(otherContainer => {
                    if (otherContainer !== event.target) {
                        otherContainer.scrollLeft = scrollLeft;
                    }
                });
                
                // 次のイベントループで解除
                requestAnimationFrame(() => {
                    isScrolling = false;
                });
            }, { passive: true }); // パフォーマンス最適化
        });
    }
    
    /**
     * 同期を解除（必要に応じて）
     * @param {HTMLElement[]} containers - 解除対象のコンテナ配列
     */
    static unbindSynchronizedScroll(containers) {
        // Note: イベントリスナーの削除にはremoveEventListenerが必要だが、
        // 匿名関数を使用しているため、現在の実装では削除できない。
        // 必要であれば、WeakMapを使用してリスナーを管理する必要がある。
        console.warn('unbindSynchronizedScroll is not implemented in current version');
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default SyncScrollController;
