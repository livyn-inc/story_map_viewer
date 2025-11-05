/**
 * SchemaValidator - YAMLスキーマの検証を担当
 * Requirements: 1.1, 1.2, 1.3
 */
class SchemaValidator {
    /**
     * YAMLデータのスキーマを検証
     * @param {Object} data - 検証対象のYAMLデータ
     * @returns {Array<{path: string, message: string}>} エラーリスト
     */
    static validate(data) {
        const errors = [];
        
        // Root structure check
        if (!data || !data.integrated_story_map) {
            errors.push({
                path: 'root',
                message: 'integrated_story_map が存在しません'
            });
            return errors;
        }
        
        const storyMap = data.integrated_story_map;
        // プロジェクト名の検証（Viewer表示用）
        const projectName = storyMap.meta?.project_name || storyMap.project_info?.name;
        if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
            errors.push({ path: 'integrated_story_map.meta.project_name', message: 'プロジェクト名（meta.project_name または project_info.name）が必須です' });
        }
        
        // story_map_structure check
        if (!storyMap.story_map_structure) {
            errors.push({
                path: 'integrated_story_map',
                message: 'story_map_structure が存在しません'
            });
            return errors;
        }
        
        const structure = storyMap.story_map_structure;
        const versionDefs = storyMap.version_definitions || {};
        const versionOrder = Array.isArray(versionDefs.order) ? versionDefs.order : null;
        
        // Validate activities
        if (!structure.activities || !Array.isArray(structure.activities)) {
            errors.push({
                path: 'story_map_structure',
                message: 'activities が存在しないか配列ではありません'
            });
        } else {
            const seenAct = new Set();
            structure.activities.forEach((activity, index) => {
                if (!activity.id) {
                    errors.push({
                        path: `activities[${index}]`,
                        message: '必須キー "id" が存在しません'
                    });
                }
                if (!activity.name) {
                    errors.push({
                        path: `activities[${index}]`,
                        message: '必須キー "name" が存在しません'
                    });
                }
                if (activity.id) {
                    if (seenAct.has(activity.id)) {
                        errors.push({ path: `activities[${index}].id`, message: `重複した activity id "${activity.id}"` });
                    } else {
                        seenAct.add(activity.id);
                    }
                }
            });
        }
        
        // Validate backbones
        const activityIds = new Set();
        if (structure.activities) {
            structure.activities.forEach(a => activityIds.add(a.id));
        }
        
        if (!structure.backbones || !Array.isArray(structure.backbones)) {
            errors.push({
                path: 'story_map_structure',
                message: 'backbones が存在しないか配列ではありません'
            });
        } else {
            const seenBB = new Set();
            structure.backbones.forEach((backbone, index) => {
                if (!backbone.id) {
                    errors.push({
                        path: `backbones[${index}]`,
                        message: '必須キー "id" が存在しません'
                    });
                }
                if (!backbone.name) {
                    errors.push({
                        path: `backbones[${index}]`,
                        message: '必須キー "name" が存在しません'
                    });
                }
                if (!backbone.hasOwnProperty('sequence')) {
                    errors.push({
                        path: `backbones[${index}]`,
                        message: '必須キー "sequence" が存在しません'
                    });
                } else if (typeof backbone.sequence !== 'number' || !Number.isInteger(backbone.sequence) || backbone.sequence < 1) {
                    errors.push({ path: `backbones[${index}].sequence`, message: 'sequence は 1 以上の整数で指定してください' });
                }
                if (!backbone.activity_id) {
                    errors.push({
                        path: `backbones[${index}]`,
                        message: '必須キー "activity_id" が存在しません'
                    });
                } else if (!activityIds.has(backbone.activity_id)) {
                    errors.push({
                        path: `backbones[${index}].activity_id`,
                        message: `activity_id "${backbone.activity_id}" が activities.id に一致しません`
                    });
                }
                if (backbone.id) {
                    if (seenBB.has(backbone.id)) {
                        errors.push({ path: `backbones[${index}].id`, message: `重複した backbone id "${backbone.id}"` });
                    } else {
                        seenBB.add(backbone.id);
                    }
                }
            });
        }
        
        // Validate stories
        const backboneIds = new Set();
        if (structure.backbones) {
            structure.backbones.forEach(b => backboneIds.add(b.id));
        }
        
        const storyIds = new Set();
        if (!storyMap.personas_stories || typeof storyMap.personas_stories !== 'object') {
            errors.push({ path: 'integrated_story_map.personas_stories', message: 'personas_stories が存在しないか不正です' });
        } else {
            Object.entries(storyMap.personas_stories).forEach(([personaKey, persona]) => {
                if (!persona || typeof persona !== 'object') {
                    errors.push({ path: `personas_stories.${personaKey}`, message: 'persona 定義が不正です' });
                    return;
                }
                if (!persona.name || typeof persona.name !== 'string' || persona.name.trim().length === 0) {
                    errors.push({ path: `personas_stories.${personaKey}.name`, message: '必須キー "name" が存在しません' });
                }
                // Validate legacy mvp_priority_* arrays (backward compatibility)
                if (Array.isArray(persona.mvp_priority_1)) {
                    persona.mvp_priority_1.forEach((story, index) => {
                        this._validateStory(story, `personas_stories.${personaKey}.mvp_priority_1[${index}]`, backboneIds, errors, versionOrder, storyIds);
                    });
                }
                if (Array.isArray(persona.mvp_priority_2)) {
                    persona.mvp_priority_2.forEach((story, index) => {
                        this._validateStory(story, `personas_stories.${personaKey}.mvp_priority_2[${index}]`, backboneIds, errors, versionOrder, storyIds);
                    });
                }

                // Validate current stories array used by Viewer
                if (Array.isArray(persona.stories)) {
                    persona.stories.forEach((story, index) => {
                        this._validateStory(story, `personas_stories.${personaKey}.stories[${index}]`, backboneIds, errors, versionOrder, storyIds);
                    });
                } else if (persona.stories !== undefined && !Array.isArray(persona.stories)) {
                    errors.push({ path: `personas_stories.${personaKey}.stories`, message: 'stories は配列である必要があります' });
                }
            });
        }

        // cross_persona_stories (optional) - validate if present
        if (Array.isArray(storyMap.cross_persona_stories)) {
            storyMap.cross_persona_stories.forEach((story, index) => {
                this._validateStory(story, `cross_persona_stories[${index}]`, backboneIds, errors, versionOrder, storyIds);
            });
        }

        // display_order.backbones の整合チェック（任意）
        if (storyMap.display_order && Array.isArray(storyMap.display_order.backbones)) {
            const order = storyMap.display_order.backbones;
            const seen = new Set();
            order.forEach((id, i) => {
                if (!backboneIds.has(id)) {
                    errors.push({ path: `display_order.backbones[${i}]`, message: `未知のbackbone id "${id}"` });
                }
                if (seen.has(id)) errors.push({ path: `display_order.backbones[${i}]`, message: `display_order に重複id "${id}"` });
                seen.add(id);
            });
            
            // すべてのBackboneがdisplay_orderに含まれているかチェック
            const missingBackbones = Array.from(backboneIds).filter(id => !seen.has(id));
            if (missingBackbones.length > 0) {
                errors.push({
                    path: 'display_order.backbones',
                    message: `display_order に含まれていない backbone が ${missingBackbones.length} 個あります: ${missingBackbones.join(', ')}。これらのBackboneに属するストーリーはViewerで表示されません。`
                });
            }
        }

        // story_mapping の整合チェック（任意）
        if (storyMap.story_mapping && typeof storyMap.story_mapping === 'object') {
            Object.entries(storyMap.story_mapping).forEach(([sid, conf]) => {
                if (!storyIds.has(sid)) {
                    errors.push({ path: `story_mapping.${sid}`, message: `story_mapping が未知のID "${sid}" を参照しています` });
                }
                if (!conf || typeof conf !== 'object') return;
                if (!conf.backbone_id || !backboneIds.has(conf.backbone_id)) {
                    errors.push({ path: `story_mapping.${sid}.backbone_id`, message: `backbone_id が不正です` });
                }
                if (conf.sequence !== undefined && (typeof conf.sequence !== 'number' || !Number.isInteger(conf.sequence) || conf.sequence < 1)) {
                    errors.push({ path: `story_mapping.${sid}.sequence`, message: 'sequence は 1 以上の整数で指定してください' });
                }
            });
        }
        
        return errors;
    }
    
    /**
     * 個別のストーリーを検証
     * @private
     */
    static _validateStory(story, path, backboneIds, errors, versionOrder, storyIds) {
        if (!story.id) {
            errors.push({
                path: path,
                message: '必須キー "id" が存在しません'
            });
        } else if (storyIds) {
            if (storyIds.has(story.id)) {
                errors.push({ path, message: `重複した story id "${story.id}"` });
            } else {
                storyIds.add(story.id);
            }
        }
        if (!story.story) {
            errors.push({
                path: path,
                message: '必須キー "story" が存在しません'
            });
        }
        if (!story.backbone_id) {
            errors.push({
                path: path,
                message: '必須キー "backbone_id" が存在しません'
            });
        } else if (!backboneIds.has(story.backbone_id)) {
            errors.push({
                path: `${path}.backbone_id`,
                message: `backbone_id "${story.backbone_id}" が backbones.id に一致しません`
            });
        }
        
        // status項目のバリデーション
        if (story.status) {
            const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
            if (!validStatuses.includes(story.status)) {
                errors.push({
                    path: `${path}.status`,
                    message: `status "${story.status}" は有効な値ではありません。有効な値: ${validStatuses.join(', ')}`
                });
            }
        }

        // version の検証（任意）
        if (story.version !== undefined) {
            if (versionOrder && !versionOrder.includes(story.version)) {
                errors.push({ path: `${path}.version`, message: `version "${story.version}" は version_definitions.order に存在しません` });
            }
        }

        // 並び順（backbone x version）のバリデーション（任意）
        if (story.hasOwnProperty('backbone_x_version_sort')) {
            const v = story.backbone_x_version_sort;
            if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
                errors.push({
                    path: `${path}.backbone_x_version_sort`,
                    message: 'backbone_x_version_sort は 1 以上の整数で指定してください'
                });
            }
        }
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default SchemaValidator;
