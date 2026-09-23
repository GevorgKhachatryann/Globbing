import { Page, Locator, expect } from '@playwright/test';

export class RegistrationStepTwoPage {
  readonly page: Page;
  readonly seeMoreButtons: Locator;
  readonly serviceCenterDropdownToggle: Locator;
  readonly serviceCenterOptions: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;
  readonly chooseBtn: Locator;
  private activePointId: string | null = null;

  constructor(page: Page) {
    this.page = page;
    this.seeMoreButtons = page.locator('div.w-100.wh-text-box > span');
    this.chooseBtn = page.locator('button.choose-warehouse');
    this.serviceCenterDropdownToggle = page.locator('.service-center-dropdown .arrow');
    this.serviceCenterOptions = page.locator('.service-center-dropdown .dropdown-item');
    this.confirmButton = page.locator('#confirm-registration');
    this.successMessage = page.locator('.success-message:visible');
  }

  async clickRandomSeeMoreButton() {
    const seeMoreButtons = this.page.locator('[id^="see-more-"]');

    // Auto-retries until at least one button is present, or throws a clear
    // timeout error instead of racing the global test timeout.
    await expect(seeMoreButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await seeMoreButtons.count();

    const randomIndex = Math.floor(Math.random() * count);
    const chosen = seeMoreButtons.nth(randomIndex);

    const fullId = await chosen.getAttribute('id');
    if (!fullId) {
      throw new Error('Clicked "See more" button has no id attribute');
    }
    this.activePointId = fullId.replace('see-more-', '');

    await chosen.scrollIntoViewIfNeeded();

    await chosen.dblclick();

  }

  async clickChooseButton() {
    if (!this.activePointId) {
      throw new Error('clickChooseButton called before clickRandomSeeMoreButton');
    }

    const chosen = this.page
      .locator(`button[data-id="${this.activePointId}"]`)
      .locator('visible=true');

    // await chosen.scrollIntoViewIfNeeded();
    
    await chosen.click();
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

  async expectRegistrationComplete() {
    await expect(this.page).toHaveURL(/profile/);
  }

}