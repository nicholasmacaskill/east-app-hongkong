import { test, expect } from '@playwright/test';

// Configuration
const PROD_URL = 'https://app.eastsportsgroup.com';
const COACH_EMAIL = 'coach@east.com';
const PLAYER_EMAIL = 'player@east.com';
const TEST_PASSWORD = 'password123';
const TIMESTAMP = Date.now();
const DRILL_TITLE = `E2E Test Drill ${TIMESTAMP}`;
const TEAM_NAME = `E2E Squad ${TIMESTAMP}`;

test.describe('Production Core Coaching Journey', () => {

    test('Coach creates drill, creates team, and sends drill to player', async ({ page }) => {
        
        // ---------------------------------------------------------
        // PHASE 1: COACH LOGIN & DRILL CREATION
        // ---------------------------------------------------------
        await test.step('Login as Coach', async () => {
            await page.goto(PROD_URL);
            
            // Choose coach portal
            await page.getByTestId('coach-portal-section').getByRole('button', { name: 'LOGIN' }).click();
            
            // Fill login
            await page.getByPlaceholder('Email Address').fill(COACH_EMAIL);
            await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
            await page.getByRole('button', { name: 'LOGIN' }).click();
            
            // Verify dashboard loaded
            await expect(page.getByText('DASHBOARD', { exact: false })).toBeVisible({ timeout: 10000 });
        });

        await test.step('Create a New Drill', async () => {
            await page.getByRole('button', { name: 'MANAGE DRILL HUB' }).click();
            await page.getByRole('button', { name: 'NEW DRILL' }).click();
            
            // Fill core details
            await page.getByPlaceholder('e.g. 3 Cone Agility').fill(DRILL_TITLE);
            await page.getByPlaceholder('Enter main objective...').fill('Testing E2E metrics');
            
            // Setup Metrics
            await page.getByPlaceholder('e.g. 4').fill('4'); // Pods
            await page.getByPlaceholder('e.g. Red, Blue').fill('Red, Blue'); // Colors
            await page.getByPlaceholder('e.g. 60').fill('120'); // Duration

            // Create Slide
            await page.getByRole('button', { name: '+ Add Slide' }).click();
            await page.getByPlaceholder('Slide Title').fill('Warmup');
            await page.getByPlaceholder('Describe the slide...').fill('Just run.');
            
            // Save Drill
            await page.getByRole('button', { name: 'Save Drill' }).click();
            
            // Wait for modal to close (or toast to appear)
            await expect(page.getByText(DRILL_TITLE)).toBeVisible();
        });

        // ---------------------------------------------------------
        // PHASE 2: TEAM CREATION & MESSAGING
        // ---------------------------------------------------------
        await test.step('Create Team and Send Drill', async () => {
            await page.getByRole('button', { name: 'MESSAGES' }).click();
            
            // Create New Team
            await page.getByRole('button', { name: 'NEW TEAM' }).click();
            await page.getByPlaceholder('e.g. U14 Selects').fill(TEAM_NAME);
            
            // Select the first available user in the list to add to team
            const firstUserBtn = page.locator('button').filter({ has: page.locator('.lucide-check') }).first();
            await firstUserBtn.click();
            
            await page.getByRole('button', { name: 'CREATE TEAM' }).click();
            
            // Verify team appears in list and open it
            await expect(page.getByText(TEAM_NAME)).toBeVisible();
            await page.getByText(TEAM_NAME).click();
            
            // Attach Drill
            await page.locator('.lucide-layers').locator('..').click(); // Click the layers icon
            await page.getByText(DRILL_TITLE).click(); // Select the drill we just made
            
            // Send Message
            await page.getByPlaceholder('Type a message...').fill('Check out this new drill guys!');
            await page.getByRole('button', { name: 'Send' }).click();
            
            // Verify message is visible in chat
            await expect(page.getByText('Check out this new drill guys!')).toBeVisible();
            await expect(page.getByText('Attached Drill')).toBeVisible();
        });

        // Logout
        await page.goto(PROD_URL);
        await page.evaluate(() => localStorage.clear());
        
        // ---------------------------------------------------------
        // PHASE 3: PLAYER VERIFICATION
        // ---------------------------------------------------------
        await test.step('Player verifies message and drill', async () => {
            await page.goto(PROD_URL);
            
            // Choose athlete portal
            await page.getByTestId('athlete-portal-section').getByRole('button', { name: 'LOGIN' }).click();
            
            // Fill login
            await page.getByPlaceholder('Email Address').fill(PLAYER_EMAIL);
            await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
            await page.getByRole('button', { name: 'LOGIN' }).click();
            
            // Go to messages
            await page.getByRole('button', { name: 'MESSAGES' }).click();
            
            // Verify Team Exists
            await expect(page.getByText(TEAM_NAME)).toBeVisible();
            await page.getByText(TEAM_NAME).click();
            
            // Verify Coach's message and drill attachment are there
            await expect(page.getByText('Check out this new drill guys!')).toBeVisible();
            await expect(page.getByText('Attached Drill')).toBeVisible();
            
            // Send reply
            await page.getByPlaceholder('Type a message...').fill('Got it, coach!');
            await page.getByRole('button', { name: 'Send' }).click();
            
            await expect(page.getByText('Got it, coach!')).toBeVisible();
        });
    });
});
