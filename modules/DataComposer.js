/**
 * DataComposer - 描画用データの合成と表示制御を担当
 * Requirements: 2.2, 4.1, 4.2, 5.1
 */
class DataComposer {
    /**
     * YAMLデータを描画用の構造に変換
     * @param {Object} data - 検証済みのYAMLデータ
     * @returns {Object} 描画用データ構造
     */
    static compose(data) {
        const storyMap = data.integrated_story_map;
        const structure = storyMap.story_map_structure;
        
        // バックボーンを取得
        const backboneMap = new Map(structure.backbones.map(b => [b.id, b]));
        let columns;
        
        // display_orderがある場合はそれを使用、なければsequence順
        if (storyMap.display_order?.backbones) {
            columns = storyMap.display_order.backbones
                .map(id => backboneMap.get(id))
                .filter(Boolean); // 存在しないIDを除外
        } else {
            columns = [...structure.backbones].sort((a, b) => a.sequence - b.sequence);
        }
        
        // アクティビティを列に対応させる
        const activityMap = new Map(structure.activities.map(a => [a.id, a]));
        const activityByColumn = columns.map(backbone => activityMap.get(backbone.activity_id));
        
        // バックボーンIDと列インデックスのマップ
        const columnIndexMap = new Map();
        columns.forEach((backbone, index) => {
            columnIndexMap.set(backbone.id, index);
        });
        
        // すべてのストーリーを収集してグリッドに配置
        const allStories = [];
        
        // 各ペルソナのストーリーを収集
        Object.entries(storyMap.personas_stories).forEach(([personaKey, persona]) => {
            if (persona.stories) {
                persona.stories.forEach(story => {
                    allStories.push({
                        ...story,
                        personaName: persona.name,
                        personaKey: personaKey,
                        colIndex: columnIndexMap.get(story.backbone_id)
                    });
                });
            }
        });
        
        // 共通（クロスペルソナ）ストーリーも描画対象に含める
        if (Array.isArray(storyMap.cross_persona_stories)) {
            storyMap.cross_persona_stories.forEach(story => {
                allStories.push({
                    ...story,
                    personaName: '全ユーザー',
                    personaKey: 'CROSS',
                    colIndex: columnIndexMap.get(story.backbone_id)
                });
            });
        }
        
        // ストーリーのグリッド配置（Versionごとにグループ化し、水平スライスを引けるように）
        const { rows, slices } = this._arrangeStoriesInGridByVersion(allStories, columns.length, data.integrated_story_map?.story_mapping || {});
        
        console.log(`DataComposer: Total columns = ${columns.length}`);
        // 編集用に全ペルソナ候補をグローバルへ渡す（key/nameの配列）
        try {
            window.__storyMapPersonas__ = Object.entries(storyMap.personas_stories).map(([key, p]) => ({ key, name: p.name }));
            // バージョン選択肢
            const orderFromYaml = (typeof DataComposer._lastYaml === 'object' &&
                Array.isArray(DataComposer._lastYaml.integrated_story_map?.version_definitions?.order))
                ? DataComposer._lastYaml.integrated_story_map.version_definitions.order
                : ['MVP', 'Release1', 'Release2', 'v1.0', 'v2.0', 'Future'];
            window.__storyMapVersionOrder__ = orderFromYaml;
            // バックボーン選択肢
            window.__storyMapBackbones__ = columns.map(b => ({ id: b.id, name: b.name }));
            // アクティビティ選択肢
            window.__storyMapActivities__ = (structure.activities || []).map(a => ({ id: a.id, name: a.name }));
        } catch {}
        return {
            columns,
            activityByColumn,
            rows,
            slices,
            personas: storyMap.personas_stories
        };
    }
    
    /**
     * ストーリーをグリッドに配置（重複を避ける）
     * @private
     */
    static _arrangeStoriesInGridByVersion(stories, columnCount, storyMapping) {
        const rows = [];
        const slices = []; // 区切り線を挿入するrowIndexの配列（先頭行は含めない）

        // Versionの順序を決定
        // YAMLのversion_definitions.order を優先的に採用
        const orderFromYaml = (typeof DataComposer._lastYaml === 'object' &&
            Array.isArray(DataComposer._lastYaml.integrated_story_map?.version_definitions?.order))
            ? DataComposer._lastYaml.integrated_story_map.version_definitions.order
            : null;
        const defaultOrder = ['MVP', 'Release1', 'Release2', 'v1.0', 'v2.0', 'Future'];
        const versionOrderPref = orderFromYaml || defaultOrder;
        const versionsInData = Array.from(new Set(stories.map(s => s.version || 'MVP')));
        const versionOrder = versionsInData.sort((a, b) => {
            const ia = versionOrderPref.indexOf(a);
            const ib = versionOrderPref.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        });

        // 列ごとの最終使用行
        const columnOccupied = new Array(columnCount).fill(-1);

        let isFirstVersion = true;
        versionOrder.forEach(version => {
            const storiesOfVersion = stories
                .filter(s => (s.version || 'MVP') === version)
                .sort((a, b) => {
                    if (a.colIndex !== b.colIndex) return a.colIndex - b.colIndex;
                    // 同一列内は backbone_x_version_sort → story_mapping.sequence → id
                    const aMap = storyMapping?.[a.id] || {};
                    const bMap = storyMapping?.[b.id] || {};
                    const aKey = (typeof a.backbone_x_version_sort === 'number') ? a.backbone_x_version_sort : (typeof aMap.sequence === 'number' ? aMap.sequence : Number.MAX_SAFE_INTEGER);
                    const bKey = (typeof b.backbone_x_version_sort === 'number') ? b.backbone_x_version_sort : (typeof bMap.sequence === 'number' ? bMap.sequence : Number.MAX_SAFE_INTEGER);
                    if (aKey !== bKey) return aKey - bKey;
                    return a.id.localeCompare(b.id);
                });

            // このVersionは新しい行から開始する
            const startRow = Math.max(0, Math.max(...columnOccupied) + 1);
            if (!isFirstVersion) {
                // 次のVersion開始位置に区切り線を入れる
                slices.push(startRow);
            }
            isFirstVersion = false;

            storiesOfVersion.forEach(story => {
                if (story.colIndex === undefined) return;
                // 対象列の次の行、かつ startRow 以上
                let targetRow = Math.max(columnOccupied[story.colIndex] + 1, startRow);
                while (rows.length <= targetRow) {
                    rows.push(new Array(columnCount).fill(null));
                }
                rows[targetRow][story.colIndex] = story;
                columnOccupied[story.colIndex] = targetRow;
            });
        });

        return { rows, slices };
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default DataComposer;
