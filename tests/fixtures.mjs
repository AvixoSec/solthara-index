// Synthetic regression data, NOT a copy of the full Solthara dataset.
export function fixture() {
  return {
    version: '2.4', license: 'Apache 2.0', generated_at: '2026-09-01T09:58:27.088704Z', total_models: 2,
    stats: { total: 2, milestones_count: 3, training_inferred: 60 },
    models: [
      {
        model_id: 'gpt-2-xl-1-5b', model_name: 'GPT-2 XL 1.5B', company: 'OpenAI', release_date: '2019-11-05',
        architecture: { raw_config: { model_type: 'gpt2', n_layer: 48, n_embd: 1600, n_head: 25, vocab_size: 50257, activation_function: 'gelu_new', layer_norm_epsilon: 0.00001 }, raw_config_source: 'test-fixture', attention: { primary: 'mha', label: 'MHA' } },
        yichen: { vocab: 50257, depth: 48, dim: 1600, norm: 'RMSNorm', pos_emb: 'RoPE', activation: 'SwiGLU', parallel_layer: 'Serial', pre_norm: 'Pre', attn_type: 'mha', bias_display: 'undisclosed', tied_display: 'undisclosed', qk_norm: '—', sliding: '—' },
        math_tricks: { hidden_act: 'silu', attention_bias: null, attention_bias_display: 'undisclosed', tie_word_embeddings: null, tie_display: 'undisclosed', rope_theta: 10000, rms_norm_eps: 0.00001 },
        scale: { total_params: 1500000000 }, training: { overall_status: 'mixed', tokens: { value: 10, unit: 'billion' } },
      },
      { model_id: 'unknown-example', model_name: 'Unknown fixture', company: 'None', release_date: null, yichen: { vocab: null, depth: null, dim: null }, architecture: { raw_config: { nested: { preserve: ['<script>', '<!--', '</ScRiPt><script>window.pwned=true</script>'] } } }, training: { overall_status: 'inferred' } },
    ],
    milestones: [
      { id: 'llama1-2023', name: 'LLaMA 65B', date: '2023-02-24', arch: 'Dense • GQA • RMSNorm • SwiGLU • RoPE θ=10k', params: '65B', org: 'Meta', ctx: '2k' },
      { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', date: '2024-01-08', arch: 'MoE', org: 'Mistral AI', ctx: '64K' },
      { id: 'chinchilla-2022', name: 'Chinchilla', date: '2022-03-29', arch: 'Dense • GQA precursor', org: 'DeepMind', params: '70B' },
    ],
  };
}
