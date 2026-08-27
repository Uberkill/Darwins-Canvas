import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = path.join(__dirname, '.artifacts', 'screenshots');

async function runPass(browser, viewport, prefix) {
  console.log(`\n=== Starting Pass: ${prefix} (${viewport.width}x${viewport.height}) ===`);
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${prefix}] CONSOLE:`, msg.text()));
  page.on('pageerror', err => console.error(`[${prefix}] ERROR:`, err.message));

  console.log(`[${prefix}] Navigating to local dev server...`);
  await page.goto('http://localhost:5180/Darwins-Canvas/', { waitUntil: 'domcontentloaded' });
  
  console.log(`[${prefix}] Capturing Title Screen...`);
  await page.waitForSelector('.title-screen-container', { state: 'visible', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}01_title_screen.png`) });

  console.log(`[${prefix}] Starting New Game (Frictionless Play)...`);
  await page.locator('.title-screen .btn-massive').click();
  
  console.log(`[${prefix}] Confirming World Setup...`);
  await page.waitForSelector('.world-setup-modal', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // For mobile, scroll the modal down so we can see the start button if it's overflowing
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.world-setup-scroll');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}01b_world_setup.png`) });
  await page.locator('.start-simulation-btn').click();

  console.log(`[${prefix}] Capturing Main Sandbox...`);
  await page.waitForSelector('.header-bar', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(3000); // Wait for terraingen
  
  console.log(`[${prefix}] Capturing Onboarding...`);
  await page.waitForSelector('.onboarding-backdrop', { state: 'visible', timeout: 5000 });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}01c_onboarding.png`) });
  console.log(`[${prefix}] Skipping Onboarding...`);
  await page.locator('.btn-skip').click();
  await page.waitForSelector('.onboarding-backdrop', { state: 'hidden', timeout: 5000 });

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}02_main_sandbox.png`) });

  console.log(`[${prefix}] Opening Collection Book...`);
  
  // Inject test creature
  await page.evaluate(() => {
    if (window.useCollectionStore) {
      window.useCollectionStore.getState().addCreature(
        { id: 'test-creature', name: 'Chunky Potato', diet: 'HERBIVORE', size: 'MEDIUM', movement: 'WALK', kills: 0, foodEaten: 59, loreProfile: 'A test creature.' },
        { drawingData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', decals: [], bakedSprites: {} }
      );
    }
  });

  await page.locator('button[aria-label="Open Collection"]').click();
  await page.waitForSelector('.collection-modal-content', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}03_collection_book.png`) });
  
  console.log(`[${prefix}] Closing Collection Book...`);
  await page.locator('.collection-close-btn').click();
  await page.waitForSelector('.collection-modal-content', { state: 'hidden', timeout: 5000 });

  console.log(`[${prefix}] Opening Tutorial Modal...`);
  await page.locator('button[aria-label="Open Tutorial"]').click();
  await page.waitForSelector('.tutorial-modal', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}03b_tutorial_modal.png`) });

  console.log(`[${prefix}] Closing Tutorial Modal...`);
  await page.locator('.tutorial-close').click();
  await page.waitForSelector('.tutorial-modal', { state: 'hidden', timeout: 5000 });

  console.log(`[${prefix}] Opening Stats Panel...`);
  await page.locator('button[aria-label="Toggle Stats"]').click();
  await page.waitForSelector('.stats-panel-content', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}04_stats_panel.png`) });
  
  console.log(`[${prefix}] Closing Stats Panel...`);
  await page.locator('.stats-close-btn').click();
  await page.waitForSelector('.stats-panel-content', { state: 'hidden', timeout: 5000 });

  console.log(`[${prefix}] Opening Settings Menu...`);
  await page.locator('.settings-btn-top-right').click();
  await page.waitForSelector('.pause-modal', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}05_settings_menu.png`) });
  
  console.log(`[${prefix}] Closing Settings Menu...`);
  await page.locator('.pause-btn.primary').click(); // Resume Game
  await page.waitForSelector('.pause-modal', { state: 'hidden', timeout: 5000 });

  console.log(`[${prefix}] Opening Creature Creation...`);
  await page.locator('#fab-create').click();
  await page.waitForSelector('.creation-modal-container', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}06_create_creature.png`) });

  console.log(`[${prefix}] Switching to World Sandbox Tab...`);
  await page.getByRole('button', { name: /World Sandbox/i }).click();
  await page.waitForSelector('.world-builder-layout', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}07_creation_world_builder.png`) });

  await context.close();
}

async function runAudit() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  let browser;
  try {
    console.log('Starting Playwright...');
    browser = await chromium.launch({ headless: true });

    // 4K Pass
    await runPass(browser, { width: 3840, height: 2160 }, '4k_');

    // Full HD Pass
    await runPass(browser, { width: 1920, height: 1080 }, 'fhd_');

    // Desktop Pass
    await runPass(browser, { width: 1280, height: 720 }, '');

    // Mobile Landscape Pass (e.g. iPhone X Landscape)
    await runPass(browser, { width: 812, height: 375 }, 'mobile_');

    console.log(`\nAudit complete. Screenshots saved to ${ARTIFACTS_DIR}`);

  } catch (err) {
    console.error('\nAudit failed:', err);
    if (browser) {
       const contexts = browser.contexts();
       if (contexts.length > 0) {
         const pages = contexts[0].pages();
         if (pages.length > 0) {
             await pages[0].screenshot({ path: path.join(ARTIFACTS_DIR, '08_crash_state.png') });
         }
       }
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runAudit();
