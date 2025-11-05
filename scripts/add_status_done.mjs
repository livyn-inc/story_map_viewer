#!/usr/bin/env node
/**
 * add_status_done.mjs (ESM)
 * 指定のストーリーマップYAML内の全ストーリーに status: DONE を追記（存在しない場合）します。
 * 使い方:
 *   node scripts/add_status_done.mjs local_secrets/test-story-map.yaml --in-place
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function addDoneStatus(data) {
  if (!data || !data.integrated_story_map) return data;
  const ism = data.integrated_story_map;

  // personas_stories
  if (ism.personas_stories && typeof ism.personas_stories === 'object') {
    for (const persona of Object.values(ism.personas_stories)) {
      const stories = Array.isArray(persona?.stories) ? persona.stories : [];
      stories.forEach((s) => {
        if (s && !s.status) s.status = 'DONE';
      });
    }
  }

  // cross_persona_stories
  if (Array.isArray(ism.cross_persona_stories)) {
    ism.cross_persona_stories.forEach((s) => {
      if (s && !s.status) s.status = 'DONE';
    });
  }

  return data;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/add_status_done.mjs <input.yaml> [--in-place]');
    process.exit(1);
  }
  const inputPath = args[0];
  const inPlace = args.includes('--in-place');

  const source = fs.readFileSync(inputPath, 'utf8');
  const data = yaml.load(source);
  const updated = addDoneStatus(data);
  const output = yaml.dump(updated, { lineWidth: -1, noRefs: true });

  if (inPlace) {
    const bak = inputPath + '.bak';
    fs.writeFileSync(bak, source, 'utf8');
    fs.writeFileSync(inputPath, output, 'utf8');
    console.log(`Updated in place. Backup: ${bak}`);
  } else {
    const outPath = inputPath.replace(/\.ya?ml$/i, '.with_status.yaml');
    fs.writeFileSync(outPath, output, 'utf8');
    console.log(`Wrote: ${outPath}`);
  }
}

main();
