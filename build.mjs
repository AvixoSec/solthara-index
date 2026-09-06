import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename } from 'node:path';
import { assertValid, dataScript, exportYaml, jsonText, sha256 } from './scripts/lib/data.mjs';
import { pageHtml, escapeInlineScript, splitScriptTags } from './scripts/lib/html.mjs';

const data = JSON.parse(await readFile('all-configs.json', 'utf8'));
const validation = assertValid(data, { corrected: true });
await mkdir('assets', { recursive: true });
await mkdir('audit', { recursive: true });
// Build before replacing published artifacts. A compilation error leaves the
// existing site and dataset derivatives untouched.
const result = await build({
  entryPoints: ['src/main.jsx'], bundle: true, minify: true, write: false,
  outdir: 'assets', entryNames: 'vector', format: 'iife', target: 'es2020',
  legalComments: 'eof', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true,
});
const jsFile = result.outputFiles.find((file) => basename(file.path) === 'vector.js');
const cssFile = result.outputFiles.find((file) => basename(file.path) === 'vector.css');
if (!jsFile || !cssFile) throw new Error('Build did not produce both JS and CSS.');
const js = jsFile.text, css = cssFile.text, dataJs = dataScript(data);
const split = pageHtml({ body: splitScriptTags });
const standalone = pageHtml({ inline: true, css, body: `<script>${dataJs}</script>\n<script>${escapeInlineScript(js)}</script>` });
const outputs = new Map([
  ['all-configs.js', dataJs], ['models.yml', exportYaml(data)],
  ['assets/vector.js', js], ['assets/vector.css', css],
  ['index.html', split], ['Solthara-VECTOR-v2.html', standalone],
]);
for (const [path, contents] of outputs) await writeFile(path, contents);
const integrity = {
  schema: 1,
  input_json_sha256: sha256(await readFile('all-configs.json')),
  outputs: Object.fromEntries([...outputs].map(([name, contents]) => [name, { sha256: sha256(contents), bytes: Buffer.byteLength(contents) }])),
  counts: { models: validation.model_count, milestones: validation.milestone_count },
  note: 'Content integrity and structural validation only; not scientific verification or proof of UI tests.',
};
await writeFile('audit/current-integrity.json', jsonText(integrity));
await writeFile('build-meta.json', jsonText(result.metafile));
console.log(JSON.stringify({ status: 'built', ...integrity.counts, standalone_bytes: Buffer.byteLength(standalone), data_bytes: Buffer.byteLength(dataJs) }, null, 2));
