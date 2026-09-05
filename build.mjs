import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const root = path.dirname(fileURLToPath(import.meta.url));
const result = await build({
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: path.join(root, 'assets/vector.js'),
  legalComments: 'eof',
  metafile: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.jsx': 'jsx' },
  logLevel: 'info',
});
const shell = (assets) =>
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="description" content="Solthara VECTOR: a full-record architecture registry with original diagrams, model dossiers, training provenance and source evidence."><title>Solthara — VECTOR / Full-record edition</title>${assets.head}</head><body><div id="root"><main class="boot-error" role="status"><h1>Loading the registry…</h1><p>Opening the complete local dataset. No account or server is required.</p></main></div><noscript><p style="padding:24px;color:white">JavaScript is required to explore this local dataset.</p></noscript>${assets.body}</body></html>\n`;
fs.writeFileSync(
  path.join(root, 'index.html'),
  shell({
    head: '<link rel="stylesheet" href="assets/vector.css">',
    body: '<script src="all-configs.js"></script><script src="assets/vector.js"></script>',
  }),
);
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');
const standalone = shell({
  head: '<style>' + fs.readFileSync(path.join(root, 'assets/vector.css'), 'utf8') + '</style>',
  body:
    '<script>' +
    esc(fs.readFileSync(path.join(root, 'all-configs.js'), 'utf8')) +
    '</script><script>' +
    esc(fs.readFileSync(path.join(root, 'assets/vector.js'), 'utf8')) +
    '</script>',
});
fs.writeFileSync(path.join(root, 'Solthara-VECTOR-v2.html'), standalone);
fs.writeFileSync(path.join(root, 'build-meta.json'), JSON.stringify(result.metafile, null, 2));
console.log('Built site and standalone preview:', Buffer.byteLength(standalone), 'bytes');
