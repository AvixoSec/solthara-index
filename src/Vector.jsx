/* Solthara VECTOR v2. Apache-2.0. Complete repository records, unchanged. */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './vector.css';
const REPO = 'https://github.com/AvixoSec/solthara-index';
const ICONS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16M3 15h18" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  external: <path d="M6 18 18 6M6 6h12v12" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1" />
      <path d="m3 17 6-6 4 4 3-3 5 5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  book: <path d="M12 5C8 3 4 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1v15" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7v1" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </>
  ),
  compare: <path d="M8 3v18M16 3v18M4 7l4-4 4 4M12 17l4 4 4-4" />,
  zoom: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6M7 10h6M10 7v6" />
    </>
  ),
  mark: (
    <>
      <path d="m12 2 10 6v9l-10 5-10-5V8Z" />
      <path d="m2 8 10 6 10-6M12 14v8M7 5l10 6v8" />
    </>
  ),
};
function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.mark}
    </svg>
  );
}
const get = (o, p) => p.split('.').reduce((v, k) => v?.[k], o),
  absent = (v) => v === null || v === undefined || v === '';
const num = (v) =>
  absent(v)
    ? '—'
    : typeof v === 'number'
      ? v.toLocaleString('en-US', { maximumSignificantDigits: 15 })
      : String(v);
function compact(v) {
  if (absent(v)) return '—';
  if (typeof v !== 'number') return String(v);
  for (const [n, s] of [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ])
    if (Math.abs(v) >= n) return (v / n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + s;
  return num(v);
}
const human = (s) =>
  String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
const attention = (m) =>
  ({
    gqa: 'GQA',
    mla: 'MLA',
    gated_deltanet: 'DeltaNet',
    mha: 'MHA',
    sliding_window: 'Sliding',
    other: 'Other',
  })[get(m, 'architecture.attention.primary')] ||
  get(m, 'architecture.attention.primary') ||
  '—';
const effective = (m) =>
    get(m, 'context.effective_length') ??
    get(m, 'context.recommended_context') ??
    get(m, 'context.advertised_context.value') ??
    get(m, 'context.length'),
  params = (m) => get(m, 'scale.total_params');
const contextText = (m) => (get(m, 'context.is_unlimited') ? 'Unlimited' : compact(effective(m)));
const date = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d)
    ? String(v)
    : d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
};
const val = (v) =>
  absent(v)
    ? '—'
    : typeof v === 'boolean'
      ? v
        ? 'Yes'
        : 'No'
      : Array.isArray(v)
        ? v.map(val).join(' · ')
        : typeof v === 'object'
          ? JSON.stringify(v)
          : num(v);
function safeUrl(u) {
  if (typeof u !== 'string') return '';
  try {
    const x = new URL(u);
    return ['http:', 'https:'].includes(x.protocol) ? x.href : '';
  } catch {
    return '';
  }
}
function originalImage(m) {
  const u = typeof m.image === 'string' ? m.image : m.image?.url;
  return typeof u === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(u)
    ? u
    : safeUrl(u);
}
function figureCandidates(m) {
  const u = originalImage(m),
    local = m.image?.local_path,
    list = [];
  if (local && /^(?:\.\/)?images\/[\w./-]+$/.test(local) && !local.includes('..')) list.push(local);
  if (u) list.push(u);
  if (u) {
    try {
      const n = new URL(u).pathname.split('/').pop();
      if (/^[\w.-]+\.(webp|png|jpe?g)$/i.test(n)) list.push('images/architectures/' + n);
    } catch {}
  }
  return [...new Set(list)];
}
function Link({ href, children, className = '', ...rest }) {
  const u = safeUrl(href);
  return u ? (
    <a href={u} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  );
}
function download(value, name) {
  const u = URL.createObjectURL(
    new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], {
      type: 'application/json;charset=utf-8',
    }),
  );
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}
function Badge({ children, tone = '' }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
function Status({ field = {} }) {
  const s = field.status || field.verified_status || 'not stated';
  return (
    <span
      className={'status status-' + s}
      title="Assessment from the original dataset, not a new audit"
    >
      {s}
      {typeof field.confidence === 'number' ? ' · ' + field.confidence.toFixed(2) : ''}
    </span>
  );
}
function Stats({ items, className = '' }) {
  return (
    <dl className={'stats-grid ' + className}>
      {items.map(([k, v, n]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
          {n && <p>{n}</p>}
        </div>
      ))}
    </dl>
  );
}
function Note({ children, kind = '' }) {
  return (
    <div className={'notice ' + kind}>
      <Icon name="info" />
      <div>{children}</div>
    </div>
  );
}
function KeyValues({ items }) {
  return (
    <dl className="key-values">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{val(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
function Raw({ value, filename = 'record.json' }) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]),
    limited = text.length > 160000;
  return (
    <section className="raw-section">
      <div className="section-title">
        <div>
          <h3>Machine-readable record</h3>
          <p>Original keys and values. No enrichment or silent corrections.</p>
        </div>
        <button className="button" onClick={() => download(value, filename)}>
          <Icon name="download" />
          Download JSON
        </button>
      </div>
      {limited && (
        <Note>
          The on-screen preview is limited to 160,000 characters for performance. The download
          contains the complete record.
        </Note>
      )}
      <pre className="code-block" tabIndex="0">
        {limited ? text.slice(0, 160000) + '\n… preview ends here' : text}
      </pre>
    </section>
  );
}
function ConfigMap({ model: m, large = false }) {
  const a = m.architecture || {},
    moe = a.moe || {},
    experts = moe.n_routed_experts ?? moe.num_experts ?? moe.num_local_experts,
    active = moe.num_experts_per_tok ?? moe.num_selected_experts;
  const mechanism = a.decoder_type === 'recurrent' ? 'Recurrent mixing' : attention(m);
  return (
    <div
      className={'config-map local-map ' + (large ? 'large' : '')}
      role="img"
      aria-label={`${m.model_name}: simplified configuration map, ${num(a.num_hidden_layers)} layers and ${num(a.hidden_size)} hidden dimension.`}
    >
      <div className="map-top">
        <span>CONFIG MAP</span>
        <b>{num(a.num_hidden_layers)}L</b>
      </div>
      <div className="map-node">
        <strong>Token embeddings</strong>
        <span>{compact(a.vocab_size)} vocabulary</span>
      </div>
      <div className="map-arrow" aria-hidden="true">
        ↓
      </div>
      <div className="map-block">
        <p>
          {a.decoder_display || human(a.decoder_type) || 'Decoder'}
          <span>× {num(a.num_hidden_layers)}</span>
        </p>
        <div className="map-attention">
          {mechanism}
          {a.num_attention_heads ? <span>{num(a.num_attention_heads)} heads</span> : null}
        </div>
        <div className="map-arrow inner" aria-hidden="true">
          ↓
        </div>
        <div className="map-ffn">
          {experts ? (
            <>
              {absent(active) ? '?' : num(active)} / {num(experts)} experts
            </>
          ) : (
            <>{m.yichen?.activation || m.math_tricks?.hidden_act || 'Feed-forward'}</>
          )}
        </div>
      </div>
      <div className="map-arrow" aria-hidden="true">
        ↓
      </div>
      <div className="map-node output">
        <strong>Output projection</strong>
      </div>
      <div className="map-foot">
        <span>{num(a.hidden_size)} hidden</span>
        <span>Simplified</span>
      </div>
    </div>
  );
}

function Figure({ model: m, onZoom, large = false, initialMode = 'source' }) {
  const [mode, setMode] = useState(initialMode),
    [candidate, setCandidate] = useState(0),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    candidates = useMemo(() => figureCandidates(m), [m]);
  useEffect(() => {
    setCandidate(0);
    setLoaded(false);
    setFailed(!candidates.length);
    setMode(initialMode);
  }, [m, initialMode, candidates]);
  const fail = () => {
    if (candidate + 1 < candidates.length) setCandidate(candidate + 1);
    else setFailed(true);
  };
  return (
    <figure className={'model-figure ' + (large ? 'figure-large' : '')} data-figure={m.model_id}>
      <div className="figure-head">
        <span>
          <Icon name="image" />
          Architecture
        </span>
        <div className="segmented small" role="group" aria-label="Diagram type">
          <button aria-pressed={mode === 'source'} onClick={() => setMode('source')}>
            Source
          </button>
          <button aria-pressed={mode === 'map'} onClick={() => setMode('map')}>
            Local map
          </button>
        </div>
      </div>
      <div className={'figure-stage ' + (loaded && mode === 'source' ? 'has-source' : '')}>
        {(mode === 'map' || failed || !loaded) && <ConfigMap model={m} large={large} />}{' '}
        {mode === 'source' && !failed && candidates[candidate] && (
          <img
            key={candidates[candidate]}
            className={loaded ? 'source-figure' : 'source-figure loading'}
            src={candidates[candidate]}
            referrerPolicy="no-referrer"
            alt={'Original architecture diagram for ' + m.model_name}
            onLoad={() => setLoaded(true)}
            onError={fail}
            onClick={onZoom ? () => onZoom(m, mode) : undefined}
            style={onZoom ? { cursor: 'zoom-in' } : undefined}
          />
        )}{' '}
        {onZoom && (
          <button
            className="figure-zoom"
            onClick={() => onZoom(m, mode)}
            aria-label={'Enlarge architecture diagram for ' + m.model_name}
          >
            <Icon name="zoom" />
            Expand
          </button>
        )}
      </div>
      <figcaption>
        {mode === 'map' ? (
          <>Simplified from this model’s configuration. Not the original figure.</>
        ) : loaded ? (
          <>
            Original figure ·{' '}
            <Link href={originalImage(m)}>
              Sebastian Raschka <Icon name="external" size={14} />
            </Link>
          </>
        ) : failed ? (
          <>Source image unavailable. A labeled local configuration map is shown.</>
        ) : (
          <>Loading original figure. Local configuration map shown meanwhile.</>
        )}
        {originalImage(m) && (
          <Link href={originalImage(m)} className="figure-source-link">
            Open original <Icon name="external" size={14} />
          </Link>
        )}
      </figcaption>
    </figure>
  );
}
function Thumb({ model: m }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [m]);
  const src = originalImage(m);
  return (
    <span className="model-thumb">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon name="mark" size={25} />
      )}
    </span>
  );
}
function SourceList({ sources = [] }) {
  if (!sources.length) return <Note>No links are provided in this part of the source record.</Note>;
  return (
    <div className="source-list">
      {sources.map((s, i) => (
        <article className="source-item" key={(s.url || '') + i}>
          <div className="source-kind">{human(s.kind || 'source')}</div>
          <div>
            <Link href={s.url} className="source-url">
              {s.label || s.url || 'No URL supplied'} <Icon name="external" size={16} />
            </Link>
            {s.label && s.url && <p className="source-domain">{s.url}</p>}
            <div className="source-meta">
              <Status field={s} />
              {s.repo && <span>{s.repo}</span>}
              {s.arxiv_id && <span>arXiv {s.arxiv_id}</span>}
            </div>
            {s.note && <p>{s.note}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
function collectSources(m) {
  const out = [...(m.sources || [])];
  for (const obj of [m.context, m.training])
    Object.values(obj || {}).forEach((v) => {
      if (v && typeof v === 'object' && Array.isArray(v.sources)) out.push(...v.sources);
    });
  const seen = new Set();
  return out.filter((s) => {
    const key = s.kind + '|' + s.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function LazyRaw(props) {
  const ref = useRef(null),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const p = ref.current?.closest('details');
    if (!p) return;
    const fn = () => setOpen(p.open);
    p.addEventListener('toggle', fn);
    fn();
    return () => p.removeEventListener('toggle', fn);
  }, []);
  return <div ref={ref}>{open && <Raw {...props} />}</div>;
}

function Contexts({ model: m }) {
  const c = m.context || {},
    fields = [
      ['config_context', 'Configuration'],
      ['advertised_context', 'Advertised'],
      ['native_context', 'Native'],
      ['trained_context', 'Trained'],
      ['tested_context', 'Tested'],
      ['api_context', 'API'],
    ].filter(([k]) => c[k] !== undefined);
  return (
    <section className="detail-section">
      <div className="section-title">
        <div>
          <h3>Context, without the shortcuts</h3>
          <p>Configuration, training and advertised limits are not interchangeable.</p>
        </div>
        <Badge>{contextText(m)} effective</Badge>
      </div>
      {fields.length ? (
        <div className="context-grid">
          {fields.map(([k, label]) => {
            const f = c[k] || {};
            return (
              <article className="context-item" key={k}>
                <span className="eyebrow">{label}</span>
                <strong>
                  {compact(f.value)}
                  <small>{!absent(f.value) ? ' tokens' : ''}</small>
                </strong>
                <Status field={f} />
                {f.note && <p>{f.note}</p>}
                <div className="context-source">
                  {f.source_path || f.source || 'Source not specified'}
                </div>
                {f.sources?.length > 0 && (
                  <details className="inline-details">
                    <summary>Evidence · {f.sources.length}</summary>
                    <SourceList sources={f.sources} />
                  </details>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <Note>{c.raw || 'No split context values are supplied in this record.'}</Note>
      )}
      {c.conflict && (
        <Note kind="warning">Source context conflict: {c.conflict_note || c.resolution}</Note>
      )}
    </section>
  );
}
function Overview({ model: m, onZoom }) {
  return (
    <>
      <div className="overview-grid">
        <section className="model-brief">
          <p className="eyebrow accent">Inside the model</p>
          <h3 className="brief-heading">
            {m.architecture?.decoder_display ||
              human(m.architecture?.decoder_type) ||
              'Model architecture'}
          </h3>
          <p className="summary-copy">
            {m.summary || 'No summary is supplied in the original record.'}
          </p>
          {m.highlight && (
            <div className="highlight">
              <span>What stands out</span>
              <p>{m.highlight}</p>
            </div>
          )}
          <div className="tag-row">
            {(m.tags || []).map((t) => (
              <Badge key={t}>{human(t)}</Badge>
            ))}
          </div>
        </section>
        <Figure model={m} onZoom={onZoom} />
      </div>
      <Stats
        className="four"
        items={[
          ['Total parameters', compact(params(m)), m.scale?.raw],
          [
            'Active parameters',
            compact(m.scale?.active_params),
            m.scale?.active_pct != null ? num(m.scale.active_pct) + '% active per token' : null,
          ],
          ['Effective context', contextText(m), 'See the source-specific limits below'],
          [
            'KV cache / token',
            m.kv_cache?.kib != null ? num(m.kv_cache.kib) + ' KiB' : '—',
            'BF16 · as reported in the dataset',
          ],
        ]}
      />
      <div className="overview-facts">
        <KeyValues
          items={[
            ['Lab', m.company],
            ['Release', m.release_date],
            ['Date confidence', m.date_confidence],
            ['Family', m.family],
            ['License', m.license?.spdx],
          ]}
        />
        <div className="notice compact-note">
          Release basis: {m.release_date_source || 'not supplied'}
          {m.date_note && <p>{m.date_note}</p>}
          <p>Dataset statements are preserved, not independently re-verified.</p>
        </div>
      </div>
      <Contexts model={m} />
    </>
  );
}
function Architecture({ model: m, onZoom }) {
  const a = m.architecture || {};
  return (
    <>
      <div className="architecture-grid">
        <Figure model={m} onZoom={onZoom} />
        <section>
          <p className="eyebrow accent">The structural record</p>
          <h3>Layers, heads & routing</h3>
          <KeyValues
            items={[
              ['Decoder', a.decoder_display || a.decoder_type],
              ['Model type', a.model_type],
              ['Layers', a.num_hidden_layers],
              ['Hidden dimension', a.hidden_size],
              ['Attention heads', a.num_attention_heads],
              ['KV heads', a.num_key_value_heads],
              ['Head dimension', a.head_dim],
              ['Intermediate size', a.intermediate_size],
              ['Vocabulary', a.vocab_size],
              ['Attention', a.attention?.raw || a.attention?.primary],
              ['Layer mix', a.layer_mix?.raw],
            ]}
          />
        </section>
      </div>
      <div className="two-columns detail-section">
        <section className="panel">
          <h3>Mixture of experts</h3>
          {a.moe && Object.keys(a.moe).length ? (
            <KeyValues items={Object.entries(a.moe).map(([k, v]) => [human(k), v])} />
          ) : (
            <p className="muted">No MoE configuration is supplied for this model.</p>
          )}
        </section>
        <section className="panel">
          <h3>Position & window</h3>
          <KeyValues
            items={[
              ['Maximum positions', a.max_position_embeddings],
              ['Sliding window', a.sliding_window],
              ['Architectures', a.architectures],
              ['Raw config source', a.raw_config_source],
            ]}
          />
          {a.rope && (
            <details className="inline-details">
              <summary>RoPE configuration</summary>
              <pre className="code-block">{JSON.stringify(a.rope, null, 2)}</pre>
            </details>
          )}
        </section>
      </div>
      {a.layer_types?.length > 0 && (
        <details className="panel disclosure">
          <summary>Layer sequence · {a.layer_types.length} entries</summary>
          <ol className="layer-sequence">
            {a.layer_types.map((x, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
        </details>
      )}
      <details className="panel disclosure">
        <summary>Full architecture configuration</summary>
        <LazyRaw value={a} filename={m.model_id + '-architecture.json'} />
      </details>
    </>
  );
}
function MathSpecs({ model: m }) {
  const y = m.yichen || {},
    t = m.math_tricks || {};
  return (
    <>
      <div className="section-title">
        <div>
          <h3>Mathematical & implementation details</h3>
          <p>
            The source’s architecture matrix and mathematical configuration, without flattening away
            uncertainty.
          </p>
        </div>
      </div>
      <Stats
        className="four"
        items={[
          ['Vocabulary', num(y.vocab ?? m.architecture?.vocab_size)],
          ['Depth', num(y.depth ?? m.architecture?.num_hidden_layers)],
          ['Hidden dimension', num(y.dim ?? m.architecture?.hidden_size)],
          ['Activation', y.activation || t.hidden_act || '—'],
        ]}
      />
      <div className="two-columns">
        <section className="panel">
          <h3>Block design</h3>
          <KeyValues
            items={[
              ['Normalization', y.norm],
              ['Norm placement', y.pre_norm],
              ['Parallel layers', y.parallel_layer],
              ['Position encoding', y.pos_emb],
              ['QK normalization', y.qk_norm],
              ['Attention type', y.attn_type],
              ['Sliding window', y.sliding],
              ['Stability', y.stability],
            ]}
          />
        </section>
        <section className="panel">
          <h3>Configuration flags</h3>
          <KeyValues
            items={[
              ['Attention bias', t.attention_bias],
              ['Tied embeddings', t.tie_word_embeddings],
              ['RMS norm epsilon', t.rms_norm_eps],
              ['RoPE theta', t.rope_theta],
              ['Initializer range', t.initializer_range],
              ['Attention dropout', t.attention_dropout],
              ['SwiGLU limit', t.swiglu_limit],
              ['Learnable sink', t.learnable_sink],
              ['Normalize top-k', t.norm_topk_prob],
            ]}
          />
        </section>
      </div>
      <section className="panel detail-section">
        <h3>Stability & precision notes</h3>
        <div className="tag-row">
          {t.tricks?.length ? (
            t.tricks.map((x, i) => <Badge key={i}>{x}</Badge>)
          ) : (
            <p className="muted">No extra implementation notes supplied.</p>
          )}
        </div>
        {t.rope_scaling && (
          <pre className="code-block">{JSON.stringify(t.rope_scaling, null, 2)}</pre>
        )}
      </section>
      <details className="panel disclosure">
        <summary>All mathematical fields</summary>
        <LazyRaw value={t} filename={m.model_id + '-math.json'} />
      </details>
    </>
  );
}
function Training({ model: m }) {
  const t = m.training || {};
  const field = (k, legacy) => {
    const x = t[k];
    return x && typeof x === 'object' && !Array.isArray(x)
      ? x
      : {
          value: x ?? t[legacy],
          status: t.overall_status || t.verified_status,
          confidence: t.overall_confidence ?? t.confidence,
        };
  };
  const fields = [
    ['Dataset', field('dataset')],
    ['Training tokens', field('tokens', 'tokens_b')],
    ['Hardware', field('hardware')],
    ['Compute', field('compute')],
    ['Post-training', field('post_training', 'post_training_methods')],
  ];
  return (
    <>
      <div className="section-title">
        <div>
          <p className="eyebrow accent">Training provenance</p>
          <h3>Evidence, one field at a time.</h3>
        </div>
        <Status
          field={{
            status: t.overall_status || t.verified_status,
            confidence: t.overall_confidence ?? t.confidence,
          }}
        />
      </div>
      <Note>
        Verification labels and confidence values below belong to the original dataset. “Verified”
        is not a new audit by this interface; mixed and inferred fields remain clearly marked.
      </Note>
      <div className="training-grid">
        {fields.map(([label, f]) => (
          <article className="training-card" key={label}>
            <div className="section-title">
              <h4>{label}</h4>
              <Status field={f} />
            </div>
            <p className="training-value">
              {label === 'Training tokens' && typeof f.value === 'number'
                ? compact(f.value * 1e9) + ' tokens'
                : val(f.value)}
            </p>
            {label === 'Training tokens' && !absent(f.value) && (
              <p className="muted">Source unit: billions of tokens · {num(f.value)} B</p>
            )}
            {f.note && <p className="muted">{f.note}</p>}
            <details className="inline-details">
              <summary>Evidence · {f.sources?.length || 0} links</summary>
              <SourceList sources={f.sources || []} />
            </details>
          </article>
        ))}
      </div>
      <section className="panel detail-section">
        <h3>Technical notes</h3>
        <p>{t.note || 'No technical note supplied.'}</p>
        {t._provenance_note && <p className="muted">{t._provenance_note}</p>}
      </section>
    </>
  );
}
function Benchmarks({ model: m }) {
  const b = m.benchmarks || {},
    aa = b.artificial_analysis || {};
  return (
    <>
      <Note>
        Scores and evaluation notes are copied from the repository snapshot. They are not live Arena
        ratings and are not normalized into a new ranking.
      </Note>
      <div className="section-title detail-section">
        <div>
          <p className="eyebrow accent">Artificial Analysis</p>
          <h3>Reported evaluation snapshot</h3>
        </div>
        {aa.url && (
          <Link href={aa.url} className="button">
            Open source <Icon name="external" />
          </Link>
        )}
      </div>
      <Stats
        className="benchmark-stats"
        items={[
          [
            'Intelligence index',
            num(aa.intelligence_index),
            aa.raw_index === 'N/A' ? 'Not available in source' : aa.raw_index,
          ],
          ...Object.entries(aa.profile || {}).map(([k, v]) => [
            human(k),
            num(v),
            'As supplied in the snapshot',
          ]),
        ]}
      />
      {absent(aa.intelligence_index) && (
        <p className="muted">
          No intelligence index is supplied for this model. Missing scores are not shown as zero.
        </p>
      )}
      <section className="panel detail-section">
        <h3>Third-party evaluation notes</h3>
        {Object.keys(b.third_party || {}).length ? (
          <KeyValues items={Object.entries(b.third_party).map(([k, v]) => [human(k), v])} />
        ) : (
          <p className="muted">No third-party evaluation entries supplied.</p>
        )}
      </section>
      <details className="panel disclosure">
        <summary>Complete benchmark record</summary>
        <LazyRaw value={b} filename={m.model_id + '-benchmarks.json'} />
      </details>
    </>
  );
}
const THEORY_LABELS = {
  optimizers: 'Optimizers',
  scaling: 'Scaling laws',
  ttl: 'Test-time learning',
  literature: 'Literature',
  tokenizer: 'Tokenizers',
  residual: 'Residual paths',
  short_conv: 'Convolutions',
  cross_domain: 'Cross-domain',
};
function Theory({ data, inside = false }) {
  const theory = data.theory || {},
    keys = Object.keys(theory).filter((k) => Array.isArray(theory[k])),
    [category, setCategory] = useState(keys[0]),
    list = theory[category] || [];
  return (
    <section className="theory-view">
      <Note>
        {inside
          ? 'General reference notes from the dataset — not a claim that every technique is used by this model.'
          : 'Original theory library: preserved notes and literature, not an independently reviewed technical reference.'}
      </Note>
      <div className="theory-categories" role="group" aria-label="Theory category">
        {keys.map((k) => (
          <button
            className="chip"
            aria-pressed={k === category}
            key={k}
            onClick={() => setCategory(k)}
          >
            {THEORY_LABELS[k] || human(k)}
          </button>
        ))}
      </div>
      <div className="section-title">
        <h3>{THEORY_LABELS[category] || human(category)}</h3>
        <span className="muted">{list.length} entries</span>
      </div>
      <div className="theory-grid">
        {list.map((x, i) => (
          <article className="theory-card" key={i}>
            <span className="eyebrow accent">{String(i + 1).padStart(2, '0')}</span>
            <h4>{x.name || x.title || x.law || 'Reference'}</h4>
            {x.formula && <div className="formula">{x.formula}</div>}
            {Object.entries(x)
              .filter(([k]) => !['name', 'title', 'law', 'url', 'formula'].includes(k))
              .map(([k, v]) => (
                <div className="theory-field" key={k}>
                  <span>{human(k)}</span>
                  <p>{val(v)}</p>
                </div>
              ))}
            {x.url && (
              <Link href={x.url} className="text-link">
                Read source <Icon name="external" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
function DossierContent({ tab, model: m, data, onZoom }) {
  if (tab === 'overview') return <Overview model={m} onZoom={onZoom} />;
  if (tab === 'architecture') return <Architecture model={m} onZoom={onZoom} />;
  if (tab === 'math') return <MathSpecs model={m} />;
  if (tab === 'training') return <Training model={m} />;
  if (tab === 'benchmarks') return <Benchmarks model={m} />;
  if (tab === 'theory') return <Theory data={data} inside />;
  if (tab === 'sources')
    return (
      <>
        <Note>
          Original references and field-level evidence. Status labels are preserved from the
          dataset, not independently checked.
        </Note>
        <div className="section-title detail-section">
          <h3>Follow the primary sources</h3>
          <span className="muted">{collectSources(m).length} references</span>
        </div>
        <SourceList sources={collectSources(m)} />
      </>
    );
  return <Raw value={m} filename={m.model_id + '.json'} />;
}

const TABS = [
  ['overview', 'Overview'],
  ['architecture', 'Architecture'],
  ['math', 'Math & config'],
  ['training', 'Training'],
  ['benchmarks', 'Benchmarks'],
  ['theory', 'Theory'],
  ['sources', 'Sources'],
  ['raw', 'Raw JSON'],
];
function Modal({ children, onClose, className = '', labelId = 'modal-title' }) {
  const ref = useRef(null),
    restore = useRef(null);
  useEffect(() => {
    const d = ref.current;
    restore.current = document.activeElement;
    d.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      if (d.open) d.close();
      document.body.style.overflow = before;
      if (restore.current?.isConnected) restore.current.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={'modal ' + className}
      aria-labelledby={labelId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target !== ref.current) return;
        const r = ref.current.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}
function Dossier({ model: m, data, onClose, selected, onSelect, onZoom, onStep, index, total }) {
  const [tab, setTab] = useState('overview'),
    body = useRef(null);
  useEffect(() => {
    setTab('overview');
    if (body.current) body.current.scrollTop = 0;
  }, [m]);
  const setView = (t) => {
    setTab(t);
    if (body.current) body.current.scrollTop = 0;
  };
  const navKeys = (e) => {
    const n = TABS.findIndex(([k]) => k === tab);
    let next;
    if (e.key === 'ArrowRight') next = (n + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (n + TABS.length - 1) % TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next !== undefined) {
      e.preventDefault();
      setView(TABS[next][0]);
      e.currentTarget.querySelectorAll('[role=tab]')[next].focus();
    }
  };
  return (
    <Modal onClose={onClose} className="dossier">
      <header className="dossier-head">
        <div>
          <p className="eyebrow accent">
            Model dossier{' '}
            <span className="muted">
              / {String(index + 1).padStart(2, '0')} of {total}
            </span>
          </p>
          <h2 id="modal-title">{m.model_name}</h2>
          <p className="dossier-meta">
            {m.company}
            <span>·</span>
            {date(m.release_date)}
            <span>·</span>
            <Link href={m.license?.url}>{m.license?.spdx || 'License not specified'}</Link>
          </p>
        </div>
        <div className="dossier-head-actions">
          <button
            className="icon-button"
            aria-label="Previous model"
            disabled={index <= 0}
            onClick={() => onStep(-1)}
          >
            ←
          </button>
          <button
            className="icon-button"
            aria-label="Next model"
            disabled={index >= total - 1}
            onClick={() => onStep(1)}
          >
            →
          </button>
          <button className="icon-button close" aria-label="Close model details" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>
      <div className="dossier-tabs" role="tablist" aria-label="Model details" onKeyDown={navKeys}>
        {TABS.map(([k, label]) => (
          <button
            id={'tab-' + k}
            role="tab"
            aria-selected={tab === k}
            aria-controls="dossier-panel"
            tabIndex={tab === k ? 0 : -1}
            key={k}
            onClick={() => setView(k)}
          >
            {label}
            {k === 'sources' && <span>{collectSources(m).length}</span>}
          </button>
        ))}
      </div>
      <div
        className="dossier-body"
        ref={body}
        id="dossier-panel"
        role="tabpanel"
        aria-labelledby={'tab-' + tab}
        tabIndex="0"
      >
        <DossierContent tab={tab} model={m} data={data} onZoom={onZoom} />
      </div>
      <footer className="dossier-foot">
        <span>Repository snapshot · {data.generated_at?.slice(0, 10) || data.version}</span>
        <div className="button-row">
          <button className="button secondary" onClick={() => download(m, m.model_id + '.json')}>
            <Icon name="download" />
            Record JSON
          </button>
          <button className="button" onClick={() => onSelect(m.model_id)}>
            <Icon name="compare" />
            {selected.has(m.model_id) ? 'Remove comparison' : 'Add to comparison'}
          </button>
        </div>
      </footer>
    </Modal>
  );
}
function Lightbox({ model, mode, onClose }) {
  const [zoom, setZoom] = useState(1);
  return (
    <Modal onClose={onClose} className="lightbox" labelId="image-title">
      <header className="lightbox-head">
        <div>
          <p className="eyebrow accent">Architecture viewer</p>
          <h2 id="image-title">{model.model_name}</h2>
        </div>
        <div className="button-row">
          <button
            className="icon-button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            disabled={zoom === 1}
            aria-label="Zoom out"
          >
            −
          </button>
          <button className="zoom-reset" onClick={() => setZoom(1)} aria-label="Reset image zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="icon-button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            disabled={zoom === 3}
            aria-label="Zoom in"
          >
            +
          </button>
          <button className="icon-button" aria-label="Close image viewer" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </header>
      <div className="lightbox-scroll">
        <div
          style={{
            width: '100%',
            minWidth: 0,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <Figure model={model} large initialMode={mode} />
        </div>
      </div>
    </Modal>
  );
}
const COMPARE = [
  ['Scale', (m) => compact(params(m))],
  ['Active parameters', (m) => compact(m.scale?.active_params)],
  ['Context · effective', contextText],
  ['Attention', attention],
  ['Layers', (m) => num(m.architecture?.num_hidden_layers)],
  ['Hidden dimension', (m) => num(m.architecture?.hidden_size)],
  ['Vocabulary', (m) => num(m.architecture?.vocab_size)],
  ['KV cache · BF16', (m) => (m.kv_cache?.kib != null ? num(m.kv_cache.kib) + ' KiB' : '—')],
  ['Normalization', (m) => val(m.yichen?.norm)],
  ['Position encoding', (m) => val(m.yichen?.pos_emb)],
  ['Activation', (m) => val(m.yichen?.activation)],
  [
    'Training · source status',
    (m) => m.training?.overall_status || m.training?.verified_status || '—',
  ],
  ['Release', (m) => date(m.release_date)],
  ['License', (m) => m.license?.spdx || '—'],
];
function Comparison({ models, onClose }) {
  return (
    <Modal onClose={onClose} className="comparison">
      <header className="dossier-head">
        <div>
          <p className="eyebrow accent">Same snapshot. Side by side.</p>
          <h2 id="modal-title">Compare architectures</h2>
        </div>
        <button className="icon-button" aria-label="Close comparison" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className="dossier-body">
        <Note>
          A specification comparison, not a performance ranking. Missing values stay unknown.
        </Note>
        <div
          className="comparison-scroll"
          role="region"
          aria-label="Comparison table; scroll horizontally"
          tabIndex="0"
        >
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Specification</th>
                {models.map((m) => (
                  <th key={m.model_id} scope="col">
                    <span className="eyebrow">{m.company}</span>
                    <strong>{m.model_name}</strong>
                    <span className="muted">{m.architecture?.decoder_display}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, fn]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {models.map((m) => (
                    <td key={m.model_id}>{fn(m)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
const MATRIX = [
  ['model_name', 'Model', (m) => m.model_name],
  ['company', 'Lab', (m) => m.company],
  ['release_date', 'Release', (m) => m.release_date],
  ['vocab', 'Vocabulary', (m) => m.yichen?.vocab ?? m.architecture?.vocab_size],
  ['depth', 'Depth', (m) => m.yichen?.depth ?? m.architecture?.num_hidden_layers],
  ['dim', 'Dimension', (m) => m.yichen?.dim ?? m.architecture?.hidden_size],
  ['norm', 'Norm', (m) => m.yichen?.norm],
  ['parallel', 'Parallel layers', (m) => m.yichen?.parallel_layer],
  ['placement', 'Norm placement', (m) => m.yichen?.pre_norm],
  ['position', 'Position', (m) => m.yichen?.pos_emb],
  ['activation', 'Activation', (m) => m.yichen?.activation],
  ['attention', 'Attention', attention],
  ['context', 'Context', effective],
  ['scale', 'Parameters', params],
  ['bias', 'Bias', (m) => m.yichen?.bias_display],
  ['tied', 'Tied weights', (m) => m.yichen?.tied_display],
  ['qk', 'QK norm', (m) => m.yichen?.qk_norm],
  ['sliding', 'Sliding', (m) => m.yichen?.sliding],
  ['stability', 'Stability', (m) => m.yichen?.stability],
];
const CATALOG = [
  MATRIX[0],
  ['scale', 'Scale', params],
  ['context', 'Context', effective],
  ['attention', 'Attention', attention],
  ['depth', 'Layers', (m) => m.architecture?.num_hidden_layers],
];
const ROUTES = [
  ['registry', 'Model registry', 'table'],
  ['matrix', 'Architecture matrix', 'grid'],
  ['timeline', 'Release timeline', 'clock'],
  ['theory', 'Theory library', 'book'],
  ['about', 'About & sources', 'info'],
];
function PageControls({ page, setPage, count, pageSize }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="page-controls">
      <span>
        {count ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, count)}` : '0'} of{' '}
        {count} models
      </span>
      <div>
        <button
          className="icon-button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          aria-label="Previous results page"
        >
          ←
        </button>
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <button
          className="icon-button"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          aria-label="Next results page"
        >
          →
        </button>
      </div>
    </div>
  );
}
function Timeline({ data }) {
  return (
    <div className="timeline-list">
      {[...(data.milestones || [])]
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .map((m, i) => (
          <article key={m.id || i} className="milestone">
            <div className="milestone-date">
              <time dateTime={m.date}>{date(m.date)}</time>
              <span>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div>
              <p className="eyebrow accent">{m.org}</p>
              <h3>{m.name}</h3>
              <p>{m.note}</p>
              <div className="tag-row">
                <Badge>{m.params} parameters</Badge>
                <Badge>{m.ctx} context</Badge>
              </div>
              <p className="muted">{m.arch}</p>
            </div>
          </article>
        ))}
    </div>
  );
}
function About({ data }) {
  return (
    <div className="about">
      <p className="eyebrow accent">Open data. A clearer interface.</p>
      <h2>
        More of the original.
        <br />
        Less noise around it.
      </h2>
      <p className="lead">
        VECTOR pairs a compact model registry with readable dossiers, original image references and
        the complete source records.
      </p>
      <div className="two-columns">
        <section className="panel">
          <h3>What this version contains</h3>
          <KeyValues
            items={[
              ['Model records', data.models.length],
              ['Foundational milestones', data.milestones?.length || 0],
              ['Dataset version', data.version],
              ['Snapshot', data.generated_at],
              ['Data license', data.license],
            ]}
          />
          <button className="button" onClick={() => download(data, 'all-configs.json')}>
            <Icon name="download" />
            Full dataset JSON
          </button>
        </section>
        <section className="panel">
          <h3>How to read the evidence</h3>
          <p>
            Descriptions, dates, confidence labels, training claims and benchmark scores are
            preserved from the supplied repository. They have not been scientifically re-verified
            here.
          </p>
          <p>Unknown means unknown. Source confidence is not a leaderboard score.</p>
          <p>
            Architecture images use the original links. If unavailable, a clearly labeled
            configuration map appears; it is not a replica of the source diagram.
          </p>
        </section>
      </div>
      <section className="panel detail-section">
        <h3>Credits & original project</h3>
        <div className="credit-list">
          <Link href={REPO}>
            Solthara Index · original repository <Icon name="external" />
          </Link>
          <Link href="https://github.com/rasbt/llm-architecture-gallery">
            Sebastian Raschka · architecture diagrams <Icon name="external" />
          </Link>
          <Link href="https://github.com/YichenZW/llm-arch-table">
            YichenZW · architecture matrix <Icon name="external" />
          </Link>
          <Link href="https://github.com/Superposition09m/Awesome-LM-Architecture">
            Awesome-LM-Architecture · theory references <Icon name="external" />
          </Link>
        </div>
      </section>
      <details className="panel disclosure">
        <summary>Original dataset provenance</summary>
        <LazyRaw value={data.provenance || {}} filename="solthara-provenance.json" />
      </details>
    </div>
  );
}
function Empty({ onReset }) {
  return (
    <div className="empty">
      <Icon name="search" size={32} />
      <h3>No models match.</h3>
      <p>Try a different name, lab, architecture or attention mechanism.</p>
      <button className="button" onClick={onReset}>
        Reset all filters
      </button>
    </div>
  );
}

export default function Vector({ data }) {
  const models = useMemo(
    () => (Array.isArray(data?.models) ? data.models : Object.values(data?.models || {})),
    [data],
  );
  const [route, setRoute] = useState('registry'),
    [query, setQuery] = useState(''),
    [company, setCompany] = useState('all'),
    [kind, setKind] = useState('all'),
    [att, setAtt] = useState('all'),
    [training, setTraining] = useState('all'),
    [bias, setBias] = useState('all'),
    [tied, setTied] = useState('all'),
    [sort, setSort] = useState('newest'),
    [tableSort, setTableSort] = useState(null),
    [page, setPage] = useState(1),
    [view, setView] = useState('table'),
    [more, setMore] = useState(false),
    [menu, setMenu] = useState(false),
    [inspected, setInspected] = useState(models[0]?.model_id),
    [dossier, setDossier] = useState(null),
    [lightbox, setLightbox] = useState(null),
    [comparison, setComparison] = useState(false),
    [selected, setSelected] = useState(new Set()),
    [toast, setToast] = useState('');
  const searchRef = useRef(null),
    catalogRef = useRef(null),
    inspectorRef = useRef(null),
    pageSize = 8;
  const searchable = useMemo(
    () =>
      new Map(
        models.map((m) => [
          m.model_id,
          [
            m.model_name,
            m.model_id,
            m.company,
            m.summary,
            m.family,
            m.scale?.raw,
            m.architecture?.decoder_display,
            m.architecture?.decoder_type,
            m.architecture?.attention?.raw,
            attention(m),
            ...(m.tags || []),
            m.math_tricks?.hidden_act,
            m.math_tricks?.tricks_display,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
        ]),
      ),
    [models],
  );
  const filtered = useMemo(() => {
    let out = models.filter((m) => {
      const type = (m.architecture?.decoder_type || '').toLowerCase();
      return (
        (!query.trim() || searchable.get(m.model_id).includes(query.trim().toLowerCase())) &&
        (company === 'all' || m.company === company) &&
        (kind === 'all' ||
          (kind === 'moe'
            ? type.includes('moe') || type.startsWith('sparse')
            : kind === 'dense'
              ? type.includes('dense')
              : kind === 'hybrid'
                ? type.includes('hybrid')
                : true)) &&
        (att === 'all' || m.architecture?.attention?.primary === att) &&
        (training === 'all' ||
          (m.training?.overall_status || m.training?.verified_status) === training) &&
        (bias === 'all' || m.math_tricks?.attention_bias_display === bias) &&
        (tied === 'all' || m.math_tricks?.tie_display === tied)
      );
    });
    const column = tableSort && MATRIX.find(([k]) => k === tableSort.key),
      fn =
        column?.[2] ||
        (sort === 'largest'
          ? params
          : sort === 'context'
            ? effective
            : sort === 'layers'
              ? (m) => m.architecture?.num_hidden_layers
              : sort === 'name'
                ? (m) => m.model_name
                : (m) => m.release_date),
      asc = tableSort ? tableSort.asc : ['name', 'oldest'].includes(sort);
    out.sort((a, b) => {
      const x = fn(a),
        y = fn(b);
      if (absent(x)) return absent(y) ? 0 : 1;
      if (absent(y)) return -1;
      const d =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true });
      return (asc ? d : -d) || a.model_name.localeCompare(b.model_name);
    });
    return out;
  }, [models, query, company, kind, att, training, bias, tied, sort, tableSort, searchable]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    inspectModel = models.find((m) => m.model_id === inspected) || models[0],
    modalModel = models.find((m) => m.model_id === dossier),
    isDataView = ['registry', 'matrix'].includes(route),
    activeFilters = [company, kind, att, training, bias, tied].filter((x) => x !== 'all').length;
  useEffect(() => setPage(1), [query, company, kind, att, training, bias, tied, sort, tableSort]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const fn = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'k' &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        setRoute('registry');
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') setMenu(false);
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);
  function navigate(r) {
    setRoute(r);
    setMenu(false);
    setPage(1);
    setTableSort(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function reset() {
    setQuery('');
    setCompany('all');
    setKind('all');
    setAtt('all');
    setTraining('all');
    setBias('all');
    setTied('all');
    setSort('newest');
    setTableSort(null);
    setPage(1);
    searchRef.current?.focus();
  }
  function choose(id) {
    if (!selected.has(id) && selected.size >= 3) {
      setToast('Choose up to 3 models. Remove one to add another.');
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function open(id) {
    setInspected(id);
    setDossier(id);
  }
  function quickLook(id) {
    setInspected(id);
    if (window.innerWidth < 1240)
      setTimeout(
        () =>
          inspectorRef.current?.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
          }),
        0,
      );
  }
  function sortBy(key) {
    setTableSort((s) => ({ key, asc: s?.key === key ? !s.asc : true }));
  }
  function pageTo(p) {
    setPage(p);
    catalogRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function exportResults() {
    download(
      {
        version: data.version,
        generated_at: data.generated_at,
        license: data.license,
        source_total_models: models.length,
        total_models: filtered.length,
        export_note:
          'Complete model records for the current filters. Dataset assertions are not newly verified.',
        filters: { query, company, kind, attention: att, training, bias, tied },
        models: filtered,
      },
      'solthara-vector-results.json',
    );
    setToast('Full records for ' + filtered.length + ' models exported.');
  }
  const title =
      route === 'registry'
        ? 'Architecture registry'
        : route === 'matrix'
          ? 'Architecture matrix'
          : route === 'timeline'
            ? 'Where it all began'
            : route === 'theory'
              ? 'The reference library'
              : 'Open by design',
    sub =
      route === 'registry'
        ? 'Inspect the structure. Open the full story.'
        : route === 'matrix'
          ? '19 architectural fields. Sort, scroll and compare.'
          : route === 'timeline'
            ? '15 foundational milestones, preserved from the original dataset.'
            : route === 'theory'
              ? 'Optimizers, scaling laws and the ideas behind the models.'
              : 'Complete records. Traceable sources. No invented scores.';
  const sortHeaders = (columns) => (
    <thead>
      <tr>
        {columns.map(([key, label]) => (
          <th
            key={key}
            scope="col"
            aria-sort={
              tableSort?.key === key ? (tableSort.asc ? 'ascending' : 'descending') : 'none'
            }
          >
            <button onClick={() => sortBy(key)}>
              {label}
              <span aria-hidden="true">
                {tableSort?.key === key ? (tableSort.asc ? '↑' : '↓') : '↕'}
              </span>
            </button>
          </th>
        ))}
        <th scope="col" className="select-head">
          <span className="sr-only">Select for comparison</span>
          <Icon name="compare" />
        </th>
        {route === 'registry' && (
          <th scope="col" className="select-head">
            <span className="sr-only">Quick preview</span>
            <Icon name="eye" />
          </th>
        )}
      </tr>
    </thead>
  );
  const checkbox = (m) => (
    <label className="check-target">
      <input
        type="checkbox"
        checked={selected.has(m.model_id)}
        onChange={() => choose(m.model_id)}
        aria-label={'Compare ' + m.model_name}
      />
      <span className="sr-only">Compare</span>
    </label>
  );
  const renderTable = () => {
    const cols = route === 'matrix' ? MATRIX : CATALOG;
    return (
      <>
        <div className="table-hint">
          <Icon name="arrow" size={16} />
          Scroll horizontally for all columns. Select a model for the full dossier.
        </div>
        <div
          className={'table-scroll ' + (route === 'matrix' ? 'matrix-scroll' : '')}
          tabIndex="0"
          role="region"
          aria-label={
            route === 'matrix'
              ? 'Architecture matrix; scroll horizontally'
              : 'Model registry; scroll horizontally'
          }
        >
          <table className={'model-table ' + (route === 'matrix' ? 'matrix-table' : '')}>
            {sortHeaders(cols)}
            <tbody>
              {visible.map((m) => (
                <tr
                  key={m.model_id}
                  className={m.model_id === inspected ? 'inspected' : ''}
                  onClick={(e) => {
                    if (!e.target.closest('button,a,input,label')) open(m.model_id);
                  }}
                >
                  {cols.map(([key, label, fn]) => (
                    <td key={key} className={key === 'model_name' ? 'model-cell' : ''}>
                      {key === 'model_name' ? (
                        <div className="model-cell-content">
                          {route === 'registry' && <Thumb model={m} />}
                          <div>
                            <button className="model-name" onClick={() => open(m.model_id)}>
                              {m.model_name}
                            </button>
                            <span className="model-byline">
                              {m.company} ·{' '}
                              {route === 'registry'
                                ? date(m.release_date)
                                : m.architecture?.decoder_display}
                            </span>
                          </div>
                        </div>
                      ) : key === 'attention' ? (
                        <Badge>{attention(m)}</Badge>
                      ) : key === 'scale' ? (
                        <>
                          <span className="mono value">{compact(fn(m))}</span>
                          {route === 'registry' && m.scale?.active_params != null && (
                            <span className="cell-note">
                              {compact(m.scale.active_params)} active
                            </span>
                          )}
                        </>
                      ) : key === 'context' ? (
                        <span className="mono value">{contextText(m)}</span>
                      ) : (
                        <span
                          className={['depth', 'dim', 'vocab'].includes(key) ? 'mono value' : ''}
                        >
                          {val(fn(m))}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>{checkbox(m)}</td>
                  {route === 'registry' && (
                    <td>
                      <button
                        className="icon-button peek"
                        aria-label={'Preview ' + m.model_name + ' in side panel'}
                        onClick={() => quickLook(m.model_id)}
                      >
                        <Icon name="eye" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };
  if (!models.length)
    return (
      <main className="boot-error">
        <h1>No dataset loaded</h1>
        <p>Place the original all-configs.js beside index.html, then reload.</p>
      </main>
    );

  return (
    <div className="vector-app">
      <a className="skip" href="#registry-main">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-row">
            <button className="brand" onClick={() => navigate('registry')}>
              <Icon name="mark" size={31} />
              <span>
                solthara<span className="brand-dot">.</span>
              </span>
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              aria-controls="main-nav"
              onClick={() => setMenu(!menu)}
            >
              <Icon name={menu ? 'close' : 'menu'} />
            </button>
          </div>
          <nav id="main-nav" className={menu ? 'open' : ''} aria-label="Primary navigation">
            <span className="nav-label">Workspace</span>
            {ROUTES.map(([k, label, icon]) => (
              <button
                key={k}
                onClick={() => navigate(k)}
                aria-current={route === k ? 'page' : undefined}
              >
                <Icon name={icon} />
                <span>{label}</span>
                {k === 'registry' && <small>{models.length}</small>}
              </button>
            ))}
            <div className="sidebar-source">
              <span className="nav-label">Source</span>
              <Link href={REPO}>
                GitHub repository <Icon name="external" />
              </Link>
              <p>
                Open dataset
                <br />
                Apache-2.0
              </p>
            </div>
          </nav>
          <div className="sidebar-bottom">
            <span className="mini-mark">S</span>
            <div>
              VECTOR <span className="muted">/ 02</span>
              <small>Full-record edition</small>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>{ROUTES.find(([k]) => k === route)?.[1]}</strong>
            </div>
            <div className="topbar-actions">
              <span className="snapshot-label">Snapshot · {data.generated_at?.slice(0, 10)}</span>
              <button className="button secondary" onClick={exportResults}>
                <Icon name="download" />
                <span>Export {isDataView ? 'results' : 'models'}</span>
              </button>
            </div>
          </header>
          <main id="registry-main" className="main">
            <section className="page-heading">
              <div>
                <p className="eyebrow accent">
                  Research workspace <span className="muted">/ VECTOR</span>
                </p>
                <h1>
                  {title}
                  <span className="accent">_</span>
                </h1>
                <p>{sub}</p>
              </div>
              <div className="version">
                <span>DATASET</span>
                <strong>v{data.version}</strong>
              </div>
            </section>
            {route === 'registry' && (
              <div className="summary-strip">
                <div>
                  <strong>{models.length}</strong>
                  <span>full model records</span>
                </div>
                <div>
                  <strong>{data.milestones?.length || 0}</strong>
                  <span>foundational milestones</span>
                </div>
                <div>
                  <Icon name="image" size={22} />
                  <span>
                    Original figures
                    <br />
                    <small>+ local configuration maps</small>
                  </span>
                </div>
              </div>
            )}
            {isDataView ? (
              <section className="catalog" ref={catalogRef}>
                <div className="catalog-toolbar">
                  <label className="search-field">
                    <Icon name="search" />
                    <span className="sr-only">Search models, labs and architecture details</span>
                    <input
                      ref={searchRef}
                      type="search"
                      placeholder="Search models, labs, architecture…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      spellCheck="false"
                    />
                    <kbd>⌘ K</kbd>
                  </label>
                  <label className="select-field">
                    <span className="sr-only">Filter by lab</span>
                    <select value={company} onChange={(e) => setCompany(e.target.value)}>
                      <option value="all">All labs</option>
                      {[...new Set(models.map((m) => m.company))].sort().map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="select-field">
                    <span className="sr-only">Sort models</span>
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setTableSort(null);
                      }}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="largest">Largest scale</option>
                      <option value="context">Longest context</option>
                      <option value="layers">Most layers</option>
                      <option value="name">Name A–Z</option>
                    </select>
                  </label>
                </div>
                <div className="filter-row">
                  <div className="filter-chips" role="group" aria-label="Architecture category">
                    {[
                      ['all', 'All models'],
                      ['moe', 'MoE'],
                      ['dense', 'Dense'],
                      ['hybrid', 'Hybrid'],
                    ].map(([k, l]) => (
                      <button
                        key={k}
                        className="chip"
                        aria-pressed={kind === k}
                        onClick={() => setKind(k)}
                      >
                        {l}
                      </button>
                    ))}
                    <button
                      className={'chip filter-toggle ' + (more ? 'active' : '')}
                      aria-expanded={more}
                      aria-controls="advanced-filters"
                      onClick={() => setMore(!more)}
                    >
                      <Icon name="filter" />
                      Filters{activeFilters > 0 && <span>{activeFilters}</span>}
                    </button>
                    {activeFilters > 0 && (
                      <button className="text-button" onClick={reset}>
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="view-controls">
                    <span className="result-count" role="status">
                      {filtered.length} / {models.length}
                    </span>
                    {route === 'registry' && (
                      <div className="segmented" role="group" aria-label="Registry layout">
                        <button
                          aria-label="Table view"
                          aria-pressed={view === 'table'}
                          onClick={() => setView('table')}
                        >
                          <Icon name="table" />
                        </button>
                        <button
                          aria-label="Gallery view"
                          aria-pressed={view === 'gallery'}
                          onClick={() => setView('gallery')}
                        >
                          <Icon name="grid" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="advanced-filters" id="advanced-filters" hidden={!more}>
                  {[
                    [
                      'Attention',
                      att,
                      setAtt,
                      [
                        ['all', 'All types'],
                        ...Array.from(
                          new Set(
                            models.map((m) => m.architecture?.attention?.primary).filter(Boolean),
                          ),
                        )
                          .sort()
                          .map((k) => [
                            k,
                            {
                              gqa: 'GQA',
                              mla: 'MLA',
                              gated_deltanet: 'DeltaNet',
                              mha: 'MHA',
                              sliding_window: 'Sliding window',
                            }[k] || human(k),
                          ]),
                      ],
                    ],
                    [
                      'Training status',
                      training,
                      setTraining,
                      [
                        ['all', 'Any status'],
                        ['verified', 'Verified'],
                        ['mixed', 'Mixed'],
                        ['inferred', 'Inferred'],
                      ],
                    ],
                    [
                      'Attention bias',
                      bias,
                      setBias,
                      [
                        ['all', 'Any bias'],
                        ['no bias', 'No bias'],
                        ['with bias', 'With bias'],
                        ['undisclosed', 'Undisclosed'],
                      ],
                    ],
                    [
                      'Weight tying',
                      tied,
                      setTied,
                      [
                        ['all', 'Any tying'],
                        ['tied', 'Tied'],
                        ['untied', 'Untied'],
                      ],
                    ],
                  ].map(([label, value, setter, options]) => (
                    <label key={label}>
                      {label}
                      <select value={value} onChange={(e) => setter(e.target.value)}>
                        {options.map(([v, l]) => (
                          <option value={v} key={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div
                  className={
                    'registry-layout ' + (route === 'matrix' || view === 'gallery' ? 'wide' : '')
                  }
                >
                  <div className="registry-results">
                    {!visible.length ? (
                      <Empty onReset={reset} />
                    ) : route === 'registry' && view === 'gallery' ? (
                      <div className="gallery-grid">
                        {visible.map((m) => (
                          <article className="gallery-card" key={m.model_id}>
                            <div className="gallery-card-head">
                              <div className="tag-row">
                                <Badge>{m.architecture?.decoder_display}</Badge>
                                <span className="muted">{m.company}</span>
                              </div>
                              <h3>
                                <button onClick={() => open(m.model_id)}>{m.model_name}</button>
                              </h3>
                            </div>
                            <Figure
                              model={m}
                              onZoom={(model, mode) => setLightbox({ model, mode })}
                            />
                            <div className="gallery-card-content">
                              <p className="gallery-summary">
                                {m.summary || 'Open the full model record.'}
                              </p>
                              <div className="gallery-values">
                                <span>
                                  <b>{compact(params(m))}</b>parameters
                                </span>
                                <span>
                                  <b>{contextText(m)}</b>context
                                </span>
                                <span>
                                  <b>{attention(m)}</b>attention
                                </span>
                              </div>
                              <div className="gallery-foot">
                                {checkbox(m)}
                                <button className="text-button" onClick={() => open(m.model_id)}>
                                  Full dossier <Icon name="arrow" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      renderTable()
                    )}
                    <PageControls
                      page={currentPage}
                      setPage={pageTo}
                      count={filtered.length}
                      pageSize={pageSize}
                    />
                  </div>
                  {route === 'registry' && view === 'table' && inspectModel && (
                    <aside
                      className="inspector"
                      ref={inspectorRef}
                      aria-label="Selected model preview"
                    >
                      <div className="inspector-head">
                        <span className="eyebrow">Record inspector</span>
                        <button
                          className="icon-button"
                          aria-label="Open inspected model details"
                          onClick={() => open(inspectModel.model_id)}
                        >
                          <Icon name="external" />
                        </button>
                      </div>
                      <div className="inspector-title">
                        <div className="tag-row">
                          <Badge tone="accent-badge">{attention(inspectModel)}</Badge>
                          <span className="muted">{inspectModel.company}</span>
                        </div>
                        <h2>{inspectModel.model_name}</h2>
                      </div>
                      <Figure
                        model={inspectModel}
                        onZoom={(model, mode) => setLightbox({ model, mode })}
                      />
                      <div className="inspector-body">
                        <p className="inspector-summary">
                          {inspectModel.summary || 'Explore the complete source record.'}
                        </p>
                        <KeyValues
                          items={[
                            [
                              'Total / active',
                              compact(params(inspectModel)) +
                                ' / ' +
                                compact(inspectModel.scale?.active_params),
                            ],
                            ['Effective context', contextText(inspectModel)],
                            [
                              'Layers / hidden',
                              num(inspectModel.architecture?.num_hidden_layers) +
                                ' / ' +
                                num(inspectModel.architecture?.hidden_size),
                            ],
                            ['License', inspectModel.license?.spdx],
                          ]}
                        />
                        <button
                          className="button inspector-open"
                          onClick={() => open(inspectModel.model_id)}
                        >
                          Open full dossier <Icon name="arrow" />
                        </button>
                        <p className="inspector-hint">
                          Architecture · Training · Benchmarks · Sources
                        </p>
                      </div>
                    </aside>
                  )}
                </div>
              </section>
            ) : route === 'timeline' ? (
              <Timeline data={data} />
            ) : route === 'theory' ? (
              <Theory data={data} />
            ) : (
              <About data={data} />
            )}
          </main>
          <footer className="site-footer">
            <span>
              SOLTHARA <span className="muted">/ VECTOR 02</span>
            </span>
            <span>Repository snapshot. Not a live ranking.</span>
            <Link href={REPO}>
              Source <Icon name="external" size={15} />
            </Link>
          </footer>
        </div>
      </div>
      {selected.size > 0 && (
        <div className="compare-tray" aria-label="Selected models for comparison">
          <div>
            <Icon name="compare" />
            <strong>{selected.size} / 3 selected</strong>
            <span className="tray-names">
              {models
                .filter((m) => selected.has(m.model_id))
                .map((m) => m.model_name)
                .join(' · ')}
            </span>
          </div>
          <div>
            <button className="text-button" onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button
              className="button"
              disabled={selected.size < 2}
              onClick={() => setComparison(true)}
            >
              Compare <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}
      {modalModel && (
        <Dossier
          model={modalModel}
          data={data}
          selected={selected}
          onSelect={choose}
          onClose={() => setDossier(null)}
          onZoom={(model, mode) => setLightbox({ model, mode })}
          index={(filtered.some((m) => m.model_id === dossier) ? filtered : models).findIndex(
            (m) => m.model_id === dossier,
          )}
          total={filtered.some((m) => m.model_id === dossier) ? filtered.length : models.length}
          onStep={(direction) => {
            const pool = filtered.some((m) => m.model_id === dossier) ? filtered : models,
              n = pool.findIndex((m) => m.model_id === dossier);
            if (pool[n + direction]) open(pool[n + direction].model_id);
          }}
        />
      )}
      {comparison && (
        <Comparison
          models={models.filter((m) => selected.has(m.model_id))}
          onClose={() => setComparison(false)}
        />
      )}{' '}
      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}{' '}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
