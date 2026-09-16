import { Page, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';

/**
 * Exact copy for "this email is not verified", per locale. Only add an
 * entry once you've actually seen the text for that locale — a guessed
 * translation is worse than no check at all, since it'd fail for the wrong
 * reason. Missing locales still get the visibility check below, just not
 * the exact-text one.
 */
const DUPLICATE_UNVERIFIED_EMAIL_ERROR_TEXT: Record<string, string> = {
  hy: 'Էլ. Հասցեն հաստատված չէ։',
  en: 'The email address is not verified.',
  ru: 'Электронная почта не подтверждена.'
};

function detectLocale(page: Page): string {
  const match = page.url().match(/\/(hy|en|ru)\//);
  return match ? match[1] : 'hy';
}

/**
 * Confirms that re-registering an email still pending confirmation shows
 * the app's real, confirmed error, rendered below the email field. It
 * never resends the confirmation email.
 *
 * IMPORTANT: don't check with `locator.isVisible()` here. isVisible() reads
 * the DOM at the instant it's called with no retrying — right after a
 * submit click the page is still mid-request, so it reads "not visible yet"
 * even when the message shows up a moment later. expect(locator)
 * .toBeVisible({ timeout }) polls until the timeout instead, which is what
 * an assertion made right after a form submission needs.
 */
export async function expectDuplicateUnverifiedEmailError(
  page: Page,
  registrationPage: RegistrationPage,
  options: { timeoutMs?: number } = {},
): Promise<void> {
  const { timeoutMs = 10_000 } = options;

  const error = registrationPage.errorMessage.first();
  await expect(error).toBeVisible({ timeout: timeoutMs });

  const expectedText = DUPLICATE_UNVERIFIED_EMAIL_ERROR_TEXT[detectLocale(page)];
  if (expectedText) {
    await expect(error).toHaveText(expectedText);
  }
}