/**
 * EditSession - 画面内の編集内容をステージングし、保存時にYAMLへ反映する
 */
class EditSession {
  constructor() {
    this.reset();
  }

  reset() {
    // 追加された新規ストーリー（ID -> story obj）
    this.added = new Map();
    // 更新された既存ストーリー（ID -> partial updated fields）
    this.updated = new Map();
    // 削除予定のストーリーID
    this.deleted = new Set();
    // 位置変更（ID -> { backbone_id, version, sequence }）
    this.position = new Map();
    // 内部カウンタ
    this._draftCounter = 0;
  }

  /** 新規ドラフトストーリーを作成し、ステージング */
  createDraftStory({ personas, backbone_id, version }) {
    const personaEntries = Object.entries(personas || {});
    const [firstKey, firstPersona] = personaEntries[0] || ['P001', { name: 'Draft Persona', stories: [] }];
    const id = `DRAFT-${Date.now()}-${++this._draftCounter}`;

    const story = {
      id,
      story: 'I want , So that ',
      backbone_id,
      version: version || 'MVP',
      priority: 3,
      acceptance_criteria: [],
      status: 'TODO',
      backbone_x_version_sort: 0
    };

    this.added.set(id, { story, personaKey: firstKey });
    // 最下段に配置（sequenceはapply時に確定）
    this.position.set(id, { backbone_id, version: story.version, sequence: Infinity });
    return story;
  }

  /** 既存ストーリーの更新（InlineEditorから呼ぶ）*/
  stageUpdate(storyId, updatedData) {
    const prev = this.updated.get(storyId) || {};
    this.updated.set(storyId, { ...prev, ...updatedData });
  }

  /** 削除をステージング */
  stageDelete(storyId) {
    // 追加直後のドラフトなら追加リストから除外
    if (this.added.has(storyId)) {
      this.added.delete(storyId);
      this.position.delete(storyId);
      return;
    }
    this.deleted.add(storyId);
  }

  /** 並び替え・移動のステージング */
  stageMove(storyId, { backbone_id, version, sequence }) {
    const prev = this.position.get(storyId) || {};
    this.position.set(storyId, { ...prev, backbone_id, version, sequence });
  }

  /** プレビュー用に、元データへステージング変更を適用したディープコピーを返す */
  buildPreviewData(baseData) {
    const data = JSON.parse(JSON.stringify(baseData));
    const ism = data.integrated_story_map;
    if (!ism) return data;

    // 1) 削除を適用
    if (this.deleted.size > 0) {
      Object.values(ism.personas_stories || {}).forEach(p => {
        p.stories = (p.stories || []).filter(s => !this.deleted.has(s.id));
      });
      if (ism.story_mapping) {
        Object.keys(ism.story_mapping).forEach(id => {
          if (this.deleted.has(id)) delete ism.story_mapping[id];
        });
      }
    }

    // 2) 追加を適用
    this.added.forEach(({ story, personaKey }) => {
      if (!ism.personas_stories[personaKey]) {
        ism.personas_stories[personaKey] = { name: personaKey, role: '', stories: [] };
      }
      ism.personas_stories[personaKey].stories = ism.personas_stories[personaKey].stories || [];
      // 既に存在しない場合のみpush
      if (!ism.personas_stories[personaKey].stories.find(s => s.id === story.id)) {
        ism.personas_stories[personaKey].stories.push(story);
      }
      ism.story_mapping = ism.story_mapping || {};
      // sequence は一時的に大きな数値で末尾に（後段で正規化）
      ism.story_mapping[story.id] = { backbone_id: story.backbone_id, sequence: 9999 };
    });

    // 3) 更新を適用
    this.updated.forEach((upd, id) => {
      // personas の中から該当を探して更新
      Object.values(ism.personas_stories || {}).forEach(p => {
        const idx = (p.stories || []).findIndex(s => s.id === id);
        if (idx >= 0) {
          p.stories[idx] = { ...p.stories[idx], ...upd };
        }
      });
    });

    // 4) 位置変更を適用（story_mappingを更新）
    ism.story_mapping = ism.story_mapping || {};
    this.position.forEach((pos, id) => {
      const map = ism.story_mapping[id] || {};
      ism.story_mapping[id] = { ...map, backbone_id: pos.backbone_id || map.backbone_id, sequence: pos.sequence ?? map.sequence };
      if (pos.version) {
        // Versionの移動はストーリーデータ側のversionを更新
        Object.values(ism.personas_stories || {}).forEach(p => {
          const s = (p.stories || []).find(st => st.id === id);
          if (s) s.version = pos.version;
        });
      }
    });

    // 5) 各バックボーン列でsequenceの正規化（小さい順に1..n）
    const mappingByBackbone = {};
    Object.entries(ism.story_mapping || {}).forEach(([id, conf]) => {
      const bb = conf.backbone_id;
      if (!bb) return;
      (mappingByBackbone[bb] = mappingByBackbone[bb] || []).push({ id, seq: conf.sequence ?? 9999 });
    });
    Object.values(mappingByBackbone).forEach(list => {
      list.sort((a, b) => (a.seq - b.seq));
      list.forEach((item, i) => {
        ism.story_mapping[item.id].sequence = i + 1;
        // story側の backbone_x_version_sort も同期
        Object.values(ism.personas_stories || {}).forEach(p => {
          const s = (p.stories || []).find(st => st.id === item.id);
          if (s) s.backbone_x_version_sort = i + 1;
        });
        if (Array.isArray(ism.cross_persona_stories)) {
          const s2 = ism.cross_persona_stories.find(st => st.id === item.id);
          if (s2) s2.backbone_x_version_sort = i + 1;
        }
      });
    });

    return data;
  }

  /** 保存（YAML文字列を返す） */
  buildCommittedYaml(baseData) {
    const preview = this.buildPreviewData(baseData);
    if (!window.jsyaml) throw new Error('js-yaml not loaded');
    return window.jsyaml.dump(preview, { lineWidth: -1, noRefs: true });
  }
}

export default new EditSession();
