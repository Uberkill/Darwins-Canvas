const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/ui/CreationSettings.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/marginTop: '16px'/g, "marginTop: 'var(--space-lg)'"); 
content = content.replace(/marginTop: '24px', marginBottom: '16px'/g, "marginTop: 'var(--space-xl)', marginBottom: 'var(--space-md)'");
content = content.replace(/gap: '16px'/g, "gap: 'var(--space-lg)'"); 

fs.writeFileSync(file, content);
console.log('Updated CreationSettings inline styles');
