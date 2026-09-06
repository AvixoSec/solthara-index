# VECTOR implementation notes

See [README.md](README.md) for setup and [RESEARCH-AUDIT.md](RESEARCH-AUDIT.md) for the correction scope.

- Registry, gallery, 19-column matrix, timeline, theory and comparison share the canonical full records.
- Dossier tabs: Overview, Architecture, Math & config, Training, Benchmarks, Theory, Sources, Raw JSON.
- Native dialogs support Escape, focus restoration and keyboard tab navigation. Comparison accepts at most three models.
- JSON downloads retain complete records even when raw on-screen previews are capped.
- External image failures show labeled configuration maps, not invented replicas.
- Missing/empty data produces an explicit error; no fixture models are silently substituted.
- The split page uses ordered deferred scripts. The standalone page embeds the complete data, application and CSS. Dataset loading is not lazy or code-split.
- The scoped-audit notice does not imply all model facts are verified. Source assertions and independently checked corrections are distinguished in audit metadata.

`npm test` exercises data/export/HTML regressions. CI validates the full dataset, checks generated-artifact drift and runs every dossier tab and the principal browser flows. Browser reports are automated functional evidence, not scientific or manual visual certification. Historical reports remain archived rather than being reused as passing results.
