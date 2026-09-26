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
    const chosen = visibleSeeMore.nth(Math.floor(Math.random() * count));
    const fullId = await chosen.getAttribute('id');
    if (!fullId) throw new Error('"See more" button has no id attribute');
    this.activePointId = fullId.replace('see-more-', '');

    const seeMore = this.page.locator(`[id="${fullId}"]`);
    await seeMore.scrollIntoViewIfNeeded();

    // DIAGNOSTIC: what's actually at the click point?
    const box = await seeMore.boundingBox();
    console.log('bounding box:', box);
    if (box) {
      const elementAtPoint = await this.page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, id: el.id, cls: el.className } : null;
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      console.log('element actually at click point:', elementAtPoint);
    }

    await seeMore.click();
    await this.page.waitForTimeout(500);

    const allButtons = await this.page.locator('.choose-warehouse').evaluateAll(els =>
      els.map(e => ({ id: e.getAttribute('data-id'), visible: (e as HTMLElement).offsetParent !== null }))
    );
    console.log('activePointId:', this.activePointId);
    console.log('all choose-warehouse buttons:', allButtons);
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