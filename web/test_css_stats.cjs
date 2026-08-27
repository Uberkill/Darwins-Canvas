const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.settings-scroll-area \{\s*flex: 1;\s*overflow-y: auto;\s*overflow-x: hidden;\s*padding: 12px;\s*margin: -12px;/g, '.settings-scroll-area {\n  flex: 1;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: var(--space-md);\n  margin: calc(-1 * var(--space-md));');
css = css.replace(/\.stats-monitor-container \{\s*margin-top: 24px;\s*border-top: 2px dashed #E2DDD5;\s*padding-top: 16px;/g, '.stats-monitor-container {\n  margin-top: var(--space-xl);\n  border-top: 2px dashed #E2DDD5;\n  padding-top: var(--space-lg);');

fs.writeFileSync(file, css);
console.log('Updated index.css more spacing');
