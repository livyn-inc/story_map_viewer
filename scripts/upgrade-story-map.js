#!/usr/bin/env node
/**
 * Upgrade StoryMap YAML from legacy format to v2 schema expected by validator.
 * - Reads input YAML, writes upgraded YAML to stdout or --out file.
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function inferStructureFromLegacy(sm) {
  // If already present, return as-is
  if (sm.story_map_structure?.activities && sm.story_map_structure?.backbones) {
    return sm.story_map_structure;
  }

  const activities = [];
  const backbones = [];

  // Heuristics: derive activities/backbones from display_order/backbones and any backbone_name/activity_name hints
  const seenActivities = new Map(); // name -> id
  const seenBackbones = new Set();

  const order = sm.display_order?.backbones || [];
  let sequence = 1;
  for (const bb of order) {
    if (typeof bb !== 'string') continue;
    if (seenBackbones.has(bb)) continue;

    // Try to find backbone name/activity from mapping or first occurrence in personas
    let backboneName = bb;
    let activityName = 'Activity';

    // search in personas_stories for first story referencing this backbone_id to infer names
    outer: for (const pk of Object.keys(sm.personas_stories || {})) {
      const stories = sm.personas_stories[pk]?.stories || [];
      for (const s of stories) {
        if (s?.backbone_id === bb) {
          backboneName = s.backbone_name || backboneName;
          activityName = s.activity_name || activityName;
          break outer;
        }
      }
    }

    // allocate or reuse activity id by name
    let activityId = seenActivities.get(activityName);
    if (!activityId) {
      activityId = `ACT_${activities.length + 1}`;
      activities.push({ id: activityId, name: activityName });
      seenActivities.set(activityName, activityId);
    }

    backbones.push({ id: bb, name: backboneName, sequence, activity_id: activityId });
    seenBackbones.add(bb);
    sequence += 1;
  }

  // Fallback: if no order, scan all stories to create minimal backbones/activities
  if (backbones.length === 0) {
    // Create a single default activity and one backbone per story id
    const DEFAULT_ACTIVITY_NAME = 'Default';
    const actId = `ACT_${activities.length + 1}`;
    activities.push({ id: actId, name: DEFAULT_ACTIVITY_NAME });

    const seenBackboneIds = new Set();
    let seq = 1;
    const registerBackbone = (story) => {
      if (!story?.id) return;
      const bbId = `BB_${story.id}`;
      if (seenBackboneIds.has(bbId)) return;
      const bbName = story.backbone_name || story.story || story.id;
      backbones.push({ id: bbId, name: String(bbName).slice(0, 80), sequence: seq++, activity_id: actId });
      seenBackboneIds.add(bbId);
    };

    for (const pk of Object.keys(sm.personas_stories || {})) {
      const stories = sm.personas_stories[pk]?.stories || [];
      for (const s of stories) registerBackbone(s);
    }
    for (const s of sm.cross_persona_stories || []) registerBackbone(s);
  }

  return { activities, backbones };
}

function upgrade(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const sm = doc.integrated_story_map;
  if (!sm) return doc;

  // Ensure story_map_structure
  if (!sm.story_map_structure) {
    sm.story_map_structure = inferStructureFromLegacy(sm);
  }

  // Ensure story_mapping (optional): create order by appearance per backbone
  if (!sm.story_mapping) {
    const mapping = {};
    const counts = new Map(); // backbone_id -> next sequence

    function nextSeq(bb) {
      const v = (counts.get(bb) || 0) + 1;
      counts.set(bb, v);
      return v;
    }

    for (const [pk, persona] of Object.entries(sm.personas_stories || {})) {
      for (const s of (persona?.stories || [])) {
        if (!s?.id) continue;
        if (!s.backbone_id) s.backbone_id = `BB_${s.id}`;
        if (!mapping[s.id]) mapping[s.id] = { backbone_id: s.backbone_id, sequence: nextSeq(s.backbone_id) };
      }
    }
    for (const s of sm.cross_persona_stories || []) {
      if (!s?.id) continue;
      if (!s.backbone_id) s.backbone_id = `BB_${s.id}`;
      if (!mapping[s.id]) mapping[s.id] = { backbone_id: s.backbone_id, sequence: nextSeq(s.backbone_id) };
    }
    if (Object.keys(mapping).length > 0) sm.story_mapping = mapping;
  }

  // Normalize personas_stories to ensure array stories
  for (const [pk, persona] of Object.entries(sm.personas_stories || {})) {
    if (!Array.isArray(persona.stories)) persona.stories = persona.stories ? Array.from(persona.stories) : [];
  }

  return doc;
}

function main() {
  const inPath = process.argv[2];
  const outIdx = process.argv.indexOf('--out');
  const outPath = outIdx > -1 ? process.argv[outIdx + 1] : null;
  if (!inPath) {
    console.error('Usage: upgrade-story-map.js <input.yaml> [--out output.yaml]');
    process.exit(2);
  }

  const text = fs.readFileSync(inPath, 'utf-8');
  const doc = yaml.load(text, { filename: inPath });
  const upgraded = upgrade(doc);
  const outText = yaml.dump(upgraded, { lineWidth: 120 });
  if (outPath) {
    fs.writeFileSync(outPath, outText);
    console.log(`Upgraded YAML written to: ${outPath}`);
  } else {
    process.stdout.write(outText);
  }
}

main();
