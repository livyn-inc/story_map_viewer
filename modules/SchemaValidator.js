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
        
        // story_map_structure check
        if (!storyMap.story_map_structure) {
            errors.push({
                path: 'integrated_story_map',
                message: 'story_map_structure が存在しません'
            });
            return errors;
        }
        
        const structure = storyMap.story_map_structure;
        
        // Validate activities
        if (!structure.activities || !Array.isArray(structure.activities)) {
            errors.push({
                path: 'story_map_structure',
                message: 'activities が存在しないか配列ではありません'
            });
        } else {
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
            });
        }
        
        // Validate stories
        const backboneIds = new Set();
        if (structure.backbones) {
            structure.backbones.forEach(b => backboneIds.add(b.id));
        }
        
        if (storyMap.personas_stories) {
            Object.entries(storyMap.personas_stories).forEach(([personaKey, persona]) => {
                // Validate mvp_priority_1 stories
                if (persona.mvp_priority_1 && Array.isArray(persona.mvp_priority_1)) {
                    persona.mvp_priority_1.forEach((story, index) => {
                        this._validateStory(story, `personas_stories.${personaKey}.mvp_priority_1[${index}]`, backboneIds, errors);
                    });
                }
                
                // Validate mvp_priority_2 stories
                if (persona.mvp_priority_2 && Array.isArray(persona.mvp_priority_2)) {
                    persona.mvp_priority_2.forEach((story, index) => {
                        this._validateStory(story, `personas_stories.${personaKey}.mvp_priority_2[${index}]`, backboneIds, errors);
                    });
                }
            });
        }
        
        return errors;
    }
    
    /**
     * 個別のストーリーを検証
     * @private
     */
    static _validateStory(story, path, backboneIds, errors) {
        if (!story.id) {
            errors.push({
                path: path,
                message: '必須キー "id" が存在しません'
            });
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
    }
}

// Export for ES6 modules (if used)
// ES6 export
export default SchemaValidator;
