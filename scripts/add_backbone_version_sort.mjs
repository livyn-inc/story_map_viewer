#!/usr/bin/env node
// ストーリーに backbone_x_version_sort を付与（backbone_id x version 内で1..n）
// 使い方: node scripts/add_backbone_version_sort.mjs <input_yaml_path> [--in-place]

import fs from 'fs';
import path from 'path';

// 動的にjs-yamlを読み込み（依存が無い環境も考慮）
let yaml;
try {
  yaml = await import('js-yaml');
} catch (e) {
  console.error('[Error] js-yaml が見つかりません。`npm i js-yaml` を実行してください');
  process.exit(1);
}

function usage() {
  console.log('Usage: node scripts/add_backbone_version_sort.mjs <input_yaml_path> [--in-place]');
}

const args = process.argv.slice(2);
if (args.length < 1) { usage(); process.exit(1); }
const inputPath = path.resolve(args[0]);
const inPlace = args.includes('--in-place');

if (!fs.existsSync(inputPath)) {
  console.error('[Error] File not found:', inputPath);
  process.exit(1);
}

const src = fs.readFileSync(inputPath, 'utf8');
let data;
try {
  data = yaml.load(src);
} catch (e) {
  console.error('[Error] YAML parse failed:', e.message);
  process.exit(1);
}

const ism = data?.integrated_story_map;
if (!ism) {
  console.error('[Error] integrated_story_map が見つかりません');
  process.exit(1);
}

// story_mapping を順序のデフォルトとして使用
const mapping = ism.story_mapping || {};

// すべてのストーリーを (persona含む/cross含む) 走査
const group = new Map(); // key: `${backbone_id}__${version}` -> stories[]

function pushStory(story) {
  if (!story || !story.backbone_id) return;
  const version = story.version || 'MVP';
  const key = `${story.backbone_id}__${version}`;
  if (!group.has(key)) group.set(key, []);
  group.get(key).push(story);
}

Object.values(ism.personas_stories || {}).forEach(p => {
  (p.stories || []).forEach(s => pushStory(s));
});
if (Array.isArray(ism.cross_persona_stories)) {
  ism.cross_persona_stories.forEach(s => pushStory(s));
}

// 各グループ内で並べ替えて 1..n を付与
for (const [key, list] of group.entries()) {
  list.sort((a, b) => {
    const sa = mapping[a.id]?.sequence ?? Number.MAX_SAFE_INTEGER;
    const sb = mapping[b.id]?.sequence ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });
  list.forEach((story, idx) => {
    story.backbone_x_version_sort = idx + 1;
  });
}

const outText = yaml.dump(data, { lineWidth: -1, noRefs: true });
if (inPlace) {
  const bak = inputPath + '.bak_sort_' + Date.now();
  fs.writeFileSync(bak, src, 'utf8');
  fs.writeFileSync(inputPath, outText, 'utf8');
  console.log('Updated in-place:', inputPath);
  console.log('Backup created at:', bak);
} else {
  const { dir, name, ext } = path.parse(inputPath);
  const outPath = path.join(dir, name + '.sorted' + ext);
  fs.writeFileSync(outPath, outText, 'utf8');
  console.log('Written:', outPath);
}














