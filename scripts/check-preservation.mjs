import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { modelsOf, sha256, jsonText } from './lib/data.mjs';
if (!process.argv[2]) throw new Error('Provide the original JSON snapshot path.');
const originalText = await readFile(process.argv[2], 'utf8');
const currentText = await readFile('all-configs.json', 'utf8');
const original = JSON.parse(originalText), current = JSON.parse(currentText);
const before = modelsOf(original), after = modelsOf(current);
assert.equal(after.length, before.length);
const byId = new Map(after.map((m) => [m.model_id, m]));
assert.equal(byId.size, before.length);
for (const m of before) {
  const next = byId.get(m.model_id); assert.ok(next, `Missing ${m.model_id}`);
  assert.deepEqual(next.architecture?.raw_config, m.architecture?.raw_config, `${m.model_id}: raw config changed`);
  assert.deepEqual(next.training, m.training, `${m.model_id}: training changed`);
  assert.deepEqual(next.context, m.context, `${m.model_id}: context changed`);
}
await mkdir('audit', { recursive: true });
await writeFile('audit/preservation.json', jsonText({ status: 'passed', models_checked: before.length, raw_configs_unchanged: true, training_unchanged: true, context_unchanged: true, original_sha256: sha256(originalText), current_sha256: sha256(currentText) }));
console.log('All original raw configs, training and context fields preserved.');
