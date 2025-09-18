/**
 * YamlLoader - YAML読込とパースを担当
 * Requirements: 7.2
 */
class YamlLoader {
    /**
     * YAMLファイルを読み込んでパースする
     * @param {string} path - YAMLファイルへのパス
     * @returns {Promise<Object>} パースされたYAMLデータ
     * @throws {Error} 読込またはパースエラー
     */
    static async loadYaml(path) {
        let response;
        
        try {
            response = await fetch(path);
        } catch (error) {
            // ネットワークエラー時はランタイムエラーを通知
            if (typeof ErrorNotifier !== 'undefined') {
                ErrorNotifier.showRuntimeError(
                    'YAMLファイルの読み込みに失敗しました。ページを再読み込みしてください。',
                    `fetch-error-${Date.now()}`
                );
            }
            throw new Error('YAMLファイルの読み込みに失敗しました');
        }
        
        if (!response.ok) {
            if (typeof ErrorNotifier !== 'undefined') {
                ErrorNotifier.showRuntimeError(
                    'YAMLファイルの読み込みに失敗しました。ページを再読み込みしてください。',
                    `http-error-${response.status}`
                );
            }
            throw new Error('YAMLファイルの読み込みに失敗しました');
        }
        
        const yamlText = await response.text();
        
        try {
            // js-yamlを使用してパース
            const data = window.jsyaml.load(yamlText);
            return data;
        } catch (parseError) {
            // パースエラー時もランタイムエラーを通知
            if (typeof ErrorNotifier !== 'undefined') {
                ErrorNotifier.showRuntimeError(
                    'YAML解析エラーが発生しました。ファイルの形式を確認してください。',
                    `parse-error-${Date.now()}`
                );
            }
            throw new Error('YAML解析エラー');
        }
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default YamlLoader;
