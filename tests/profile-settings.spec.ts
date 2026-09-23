import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegistrationPage } from '../pages/RegistrationPage';
import { RegistrationStepTwoPage } from '../pages/RegistrationStepTwoPage';
import { LoginPage } from '../pages/LoginPage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';
import { createDynamicEmailAccount } from '../utils/dynamicEmail';
import { waitForMessage, getMessageBody, extractConfirmationLink } from '../utils/mailtm';

// Shared helper: register + confirm a throwaway account, since password
// changes are unsafe to run against the shared APP_USERNAME account.
async function registerThrowawayAccount(
  page: import('@playwright/test').Page,
  registrationPage: RegistrationPage,
  stepTwoPage: RegistrationStepTwoPage,
  password: string
) {
  const mailbox = await createDynamicEmailAccount();

  await registrationPage.goto();
  await registrationPage.registerIndividual({
    firstName: faker.person.firstName().replace(/[^a-zA-Z]/g, ''),
    lastName: faker.person.lastName().replace(/[^a-zA-Z]/g, ''),
    email: mailbox.address,
    password,
    phoneNumber: faker.string.numeric(9),
  });

  const message = await waitForMessage(mailbox.token, { timeoutMs: 30000 });
  const htmlBody = await getMessageBody(mailbox.token, message.id);
  const confirmationLink = extractConfirmationLink(htmlBody);

  await page.goto(confirmationLink);
  await expect(page).toHaveURL(/congratulations/);
  await registrationPage.clickOnChoosePickupPoint();
  test.setTimeout(50000);
  await stepTwoPage.clickRandomSeeMoreButton();
  test.setTimeout(50000);
  await stepTwoPage.clickChooseButton();
  await stepTwoPage.expectRegistrationComplete();

  return mailbox;
}

test.describe('Globbing — Profile Settings — Change Password', () => {

  test.setTimeout(60000);

  test(
    'changes password successfully and can log in with the new password',
    { tag: '@needs-mailbox' },
    async ({ page }) => {
      const registrationPage = new RegistrationPage(page);
      const stepTwoPage = new RegistrationStepTwoPage(page);
      const loginPage = new LoginPage(page);
      const settingsPage = new ProfileSettingsPage(page);

      const originalPassword = faker.internet.password({ length: 12 }) + '1A!';
      const newPassword = faker.internet.password({ length: 12 }) + '2B!';

      const mailbox = await registerThrowawayAccount(page, registrationPage, stepTwoPage, originalPassword);

      await settingsPage.goto();
      await expect(page).toHaveURL(/profile\/settings/);
      await settingsPage.openSection(settingsPage.personalDetailsSection);
      await settingsPage.clickChangePassword();

      await settingsPage.changePassword({
        currentPassword: originalPassword,
        newPassword,
      });

      await settingsPage.expectPasswordChangeSuccess();
      await settingsPage.closePasswordChangeSuccessModal();

      await loginPage.logout();
      await loginPage.goto();
      await loginPage.login(mailbox.address, newPassword);
      await expect(page).toHaveURL(/profile/);
    }
  );

  test(
    'logs out of all devices when that option is checked during password change',
    { tag: '@needs-mailbox' },
    async ({ page, browser }) => {
      const registrationPage = new RegistrationPage(page);
      const stepTwoPage = new RegistrationStepTwoPage(page);
      const loginPage = new LoginPage(page);
      const settingsPage = new ProfileSettingsPage(page);

      const originalPassword = faker.internet.password({ length: 12 }) + '1A!';
      const newPassword = faker.internet.password({ length: 12 }) + '2B!';

      const mailbox = await registerThrowawayAccount(page, registrationPage, stepTwoPage, originalPassword);

      // A second, independent session logged in as the same account —
      // this is what we expect to get kicked out once "log out from all
      // devices" is checked in the first session's password change.
      const secondContext = await browser.newContext({ baseURL: 'https://am.new.globbing.com/' }); // just add baseURL
      const secondPage = await secondContext.newPage();
      const secondLoginPage = new LoginPage(secondPage);
      await secondLoginPage.goto();
      await secondLoginPage.login(mailbox.address, originalPassword);
      await expect(secondPage).toHaveURL(/\/profile\//, { timeout: 15000 });

      await settingsPage.goto();
      await settingsPage.openSection(settingsPage.personalDetailsSection);
      await settingsPage.clickChangePassword();
      await settingsPage.changePassword({
        currentPassword: originalPassword,
        newPassword,
        logOutFromAllDevices: true,
      });
      await settingsPage.expectPasswordChangeSuccess();
      await settingsPage.closePasswordChangeSuccessModal();

      // The second session's next action should now be rejected/redirected
      // to login, since its session should have been invalidated.
      await secondPage.reload();
      await expect(secondPage).toHaveURL(/login/, { timeout: 10000 });

      await secondContext.close();
    }
  );

  test(
    'rejects password change when current password is incorrect',
    { tag: '@needs-mailbox' },
    async ({ page }) => {
      const registrationPage = new RegistrationPage(page);
      const stepTwoPage = new RegistrationStepTwoPage(page);
      const settingsPage = new ProfileSettingsPage(page);

      const originalPassword = faker.internet.password({ length: 12 }) + '1A!';
      await registerThrowawayAccount(page, registrationPage, stepTwoPage, originalPassword);

      await settingsPage.goto();
      await settingsPage.openSection(settingsPage.personalDetailsSection);
      await settingsPage.clickChangePassword();

      await settingsPage.changePassword({
        currentPassword: 'WrongCurrentPassword123!',
        newPassword: 'NewPassword456!',
      });

      await expect(settingsPage.page.locator('.error-message:visible').first()).toBeVisible();
    }
  );

  test(
    'rejects password change when new password and confirmation do not match',
    { tag: '@needs-mailbox' },
    async ({ page }) => {
      const registrationPage = new RegistrationPage(page);
      const stepTwoPage = new RegistrationStepTwoPage(page);
      const settingsPage = new ProfileSettingsPage(page);

      const originalPassword = faker.internet.password({ length: 12 }) + '1A!';
      await registerThrowawayAccount(page, registrationPage, stepTwoPage, originalPassword);

      await settingsPage.goto();
      await settingsPage.openSection(settingsPage.personalDetailsSection);
      await settingsPage.clickChangePassword();

      // Fill directly (not via changePassword()) since we need the new
      // and confirm fields to differ, which the helper doesn't support.
      await settingsPage.currentPasswordInput.fill(originalPassword);
      await settingsPage.newPasswordInput.fill('NewPassword456!');
      await settingsPage.confirmNewPasswordInput.fill('DifferentPassword789!');
      await settingsPage.submitPasswordChangeButton.click();

      await expect(settingsPage.page.locator('.error-message:visible').first()).toBeVisible();
    }
  );

  test(
    'cancel button closes the modal without changing the password',
    { tag: '@needs-mailbox' },
    async ({ page }) => {
      const registrationPage = new RegistrationPage(page);
      const stepTwoPage = new RegistrationStepTwoPage(page);
      const loginPage = new LoginPage(page);
      const settingsPage = new ProfileSettingsPage(page);

      const originalPassword = faker.internet.password({ length: 12 }) + '1A!';
      const mailbox = await registerThrowawayAccount(page, registrationPage, stepTwoPage, originalPassword);

      await settingsPage.goto();
      await settingsPage.openSection(settingsPage.personalDetailsSection);
      await settingsPage.clickChangePassword();

      await settingsPage.currentPasswordInput.fill(originalPassword);
      await settingsPage.newPasswordInput.fill('SomeNewPassword456!');
      await settingsPage.confirmNewPasswordInput.fill('SomeNewPassword456!');
      await settingsPage.clickCancelPasswordChange();
      await settingsPage.page.reload();
      // Original password should still work — nothing was actually saved.
      await loginPage.logout();
      await loginPage.goto();
      await loginPage.login(mailbox.address, originalPassword);
      await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    }
  );
});