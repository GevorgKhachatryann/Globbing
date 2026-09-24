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
    const visibleSeeMore = this.page
      .locator('[id^="see-more-"]')
      .filter({ visible: true });

    await expect(visibleSeeMore.first()).toBeVisible({ timeout: 15000 });

    const count = await visibleSeeMore.count();
    const fullId = await visibleSeeMore.nth(Math.floor(Math.random() * count)).getAttribute('id');
    if (!fullId) throw new Error('"See more" button has no id attribute');
    this.activePointId = fullId.replace('see-more-', '');

    const seeMore = this.page.locator(`[id="${fullId}"]`);
    await seeMore.scrollIntoViewIfNeeded();
    await seeMore.click(); // single click, not dblclick
  }

  async clickChooseButton() {
    if (!this.activePointId) {
      throw new Error('clickChooseButton called before clickRandomSeeMoreButton');
    }

    const chooseBtn = this.page
      .locator(`.choose-warehouse[data-id="${this.activePointId}"]`)
      .filter({ visible: true });

    await expect(chooseBtn).toHaveCount(1, { timeout: 10000 });
    await chooseBtn.click();
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