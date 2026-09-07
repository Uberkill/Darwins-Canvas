import { test, expect } from '@playwright/test';

test.describe("Darwin's Canvas E2E Flow", () => {
  test('Completes the entire new game flow', async ({ page }) => {
    await page.goto('/');

    // Wait for the game to boot up and Title Screen to show
    const newGameBtn = page.getByRole('button', { name: /New Game/i });
    await expect(newGameBtn).toBeVisible();

    // Click New Game
    await newGameBtn.click();
    
    // Pick Slot 1
    const slot1 = page.getByRole('button', { name: /Play Slot 1/i });
    await slot1.click();

    // Wait for World Setup Modal
    const mapNameInput = page.getByPlaceholder('Name your ecosystem...');
    await expect(mapNameInput).toBeVisible();

    // Pick "Archipelago"
    await page.getByRole('button', { name: /Archipelago/i }).click();

    // Pick "Small"
    await page.getByRole('button', { name: /Small/i }).click();

    // Click Start World
    const startWorldBtn = page.getByRole('button', { name: /Start World/i });
    await startWorldBtn.click();

    // Verify loading overlay appears
    await expect(page.getByText(/Loading Ecosystem/i)).toBeVisible();

    // Verify loading overlay disappears and game is playing
    const gameCanvas = page.locator('canvas[aria-label="Living terrarium ecosystem"]');
    await expect(gameCanvas).toBeVisible({ timeout: 10000 });

    // Verify HUD appears
    const tutorialBtn = page.getByTitle(/Tutorial/i);
    await expect(tutorialBtn).toBeVisible();
    
    // Assert we can click tools
    const feedTool = page.getByRole('button', { name: /Feed/i });
    await feedTool.click();
    await expect(feedTool).toHaveClass(/active/);
  });
});
