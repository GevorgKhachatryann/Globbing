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

  private async pickAndOpenRandomPoint(): Promise<string> {
    const visibleSeeMore = this.page
      .locator('[id^="see-more-"]')
      .filter({ visible: true });

    await expect(visibleSeeMore.first()).toBeVisible({ timeout: 15000 });

    const count = await visibleSeeMore.count();
    const fullId = await visibleSeeMore.nth(Math.floor(Math.random() * count)).getAttribute('id');
    if (!fullId) throw new Error('"See more" button has no id attribute');

    const pointId = fullId.replace('see-more-', '');
    const seeMore = this.page.locator(`[id="${fullId}"]`);
    await seeMore.scrollIntoViewIfNeeded();
    // Let any scroll animation settle before clicking, so the click
    // lands on the intended element instead of a mid-scroll position.
    await this.page.waitForTimeout(300);
    await seeMore.click();

    return pointId;
  }

  async clickRandomSeeMoreButton() {
    // Retry the whole pick-and-click sequence a few times: occasionally
    // a single click doesn't register (see-more expands nothing), which
    // otherwise surfaces later as a confusing "choose button never found" error.
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const pointId = await this.pickAndOpenRandomPoint();
      const chooseBtn = this.page
        .locator(`.choose-warehouse[data-id="${pointId}"]`)
        .filter({ visible: true });

      try {
        await expect(chooseBtn).toHaveCount(1, { timeout: 6000 });
        this.activePointId = pointId;
        return; // success
      } catch (e) {
        lastError = e;
        console.warn(`Attempt ${attempt}: choose button for point ${pointId} never appeared, retrying with a new row.`);
      }
    }

    throw new Error(
      `clickRandomSeeMoreButton: choose button never appeared after 3 attempts. Last error: ${lastError}`
    );
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