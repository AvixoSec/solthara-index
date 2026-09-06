import test from 'node:test';
import assert from 'node:assert/strict';
import { repairDataset, inspectDataset } from '../scripts/lib/data.mjs';
import { fixture } from './fixtures.mjs';
const extra = (raw, architecture = {}) => ({ model_id: 'extra', model_name: 'Extra fixture', architecture: { ...architecture, raw_config_source: 'fixture/config.json', raw_config: raw } });
test('nested language dimensions take precedence over vision/root values', () => {
  const input = fixture(); input.models.push(extra({ hidden_size: 1024, text_config: { hidden_size: 5376, num_hidden_layers: 62, head_dim: 128, attention_bias: false, hidden_act: 'gelu' }, vision_config: { hidden_size: 1152 } }, { head_dim: 168 }));
  const m = repairDataset(input).data.models.at(-1);
  assert.equal(m.yichen.dim, 5376); assert.equal(m.architecture.head_dim, 128); assert.equal(m.architecture.hidden_size_source, 'text_config.hidden_size'); assert.equal(m.math_tricks.attention_bias, false);
  assert.deepEqual(m.architecture.raw_config, input.models.at(-1).architecture.raw_config);
});
test('absent config flags stay unknown', () => {
  const input = fixture(); input.models.push(extra({ model_type: 'unknown' }));
  const m = repairDataset(input).data.models.at(-1); assert.equal(m.math_tricks, undefined); assert.equal(m.yichen, undefined);
});
test('MLA uses explicit component dimensions, not hidden size divided by heads', () => {
  const input = fixture(); input.models.push(extra({ hidden_size: 7168, num_attention_heads: 128, qk_nope_head_dim: 128, qk_rope_head_dim: 64, v_head_dim: 128 }, { head_dim: 56 }));
  const m = repairDataset(input).data.models.at(-1); assert.equal(m.architecture.head_dim, null); assert.equal(m.architecture.qk_nope_head_dim, 128); assert.equal(m.architecture.qk_rope_head_dim, 64); assert.equal(m.architecture.v_head_dim, 128);
});
test('xLSTM aliases and position are corrected without inventing context/training', () => {
  const input = fixture(); const model = extra({ model_type: 'xlstm', embedding_dim: 4096, num_blocks: 32, num_heads: 8, vocab_size: 50304 }); model.model_id = 'xlstm-7b'; model.context = { is_unlimited: true, length: null }; model.training = { overall_status: 'inferred' }; input.models.push(model);
  const m = repairDataset(input).data.models.at(-1); assert.equal(m.yichen.depth, 32); assert.equal(m.yichen.dim, 4096); assert.equal(m.yichen.pos_emb, 'None (recurrent)'); assert.equal(m.math_tricks.attention_bias_display, 'not applicable'); assert.equal(m.architecture.num_attention_heads, undefined); assert.deepEqual(m.context, model.context); assert.deepEqual(m.training, model.training);
});
test('Gemini and references retain auditable corrections and idempotency', () => {
  const input = fixture(); input.milestones.push({ id: 'gemini-2023', date: '2023-12-06', params: '~1.5T est.', arch: 'Dense hybrid • MHA' });
  input.theory = { literature: [{ title: 'Muon Optimizer', url: 'https://arxiv.org/abs/2402.10002' }], short_conv: [{ name: 'Hippo / S4', paper: '2212.14052' }] }; input.provenance = { training_coverage: '41/101 verified' };
  const { data } = repairDataset(input); assert.equal(data.milestones.at(-1).params, 'Undisclosed'); assert.equal(data.theory.literature[0].url, 'https://kellerjordan.github.io/posts/muon/'); assert.equal(data.theory.short_conv[0].paper, '2111.00396'); assert.match(data.provenance.training_coverage, /0 fully verified, 1 mixed, 1 inferred/); assert.ok(data._solthara_audit.dataset_changes.length); assert.deepEqual(repairDataset(data).data, data);
});
test('validation rejects tampering with a projected dimension', () => {
  const input = fixture(); input.models.push(extra({ text_config: { hidden_size: 512 } })); const { data } = repairDataset(input); data.models.at(-1).yichen.dim = 1024; assert.ok(inspectDataset(data, { corrected: true }).errors.some((e) => e.includes('raw-config projection')));
});
