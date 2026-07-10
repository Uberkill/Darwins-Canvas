import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const engineDir = path.join(__dirname, 'src', 'engine');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('Math.random') && !filePath.endsWith('random.ts')) {
    content = content.replace(/Math\.random\(\)/g, 'random()');
    
    // Determine relative path to random.ts
    const relativeDepth = path.relative(path.dirname(filePath), engineDir);
    const importPath = relativeDepth ? `${relativeDepth}/random` : './random';
    const importPathFixed = importPath.replace(/\\/g, '/');
    
    // Check if import already exists
    if (!content.includes('import { random }')) {
      content = `import { random } from '${importPathFixed}';\n` + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

walkDir(engineDir);
console.log('Done.');
