import test from 'node:test';
import assert from 'node:assert/strict';
import { pageHtml, splitScriptTags, escapeInlineScript, escapeInlineStyle } from '../scripts/lib/html.mjs';
import { fixture } from './fixtures.mjs';
import { dataScript } from '../scripts/lib/data.mjs';

test('both external scripts defer in dependency order', () => {
  assert.equal((splitScriptTags.match(/<script defer /g) ?? []).length, 2);
  assert.ok(splitScriptTags.indexOf('all-configs.js') < splitScriptTags.indexOf('assets/vector.js'));
  assert.equal(splitScriptTags.includes('async'), false);
});
test('split page has a real loading state, noscript content and responsive metadata', () => {
  const html = pageHtml({ body: splitScriptTags });
  assert.match(html, /role="status"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /href="assets\/vector.css"/);
});
test('standalone carries data and CSS without external script dependencies', () => {
  const html = pageHtml({ inline: true, css: 'body{color:white}', body: `<script>${dataScript(fixture())}</script>` });
  assert.equal((html.match(/<script>/g) ?? []).length, 1);
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link rel="stylesheet"/);
  assert.match(html, /<style>body/);
});
test('mixed-case closing tags are neutralized for inline scripts and styles', () => {
  assert.equal(escapeInlineScript('"</ScRiPt>"').toLowerCase(), '"<\\/script>"');
  assert.equal(escapeInlineStyle('/* </StYlE> */').toLowerCase(), '/* <\\/style> */');
});
