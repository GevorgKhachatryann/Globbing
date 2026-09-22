import { Page, Locator, expect } from '@playwright/test';

export class ProfileSettingsPage {
  readonly page: Page;

  // Accordion section headers
  readonly personalDetailsSection: Locator;
  readonly notificationsSection: Locator;
  readonly recipientsSection: Locator;
  readonly mainReceivingAddressSection: Locator;
  readonly filesSection: Locator;

  // Personal Details fields
  readonly nameInput: Locator;
  readonly surnameInput: Locator;
  readonly birthdateInput: Locator;
  readonly genderDropdown: Locator;
  readonly phoneNumberInput: Locator;
  readonly emailInput: Locator;
  readonly emailInfoIcon: Locator;
  readonly changePasswordButton: Locator;
  readonly saveButton: Locator;

  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly submitPasswordChangeButton: Locator;
  readonly cancelPasswordChangeButton: Locator;
  readonly checkLogOutFromAllDevicesCheckbox: Locator;
  readonly passwordChangeSuccessModal: Locator;
  readonly passwordChangeSuccessCloseButton: Locator;

  // Files section
  readonly filesSearchInput: Locator;
  readonly filesFilterDropdown: Locator;
  readonly addNewFileButton: Locator;
  readonly noAttachedDocumentState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.personalDetailsSection = page.locator('#tab1Head > button');
    this.notificationsSection = page.locator('#tab2Head > button');
    this.recipientsSection = page.locator('#tab3Head > button');
    this.mainReceivingAddressSection = page.locator('#tab4Head > button');
    this.filesSection = page.locator('#tab5Head > button');

    this.nameInput = page.locator('#name');
    this.surnameInput = page.locator('#surname');
    this.birthdateInput = page.locator('#bday');
    this.genderDropdown = page.locator('#profile-setting-personal-info [for="gender"] .arrow');
    this.phoneNumberInput = page.locator('#phone');
    this.emailInput = page.locator('input[type="email"]');
    this.emailInfoIcon = page.locator(
      '#profile-setting-personal-info > div.accordion-body > div:nth-child(4) > div:nth-child(2) > label > input[type=text]'
    );
    this.changePasswordButton = page.locator(
      '#profile-setting-personal-info .pass-row button'
    );
    this.saveButton = page.locator(
      '#profile-setting-personal-info > div.accordion-body > div.d-none.d-md-block.text-end > span > button'
    );

    // Change Password modal — all scoped under #change-password
    this.currentPasswordInput = page.locator('#change-password [name="old_password"]');
    this.newPasswordInput = page.locator('#change-password > div > div:nth-child(2) > div > label > input');
    this.confirmNewPasswordInput = page.locator('#change-password > div > div:nth-child(3) > div > label > input');
    // FIX: was scoped under a nonexistent #changePasswordModal — every
    // other field here lives under #change-password instead.
    this.checkLogOutFromAllDevicesCheckbox = page.locator('#change-password [type="checkbox"]');
    this.submitPasswordChangeButton = page.locator(
      '#change-password > div > div:nth-child(5) > div > span:nth-child(2) > button'
    );
    this.cancelPasswordChangeButton = page.locator(
      '#change-password span:nth-child(1) > button'
    );

    // TODO: confirm the close button selector via DevTools — the success
    // message itself is confirmed as `.row.success-message`.
    this.passwordChangeSuccessModal = page.locator('.row.success-message');
    this.passwordChangeSuccessCloseButton = page.locator('.row.success-message button');

    this.filesSearchInput = page.locator('[data-testid="files-search-input"]');
    this.filesFilterDropdown = page.locator('[data-testid="files-filter-dropdown"]');
    this.addNewFileButton = page.locator('[data-testid="add-new-file-btn"]');
    this.noAttachedDocumentState = page.locator('[data-testid="files-empty-state"]');
  }

  async goto() {
    await this.page.goto('/profile/settings');
  }

  async openSection(section: Locator) {
    await section.click();
  }

  async updatePersonalDetails(details: { name?: string; surname?: string; phoneNumber?: string }) {
    if (details.name) {
      await this.nameInput.fill(details.name);
    }
    if (details.surname) {
      await this.surnameInput.fill(details.surname);
    }
    if (details.phoneNumber) {
      await this.phoneNumberInput.fill(details.phoneNumber);
    }
  }

  async save() {
    await this.saveButton.click();
  }

  async clickChangePassword() {
    await this.changePasswordButton.click();
  }

  async changePassword(options: {
    currentPassword: string;
    newPassword: string;
    logOutFromAllDevices?: boolean;
  }) {
    await this.currentPasswordInput.fill(options.currentPassword);
    await this.newPasswordInput.fill(options.newPassword);
    await this.confirmNewPasswordInput.fill(options.newPassword);
    if (options.logOutFromAllDevices) {
      await this.checkLogOutFromAllDevicesCheckbox.check();
    }
    await this.submitPasswordChangeButton.click();
  }

  async clickCancelPasswordChange() {
    await this.cancelPasswordChangeButton.click({force: true});
  }

  async expectPasswordChangeSuccess() {
    await expect(this.passwordChangeSuccessModal).toBeVisible({ timeout: 10000 });
  }

  async closePasswordChangeSuccessModal() {
    await this.passwordChangeSuccessCloseButton.click();
  }

  async expectEmailReadOnly() {
    await expect(this.emailInput).toBeDisabled();
  }

  async searchFiles(query: string) {
    await this.filesSearchInput.fill(query);
  }

  async openFilesFilter() {
    await this.filesFilterDropdown.click();
  }

  async clickAddNewFile() {
    await this.addNewFileButton.click();
  }

  async expectNoAttachedDocuments() {
    await expect(this.noAttachedDocumentState).toBeVisible();
  }
}