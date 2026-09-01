# Images fallback (v2.3 anti-hotlink)

Hotlink source (rasbt): `https://sebastianraschka.com/llm-architecture-gallery/images/architectures/*.webp`

`index.html` uses `onerror="handleImgError(this)"`:

1. try remote raschka URL
2. on fail (`triedLocal` guard) → `images/architectures/<slug>.webp` (local mirror)
3. on second fail → gradient placeholder (`no preview • local fallback`)

## Mirror

```bash
python images/mirror.py
# or
python -m images.mirror --out images/architectures
```

Script reads `all-configs.json` → `image.url` → downloads with retry + CORS-friendly UA.

If raschka enables hotlink protection, run mirror once and commit `images/architectures/*.webp` (101 files, ~15-30 MB).
