# Solthara Index

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Models](https://img.shields.io/badge/Models-101%20Architectures-6366f1.svg)](#)
[![Milestones](https://img.shields.io/badge/Milestones-15%20Key%20Models-10b981.svg)](#)
[![Data Format](https://img.shields.io/badge/Data-JSON%20%7C%20YAML-06b6d4.svg)](#)

Structured dataset and offline viewer for LLM architectures from 2017 to 2026. Covers 101 modern models and 15 foundational milestones.

---

## Overview

- **Web interface (index.html)**: Single-page app with full-text search, architecture filters (Dense, Sparse MoE, Hybrid, Recurrent), 7-tab modal for model inspection, and a sortable 19-column parameter matrix.
- **Dataset (ll-configs.json / models.yml)**: Specifications covering vocabulary, layer count, hidden dimensions, normalization placement, positional encodings, activation functions, attention mechanisms, training compute/tokens, and primary source links.
- **Theory section**: Reference tables for optimizers (AdamW vs Muon), empirical scaling laws, test-time learning methods (TTL, TTT, Titans), and tokenizers.
- **Zero build dependencies**: Runs directly in the browser without bundlers or server runtimes.

---

## Files

`	ext
index.html              # Standalone web viewer
all-configs.json        # Full dataset in JSON format
all-configs.js          # JavaScript wrapper for local browser loading
models.yml              # YAML export of the 19-column matrix
images/                 # Architecture diagram mirror utilities
NOTICE                  # Third-party attributions
LICENSE                 # Apache License 2.0
`

---

## Data Sources & References

Data is compiled from papers, model repositories, and existing open-source collections:

- Architecture diagrams: [rasbt/llm-architecture-gallery](https://github.com/rasbt/llm-architecture-gallery)
- 19-column architecture matrix format: [YichenZW/llm-arch-table](https://github.com/YichenZW/llm-arch-table)
- Theory and architecture notes: [Superposition09m/Awesome-LM-Architecture](https://github.com/Superposition09m/Awesome-LM-Architecture)

Citation:
`	ext
Solthara Index Contributors (2026). Solthara Index: Open Neural Architecture Observatory (2017-2026), Version 2.4.
`

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).\n