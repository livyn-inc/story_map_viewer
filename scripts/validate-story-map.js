#!/usr/bin/env node
/*
 * StoryMap YAML Validator (CLI)
 * - Validate integrated_story_map v2 structure
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import yaml from 'js-yaml';

/** Collect .yaml/.yml files from args (files or directories) */
function collectTargets(args) {
  const results = new Set();
  const isYaml = (p) => p.endsWith('.yaml') || p.endsWith('.yml');

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (isYaml(p)) results.add(p);
    }
  }

  if (args.length === 0) {
    const ex = path.join(process.cwd(), 'examples');
    if (fs.existsSync(ex)) walk(ex);
    return Array.from(results);
  }

  for (const a of args) {
    const p = path.resolve(a);
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (stat.isFile() && isYaml(p)) results.add(p);
  }
  return Array.from(results);
}

/** Schema validation producing an array of {path, message} */
function validateSchema(data) {
  const errors = [];
  const add = (pathStr, msg) => errors.push({ path: pathStr, message: msg });

  if (!data || typeof data !== 'object') {
    add('root', 'YAML ルートがオブジェクトではありません');
    return errors;
  }

  const sm = data.integrated_story_map;
  if (!sm) {
    add('root', 'integrated_story_map が存在しません');
    return errors;
  }

  const struct = sm.story_map_structure;
  if (!struct) {
    add('integrated_story_map', 'story_map_structure が存在しません');
    return errors;
  }

  // activities
  if (!Array.isArray(struct.activities) || struct.activities.length === 0) {
    add('story_map_structure.activities', 'activities は非空配列である必要があります');
  }
  const activityIds = new Set();
  (struct.activities || []).forEach((a, i) => {
    if (!a?.id) add(`activities[${i}]`, '必須キー "id"');
    else activityIds.add(a.id);
    if (!a?.name) add(`activities[${i}]`, '必須キー "name"');
  });

  // backbones
  if (!Array.isArray(struct.backbones) || struct.backbones.length === 0) {
    add('story_map_structure.backbones', 'backbones は非空配列である必要があります');
  }
  const backboneIds = new Set();
  (struct.backbones || []).forEach((b, i) => {
    if (!b?.id) add(`backbones[${i}]`, '必須キー "id"');
    else backboneIds.add(b.id);
    if (!b?.name) add(`backbones[${i}]`, '必須キー "name"');
    if (b?.sequence === undefined) add(`backbones[${i}]`, '必須キー "sequence"');
    if (!b?.activity_id) add(`backbones[${i}]`, '必須キー "activity_id"');
    else if (!activityIds.has(b.activity_id)) add(`backbones[${i}].activity_id`, `未知の activity_id "${b.activity_id}"`);
  });

  // personas_stories
  if (sm.personas_stories && typeof sm.personas_stories === 'object') {
    for (const [pKey, persona] of Object.entries(sm.personas_stories)) {
      const stories = persona?.stories || [];
      if (!Array.isArray(stories)) {
        add(`personas_stories.${pKey}.stories`, 'stories は配列である必要があります');
        continue;
      }
      stories.forEach((s, si) => {
        const base = `personas_stories.${pKey}.stories[${si}]`;
        if (!s?.id) add(base, '必須キー "id"');
        if (!s?.story) add(base, '必須キー "story" (I want …, So that …)');
        if (!s?.backbone_id) add(base, '必須キー "backbone_id"');
        else if (!backboneIds.has(s.backbone_id)) add(`${base}.backbone_id`, `未知の backbone_id "${s.backbone_id}"`);
        if (s?.priority !== undefined && (s.priority < 1 || s.priority > 5)) {
          add(`${base}.priority`, 'priority は 1-5 の数値');
        }
      });
    }
  } else {
    add('integrated_story_map.personas_stories', 'personas_stories が存在しません');
  }

  // cross_persona_stories
  if (Array.isArray(sm.cross_persona_stories)) {
    sm.cross_persona_stories.forEach((s, i) => {
      const base = `cross_persona_stories[${i}]`;
      if (!s?.id) add(base, '必須キー "id"');
      if (!s?.story) add(base, '必須キー "story"');
      if (!s?.backbone_id) add(base, '必須キー "backbone_id"');
      else if (!backboneIds.has(s.backbone_id)) add(`${base}.backbone_id`, `未知の backbone_id "${s.backbone_id}"`);
    });
  }

  // display_order.backbones
  if (sm.display_order?.backbones) {
    (sm.display_order.backbones || []).forEach((bb, i) => {
      if (!backboneIds.has(bb)) add(`display_order.backbones[${i}]`, `未知の backbone_id "${bb}"`);
    });
  }

  // story_mapping
  if (sm.story_mapping && typeof sm.story_mapping === 'object') {
    for (const [sid, conf] of Object.entries(sm.story_mapping)) {
      if (!conf?.backbone_id) add(`story_mapping.${sid}`, '必須キー "backbone_id"');
      else if (!backboneIds.has(conf.backbone_id)) add(`story_mapping.${sid}.backbone_id`, `未知の backbone_id "${conf.backbone_id}"`);
      if (conf?.sequence === undefined) add(`story_mapping.${sid}`, '必須キー "sequence"');
    }
  }

  return errors;
}

function main() {
  const targets = collectTargets(process.argv.slice(2));
  if (targets.length === 0) {
    console.error('検証対象のYAMLが見つかりません。引数でファイル/ディレクトリを指定してください。');
    process.exit(2);
  }

  let totalErrors = 0;
  for (const file of targets) {
    try {
      const text = fs.readFileSync(file, 'utf-8');
      const data = yaml.load(text, { filename: file });
      const errs = validateSchema(data);
      if (errs.length) {
        totalErrors += errs.length;
        console.log(`\n❌ ${file}`);
        errs.forEach(e => console.log(`  - [${e.path}] ${e.message}`));
      } else {
        console.log(`✅ ${file}`);
      }
    } catch (e) {
      totalErrors += 1;
      console.log(`\n❌ ${file}`);
      console.log(`  - パースエラー: ${e.message}`);
    }
  }

  if (totalErrors > 0) {
    console.log(`\n合計エラー: ${totalErrors}`);
    process.exit(1);
  }
}

main();


