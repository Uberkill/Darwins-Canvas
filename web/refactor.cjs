const fs = require('fs');
const path = require('path');

const uiKeys = ['activeTool', 'setActiveTool', 'selectedCreatureId', 'setSelectedCreatureId', 'cameraMode', 'setCameraMode', 'targetZoom', 'setTargetZoom', 'keys', 'setKeys', 'panSpeed', 'isPanelOpen', 'openPanel', 'closePanel', 'isTutorialOpen', 'openTutorial', 'closeTutorial', 'isOnboardingOpen', 'openOnboarding', 'closeOnboarding', 'isStatsOpen', 'openStats', 'closeStats', 'isPauseMenuOpen', 'openPauseMenu', 'closePauseMenu'];
const engineKeys = ['timeScale', 'setTimeScale', 'activeSaveSlot', 'setActiveSaveSlot', 'previousTimeScale', 'pendingCreature', 'queueCreature', 'clearQueue'];
const settingsKeys = ['masterVolume', 'sfxVolume', 'musicVolume', 'uiScale', 'setSettings'];

function getStoreForProperty(prop) {
  if (uiKeys.includes(prop)) return 'useUIStore';
  if (engineKeys.includes(prop)) return 'useEngineStore';
  if (settingsKeys.includes(prop)) return 'useSettingsStore';
  return 'useUIStore'; // fallback
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Find all useStore usages
  // Like: const timeScale = useStore((s) => s.timeScale)
  // Or: const { timeScale, activeTool } = useStore()
  
  let neededStores = new Set();

  // Replace useStore((s) => s.PROP)
  content = content.replace(/useStore\(\s*\(\s*(\w+)\s*\)\s*=>\s*\1\.(\w+)\s*\)/g, (match, varName, prop) => {
    const store = getStoreForProperty(prop);
    neededStores.add(store);
    return `${store}((${varName}) => ${varName}.${prop})`;
  });
  
  // Replace useStore.getState().PROP
  content = content.replace(/useStore\.getState\(\)\.(\w+)/g, (match, prop) => {
    const store = getStoreForProperty(prop);
    neededStores.add(store);
    return `${store}.getState().${prop}`;
  });

  // Replace const { prop1, prop2 } = useStore()
  // This is harder with regex, let's just do a naive check if it exists
  const destructureMatch = content.match(/const\s+\{\s*([^}]+)\s*\}\s*=\s*useStore\(\)/);
  if (destructureMatch) {
    const props = destructureMatch[1].split(',').map(p => p.trim());
    let replacements = [];
    for (const prop of props) {
      if (!prop) continue;
      const cleanProp = prop.split(':')[0].trim(); // handle renaming like `timeScale: ts`
      const store = getStoreForProperty(cleanProp);
      neededStores.add(store);
      replacements.push(`const { ${prop} } = ${store}()`);
    }
    content = content.replace(destructureMatch[0], replacements.join(';\n  '));
  }

  // Update imports
  if (neededStores.size > 0) {
    // Remove old import
    content = content.replace(/import\s*\{\s*useStore\s*\}\s*from\s*['"]([^'"]+useStore)['"];?\n?/g, '');
    
    // Determine path depth
    const depth = filePath.split(/[\\/]/).length - 3; // web/src is depth 0
    let importPath = depth === 0 ? './store' : depth === 1 ? '../store' : '../../store';
    // Actually wait, let's just use the relative path of the old import if we can find it
    const importMatch = originalContent.match(/import\s*\{\s*useStore\s*\}\s*from\s*['"]([^'"]+)useStore['"]/);
    if (importMatch) {
       importPath = importMatch[1]; // e.g. '../store/'
    } else {
       importPath = importPath + '/';
    }

    let importsToAdd = [];
    for (const store of neededStores) {
      importsToAdd.push(`import { ${store} } from '${importPath}${store}';`);
    }
    
    // Add new imports after the last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfImport + 1) + importsToAdd.join('\n') + '\n' + content.slice(endOfImport + 1);
    } else {
      content = importsToAdd.join('\n') + '\n\n' + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (file !== 'useUIStore.ts' && file !== 'useEngineStore.ts' && file !== 'useSettingsStore.ts') {
        processFile(fullPath);
      }
    }
  }
}

walk(path.join(__dirname, 'src'));
