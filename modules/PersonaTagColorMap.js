/**
 * PersonaTagColorMap - ペルソナと色のマッピングを担当
 * Requirements: 6.1, 6.2
 */
class PersonaTagColorMap {
    /**
     * ペルソナ名から安定的に色を生成（HSL）
     * - 名前をハッシュ化 → 0-359 の Hue にマップ
     * - 彩度・輝度は固定（視認性重視）
     */
    static colorOf(persona) {
        const name = (persona || '').toString();
        if (!name) {
            return { bg: '#7f8c8d', fg: '#ffffff' };
        }
        const hue = this.#hashToHue(name);
        const bg = `hsl(${hue}, 60%, 45%)`;
        const fg = '#ffffff';
        return { bg, fg };
    }

    /**
     * 文字列ハッシュ → Hue(0-359)
     * @private
     */
    static #hashToHue(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // 32bit int
        }
        const hue = Math.abs(hash) % 360;
        return hue;
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default PersonaTagColorMap;
