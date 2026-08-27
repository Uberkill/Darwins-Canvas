import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5180/Darwins-Canvas/');
  
  await page.evaluate(() => {
    if (window.useCollectionStore) {
      window.useCollectionStore.getState().addCreature(
        { id: 'test', name: 'Chunky Potato', diet: 'HERBIVORE', size: 'MEDIUM', movement: 'WALK', kills: 0, foodEaten: 59, loreProfile: '' },
        { drawingData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', decals: [], bakedSprites: {} }
      );
    }
  });

  await page.locator('button[aria-label="Open Collection"]').click();
  await page.waitForSelector('.trading-card-container img', {state: 'visible'});
  
  const imgWidth = await page.$eval('.trading-card-container img', el => getComputedStyle(el).width);
  const containerWidth = await page.$eval('.trading-card-container', el => getComputedStyle(el).width);
  
  console.log('Img Width:', imgWidth);
  console.log('Container Width:', containerWidth);
  
  await browser.close();
}

run().catch(console.error);
