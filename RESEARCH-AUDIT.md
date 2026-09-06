# Research and data-integrity audit

Revision: `2026-09-06.1`. Original snapshot: `30a2ea0f117d37fc24a64f2eb4a69229d635169a`.

The complete canonical input was read in GitHub Actions: 101 models, 15 milestones, 14,009,997 bytes; SHA-256 `5054ceb0133b4eb6249d31f5e47c10d6d8d043cf69f81bfc4b73b1b7832a4de8`.

## Primary-source corrections

- **GPT-2 XL:** LayerNorm, learned absolute positional embeddings, GELU/`gelu_new`, attention biases and tied token/output embeddings. Dimensions are 48 layers, 1600 hidden units, 50,257 vocabulary entries. Sources: [original OpenAI implementation](https://github.com/openai/gpt-2/blob/9b63575ef42771a015060c964af2c3da4cf7c8ab/src/model.py), [pinned XL configuration](https://huggingface.co/openai-community/gpt2-xl/blob/cefd64e6208bcba99d6e3f55ff78cca372c1a46f/config.json).
- **Original LLaMA 65B:** MHA, not GQA. [Llama 2 paper, Table 1](https://arxiv.org/pdf/2307.09288) distinguishes Llama 1 and Llama 2 variants.
- **Chinchilla:** remove the unsupported “GQA precursor” label. [The paper](https://arxiv.org/pdf/2203.15556) describes the Gopher-based architecture and its differences.
- **Mixtral 8x22B:** 2024-04-17 is the [official announcement](https://mistral.ai/news/mixtral-8x22b), not 2024-01-08. The date basis is explicit; it is not claimed to be the first availability of base weights.
- **Gemini 1.0 Ultra:** parameter count is undisclosed, not an unsourced 1.5T specification. The [technical report](https://storage.googleapis.com/deepmind-media/gemini/gemini_1_report.pdf) describes multimodal Transformer decoders, efficient attention such as MQA at the family level, and training with 32,768-token sequences. Exact Ultra attention details are not newly inferred. Gemini 1.5 results are kept separate.
- **xLSTM 7B:** 32 recurrent blocks, embedding dimension 4096, no rotary positional transform, RMS pre-norm with head-wise LayerNorm, SwiGLU, and gate biases distinct from projection biases. Sources: [implementation](https://github.com/NX-AI/xlstm/blob/c98d429ad970d20e4fa77f5f7c4059f47e54c6c5/xlstm/xlstm_large/model.py), [config](https://huggingface.co/NX-AI/xLSTM-7b/raw/main/config.json), [paper](https://arxiv.org/html/2503.13427v1). No new fixed context limit or training-corpus claim is inferred.
- **References:** Muon now links to the [original write-up](https://kellerjordan.github.io/posts/muon/), not arXiv:2402.10002 (MM-Point). HiPPO/S4 links to [S4](https://arxiv.org/abs/2111.00396), with [HiPPO foundations](https://arxiv.org/abs/2008.07669), not arXiv:2212.14052 (H3). The Titans title no longer carries an inconsistent year suffix.

## Mechanical normalization, not new scientific verification

Explicit numeric dimensions and mathematical flags already present in saved `raw_config` are projected into normalized fields. Nested `text_config` takes precedence over vision/root dimensions. Missing flags are not filled from generic Transformer defaults. MLA component dimensions are retained explicitly rather than treating `hidden_size / heads` as a universal head size.

These changes cite the preserved original dataset and name the raw field path. That establishes reproducible local provenance, not independent verification that every upstream config or model claim is correct. Training labels remain inherited; “mixed” records are no longer counted as fully verified in the coverage description.

Every changed field has before/after values, sources and a reason in `_solthara_audit`. Raw configurations, unrelated records/fields, training data assertions and uncertainty labels are retained. Missing numeric values export as YAML `null`, never Python-style `None` strings.

## Verification and remaining limits

`audit/verification.json` links the actual repair run. `audit/current-integrity.json` contains output hashes. The read-only CI validates all records and exports, builds both site formats, and exercises every model's eight dossier tabs plus main interaction flows.

A successful structural/build/browser run **does not scientifically certify all 101 models**, their parameter estimates, training corpora, context-window claims, licenses or benchmark scores. Other per-model and theory assertions still need independent source review. Browser tests block external requests for deterministic fallback behavior; they do not certify external image availability or production-network performance. No lazy loading or measured production speedup is claimed.

Historical QA reports remain under `audit/legacy/`; root report files are pointers, not reused claims that current tests passed. The backup branch preserves the original release.
