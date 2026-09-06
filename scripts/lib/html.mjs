export function escapeInlineScript(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}
export function escapeInlineStyle(css) {
  return css.replace(/<\/style/gi, '<\\/style');
}
export function pageHtml({ css = '', body, inline = false }) {
  return '<!doctype html>\n<html lang="en" data-theme="dark">\n<head>\n' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="color-scheme" content="dark light">\n' +
    '<meta name="description" content="Solthara Index: model architecture records with explicit sources and uncertainty.">\n' +
    '<title>Solthara Index — VECTOR</title>\n' +
    (inline ? `<style>${escapeInlineStyle(css)}</style>` : '<link rel="stylesheet" href="assets/vector.css">') +
    '\n</head>\n<body>\n<div id="root"><main aria-label="Loading Solthara"><h1>Solthara Index</h1><p role="status">Loading architecture records…</p></main></div>\n' +
    '<noscript><p>JavaScript is required for the interactive catalog. The JSON and YAML data files can be read without JavaScript.</p></noscript>\n' +
    body + '\n</body>\n</html>\n';
}
export const splitScriptTags = '<script defer src="all-configs.js"></script>\n<script defer src="assets/vector.js"></script>';
