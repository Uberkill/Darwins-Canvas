const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.tool-btn--spaced \{\s*margin-top: var\(--space-sm\);\s*\}/g, '.tool-btn--spaced {\n  margin-top: var(--space-md);\n}');
css = css.replace(/\.feature-category-wrapper--spaced \{\s*margin-top: var\(--space-sm\);\s*\}/g, '.feature-category-wrapper--spaced {\n  margin-top: var(--space-md);\n}');
css = css.replace(/\.section-block \{\s*margin-top: var\(--space-md\);\s*\}/g, '.section-block {\n  margin-top: var(--space-xl);\n}');

fs.writeFileSync(file, css);
console.log('Updated index.css tool btn spacing');
