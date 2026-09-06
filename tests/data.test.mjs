import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.mjs';
import { repairDataset, modelsOf, inspectDataset, assertValid, dataScript, parseDataScript, exportYaml, flattenedRows, verifyExports, sha256, gitBlobSha, REVISION } from '../scripts/lib/data.mjs';

const repaired = () => repairDataset(fixture()).data;
test('accept array and object model containers', () => {
  const original = fixture();
  assert.equal(modelsOf(original).length, 2);
  original.models = Object.fromEntries(original.models.map((m) => [m.model_id, m]));
  assert.equal(modelsOf(repairDataset(original).data).length, 2);
  assert.throws(() => modelsOf({ models: 'invalid' }));
});
test('correct GPT-2 norm, position and activation from primary sources', () => {
  const model = modelsOf(repaired())[0];
  assert.equal(model.yichen.norm, 'LayerNorm');
  assert.equal(model.yichen.pos_emb, 'Learned absolute');
  assert.equal(model.yichen.activation, 'GELU');
  assert.equal(model.math_tricks.hidden_act, 'gelu_new');
});
test('correct GPT-2 bias and weight tying in both matrix and filters', () => {
  const model = modelsOf(repaired())[0];
  assert.equal(model.yichen.bias_display, 'with bias');
  assert.equal(model.math_tricks.attention_bias, true);
  assert.equal(model.math_tricks.attention_bias_display, model.yichen.bias_display);
  assert.equal(model.math_tricks.tie_word_embeddings, true);
  assert.equal(model.yichen.tied_display, 'tied');
});
test('inapplicable rotary/RMSNorm fields become null without editing raw config', () => {
  const model = modelsOf(repaired())[0];
  assert.equal(model.math_tricks.rope_theta, null);
  assert.equal(model.math_tricks.rms_norm_eps, null);
  assert.deepEqual(model.architecture.raw_config, fixture().models[0].architecture.raw_config);
});
test('source records, training claims and unrelated stats are preserved', () => {
  const original = fixture(), snapshot = structuredClone(original);
  const data = repairDataset(original).data;
  assert.deepEqual(original, snapshot);
  assert.deepEqual(data.models[0].training, snapshot.models[0].training);
  assert.deepEqual(data.models[1], snapshot.models[1]);
  assert.equal(data.stats.training_inferred, 60);
});
test('audit scope is explicit and each changed field has provenance', () => {
  const { data, changes } = repairDataset(fixture());
  assert.equal(data._solthara_audit.revision, REVISION);
  assert.equal(data._solthara_audit.full_dataset_verified, false);
  assert.ok(changes.length > 0);
  for (const change of changes) {
    assert.ok(change.sources.length > 0);
    assert.ok(change.sources.every((source) => source.startsWith('https://')));
    assert.ok(change.reason.length > 10);
  }
});
test('repairs are idempotent', () => {
  const data = repaired();
  const next = repairDataset(data);
  assert.equal(next.alreadyApplied, true);
  assert.deepEqual(next.data, data);
  assert.deepEqual(next.changes, []);
});
test('missing or ambiguous patch targets fail before any writes', () => {
  const missing = fixture(); missing.models.shift();
  assert.throws(() => repairDataset(missing), /exactly one/);
  const duplicate = fixture(); duplicate.models.push(structuredClone(duplicate.models[0]));
  assert.throws(() => repairDataset(duplicate), /exactly one/);
});
test('an unexpected nested shape is not overwritten', () => {
  const source = fixture(); source.models[0].yichen = 'unexpected';
  assert.throws(() => repairDataset(source), /Unexpected object shape/);
});
test('Llama 1 no longer claims GQA and Chinchilla loses unsupported precursor label', () => {
  const milestones = repaired().milestones;
  assert.match(milestones[0].arch, /MHA/);
  assert.doesNotMatch(milestones[0].arch, /GQA/);
  assert.equal(milestones[2].arch, 'Dense');
});
test('Mixtral announcement date is explicitly distinguished from first weights', () => {
  const milestone = repaired().milestones[1];
  assert.equal(milestone.date, '2024-04-17');
  assert.equal(milestone.date_basis, 'official_announcement');
  assert.match(milestone.date_note, /first-weight publication is not verified/);
});
test('missing numeric values are real YAML null, not None strings', () => {
  const yaml = exportYaml(repaired());
  assert.match(yaml, /vocab: null/);
  assert.match(yaml, /depth: null/);
  assert.match(yaml, /company: "None"/);
  assert.doesNotMatch(yaml, /^\s*(vocab|depth|dim): None$/m);
});
test('YAML mirrors corrected display fields and quotes dates', () => {
  const data = repaired(), rows = flattenedRows(data);
  assert.equal(rows[0].bias, 'with bias');
  assert.equal(rows[0].tied, 'tied');
  assert.match(exportYaml(data), /date: "2019-11-05"/);
});
test('numeric strings, zero, negatives and non-finite numbers fail validation', () => {
  for (const value of ['None', '48', 0, -1, Infinity, NaN]) {
    const data = fixture(); data.models[1].yichen.depth = value;
    assert.ok(inspectDataset(data).errors.some((error) => error.includes('yichen.depth')));
  }
});
test('counts, unique IDs and active/total parameter order are checked', () => {
  const data = fixture(); data.total_models = 50; data.models[1].model_id = data.models[0].model_id;
  data.models[0].scale.active_params = 2000000000;
  const errors = inspectDataset(data).errors;
  assert.ok(errors.some((e) => e.includes('total_models')));
  assert.ok(errors.some((e) => e.includes('Duplicate')));
  assert.ok(errors.some((e) => e.includes('active parameters')));
});
test('dataset JS is data-only and round-trips dangerous HTML strings safely', () => {
  const data = repaired(), js = dataScript(data);
  assert.equal(js.includes('<'), false);
  assert.deepEqual(parseDataScript(js), data);
});
test('parser refuses arbitrary JavaScript rather than evaluating it', () => {
  globalThis.__solthara_test_execution = false;
  assert.throws(() => parseDataScript('globalThis.__solthara_test_execution=true;'));
  assert.throws(() => parseDataScript('window.__LLM_DATA__=(function(){globalThis.__solthara_test_execution=true;})();'));
  assert.equal(globalThis.__solthara_test_execution, false);
  delete globalThis.__solthara_test_execution;
});
test('exports are deterministic and drift is detected', () => {
  const data = repaired(), js = dataScript(data), yaml = exportYaml(data);
  assert.equal(exportYaml(data), yaml);
  assert.deepEqual(verifyExports(data, js, yaml), []);
  assert.ok(verifyExports(data, js + '// extra code', yaml).length);
  assert.ok(verifyExports(data, js, yaml + '# stale').length);
});
test('Git blob hashes include the correct object header', () => {
  assert.equal(gitBlobSha('test content\n'), 'd670460b4b4aece5915caf5c68d12f560a9fe3e4');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('regression checks reject tampered audit-marked data', () => {
  const data = repaired(); data.models[0].yichen.norm = 'RMSNorm';
  assert.throws(() => assertValid(data, { corrected: true }), /GPT-2 regression/);
  assert.throws(() => repairDataset(data), /GPT-2 regression/);
});

test('literal None in normalized numeric fields is logged as null, not guessed', () => {
  const original = fixture();
  original.models[1].yichen.depth = 'None';
  original.models[1].architecture.hidden_size = 'None';
  original.models[1].architecture.raw_config.literal = 'None';
  const { data, changes } = repairDataset(original);
  assert.equal(data.models[1].yichen.depth, null);
  assert.equal(data.models[1].architecture.hidden_size, null);
  assert.equal(data.models[1].architecture.raw_config.literal, 'None');
  assert.ok(changes.some((c) => c.record_id === 'unknown-example' && c.path === 'yichen.depth' && c.before === 'None' && c.after === null));
});
test('matrix display regressions cannot hide behind correct filter values', () => {
  const data = repaired(); data.models[0].yichen.bias_display = 'undisclosed';
  assert.throws(() => assertValid(data, { corrected: true }), /bias_display/);
});
