import { test, expect, chromium } from '@playwright/test';
import { qumAction, writeQUMFiles } from '../utils/qumAction.js';
import { qumValidation } from '../utils/qumValidation.js';

test.describe('Instagram', () => {
  test.beforeAll(async () => {
  });

  test.afterAll(async () => {
    writeQUMFiles(test.info());
  });

  test('Login', async ({ page, context, baseURL }) => {

    // 1. Open the url from config
    await qumAction('Open Url', page, async () => {
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    });

    // Assert title
    await qumValidation('Validate url post page load.','', false,page, async () => {
      await expect(page).toHaveTitle('Brandwatch');
    });

    // 2. Accept Cookies
    await qumAction('Accept Cookies', page, async () => {
      await page.locator("//*[@id='onetrust-accept-btn-handler']").click();
    });

    // 3. Click Sign in button
    await qumAction('Click Sign In Tab', page, async () => {
      await page.locator('//*[@id="spanrotate"]').click();
    });
    await page.screenshot({ path: './screenshots/signin-clicked.png' });

    let newTab;

    // 4. Click "Social Media Management"
    await qumAction('Select Social Media Management', page, async () => {
      const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
      await ssmLocator.click();

      [newTab] = await Promise.all([
        context.waitForEvent('page'),
      ]);

      console.log(await newTab.title());
    });

    // 5. Enter username.
    await qumAction('Enter username', newTab, async () => {
      await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
      await newTab.waitForLoadState('domcontentloaded');
    });

    // 6. Click Next to go to Password Page
    await qumAction('Click Next go to password Page', newTab, async () => {
      await newTab.locator('//*[@id="continue-btn-text"]').click();
      await newTab.waitForLoadState('domcontentloaded');
    });

    // 7. Enter Password
    await qumAction('Enter Password', newTab, async () => {
      await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);
    });

    // 8. Click Sign in
    await qumAction('Click SignIn Button', newTab, async () => {
      await newTab.locator('//*[@id="signin-btn-text"]').click();
    });
    await newTab.waitForLoadState('domcontentloaded');

    // Final validation
    // await expect(newTab).toHaveTitle('Social Media Management');
    await qumValidation('Validate url post page load.','', true,page, async () => {
      await expect(newTab).toHaveTitle('Social Media Management')
    });
  });
 
});