import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const output = 'audit/bootstrap';
await mkdir(output, { recursive: true });
const bytes = await readFile('all-configs.json');
const data = JSON.parse(bytes);
const models = Array.isArray(data.models) ? data.models : Object.values(data.models ?? {});
if (!models.length) throw new Error('No models in the actual dataset.');
const write = (name, value) => writeFile(`${output}/${name}`, JSON.stringify(value, null, 2) + '\n');
function brief(value, depth = 0) {
  if (value === null || typeof value !== 'object') return typeof value === 'string' && value.length > 1800 ? value.slice(0, 1800) + ' [truncated for audit display]' : value;
  if (depth >= 6) return { audit_display_truncated: true, kind: Array.isArray(value) ? 'array' : 'object', size: Array.isArray(value) ? value.length : Object.keys(value).length };
  if (Array.isArray(value)) return value.length > 24 ? { audit_display_truncated: true, total_items: value.length, first_items: value.slice(0, 24).map((v) => brief(v, depth + 1)) } : value.map((v) => brief(v, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, brief(child, depth + 1)]));
}
const get = (obj, key) => key.split('.').reduce((v, p) => v?.[p], obj);
const numericPaths = ['yichen.vocab', 'yichen.depth', 'yichen.dim', 'architecture.vocab_size', 'architecture.num_hidden_layers', 'architecture.hidden_size', 'scale.total_params', 'scale.active_params'];
const issues = [];
const seen = new Set();
const records = models.map((model, index) => {
  if (!model.model_id || seen.has(model.model_id)) issues.push({ id: model.model_id, problem: 'missing_or_duplicate_id' });
  seen.add(model.model_id);
  for (const path of numericPaths) {
    const value = get(model, path);
    if (value != null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) issues.push({ id: model.model_id, path, value, problem: 'invalid_numeric_type_or_range' });
  }
  const raw = model.architecture?.raw_config;
  return {
    index, model_id: model.model_id, model_name: model.model_name, company: model.company,
    release_date: model.release_date, family: model.family, summary: model.summary,
    yichen: brief(model.yichen), math_tricks: brief(model.math_tricks), scale: model.scale,
    architecture: brief(Object.fromEntries(Object.entries(model.architecture ?? {}).filter(([key]) => key !== 'raw_config'))),
    raw_config: brief(raw), raw_config_bytes: raw ? Buffer.byteLength(JSON.stringify(raw)) : 0,
    context: brief(model.context), training: brief(model.training), sources: brief(model.sources),
  };
});
const manifest = {
  base_commit: process.env.GITHUB_SHA ?? 'local-fixture',
  input_json_sha256: createHash('sha256').update(bytes).digest('hex'), input_bytes: bytes.length,
  model_count: models.length, milestone_count: data.milestones?.length, top_level_keys: Object.keys(data),
  metadata: brief(Object.fromEntries(Object.entries(data).filter(([key]) => !['models', 'milestones'].includes(key)))),
  issues,
  model_index: models.map((m, i) => ({ id: m.model_id, name: m.model_name, company: m.company, file: `records-${String(Math.floor(i / 5) + 1).padStart(2, '0')}.json` })),
  note: 'Complete input read; compact display projections may be truncated. These are audit observations, not a replacement dataset or scientific verification.',
};
await write('manifest.json', manifest);
await write('milestones.json', data.milestones ?? []);
for (let i = 0; i < records.length; i += 5) await write(`records-${String(Math.floor(i / 5) + 1).padStart(2, '0')}.json`, records.slice(i, i + 5));
const gpt2 = models.find((m) => m.model_id === 'gpt-2-xl-1-5b');
if (gpt2) for (const field of ['architecture', 'yichen', 'math_tricks', 'sources']) await write(`gpt2-${field}.json`, gpt2[field] ?? null);
for (const [path, label] of [['src/Vector.jsx', 'Vector'], ['src/vector.css', 'styles']]) {
  const source = await readFile(path, 'utf8');
  let current = '', part = 1;
  for (const line of source.split(/(?<=\n)/)) {
    if (current.length && current.length + line.length > 22000) { await writeFile(`${output}/${label}-${part++}.txt`, current); current = ''; }
    current += line;
  }
  if (current) await writeFile(`${output}/${label}-${part}.txt`, current);
}
console.log(JSON.stringify({ models: models.length, milestones: data.milestones?.length, numeric_issues: issues.length, input_sha256: manifest.input_json_sha256 }));
