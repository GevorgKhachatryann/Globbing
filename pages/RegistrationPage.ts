import { Page, Locator, expect } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;
  readonly individualTab: Locator;
  readonly businessTab: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly phoneCountryCodeToggle: Locator;
  readonly phoneCountryCodeOptions: Locator;
  readonly agreeTermsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly choosePickupPointBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.individualTab = page.locator('[data-type="physical"]');
    this.businessTab = page.locator('[data-type="legal"]');
    this.firstNameInput = page.locator('#register-name');
    this.lastNameInput = page.locator('#register-surname');
    this.emailInput = page.locator('#register-email');
    this.passwordInput = page.locator('#register-password');
    this.repeatPasswordInput = page.locator('#register-password-confirmation');
    this.phoneNumberInput = page.locator('#register-phone-number');
    this.phoneCountryCodeToggle = page.locator('#user-register-form > div.phone_number-label  button');
    this.phoneCountryCodeOptions = page.locator(
      '#user-register-form > div.phone_number-label > div > div > div > ul > li > a'
    );
    this.agreeTermsCheckbox = page.locator('#terms');
    this.submitButton = page.locator('#user-register-form span > button');
    this.errorMessage = page.locator('.error-message:visible');
    this.choosePickupPointBtn = page.locator('#congrats-timer');
  }

  async goto() {
    await this.page.goto('/registration/');
  }

  async selectIndividualTab() {
    await this.individualTab.click();
  }

  async selectBusinessTab() {
    await this.businessTab.click();
  }

  async openCountryCodeDropdown() {
    await this.phoneCountryCodeToggle.click();
  }

  async selectCountryCodeByIndex(index: number) {
    await this.openCountryCodeDropdown();
    await this.phoneCountryCodeOptions.nth(index).click();
  }

  async fillIndividualDetails(details: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }) {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.passwordInput.fill(details.password);
    await this.repeatPasswordInput.fill(details.password);
    await this.phoneNumberInput.fill(details.phoneNumber);
    await this.agreeTermsCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }

  async registerIndividual(details: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }) {
    await this.selectIndividualTab();
    await this.fillIndividualDetails(details);
    await this.submit();
  }

  async expectErrorVisible() {
    await expect(this.errorMessage.first()).toBeVisible();
  }

  async clickOnChoosePickupPoint() {
    await this.choosePickupPointBtn.click();
  }

  async expectEmailFormatError() {
    const isValid = await this.emailInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid
    );

    expect(isValid).toBe(false);
  }
}