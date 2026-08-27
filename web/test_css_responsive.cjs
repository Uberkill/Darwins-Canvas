const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.col-tools-panel \{ grid-area: tools; \}/g, '.col-tools-panel { grid-area: tools; width: 100%; }');
css = css.replace(/\.col-settings \{ grid-area: settings; \}/g, '.col-settings { grid-area: settings; width: 100%; }');
css = css.replace(/\.col-settings \{\s*grid-area: settings;\s*overflow-y: auto;/g, '.col-settings {\n    grid-area: settings;\n    width: 100%;\n    overflow-y: auto;');

fs.writeFileSync(file, css);
console.log('Updated index.css responsive width');
