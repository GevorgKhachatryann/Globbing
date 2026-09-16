import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Globbing — Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });


  test('logs in successfully with valid credentials', async ({ page }) => {
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
    await expect(page).toHaveURL(/profile/);
  });

  test('logs in successfully with remember me checked', async ({ page }) => {
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!, true);
    await expect(page).toHaveURL(/profile/);
  });

  // Validation errors 
  test('shows an error with an incorrect password', async () => {
    await loginPage.login(process.env.APP_USERNAME!, 'wrong-password-123');
    await loginPage.expectPasswordErrorVisible();
  });

  test('shows an error with an incorrect username', async () => {
    await loginPage.login('nonexistent-user', process.env.APP_PASSWORD!);
    await loginPage.expectEmailErrorVisible();
  });

  test('shows an error when username is empty', async () => {
    await loginPage.login('', process.env.APP_PASSWORD!);
    await loginPage.expectEmailErrorVisible();
  });

  test('shows an error when password is empty', async () => {
    await loginPage.login(process.env.APP_USERNAME!, '');
    await loginPage.expectPasswordErrorVisible();
  });

  test('shows an error when both fields are empty', async () => {
    await loginPage.login('', '');
    await loginPage.expectEmailErrorVisible();
  });

  test('rejects an invalid email format', async () => {
    await loginPage.login('not-an-email', process.env.APP_PASSWORD!);
    await loginPage.expectEmailErrorVisible();
  });

  //Field behavior
  test('password input is masked', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('submits the form on Enter key in password field', async ({ page }) => {
    await loginPage.usernameInput.fill(process.env.APP_USERNAME!);
    await loginPage.passwordInput.fill(process.env.APP_PASSWORD!);
    await loginPage.passwordInput.press('Enter');
    await expect(page).toHaveURL(/profile/);
  });

  //Navigation
  test('navigates to forgot password page', async ({ page }) => {
    await loginPage.goToForgotPassword();
    await expect(page).toHaveURL(/password-reset-email/);
  });

  test('navigates to registration page', async ({ page }) => {
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/registration/);
  });

  test('logs out successfully', async ({ page }) => {
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
    await expect(page).toHaveURL(/profile/);
    await loginPage.logout();
    await expect(page).not.toHaveURL(/profile/);
  });
});