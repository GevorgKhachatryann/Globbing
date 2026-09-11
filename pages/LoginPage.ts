import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.rememberMeCheckbox = page.locator('#remember');
    this.loginButton = page.locator('#user-login-form button[type="submit"]');

    const loginFormErrors = page.locator('#user-login-form .error-message');
    this.emailError = loginFormErrors.nth(0);
    this.passwordError = loginFormErrors.nth(1);

    this.forgotPasswordLink = page.getByText('Մոռացե՞լ եք Ձեր գաղտնաբառը');
    this.registerLink = page.getByText('Միացեք հիմա');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string, rememberMe: boolean = false) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async expectEmailErrorVisible(timeout: number = 10000) {
    await expect(this.emailError).toBeVisible({ timeout });
  }

  async expectPasswordErrorVisible(timeout: number = 10000) {
    await expect(this.passwordError).toBeVisible({ timeout });
  }
}