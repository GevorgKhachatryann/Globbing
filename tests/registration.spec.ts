import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegistrationPage } from '../pages/RegistrationPage';
import { RegistrationStepTwoPage } from '../pages/RegistrationStepTwoPage';
import { createDynamicEmailAccount } from '../utils/dynamicEmail';
import { waitForMessage, getMessageBody, extractConfirmationLink } from '../utils/mailtm';
import { expectDuplicateUnverifiedEmailError } from '../utils/registrationDuplicateEmail';
import { LoginPage } from '../pages/LoginPage';

function fakeEmail(): string {
  return `test.${faker.string.uuid()}@example.com`;
}

test.describe('Globbing — Registration', () => {
  test('registers a new individual user and confirms via email', async ({ page }) => {
    const mailbox = await createDynamicEmailAccount();
    const registrationPage = new RegistrationPage(page);
    const stepTwoPage = new RegistrationStepTwoPage(page);
    const password = faker.internet.password({ length: 12 }) + '1A!';

    await registrationPage.goto();
    await registrationPage.registerIndividual({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
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
    await stepTwoPage.clickRandomSeeMoreButton();
    await stepTwoPage.clickChooseButton();
    await stepTwoPage.expectRegistrationComplete();
  });

  test('registers a new Business and confirms via email', async ({ page }) => {
    const mailbox = await createDynamicEmailAccount();
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    const stepTwoPage = new RegistrationStepTwoPage(page);
    const password = faker.internet.password({ length: 12 }) + '1A!';

    await registrationPage.goto();
    await registrationPage.registerBusiness({
      companyName: faker.company.name(),
      email: mailbox.address,
      password,
      tin: faker.string.numeric(9),
      licensePersonName: faker.person.firstName(),
      licensePersonSurname: faker.person.lastName(),
      phoneNumber: faker.string.numeric(9),
    });

    const message = await waitForMessage(mailbox.token, { timeoutMs: 30000 });
    const htmlBody = await getMessageBody(mailbox.token, message.id);
    const confirmationLink = extractConfirmationLink(htmlBody);

    await page.goto(confirmationLink);
    await expect(page).toHaveURL(/congratulations/);
    await registrationPage.clickOnChoosePickupPoint();
    await stepTwoPage.clickRandomSeeMoreButton();
    await stepTwoPage.clickChooseButton();
    await expect(loginPage.userMenuToggle).toBeVisible({ timeout: 15000 });
    await stepTwoPage.expectRegistrationComplete();
  });

  test.describe('Validation', () => {
    let registrationPage: RegistrationPage;

    test.beforeEach(async ({ page }) => {
      registrationPage = new RegistrationPage(page);
      await registrationPage.goto();
      await registrationPage.selectIndividualTab();
    });

    test('shows an error when all fields are empty', async () => {
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error with an invalid email format', async () => {
      await registrationPage.fillIndividualDetails({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: 'not-an-email',
        password: 'SecurePass123!',
        phoneNumber: faker.string.numeric(9),
      });
      await registrationPage.submit();
      await registrationPage.expectEmailFormatError();
    });

    test('shows an error when passwords do not match', async () => {
      await registrationPage.firstNameInput.fill(faker.person.firstName());
      await registrationPage.lastNameInput.fill(faker.person.lastName());
      await registrationPage.emailInput.fill(fakeEmail());
      await registrationPage.passwordInput.fill('SecurePass123!');
      await registrationPage.repeatPasswordInput.fill('DifferentPass456!');
      await registrationPage.phoneNumberInput.fill(faker.string.numeric(9));
      await registrationPage.agreeTermsCheckbox.check();
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('rejects submission without agreeing to terms', async () => {
      await registrationPage.firstNameInput.fill(faker.person.firstName());
      await registrationPage.lastNameInput.fill(faker.person.lastName());
      await registrationPage.emailInput.fill(fakeEmail());
      await registrationPage.passwordInput.fill('SecurePass123!');
      await registrationPage.repeatPasswordInput.fill('SecurePass123!');
      await registrationPage.phoneNumberInput.fill(faker.string.numeric(9));
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error when trying to register with an already-used email', async () => {
      await registrationPage.fillIndividualDetails({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: process.env.APP_USERNAME!, // known existing account from login tests
        password: 'SecurePass123!',
        phoneNumber: faker.string.numeric(9),
      });
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error when first name is empty', async () => {
      await registrationPage.lastNameInput.fill(faker.person.lastName());
      await registrationPage.emailInput.fill(fakeEmail());
      await registrationPage.passwordInput.fill('SecurePass123!');
      await registrationPage.repeatPasswordInput.fill('SecurePass123!');
      await registrationPage.phoneNumberInput.fill(faker.string.numeric(9));
      await registrationPage.agreeTermsCheckbox.check();
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error when last name is empty', async () => {
      await registrationPage.firstNameInput.fill(faker.person.firstName());
      await registrationPage.emailInput.fill(fakeEmail());
      await registrationPage.passwordInput.fill('SecurePass123!');
      await registrationPage.repeatPasswordInput.fill('SecurePass123!');
      await registrationPage.phoneNumberInput.fill(faker.string.numeric(9));
      await registrationPage.agreeTermsCheckbox.check();
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error when phone number is empty', async () => {
      await registrationPage.firstNameInput.fill(faker.person.firstName());
      await registrationPage.lastNameInput.fill(faker.person.lastName());
      await registrationPage.emailInput.fill(fakeEmail());
      await registrationPage.passwordInput.fill('SecurePass123!');
      await registrationPage.repeatPasswordInput.fill('SecurePass123!');
      await registrationPage.agreeTermsCheckbox.check();
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('shows an error with a weak/short password', async () => {
      await registrationPage.fillIndividualDetails({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: fakeEmail(),
        password: '123', // too short/weak
        phoneNumber: faker.string.numeric(9),
      });
      await registrationPage.submit();
      await registrationPage.expectErrorVisible();
    });

    test('allows switching between individual and business tabs', async () => {
      await registrationPage.selectBusinessTab();
      await expect(registrationPage.businessTab).toBeVisible();
      await registrationPage.selectIndividualTab();
      await expect(registrationPage.individualTab).toBeVisible();
    });

    test('handles registering the same email again before the first confirmation is used', async ({ page }) => {
      const mailbox = await createDynamicEmailAccount();
      const registrationPage = new RegistrationPage(page);
      const password = faker.internet.password({ length: 12 }) + '1A!';

      const details = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: mailbox.address,
        password,
        phoneNumber: faker.string.numeric(9),
      };

      // First registration — email is sent but deliberately NOT confirmed.
      await registrationPage.goto();
      await registrationPage.registerIndividual(details);
      const firstMessage = await waitForMessage(mailbox.token, { timeoutMs: 30000 });

      // Second registration attempt with the same, still-unconfirmed address.
      await registrationPage.goto();
      await registrationPage.registerIndividual({
        ...details,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });

      await expectDuplicateUnverifiedEmailError(page, registrationPage);
    });
  });
});