const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(searchRegex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log('Fixed:', filePath);
    }
}

const uiDir = path.join(__dirname, 'src', 'ui');
const featuresDir = path.join(__dirname, 'src', 'features');

replaceInFile(path.join(uiDir, 'StatsPanel.tsx'), /<button className="stats-close-btn" onClick=\{closeStats\}>/g, '<button className="stats-close-btn" onClick={closeStats} aria-label="Close Analytics">');

replaceInFile(path.join(uiDir, 'TutorialModal.tsx'), /<button className="tutorial-close" onClick=\{closeTutorial\}>/g, '<button className="tutorial-close" onClick={closeTutorial} aria-label="Close Tutorial">');

replaceInFile(path.join(uiDir, 'GodToolbar.tsx'), /className={`god-tool-btn \$\{activeTool === tool\.id \? 'active' : ''\}`}/g, 'className={`god-tool-btn ${activeTool === tool.id ? \'active\' : \'\'}`}\n          aria-label={tool.tooltip}');

replaceInFile(path.join(uiDir, 'TimeControls.tsx'), /<button \n        className={`time-btn \$\{timeScale === 0 \? 'active' : ''\}`}/g, '<button \n        aria-label="Pause Simulation"\n        className={`time-btn ${timeScale === 0 ? \'active\' : \'\'}`}');
replaceInFile(path.join(uiDir, 'TimeControls.tsx'), /<button \n        className={`time-btn \$\{timeScale === 1 \? 'active' : ''\}`}/g, '<button \n        aria-label="Normal Speed"\n        className={`time-btn ${timeScale === 1 ? \'active\' : \'\'}`}');
replaceInFile(path.join(uiDir, 'TimeControls.tsx'), /<button \n        className={`time-btn \$\{timeScale === 2 \? 'active' : ''\}`}/g, '<button \n        aria-label="Fast Forward"\n        className={`time-btn ${timeScale === 2 ? \'active\' : \'\'}`}');

replaceInFile(path.join(featuresDir, 'collection', 'CollectionModal.tsx'), /<button className="collection-close-btn" onClick=\{closeCollection\}>/g, '<button className="collection-close-btn" onClick={closeCollection} aria-label="Close Collection">');

replaceInFile(path.join(uiDir, 'CreationCanvas.tsx'), /<button \n          className="btn-close"/g, '<button \n          aria-label="Close Creation Lab"\n          className="btn-close"');

console.log("A11y pass completed.");
