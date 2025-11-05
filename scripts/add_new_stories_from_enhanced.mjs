#!/usr/bin/env node
/**
 * add_new_stories_from_enhanced.mjs
 *
 * test-story-map.yaml に、enhanced YAML（palma_enhanced_story_map.yaml）の新規ストーリーを追加します。
 * - 新規Activities（ACT-06, ACT-07）とBackbones（BB-13, BB-14, BB-15）も不足していれば追加
 * - story_mapping に新規ストーリーのマッピングを追加
 * - personas_stories に P005, P006 を作成し、各storiesを status: TODO 付きで追加
 *
 * 使い方:
 *   node scripts/add_new_stories_from_enhanced.mjs \
 *     --base local_secrets/test-story-map.yaml \
 *     --enh /Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml \
 *     --in-place
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function ensureArray(obj) { return Array.isArray(obj) ? obj : []; }

function addIfMissingActivity(baseStruct, act) {
  const acts = ensureArray(baseStruct.activities);
  if (!acts.find(a => a.id === act.id)) {
    acts.push(act);
  }
  baseStruct.activities = acts;
}

function addIfMissingBackbone(baseStruct, bb) {
  const bbs = ensureArray(baseStruct.backbones);
  if (!bbs.find(b => b.id === bb.id)) {
    bbs.push(bb);
  }
  baseStruct.backbones = bbs;
}

function addOrUpdateStoryMapping(sm, id, mapping) {
  if (!sm.story_mapping || typeof sm.story_mapping !== 'object') sm.story_mapping = {};
  if (!sm.story_mapping[id]) sm.story_mapping[id] = {};
  sm.story_mapping[id].backbone_id = mapping.backbone_id;
  sm.story_mapping[id].sequence = mapping.sequence;
}

function personaKeyOfName(personas, fallbackKey, name) {
  // 既存に同名nameのペルソナがあればそのキーを返す。なければfallbackKey
  for (const [k, v] of Object.entries(personas)) {
    if (v?.name === name) return k;
  }
  return fallbackKey;
}

function main() {
  const args = process.argv.slice(2);
  const getArg = (key, d) => {
    const i = args.indexOf(key);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
  };
  const basePath = getArg('--base', 'local_secrets/test-story-map.yaml');
  const enhPath = getArg('--enh', '/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml');
  const inPlace = args.includes('--in-place');

  const baseText = fs.readFileSync(basePath, 'utf8');
  const base = yaml.load(baseText);
  const enh = yaml.load(fs.readFileSync(enhPath, 'utf8'));

  const smBase = base.integrated_story_map;
  const smEnh = enh.integrated_story_map;

  // 1) Activities と Backbones を補完
  const actsNeeded = (smEnh.story_map_structure?.activities || []).filter(a => ['ACT-06', 'ACT-07'].includes(a.id));
  actsNeeded.forEach(a => addIfMissingActivity(smBase.story_map_structure, a));

  const bbsNeeded = (smEnh.story_map_structure?.backbones || []).filter(b => ['BB-13','BB-14','BB-15'].includes(b.id));
  bbsNeeded.forEach(b => addIfMissingBackbone(smBase.story_map_structure, b));

  // 2) story_mapping を追加
  const newIds = [
    'ST-SEARCH-001','ST-DASH-CUSTOM-001','ST-AI-WF-OPT-001','ST-AI-CTX-SMART-001','ST-AI-DOC-AUTO-001',
    'ST-PERM-RBAC-001','ST-COLLAB-EXT-001','ST-INTEG-TOOLS-001','ST-API-FULL-001','ST-MOBILE-RESP-001',
    'ST-MONITOR-USAGE-001','ST-BACKUP-DR-001'
  ];
  for (const id of newIds) {
    const m = smEnh.story_mapping?.[id];
    if (m) addOrUpdateStoryMapping(smBase, id, m);
  }

  // 3) personas_stories に新規ストーリーを追加（status: TODO）
  if (!smBase.personas_stories || typeof smBase.personas_stories !== 'object') smBase.personas_stories = {};

  const addStoriesFromPersona = (enhPersonaKey, fallbackKey) => {
    const enhPersona = smEnh.enhanced_stories?.[enhPersonaKey];
    if (!enhPersona) return;
    const name = enhPersona.name;
    const role = enhPersona.role;
    const basePersonaKey = personaKeyOfName(smBase.personas_stories, fallbackKey, name);
    if (!smBase.personas_stories[basePersonaKey]) {
      smBase.personas_stories[basePersonaKey] = { name, role, stories: [] };
    }
    if (!Array.isArray(smBase.personas_stories[basePersonaKey].stories)) smBase.personas_stories[basePersonaKey].stories = [];

    const targetStories = smBase.personas_stories[basePersonaKey].stories;
    const existingIds = new Set(targetStories.map(s => s.id));

    enhPersona.stories.forEach(s => {
      if (existingIds.has(s.id)) return;
      const copy = {
        id: s.id,
        story: s.story,
        backbone_id: s.backbone_id,
        acceptance_criteria: s.acceptance_criteria || [],
        ui_screens: s.ui_screens || [],
        linked_modules: s.linked_modules || [],
        version: s.version,
        priority: s.priority,
        status: 'TODO'
      };
      targetStories.push(copy);
    });
  };

  // P005 -> fallback P005, P006 -> fallback P006（新規キーとして作成）
  addStoriesFromPersona('P005', 'P005');
  addStoriesFromPersona('P006', 'P006');

  const out = yaml.dump(base, { lineWidth: -1, noRefs: true });
  if (inPlace) {
    fs.writeFileSync(basePath + '.bak2', baseText, 'utf8');
    fs.writeFileSync(basePath, out, 'utf8');
    console.log(`Updated with new stories. Backup: ${basePath}.bak2`);
  } else {
    const outPath = basePath.replace(/\.ya?ml$/i, '.with_new_stories.yaml');
    fs.writeFileSync(outPath, out, 'utf8');
    console.log(`Wrote: ${outPath}`);
  }
}

main();
