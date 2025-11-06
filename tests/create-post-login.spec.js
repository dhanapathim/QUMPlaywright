import { test, expect, chromium } from '@playwright/test';
import { qumAction, writeQUMFiles } from '../utils/qumAction.js';
import { qumValidation } from '../utils/qumValidation.js';

test.describe('Create a Post', () => {
  test.beforeAll(async () => {
  });

  test.afterAll(async () => {
    writeQUMFiles(test.info());
  });

  test('Instagram flow', async ({ page, context, baseURL }) => {
    let newTab;
    await test.step('Login', async () => {

      const stepName = "Login";
      // 1. Open the url from config
      await qumAction('Open Url', stepName, page, async () => {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      });

      // Assert title
      await qumValidation('Validate url post page load.', stepName, false, page, async () => {
        await expect(page).toHaveTitle('Brandwatch');
      });

      // await page.goto(baseURL, { waitUntil: 'load' });

      // 2. Accept Cookies
      await qumAction('Accept Cookies', stepName, page, async () => {
        await page.locator("//*[@id='onetrust-accept-btn-handler']").click();
      });

      // 3. Click Sign in button
      await qumAction('Click Sign In Tab', stepName, page, async () => {
        await page.locator('//*[@id="spanrotate"]').click();
      });
      await page.screenshot({ path: './screenshots/signin-clicked.png' });

      // 4. Click "Social Media Management"
      await qumAction('Select Social Media Management', stepName, page, async () => {
        const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
        await ssmLocator.click();

        [newTab] = await Promise.all([
          context.waitForEvent('page'),
        ]);

        console.log(await newTab.title());
      });

      // 5. Enter username.
      await qumAction('Enter username', stepName, newTab, async () => {
        await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. Click Next to go to Password Page
      await qumAction('Click Next go to password Page', stepName, newTab, async () => {
        await newTab.locator('//*[@id="continue-btn-text"]').click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 7. Enter Password
      await qumAction('Enter Password', stepName, newTab, async () => {
        await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);
      });

      // 8. Click Sign in
      await qumAction('Click SignIn Button', stepName, newTab, async () => {
        await newTab.locator('//*[@id="signin-btn-text"]').click();
      });
      await newTab.waitForLoadState('domcontentloaded');

      // Final validation
      // await expect(newTab).toHaveTitle('Social Media Management');
      await qumValidation('Validate url post page load.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });
    });

    await test.step('Select channel', async () => {
      const stepName = "Select channel";
      // 1.wait for cookies
      // await page.waitForSelector("//*[@id='onetrust-accept-btn-handler']", { state: 'visible', timeout: 5000 });
      await newTab.waitForLoadState('domcontentloaded');
      const element = newTab.locator("//*[@id='onetrust-accept-btn-handler']");
      await element.waitFor({ state: 'visible' });

      // 2. Accept Cookies
      await qumAction('Accept cookies', stepName, newTab, async () => {
        await newTab.locator("//*[@id='onetrust-accept-btn-handler']").click();
      });

      // 3. Click on add post
      await qumAction('Click on add post', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/home-feature-homescreen/main/div/section[2]/div[1]/home-feature-publications/div/div/a[1]/span`).click();
        //await page.screenshot({ path: './screenshots/signin-clicked.png' });
      });

      // 4. select instagram
      await qumAction('select instagram', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-network-selector/fang-toggle-select/fang-toggle-select-option[4]/label/fang-badge").click();
        //await ssmLocator.click();
      });

      // 5. select fang-out
      await qumAction('selct fang out', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-channel-selector/fang-select-list/div[2]/div[2]/fang-select-list-option[1]/div/fang-input-box/div/label").click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. click on create button
      await qumAction('click on create button ', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/falcon-app/ui-view/ui-view/prisma-app-outlet/div/ui-view/publish-app/publish-network-channel-selector/main/publish-side-menu/fang-card/fang-card-footer/button`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // Final validation
      await qumValidation('Validate url post page load.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });
    });
    await test.step('Publish post', async () => {
      const stepName = "Publish post";
      //1. fill data
      await qumAction('add  text', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[1]/div/publish-rich-textfield/gpt-suggestion-popover-spawn-point/div/fang-text-field/div/div[1]/fang-text-field-editable/div/div[1]").fill(" Sample test");
      });

      // 2. focus
      await qumAction('mouse over ', stepName, newTab, async () => {
        await newTab.locator(`//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]
       /publish-instagram-post-form/form/publish-form-field[2]/div/
       publish-editor-post-attachments/fang-file-uploader`).hover();
      });
      //await page.screenshot({ path: './screenshots/signin-clicked.png' });

      // 3. click on upload
      await qumAction('click on upload link', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[2]/div/publish-editor-post-attachments/fang-file-uploader/label/div[3]/div/div[2]/span[1]/button").click();
      });

      // 4. select image
      await qumAction('select image', stepName, newTab, async () => {
        await newTab.locator("(//*[contains(@id, 'fang-card-content')]/div/fang-content-media/div[2]/fang-post-thumbnail/div/ol/li)[2]").click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 5. click on add button
      await qumAction('click on add button', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/ng-component/fang-modal/div/div[3]/publish-content-pool-new-stock-picker-modal/fang-card/fang-card-footer/div/button[2]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. click on label
      await qumAction('click on the label', stepName, newTab, async () => {
        await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 7. Type label value
      await qumAction('Type the label value', stepName, newTab, async () => {
        await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).fill("cars");
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 8. select item
      await qumAction('Select item', stepName, newTab, async () => {
        await newTab.locator(`xpath=//fang-autocomplete-option[contains(@id,'fang-autocomplete-option')][1]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // Final validation
      await qumValidation('Validation.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });

    });
  });

  test('facebook flow', async ({ page, context, baseURL }) => {
    let newTab;
    await test.step('Login', async () => {

      const stepName = "Login";
      // 1. Open the url from config
      await qumAction('Open Url', stepName, page, async () => {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      });

      // Assert title
      await qumValidation('Validate url post page load.', stepName, false, page, async () => {
        await expect(page).toHaveTitle('Brandwatch');
      });

      // await page.goto(baseURL, { waitUntil: 'load' });

      // 2. Accept Cookies
      await qumAction('Accept Cookies', stepName, page, async () => {
        await page.locator("//*[@id='onetrust-accept-btn-handler']").click();
      });

      // 3. Click Sign in button
      await qumAction('Click Sign In Tab', stepName, page, async () => {
        await page.locator('//*[@id="spanrotate"]').click();
      });
      await page.screenshot({ path: './screenshots/signin-clicked.png' });

      // 4. Click "Social Media Management"
      await qumAction('Select Social Media Management', stepName, page, async () => {
        const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
        await ssmLocator.click();

        [newTab] = await Promise.all([
          context.waitForEvent('page'),
        ]);

        console.log(await newTab.title());
      });

      // 5. Enter username.
      await qumAction('Enter username', stepName, newTab, async () => {
        await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. Click Next to go to Password Page
      await qumAction('Click Next go to password Page', stepName, newTab, async () => {
        await newTab.locator('//*[@id="continue-btn-text"]').click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 7. Enter Password
      await qumAction('Enter Password', stepName, newTab, async () => {
        await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);
      });

      // 8. Click Sign in
      await qumAction('Click SignIn Button', stepName, newTab, async () => {
        await newTab.locator('//*[@id="signin-btn-text"]').click();
      });
      await newTab.waitForLoadState('domcontentloaded');

      // Final validation
      // await expect(newTab).toHaveTitle('Social Media Management');
      await qumValidation('Validate url post page load.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });
    });

    await test.step('Select channel', async () => {
      const stepName = "Select channel";
      // 1.wait for cookies
      // await page.waitForSelector("//*[@id='onetrust-accept-btn-handler']", { state: 'visible', timeout: 5000 });
      await newTab.waitForLoadState('domcontentloaded');
      const element = newTab.locator("//*[@id='onetrust-accept-btn-handler']");
      await element.waitFor({ state: 'visible' });

      // 2. Accept Cookies
      await qumAction('Accept cookies', stepName, newTab, async () => {
        await newTab.locator("//*[@id='onetrust-accept-btn-handler']").click();
      });

      // 3. Click on add post
      await qumAction('Click on add post', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/home-feature-homescreen/main/div/section[2]/div[1]/home-feature-publications/div/div/a[1]/span`).click();
        //await page.screenshot({ path: './screenshots/signin-clicked.png' });
      });

      // 4. select instagram
      await qumAction('select instagram', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-network-selector/fang-toggle-select/fang-toggle-select-option[4]/label/fang-badge").click();
        //await ssmLocator.click();
      });

      // 5. select fang-out
      await qumAction('selct fang out', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-channel-selector/fang-select-list/div[2]/div[2]/fang-select-list-option[1]/div/fang-input-box/div/label").click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. click on create button
      await qumAction('click on create button ', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/falcon-app/ui-view/ui-view/prisma-app-outlet/div/ui-view/publish-app/publish-network-channel-selector/main/publish-side-menu/fang-card/fang-card-footer/button`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // Final validation
      await qumValidation('Validate url post page load.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });
    });
    await test.step('Publish post', async () => {
      const stepName = "Publish post";
      //1. fill data
      await qumAction('add  text', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[1]/div/publish-rich-textfield/gpt-suggestion-popover-spawn-point/div/fang-text-field/div/div[1]/fang-text-field-editable/div/div[1]").fill(" Sample test");
      });

      // 2. focus
      await qumAction('mouse over ', stepName, newTab, async () => {
        await newTab.locator(`//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]
     /publish-instagram-post-form/form/publish-form-field[2]/div/
     publish-editor-post-attachments/fang-file-uploader`).hover();
      });
      //await page.screenshot({ path: './screenshots/signin-clicked.png' });

      // 3. click on upload
      await qumAction('click on upload link', stepName, newTab, async () => {
        await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[2]/div/publish-editor-post-attachments/fang-file-uploader/label/div[3]/div/div[2]/span[1]/button").click();
      });

      // 4. select image
      await qumAction('select image', stepName, newTab, async () => {
        await newTab.locator("(//*[contains(@id, 'fang-card-content')]/div/fang-content-media/div[2]/fang-post-thumbnail/div/ol/li)[2]").click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 5. click on add button
      await qumAction('click on add button', stepName, newTab, async () => {
        await newTab.locator(`xpath=/html/body/ng-component/fang-modal/div/div[3]/publish-content-pool-new-stock-picker-modal/fang-card/fang-card-footer/div/button[2]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 6. click on label
      await qumAction('click on the label', stepName, newTab, async () => {
        await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 7. Type label value
      await qumAction('Type the label value', stepName, newTab, async () => {
        await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).fill("cars");
        await newTab.waitForLoadState('domcontentloaded');
      });

      // 8. select item
      await qumAction('Select item', stepName, newTab, async () => {
        await newTab.locator(`xpath=//fang-autocomplete-option[contains(@id,'fang-autocomplete-option')][1]`).click();
        await newTab.waitForLoadState('domcontentloaded');
      });

      // Final validation
      await qumValidation('Validation.', stepName, true, newTab, async () => {
        await expect(newTab).toHaveTitle('Social Media Management')
      });
    });
  });

});
