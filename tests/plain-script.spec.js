import { test, expect } from '@playwright/test';

test.describe('Instagram', () => {

  test('Instagram flow', async ({ page, context, baseURL }) => {
    let newTab;
  await test.step('Login', async () => {
    // 1. Open url
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('Brandwatch');

    // 2. Accept Cookies
    await page.locator("//*[@id='onetrust-accept-btn-handler']").click();

    // 3. Click Sign in button
    await page.locator('//*[@id="spanrotate"]').click();
    await page.screenshot({ path: './screenshots/signin-clicked.png' });

    

    // 4. Click "Social Media Management"
    const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
    await ssmLocator.click();

    [newTab] = await Promise.all([
      context.waitForEvent('page'),
    ]);

    console.log(await newTab.title());

    // 5. Enter username.
    await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
    await newTab.waitForLoadState('domcontentloaded');

    // 6. Click Next to go to Password Page
    await newTab.locator('//*[@id="continue-btn-text"]').click();
    await newTab.waitForLoadState('domcontentloaded');

    // 7. Enter Password
    await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);

    // 8. Click Sign in
    await newTab.locator('//*[@id="signin-btn-text"]').click();
    await newTab.waitForLoadState('domcontentloaded');

    // Final validation
    await expect(newTab).toHaveTitle('Social Media Management')
  });
 await test.step('Select channel', async () => {
    // 1.wait for cookies
   // await page.waitForSelector("//*[@id='onetrust-accept-btn-handler']", { state: 'visible', timeout: 5000 });
   const element = newTab.locator("//*[@id='onetrust-accept-btn-handler']");
    await element.waitFor({ state: 'visible' }); 
   // 2. Accept Cookies
    await newTab.locator("//*[@id='onetrust-accept-btn-handler']").click();

    // 3. Click on add post
    await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/home-feature-homescreen/main/div/section[2]/div[1]/home-feature-publications/div/div/a[1]/span`).click();
    //await page.screenshot({ path: './screenshots/signin-clicked.png' });

    

    // 4. select instagram
     await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-network-selector/fang-toggle-select/fang-toggle-select-option[4]/label/fang-badge").click();
    //await ssmLocator.click();

    
    // 5. select fang-out
    await newTab.locator("//*[contains(@id, 'fang-card-content')]/publish-channel-selector/fang-select-list/div[2]/div[2]/fang-select-list-option[1]/div/fang-input-box/div/label").click();
    await newTab.waitForLoadState('domcontentloaded');

    // 6. click on create button
    await newTab.locator(`xpath=/html/body/falcon-new-app/prisma-shell/div/falcon-app/ui-view/ui-view/prisma-app-outlet/div/ui-view/publish-app/publish-network-channel-selector/main/publish-side-menu/fang-card/fang-card-footer/button`).click();
    await newTab.waitForLoadState('domcontentloaded');

    
    // Final validation
    await expect(newTab).toHaveTitle('Social Media Management')
  });
  await test.step('Publish post', async () => {
   //1. fill data
    await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[1]/div/publish-rich-textfield/gpt-suggestion-popover-spawn-point/div/fang-text-field/div/div[1]/fang-text-field-editable/div/div[1]").fill(" Sample test");

    // 2. focus
    await newTab.locator(`//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]
      /publish-instagram-post-form/form/publish-form-field[2]/div/
      publish-editor-post-attachments/fang-file-uploader`).hover();
    //await page.screenshot({ path: './screenshots/signin-clicked.png' });
    // 3. click on upload
     await newTab.locator("//*[contains(@id, 'fang-card-content')]/fang-tabs/div[2]/publish-instagram-post-form/form/publish-form-field[2]/div/publish-editor-post-attachments/fang-file-uploader/label/div[3]/div/div[2]/span[1]/button").click();
    //await ssmLocator.click();

    // 4. select image
    await newTab.locator("(//*[contains(@id, 'fang-card-content')]/div/fang-content-media/div[2]/fang-post-thumbnail/div/ol/li)[2]").click();
    await newTab.waitForLoadState('domcontentloaded');

    // 5. click on add button
    await newTab.locator(`xpath=/html/body/ng-component/fang-modal/div/div[3]/publish-content-pool-new-stock-picker-modal/fang-card/fang-card-footer/div/button[2]`).click();
    await newTab.waitForLoadState('domcontentloaded');

     // 6. click on lable
     await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).click();
     await newTab.waitForLoadState('domcontentloaded');
      // 7. Type lable value
    await newTab.locator(`xpath=(//input[@placeholder='Add labels...'])[1]`).fill("cars");
    await newTab.waitForLoadState('domcontentloaded');
     // 8. select item
     await newTab.locator(`xpath=//fang-autocomplete-option[contains(@id,'fang-autocomplete-option')][1]`).click();
     await newTab.waitForLoadState('domcontentloaded');
    // Final validation
    await expect(newTab).toHaveTitle('Social Media Management')
  });

});
});