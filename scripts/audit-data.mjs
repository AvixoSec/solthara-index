import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { modelsOf, inspectDataset, jsonText, get, sha256 } from './lib/data.mjs';

const source = await readFile('all-configs.json', 'utf8');
const data = JSON.parse(source);
const fields = {
  'yichen.vocab': ['vocab_size', 'padded_vocab_size'],
  'yichen.depth': ['num_hidden_layers', 'n_layer', 'num_layers', 'num_blocks'],
  'yichen.dim': ['hidden_size', 'n_embd', 'd_model', 'embedding_dim'],
};
const records = modelsOf(data).map((model) => {
  const raw = model.architecture?.raw_config;
  const conflicts = [];
  if (raw && typeof raw === 'object') for (const [path, keys] of Object.entries(fields)) {
    const normal = get(model, path);
    if (normal == null) continue;
    for (const key of keys) if (typeof raw[key] === 'number' && typeof normal === 'number' && raw[key] !== normal) {
      conflicts.push({ path, normalized: normal, raw_field: key, raw_value: raw[key], status: 'review_required_not_automatically_wrong' });
    }
  }
  return {
    id: model.model_id, name: model.model_name,
    config_source: model.architecture?.raw_config_source ?? null,
    raw_config_bytes: raw ? Buffer.byteLength(JSON.stringify(raw)) : 0,
    normalized_config_conflicts: conflicts,
    corrected_fields: model._solthara_audit?.changes.map((item) => item.path) ?? [],
    primary_sources: model.sources ?? [],
    training_status_from_original: model.training?.overall_status ?? model.training?.verified_status ?? null,
    scientific_status: 'not_fully_verified',
  };
});
const report = {
  input_sha256: sha256(source), scope: 'All records structurally scanned; no automatic scientific verification.',
  validation: inspectDataset(data, { corrected: Boolean(data._solthara_audit) }),
  records_with_config_conflicts: records.filter((item) => item.normalized_config_conflicts.length).length,
  records,
};
await mkdir('audit', { recursive: true });
await writeFile('audit/data-audit.json', jsonText(report));
console.log(JSON.stringify({ models_scanned: records.length, conflicts_to_review: report.records_with_config_conflicts, report: 'audit/data-audit.json' }, null, 2));
if (report.validation.errors.length) process.exitCode = 1;
