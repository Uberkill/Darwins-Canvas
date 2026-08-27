const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/gap: var\(--space-sm\); align-items: center; width: 100%; max-width: 400px;/g, 'gap: var(--space-md); align-items: center; width: 100%; max-width: 400px;');

fs.writeFileSync(file, css);
console.log('Updated index.css canvas spacing');
