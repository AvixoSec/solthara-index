import { createHash } from 'node:crypto';
import { EXTENDED_SOURCES, repairExtended, inspectExtended } from './extended.mjs';

export const REVISION = '2026-09-06.1';
export const BASE_COMMIT = '30a2ea0f117d37fc24a64f2eb4a69229d635169a';
export const SOURCES = {
  ...EXTENDED_SOURCES,
  gpt2Code: 'https://github.com/openai/gpt-2/blob/9b63575ef42771a015060c964af2c3da4cf7c8ab/src/model.py',
  gpt2Config: 'https://huggingface.co/openai-community/gpt2-xl/blob/cefd64e6208bcba99d6e3f55ff78cca372c1a46f/config.json',
  llama2Paper: 'https://arxiv.org/pdf/2307.09288',
  llama1Paper: 'https://arxiv.org/abs/2302.13971',
  mixtralAnnouncement: 'https://mistral.ai/news/mixtral-8x22b',
  mixtralDocs: 'https://docs.mistral.ai/models/mixtral-8x22b-0-1-0-3',
  chinchillaPaper: 'https://arxiv.org/pdf/2203.15556',
  inspectedDataset: 'https://raw.githubusercontent.com/AvixoSec/solthara-index/30a2ea0f117d37fc24a64f2eb4a69229d635169a/all-configs.json',
};

export const sha256 = (input) => createHash('sha256').update(input).digest('hex');
export const gitBlobSha = (input) => {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};
export const jsonText = (data) => JSON.stringify(data, null, 2) + '\n';
export const get = (object, path) => path.split('.').reduce((v, key) => v?.[key], object);
const plainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export function modelsOf(data) {
  if (!plainObject(data)) throw new Error('Dataset must be an object.');
  if (Array.isArray(data.models)) return data.models;
  if (plainObject(data.models)) return Object.values(data.models);
  throw new Error('models must be an array or object, not an absent/invalid value.');
}
export function findUnique(list, id) {
  const matches = list.filter((item) => item?.model_id === id || item?.id === id);
  if (matches.length !== 1) throw new Error(`Expected exactly one record for ${id}; found ${matches.length}. No files written.`);
  return matches[0];
}

// This is intentionally not a model-family inference engine. Only the listed,
// primary-source-backed fields are changed; raw_config and training are untouched.
export function repairDataset(original) {
  const data = structuredClone(original);
  const models = modelsOf(data);
  if (data._solthara_audit?.revision === REVISION) {
    assertValid(data, { corrected: true });
    return { data, changes: [], alreadyApplied: true };
  }
  if (data._solthara_audit) throw new Error('Unrecognized pre-existing audit metadata. Review manually.');
  const changes = [];
  const annotate = (record, path, value, sourceKeys, reason) => {
    const parts = path.split('.');
    if (parts.some((p) => ['__proto__', 'prototype', 'constructor'].includes(p))) throw new Error('Unsafe field path.');
    let parent = record;
    for (const part of parts.slice(0, -1)) {
      if (!Object.hasOwn(parent, part)) parent[part] = {};
      if (!plainObject(parent[part])) throw new Error(`Unexpected object shape at ${path}; refusing to overwrite.`);
      parent = parent[part];
    }
    const key = parts.at(-1);
    const existed = Object.hasOwn(parent, key);
    const before = existed ? structuredClone(parent[key]) : null;
    if (existed && JSON.stringify(before) === JSON.stringify(value)) return;
    parent[key] = structuredClone(value);
    const change = { record_id: record.model_id ?? record.id ?? 'dataset', path, existed, before, after: value, sources: sourceKeys.map((k) => SOURCES[k]), reason };
    changes.push(change);
    record._solthara_audit ??= { revision: REVISION, checked_on: '2026-09-06', scope: 'listed_fields_only', changes: [] };
    record._solthara_audit.changes.push(change);
  };

  const gpt2 = findUnique(models, 'gpt-2-xl-1-5b');
  const gpt2Facts = {
    'yichen.vocab': 50257, 'yichen.depth': 48, 'yichen.dim': 1600,
    'yichen.norm': 'LayerNorm', 'yichen.pos_emb': 'Learned absolute',
    'yichen.activation': 'GELU', 'yichen.parallel_layer': 'Serial',
    'yichen.pre_norm': 'Pre', 'yichen.attn_type': 'mha',
    'yichen.bias_display': 'with bias', 'yichen.tied_display': 'tied',
    'math_tricks.hidden_act': 'gelu_new',
    'math_tricks.attention_bias': true,
    'math_tricks.attention_bias_display': 'with bias',
    'math_tricks.tie_word_embeddings': true,
    'math_tricks.tie_display': 'tied',
  };
  for (const [path, value] of Object.entries(gpt2Facts)) {
    annotate(gpt2, path, value, ['gpt2Code', 'gpt2Config'], 'OpenAI GPT-2 code and XL configuration; no modern-Transformer defaults.');
  }
  // Remove inapplicable normalized rotary/RMSNorm parameters, never the source config.
  for (const path of ['math_tricks.rope_theta', 'math_tricks.rms_norm_eps']) {
    if (get(gpt2, path) !== undefined) annotate(gpt2, path, null, ['gpt2Code'], 'Not applicable to GPT-2: learned positional embeddings and LayerNorm.');
  }
  for (const [path, value] of Object.entries({
    'architecture.attention.primary': 'mha', 'architecture.attention.label': 'MHA',
    'yichen.bias': 'with bias', 'yichen.tied': 'tied',
  })) {
    if (get(gpt2, path) !== undefined) annotate(gpt2, path, value, ['gpt2Code'], 'Align an existing display field with the original implementation.');
  }

  for (const model of models) for (const path of NUMERIC_PATHS) {
    if (get(model, path) === 'None') annotate(model, path, null, ['inspectedDataset'], 'Normalize a missing-value string in a numeric field to real null; no numeric value is inferred.');
  }

  if (!Array.isArray(data.milestones)) throw new Error('Expected a milestones array. No files written.');
  const llama1 = findUnique(data.milestones, 'llama1-2023');
  if (typeof llama1.arch !== 'string') throw new Error('LLaMA milestone arch must be a string.');
  annotate(llama1, 'arch', llama1.arch.replace(/\bGQA\b/g, 'MHA'), ['llama2Paper', 'llama1Paper'], 'Llama 2 paper Table 1 marks all Llama 1 models, including 65B, as not using GQA.');

  const mixtral = findUnique(data.milestones, 'mixtral-8x22b');
  // A timeline date needs an explicit basis. Do NOT silently claim that April 17
  // is the first availability of base weights; earlier weights are separately noted.
  annotate(mixtral, 'date', '2024-04-17', ['mixtralAnnouncement', 'mixtralDocs'], 'Official announcement/documentation date, not first base-weight availability.');
  annotate(mixtral, 'date_basis', 'official_announcement', ['mixtralAnnouncement'], 'Disambiguate announcement from the earlier base-weight publication.');
  annotate(mixtral, 'date_note', 'Official announcement: 2024-04-17. Earlier base weights circulated in April; first-weight publication is not verified by this correction.', ['mixtralAnnouncement', 'mixtralDocs'], 'Do not conflate announcement and initial weight availability.');

  const chinchilla = findUnique(data.milestones, 'chinchilla-2022');
  if (typeof chinchilla.arch !== 'string') throw new Error('Chinchilla milestone arch must be a string.');
  if (/GQA precursor/i.test(chinchilla.arch)) {
    annotate(chinchilla, 'arch', chinchilla.arch.replace(/\s*[•·]\s*GQA precursor/gi, '').replace(/GQA precursor/gi, 'Transformer'), ['chinchillaPaper'], 'Remove the unsupported GQA-precursor label; the paper specifies the Gopher architecture and Table 4.');
  }

  repairExtended(data, models, annotate);

  data._solthara_audit = {
    revision: REVISION, checked_on: '2026-09-06', base_commit: BASE_COMMIT,
    scope: 'Only fields listed in record audit metadata; not a complete scientific audit.',
    full_dataset_verified: false, original_raw_configs_preserved: true,
    sources: SOURCES, changes_count: changes.length,
    dataset_changes: changes.filter((c) => c.record_id === 'dataset'),
    verification_note: 'See audit/verification.json for actual full-repository validation. Explicit config projections are separate from independent primary-source checks; unlisted scientific claims remain unverified.',
  };
  // Structural counts are recomputed, without overwriting unrelated epistemic stats.
  data.total_models = models.length;
  if (plainObject(data.stats)) {
    data.stats.total = models.length;
    data.stats.milestones_count = data.milestones.length;
  }
  assertValid(data, { corrected: true });
  return { data, changes, alreadyApplied: false };
}

const NUMERIC_PATHS = ['yichen.vocab', 'yichen.depth', 'yichen.dim', 'architecture.vocab_size', 'architecture.num_hidden_layers', 'architecture.hidden_size'];
export function inspectDataset(data, { corrected = false } = {}) {
  const errors = [], warnings = [];
  let models;
  try { models = modelsOf(data); } catch (error) { return { errors: [error.message], warnings, model_count: 0 }; }
  if (!models.length) errors.push('Dataset has no models.');
  const ids = new Set();
  for (const model of models) {
    if (!plainObject(model)) { errors.push('Model record must be an object.'); continue; }
    const id = model.model_id;
    if (typeof id !== 'string' || !id.trim()) errors.push('Every model needs a nonempty model_id.');
    if (ids.has(id)) errors.push(`Duplicate model_id: ${id}`);
    ids.add(id);
    if (typeof model.model_name !== 'string' || !model.model_name.trim()) errors.push(`${id}: missing model_name.`);
    for (const path of NUMERIC_PATHS) {
      const value = get(model, path);
      if (value != null && (!Number.isInteger(value) || value <= 0)) errors.push(`${id}: ${path} must be a positive integer or null, not ${JSON.stringify(value)}.`);
    }
    for (const key of ['total_params', 'active_params']) {
      const value = model.scale?.[key];
      if (value != null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) errors.push(`${id}: scale.${key} must be a positive number or null.`);
    }
    if (typeof model.scale?.total_params === 'number' && typeof model.scale?.active_params === 'number' && model.scale.active_params > model.scale.total_params) errors.push(`${id}: active parameters exceed total parameters.`);
    const sourceCount = Array.isArray(model.sources) ? model.sources.length : 0;
    if (!sourceCount && !model.architecture?.raw_config_source && !model._solthara_audit) warnings.push(`${id}: no top-level sources/config provenance; review nested evidence.`);
  }
  if (data.total_models !== undefined && data.total_models !== models.length) errors.push('total_models does not equal the actual record count.');
  if (Array.isArray(data.milestones)) {
    const seen = new Set();
    for (const milestone of data.milestones) {
      const id = milestone?.id ?? milestone?.model_id;
      if (typeof id !== 'string' || !id) errors.push('Milestone is missing an ID.');
      if (seen.has(id)) errors.push(`Duplicate milestone ID: ${id}`);
      seen.add(id);
      if (milestone?.date != null && !/^\d{4}-\d{2}-\d{2}$/.test(milestone.date)) errors.push(`${id}: milestone date must be YYYY-MM-DD.`);
    }
  } else errors.push('milestones must be an array.');
  if (corrected) {
    errors.push(...inspectExtended(data, models));
    const gpt2 = models.find((m) => m.model_id === 'gpt-2-xl-1-5b');
    if (!gpt2) errors.push('Missing GPT-2 regression record.');
    for (const [path, expected] of Object.entries({ 'yichen.vocab': 50257, 'yichen.depth': 48, 'yichen.dim': 1600, 'yichen.norm': 'LayerNorm', 'yichen.pos_emb': 'Learned absolute', 'yichen.activation': 'GELU', 'yichen.attn_type': 'mha', 'yichen.bias_display': 'with bias', 'yichen.tied_display': 'tied', 'math_tricks.hidden_act': 'gelu_new', 'math_tricks.attention_bias': true, 'math_tricks.tie_word_embeddings': true })) {
      if (get(gpt2, path) !== expected) errors.push(`GPT-2 regression: ${path} must equal ${JSON.stringify(expected)}.`);
    }
    const milestones = data.milestones ?? [];
    const llama = milestones.find((m) => (m.id ?? m.model_id) === 'llama1-2023');
    if (!llama || /\bGQA\b/.test(llama.arch ?? '')) errors.push('Llama 1 milestone must not claim GQA.');
    const mixtral = milestones.find((m) => (m.id ?? m.model_id) === 'mixtral-8x22b');
    if (mixtral?.date !== '2024-04-17' || mixtral?.date_basis !== 'official_announcement') errors.push('Mixtral milestone announcement date/basis regression.');
    const chinchilla = milestones.find((m) => (m.id ?? m.model_id) === 'chinchilla-2022');
    if (!chinchilla || /GQA precursor/i.test(chinchilla.arch ?? '')) errors.push('Chinchilla milestone must not claim an unsupported GQA precursor.');
  }
  return { errors, warnings, model_count: models.length, milestone_count: data.milestones?.length ?? 0 };
}
export function assertValid(data, options) {
  const report = inspectDataset(data, options);
  if (report.errors.length) throw new Error(`Dataset validation failed:\n${report.errors.join('\n')}`);
  return report;
}

// JSON is a YAML-1.2-compatible scalar representation; all strings are quoted.
// In particular Python's "None" is NEVER emitted as a missing numeric value.
const scalar = (value) => JSON.stringify(value === undefined ? null : value);
export function flattenedRows(data) {
  return modelsOf(data).map((model) => {
    const y = model.yichen ?? {}, math = model.math_tricks ?? {};
    return {
      model_id: model.model_id, model_name: model.model_name, company: model.company ?? null,
      date: model.release_date ?? null, vocab: y.vocab ?? model.architecture?.vocab_size ?? null, depth: y.depth ?? model.architecture?.num_hidden_layers ?? null,
      dim: y.dim ?? model.architecture?.hidden_size ?? null, norm: y.norm ?? null, parallel: y.parallel_layer ?? null,
      pre_norm: y.pre_norm ?? null, pos_emb: y.pos_emb ?? null, activation: y.activation ?? null,
      attn: y.attn_type ?? model.architecture?.attention?.primary ?? null,
      bias: y.bias_display ?? math.attention_bias_display ?? y.bias ?? null,
      tied: y.tied_display ?? math.tie_display ?? y.tied ?? null,
      qk_norm: y.qk_norm ?? math.qk_norm_display ?? null,
      sliding: y.sliding ?? math.sliding_window_display ?? null,
    };
  });
}
export function exportYaml(data) {
  const lines = ['# Generated from all-configs.json; do not edit by hand.', '# Unknowns are null; no architecture defaults are inferred.', `version: ${scalar(data.version)}`, `license: ${scalar(data.license)}`, `generated_at: ${scalar(data.generated_at)}`, 'source_file: "all-configs.json"', `total_models: ${modelsOf(data).length}`, 'models:'];
  for (const row of flattenedRows(data)) {
    Object.entries(row).forEach(([key, value], i) => lines.push(`${i === 0 ? '  - ' : '    '}${key}: ${scalar(value)}`));
  }
  // Flow-style JSON is valid YAML and preserves all milestone fields/evidence.
  lines.push(`milestones: ${JSON.stringify(data.milestones ?? [])}`, `audit_revision: ${scalar(data._solthara_audit?.revision)}`);
  return lines.join('\n') + '\n';
}
export function dataScript(data) {
  // Escaping every '<' prevents </script>, <!-- and <script parser states in
  // standalone HTML. JSON.parse validation never executes an untrusted JS file.
  return `window.__LLM_DATA__=${JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')};\n`;
}
export function parseDataScript(script) {
  const match = /^window\.__LLM_DATA__=(.*);\n?$/s.exec(script);
  if (!match) throw new Error('Unexpected data script format; refusing to evaluate JavaScript.');
  return JSON.parse(match[1]);
}
export function verifyExports(data, js, yaml) {
  const errors = [];
  try { if (JSON.stringify(parseDataScript(js)) !== JSON.stringify(data)) errors.push('JSON and JS dataset contents differ.'); } catch (error) { errors.push(error.message); }
  if (yaml !== exportYaml(data)) errors.push('models.yml is stale or differs from its deterministic export.');
  if (/^\s*(?:vocab|depth|dim):\s*None\s*$/m.test(yaml)) errors.push('YAML contains a string None in a numeric column.');
  return errors;
}
