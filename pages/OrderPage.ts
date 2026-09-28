import { Page, Locator, expect } from '@playwright/test';

export class OrderPage {
  readonly page: Page;
  readonly addParcelButton: Locator;
  readonly trackingNumberInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly countryOptions: Locator;
  readonly shopDropdownToggle: Locator;
  readonly shopDropdownArrow: Locator;
  readonly shopOptions: Locator;
  readonly orderNameInput: Locator;
  readonly priceInput: Locator;
  readonly fileInput: Locator;
  readonly insuranceArrow: Locator;
  readonly insuranceOptions: Locator;
  readonly recipientArrow: Locator;
  readonly recipientOptions: Locator;
  readonly agreeTermsCheckbox: Locator;
  readonly deliveryMethodOptions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addParcelButton = page.getByRole('button', { name: 'Add Parcel' });
    this.countryOptions = page.locator('.section.country-section > div > div');
    this.trackingNumberInput = page.locator('#tracking');
    this.deliveryMethodOptions = page.locator('.section.method-section .radio-tab.switch-tab');
    this.shopDropdownToggle = page.locator('.dropdown-toggle.shop-options-dropdown');
    this.shopDropdownArrow = page.locator('.dropdown-toggle.shop-options-dropdown .arrow');
    this.shopOptions = page.locator('#sale-order > div:nth-child(6) label > div > ul > li > a');
    this.submitButton = page.locator('#submit-sale-order');
    this.errorMessage = page.locator('.error-message');
    this.agreeTermsCheckbox = page.locator('#agree-terms');
    this.orderNameInput = page.locator('[name="declaration[0][title]"]');
    this.priceInput = page.locator('#order-declarations .price-input');
    this.fileInput = page.locator('#uploadifive-undefined > input[type=file]');
    this.insuranceArrow = page.locator('.section.insurance-section .arrow');
    this.insuranceOptions = page.locator('.section.insurance-section .dropdown-item');
    this.recipientArrow = page.locator('.section.recipient-section .arrow');
    this.recipientOptions = page.locator('.section.recipient-section .dropdown-item');
  }

  // --- edit page locators (the declaration ID in the name differs per order) ---
  // filter({ visible: true }) needs Playwright 1.51+. On older versions use .locator('visible=true').
  get editOrderNameInput(): Locator {
    return this.page
      .locator('input[name^="declaration["][name$="][title]"]')
      .filter({ visible: true });
  }

  get editPriceInput(): Locator {
    // if its name is declaration[<id>][price], use:
    // input[name^="declaration["][name$="][price]"]
    return this.page.locator('.price-input').filter({ visible: true });
  }

  get editTrackingNumberInput(): Locator {
    return this.page.locator('#tracking').filter({ visible: true });
  }

  async goto() {
    await this.page.goto('/sale-order/');
  }

  async openAddParcelForm() {
    await this.addParcelButton.click();
  }

  async selectCountryByName(countryName: string) {
    await this.countryOptions.filter({ hasText: countryName }).click();
  }

  async openShopDropdown() {
    await this.shopDropdownArrow.click();
  }

  private deleteButtonFor(trackingNumber: string): Locator {
    return this.page.locator(
      `.delete-parcel-btn[data-order-number="${trackingNumber}"]`
    );
  }

  async deleteParcelByTrackingNumber(trackingNumber: string) {
    const deleteBtn = this.deleteButtonFor(trackingNumber);
    const myOrdersUrl = this.page.url();

    await expect(async () => {
      await this.page.goto(myOrdersUrl);
      await this.page.waitForLoadState('networkidle');
      await expect(deleteBtn).toHaveCount(1, { timeout: 3000 });
    }).toPass({ timeout: 30000 });

    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();

    const confirmBtn = this.page.locator('#saleOrderDeleteBtn');
    await expect(confirmBtn).toBeVisible({ timeout: 10000 }); // modal fade-in
    await confirmBtn.click();

    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    await expect(this.deleteButtonFor(trackingNumber)).toHaveCount(0, { timeout: 10000 });
  }

  private editButtonFor(trackingNumber: string): Locator {
    return this.page
      .locator('.row.order-row')
      .filter({ hasText: trackingNumber })
      .locator('a[href*="/sale-order/edit/"]');
  }

  async openEditParcel(trackingNumber: string) {
    const editLink = this.editButtonFor(trackingNumber);
    await expect(editLink).toHaveCount(1, { timeout: 15000 });
    await editLink.click();
    await expect(this.page).toHaveURL(/\/sale-order\/edit\/\d+/);
    await expect(this.editOrderNameInput).toBeVisible();
  }

  private async replaceValue(input: Locator, from: string, to: string) {
    await expect(input).toHaveValue(from); // old value is there right now
    await input.fill(to);
  }

  async editParcel(changes: {
    trackingNumber?: { from: string; to: string };
    orderName?: { from: string; to: string };
    price?: { from: string; to: string };
    shopName?: string;
    insuranceType?: string;
    filePath?: string;
  }) {
    if (changes.trackingNumber)
      await this.replaceValue(this.editTrackingNumberInput, changes.trackingNumber.from, changes.trackingNumber.to);
    if (changes.orderName)
      await this.replaceValue(this.editOrderNameInput, changes.orderName.from, changes.orderName.to);
    if (changes.price)
      await this.replaceValue(this.editPriceInput, changes.price.from, changes.price.to);
    if (changes.shopName !== undefined) await this.selectShopByName(changes.shopName);
    if (changes.filePath !== undefined) await this.attachFile(changes.filePath);
    if (changes.insuranceType !== undefined)
       await this.selectInsuranceByName(changes.insuranceType);
       await this.agreeToTerms();

    await this.submit();
  }

  async expectFormValues(expected: { trackingNumber?: string; orderName?: string; price?: string }) {
    if (expected.trackingNumber !== undefined)
      await expect(this.editTrackingNumberInput).toHaveValue(expected.trackingNumber);
    if (expected.orderName !== undefined)
      await expect(this.editOrderNameInput).toHaveValue(expected.orderName);
    if (expected.price !== undefined)
      await expect(this.editPriceInput).toHaveValue(expected.price);
  }

  async selectShopByName(shopName: string) {
    await this.openShopDropdown();
    await this.page.locator(`[data-value="${shopName}"]`).click();
    // await this.shopOptions.filter({ hasText: shopName }).click();
  }

  async fillOrderName(orderName: string) {
    await this.orderNameInput.fill(orderName);
  }

  async fillPrice(price: string) {
    await this.priceInput.fill(price);
  }

  async attachFile(filePath: string) {
    await this.fileInput.click();
    await this.fileInput.setInputFiles(filePath);
  }

  async selectDeliveryMethodByName(methodName: string) {
    const visibleOptions = this.deliveryMethodOptions.locator('visible=true');
    await visibleOptions.filter({ hasText: methodName }).click();
  }

  async openInsuranceDropdown() {
    await this.insuranceArrow.click();
  }

  async selectInsuranceByName(insuranceType: string) {
    await this.openInsuranceDropdown();
    await this.insuranceOptions.filter({ hasText: insuranceType }).click();
  }

  async selectInsuranceByIndex(index: number) {
    await this.openInsuranceDropdown();
    await this.insuranceOptions.nth(index).click();
  }

  async openRecipientDropdown() {
    await this.recipientArrow.click();
  }

  async selectRecipientByName(recipientName: string) {
    await this.openRecipientDropdown();
    await this.recipientOptions.filter({ hasText: recipientName }).click();
  }

  async selectRecipientByIndex(index: number) {
    await this.openRecipientDropdown();
    await this.recipientOptions.nth(index).click();
  }

  async agreeToTerms() {
    await this.agreeTermsCheckbox.check();
  }

  async fillParcelDetails(details: {
    trackingNumber: string;
    shopName: string;
    orderName: string;
    price: string;
    insuranceType: string;
    recipientName: string;
    deliveryMethod: string;
    filePath: string;
  }) {
    await this.selectDeliveryMethodByName(details.deliveryMethod);
    await this.trackingNumberInput.fill(details.trackingNumber);
    await this.selectShopByName(details.shopName);
    await this.fillOrderName(details.orderName);
    await this.fillPrice(details.price);
    await this.attachFile(details.filePath);
    await this.selectInsuranceByName(details.insuranceType);
    await this.agreeToTerms();
    await this.selectRecipientByIndex(0);
  }

  async submit() {
    await this.submitButton.click();
  }

  async addParcel(details: {
    trackingNumber: string;
    shopName: string;
    orderName: string;
    price: string;
    insuranceType: string;
    recipientName: string;
    deliveryMethod: string;
    filePath: string;
  }) {
    await this.fillParcelDetails(details);
    await this.submit();
  }

  async expectErrorVisible() {
    const visibleError = this.errorMessage.locator('visible=true');
    await expect(visibleError).toBeVisible();
  }
}