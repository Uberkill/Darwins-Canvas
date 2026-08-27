const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/ui/components/WorldSetupModal.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/padding: 24px;\s*position: relative;\s*\}/g, 'padding: var(--space-xl); \n  position: relative;\n}');
fs.writeFileSync(file, css);
console.log('Refined CSS 3');
