# Solthara Index — Open Neural Architecture Observatory (2017→2026)

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Models](https://img.shields.io/badge/Models-101%20Architectures-6366f1.svg)](#)
[![Milestones](https://img.shields.io/badge/Milestones-15%20Key%20Models-10b981.svg)](#)
[![Data Format](https://img.shields.io/badge/Data-JSON%20%7C%20YAML-06b6d4.svg)](#)

**Solthara Index** is an open-source database and interactive visual observatory of Large Language Model (LLM) architectures spanning from the original Transformer (2017) to frontier models (2024–2026).

---

## 🌟 Key Features

- 🔍 **Interactive Web Observatory (`index.html`)**:
  - Live full-text search (`Ctrl+K` shortcut).
  - Multi-criteria filtering by Era (2017–2020, 2021–2023, 2024–2026), Architecture/Decoder (Dense, Sparse MoE, Hybrid, Recurrent/SSM), Attention Bias, Tied Embeddings, and Company.
  - Deep-dive modal with 7 detailed tabs: *Overview, Architecture, Math Specs, Training, Benchmarks, Theory, Sources*.
- 📊 **19-Dimensional Model Architecture Matrix**:
  - Full architectural parameter matrix with sortable columns: `Vocab`, `Depth`, `Dim`, `Norm`, `Parallel`, `Pre-norm`, `Pos.Emb`, `Activation`, `Attn`, `Ctx`, `MoE`, `Bias`, `Tied`, `QK-Norm`, `Sliding`, and `Stability`.
- 🧠 **Theoretical Foundations Strip**:
  - In-depth comparison of modern optimizers (AdamW vs Muon).
  - Empirical scaling laws (Chinchilla, Kaplan).
  - Test-Time Learning (TTL, TTT, Titans, MTP).
  - Tokenizers, Residual & Hyper-connections, Short Convolutions, and cross-domain literature.
- 📑 **Transparent Provenance & Verification**:
  - Per-field split for training dataset, hardware, compute, and token counts with granular status (`verified`, `mixed`, `inferred`, `undisclosed`) and confidence scores.
- 💾 **Dual-Format Machine-Readable Data**:
  - Available as [`all-configs.json`](./all-configs.json), [`all-configs.js`](./all-configs.js), and [`models.yml`](./models.yml).
  - 100% offline-compatible: open `index.html` directly in any web browser without needing a backend or build step.
- 🖼️ **Robust Image Fallback System**:
  - Seamless multi-tier diagram loading (Remote Gallery → Local Mirror → Generative SVG Topology).
  - Includes [`images/mirror.py`](./images/mirror.py) utility for local image vendoring.

---

## 🚀 Quick Start

### Option 1: Open Locally (Offline-Ready)
Simply double-click [`index.html`](./index.html) or open it directly in any browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option 2: Run via Local HTTP Server
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```
Then navigate to `http://localhost:8000`.

### Option 3: GitHub Pages Deployment
You can publish this repository directly via GitHub Pages:
1. Push this repository to GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** → branch `main` / `master` (root folder `/`).
4. Your site will be live instantly!

---

## 📁 Repository Structure

```text
├── index.html              # Standalone interactive single-page application (UI & logic)
├── all-configs.json        # Complete structured dataset (101 models + 15 milestones + theory)
├── all-configs.js          # JavaScript data bundle (window.__LLM_DATA__) for zero-CORS local viewing
├── models.yml              # Clean YAML export of the model catalog
├── README.md               # Project documentation and quick start guide
├── NOTICE                  # Third-party attributions and credits
├── LICENSE                 # Apache License 2.0
├── .gitignore              # Git ignore rules
└── images/
    ├── README.md           # Documentation on image fallback & mirroring
    ├── mirror.py           # Python script to download & vendor architecture diagrams
    └── architectures/      # Local image directory for mirrored .webp diagrams
```

---

## 📜 Citations & Attributions

Solthara Index compiles and synthesizes architecture metadata from academic papers, technical reports, and authoritative open-source repositories:

1. **Architecture Diagrams & Raschka Gallery**:
   - Sebastian Raschka — [rasbt/llm-architecture-gallery](https://github.com/rasbt/llm-architecture-gallery)
2. **19-Column Architecture Dimensions**:
   - YichenZW — [YichenZW/llm-arch-table](https://github.com/YichenZW/llm-arch-table)
3. **Theory, Scaling Laws & TTL Analysis**:
   - Superposition09m — [Superposition09m/Awesome-LM-Architecture](https://github.com/Superposition09m/Awesome-LM-Architecture)

If you use this dataset or visualization in your research or project, please cite:
```text
Solthara Index Contributors (2026). Solthara Index: Open Neural Architecture Observatory (2017-2026), Version 2.4.
```

---

## ⚖️ License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](./LICENSE) and [NOTICE](./NOTICE) files for full details.
