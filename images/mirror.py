#!/usr/bin/env python3
"""
Mirror raschka gallery images locally to survive hotlink/CORS break.
Reads all-configs.json (or models.json) -> image.url -> images/architectures/
v2.3 anti-hotlink fix for rasbt/llm-architecture-gallery comparison gap.
Usage:
  python images/mirror.py
  python images/mirror.py --dry-run
  python images/mirror.py --json all-configs.json --out images/architectures
"""

import argparse, json, pathlib, time, sys, urllib.request, urllib.error

DEFAULT_JSON = pathlib.Path(__file__).parent.parent / "all-configs.json"
DEFAULT_OUT = pathlib.Path(__file__).parent / "architectures"
UA = "Solthara-Index-mirror/2.4 (+https://github.com/rasbt/llm-architecture-gallery)"


def fetch(url, dest, retries=3):
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": UA, "Referer": "https://sebastianraschka.com/"},
            )
            with urllib.request.urlopen(req, timeout=20) as r, open(dest, "wb") as f:
                f.write(r.read())
            size = dest.stat().st_size
            print(f"  OK {dest.name} {size} bytes")
            return True
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code} {url} attempt {attempt}/{retries}: {e.reason}")
            if e.code in (403, 404):
                # 403 = hotlink blocked, 404 = missing upstream - don't retry forever
                if attempt == retries:
                    print(f"  SKIP {url}")
                    return False
                time.sleep(1)
            else:
                time.sleep(1.5 * attempt)
        except Exception as e:
            print(f"  ERR {url} attempt {attempt}/{retries}: {e}")
            time.sleep(1.5 * attempt)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--json", default=str(DEFAULT_JSON), help="all-configs.json or models.json"
    )
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="limit for testing")
    args = ap.parse_args()

    src = pathlib.Path(args.json)
    if not src.exists():
        print(f"JSON not found: {src}", file=sys.stderr)
        sys.exit(1)
    data = json.loads(src.read_text(encoding="utf-8"))
    models = data.get("models", [])
    if not models and isinstance(data, list):
        models = data

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    urls = []
    for m in models:
        url = (
            (m.get("image") or {}).get("url")
            if isinstance(m.get("image"), dict)
            else m.get("image")
        )
        if url and "sebastianraschka.com" in url:
            slug = url.split("/")[-1]
            dest = out / slug
            urls.append((url, dest, m.get("model_name", "")))

    print(f"Found {len(urls)} raschka images -> {out}")
    if args.limit:
        urls = urls[: args.limit]
        print(f"Limit {args.limit}")

    ok = skip = fail = 0
    for url, dest, name in urls:
        if dest.exists() and dest.stat().st_size > 1024:
            print(f"  SKIP exists {dest.name} ({name})")
            skip += 1
            continue
        if args.dry_run:
            print(f"  DRY {url} -> {dest}")
            ok += 1
            continue
        if fetch(url, dest):
            ok += 1
            time.sleep(0.25)  # be nice
        else:
            fail += 1

    print(f"\nDone: ok={ok} skip={skip} fail={fail} total={len(urls)}")
    if fail and not args.dry_run:
        print(
            "Tip: 403 = hotlink blocked -> fallback gradient will show until you vendor images manually.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
