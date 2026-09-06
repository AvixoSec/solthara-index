// Explicit projections of saved configs are not independent scientific verification.
export const EXTENDED_SOURCES = {
  geminiReport: 'https://storage.googleapis.com/deepmind-media/gemini/gemini_1_report.pdf',
  muon: 'https://kellerjordan.github.io/posts/muon/',
  s4: 'https://arxiv.org/abs/2111.00396',
  hippo: 'https://arxiv.org/abs/2008.07669',
  titans: 'https://arxiv.org/abs/2501.00663',
  xlstmConfig: 'https://huggingface.co/NX-AI/xLSTM-7b/raw/main/config.json',
  xlstmCode: 'https://github.com/NX-AI/xlstm/blob/c98d429ad970d20e4fa77f5f7c4059f47e54c6c5/xlstm/xlstm_large/model.py',
  xlstmPaper: 'https://arxiv.org/html/2503.13427v1',
};
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const positive = (v) => Number.isInteger(v) && v > 0;
const dimensions = ['vocab_size', 'hidden_size', 'num_hidden_layers', 'num_attention_heads', 'num_key_value_heads', 'head_dim', 'intermediate_size'];
const matrix = [['vocab_size', 'vocab'], ['hidden_size', 'dim'], ['num_hidden_layers', 'depth']];
export function repairExtended(data, models, set) {
  for (const model of models) {
    const raw = model.architecture?.raw_config;
    if (!object(raw) || !model.architecture?.raw_config_source) continue;
    const nested = object(raw.text_config), text = nested ? raw.text_config : raw;
    const prefix = nested ? 'text_config.' : '';
    const project = (path, key, value = text[key]) => set(model, path, value, ['inspectedDataset'], `Mechanical projection from preserved raw_config.${prefix}${key}; not independent upstream verification.`);
    for (const key of dimensions) if (positive(text[key])) project(`architecture.${key}`, key);
    for (const [key, column] of matrix) if (positive(text[key])) project(`yichen.${column}`, key);
    if (positive(text.hidden_size)) set(model, 'architecture.hidden_size_source', prefix + 'hidden_size', ['inspectedDataset'], 'Record the language-config path, not a vision-config field.');
    for (const key of ['rms_norm_eps', 'rope_theta', 'attention_dropout', 'initializer_range']) if (typeof text[key] === 'number' && Number.isFinite(text[key])) project(`math_tricks.${key}`, key);
    if (typeof text.hidden_act === 'string') project('math_tricks.hidden_act', 'hidden_act');
    for (const key of ['attention_bias', 'tie_word_embeddings']) if (typeof text[key] === 'boolean') project(`math_tricks.${key}`, key);
    if (typeof text.attention_bias === 'boolean') {
      const value = text.attention_bias ? 'with bias' : 'no bias';
      project('math_tricks.attention_bias_display', 'attention_bias', value);
      project('yichen.bias_display', 'attention_bias', value);
    }
    if (typeof text.tie_word_embeddings === 'boolean') {
      const value = text.tie_word_embeddings ? 'tied' : 'untied';
      project('math_tricks.tie_display', 'tie_word_embeddings', value);
      project('yichen.tied_display', 'tie_word_embeddings', value);
    }
    if (!positive(text.head_dim) && positive(text.qk_nope_head_dim) && positive(text.qk_rope_head_dim) && positive(text.v_head_dim)) {
      set(model, 'architecture.head_dim', null, ['inspectedDataset'], 'MLA has separate query/key/value dimensions; hidden_size/heads is not an explicit common head dimension.');
      for (const key of ['qk_nope_head_dim', 'qk_rope_head_dim', 'v_head_dim']) project(`architecture.${key}`, key);
    }
  }
  const xlstm = models.find((m) => m.model_id === 'xlstm-7b');
  if (xlstm) {
    const raw = xlstm.architecture?.raw_config;
    if (raw?.model_type !== 'xlstm' || raw?.num_blocks !== 32 || raw?.embedding_dim !== 4096 || raw?.num_heads !== 8) throw new Error('xLSTM configuration differs from inspected source.');
    for (const [path, value] of Object.entries({
      'architecture.num_hidden_layers': 32, 'architecture.hidden_size': 4096,
      'architecture.hidden_size_source': 'embedding_dim', 'architecture.layer_mix.total_layers': 32,
      'architecture.recurrent_heads': 8, 'yichen.depth': 32, 'yichen.dim': 4096,
      'yichen.norm': 'RMSNorm + head-wise LayerNorm', 'yichen.pos_emb': 'None (recurrent)',
      'yichen.activation': 'SwiGLU', 'yichen.bias_display': 'Mixed (gate biases)',
      'math_tricks.attention_bias': null, 'math_tricks.attention_bias_display': 'not applicable',
      'math_tricks.hidden_act': 'silu',
    })) set(xlstm, path, value, ['xlstmCode', 'xlstmConfig', 'xlstmPaper'], 'xLSTM implementation/config: 32 recurrent blocks, dimension 4096, no rotary positional transform; gate biases differ from projection biases.');
  }
  const gemini = data.milestones.find((m) => m.id === 'gemini-2023');
  if (gemini) {
    set(gemini, 'params', 'Undisclosed', ['geminiReport'], 'The report does not disclose an Ultra parameter count; the unsourced 1.5T estimate is not a specification.');
    set(gemini, 'arch', 'Multimodal Transformer decoder; efficient attention (e.g. MQA)', ['geminiReport'], 'Use family-level report wording, not an unsupported Dense hybrid / MHA classification.');
    set(gemini, 'note', 'Gemini 1.0 supports a trained sequence length of 32,768 tokens. Gemini 1.5 long-context results refer to a different model generation.', ['geminiReport'], 'Separate the 1.0 milestone from later family results.');
  }
  if (Array.isArray(data.theory?.literature)) set(data, 'theory.literature', data.theory.literature.map((entry) => {
    if (entry.url === 'https://arxiv.org/abs/2402.10002' && /Muon/.test(entry.title ?? '')) return { ...entry, url: EXTENDED_SOURCES.muon };
    if (entry.url === EXTENDED_SOURCES.titans && /Titans/.test(entry.title ?? '')) return { ...entry, title: 'Titans: Learning to Memorize at Test Time' };
    return entry;
  }), ['muon', 'titans'], 'Fix Muon reference (old ID is MM-Point) and use the Titans title without an inconsistent year.');
  if (Array.isArray(data.theory?.short_conv)) set(data, 'theory.short_conv', data.theory.short_conv.map((entry) => entry.name === 'Hippo / S4' && entry.paper === '2212.14052' ? { ...entry, name: 'HiPPO / S4', paper: '2111.00396', idea: 'Structured state-space model with HiPPO-based initialization', use: 'Long-sequence modeling; see S4 and HiPPO foundations' } : entry), ['s4', 'hippo'], 'The original 2212.14052 paper is H3, not HiPPO/S4.');
  if (typeof data.provenance?.training_coverage === 'string') {
    const counts = { verified: 0, mixed: 0, inferred: 0, other: 0 };
    for (const model of models) { const status = model.training?.overall_status ?? model.training?.verified_status; counts[Object.hasOwn(counts, status) ? status : 'other']++; }
    set(data, 'provenance.training_coverage', `Inherited labels: ${counts.verified} fully verified, ${counts.mixed} mixed, ${counts.inferred} inferred, ${counts.other} other. Not newly independently verified training claims.`, ['inspectedDataset'], 'Mixed training records are not fully verified records.');
  }
}
export function inspectExtended(data, models) {
  const errors = [];
  for (const model of models) {
    const raw = model.architecture?.raw_config;
    if (!object(raw) || !model.architecture?.raw_config_source) continue;
    const text = object(raw.text_config) ? raw.text_config : raw;
    for (const key of dimensions) if (positive(text[key]) && model.architecture[key] !== text[key]) errors.push(`${model.model_id}: raw-config projection mismatch for architecture.${key}.`);
    for (const [key, column] of matrix) if (positive(text[key]) && model.yichen?.[column] !== text[key]) errors.push(`${model.model_id}: raw-config projection mismatch for yichen.${column}.`);
  }
  const xlstm = models.find((m) => m.model_id === 'xlstm-7b');
  if (xlstm && (xlstm.yichen?.dim !== 4096 || xlstm.yichen?.depth !== 32 || xlstm.yichen?.pos_emb !== 'None (recurrent)')) errors.push('xLSTM architecture regression.');
  const gemini = data.milestones?.find((m) => m.id === 'gemini-2023');
  if (gemini && (gemini.params !== 'Undisclosed' || /Dense hybrid|\bMHA\b/.test(gemini.arch ?? ''))) errors.push('Gemini undisclosed-size/architecture regression.');
  if (data.theory?.literature?.some((m) => /Muon/.test(m.title ?? '') && m.url === 'https://arxiv.org/abs/2402.10002')) errors.push('Muon unrelated reference regression.');
  return errors;
}
