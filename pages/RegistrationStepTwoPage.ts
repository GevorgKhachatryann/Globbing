import { Page, Locator, expect } from '@playwright/test';

export class RegistrationStepTwoPage {
  readonly page: Page;
  readonly seeMoreButtons: Locator;
  readonly serviceCenterDropdownToggle: Locator;
  readonly serviceCenterOptions: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;
  readonly chooseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: replace with real locators once you inspect the actual step-two page
    this.seeMoreButtons = page.locator('div.w-100.wh-text-box > span');
    this.chooseBtn = page.locator('span.custom-btn-wrapper > button');
    this.serviceCenterDropdownToggle = page.locator('.service-center-dropdown .arrow');
    this.serviceCenterOptions = page.locator('.service-center-dropdown .dropdown-item');
    this.confirmButton = page.locator('#confirm-registration');
    this.successMessage = page.locator('.success-message:visible');
  }

  async clickRandomSeeMoreButton() {
    const visibleButtons = this.seeMoreButtons.locator('visible=true');
    const count = await visibleButtons.count();
    const randomIndex = Math.floor(Math.random() * count);
    const chosen = visibleButtons.nth(randomIndex);

    await chosen.scrollIntoViewIfNeeded();
    await chosen.waitFor({ state: 'visible', timeout: 10000 });

    const browserName = this.page.context().browser()?.browserType().name();
    if (browserName === 'webkit') {
      await chosen.click({ force: true });
    } else {
      await chosen.click();
    }
  }

    async selectServiceCenterByIndex(index: number) {
    await this.serviceCenterDropdownToggle.click();
    await this.serviceCenterOptions.nth(index).click();
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async expectSuccessVisible() {
    await expect(this.successMessage.first()).toBeVisible();
  }

  async clickChooseButton() {
    const chosen = this.chooseBtn.locator('visible=true');
    await expect(chosen).toBeVisible({ timeout: 10000 });
    await chosen.click({ force: true });
  }

  async expectRegistrationComplete() {
    await expect(this.page).toHaveURL(/profile/);
  }

}