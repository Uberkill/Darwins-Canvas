const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/ui/components/WorldSetupModal.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/padding: 0 var\(--space-md\);/g, 'padding: 0;'); 
css = css.replace(/margin: 0 var\(--space-xl\) var\(--space-xl\) var\(--space-xl\);/g, 'margin: var(--space-md) var(--space-xl) var(--space-xl) var(--space-xl);'); 
css = css.replace(/padding: var\(--space-lg\);/g, 'padding: var(--space-md) var(--space-xl);');

fs.writeFileSync(file, css);
console.log('Refined CSS');
