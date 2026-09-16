import { faker } from '@faker-js/faker';
import { getRandomDomain, createAccount, getToken, MailTmAccount } from './mailtm';

// Global throttle: ensures we never hit mail.tm more than once every N ms,
// across all tests sharing this module — not just within a single call.
let lastCallTime = 0;
const MIN_INTERVAL_MS = 3000;

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, lastCallTime + MIN_INTERVAL_MS - now);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastCallTime = Date.now();
}

export async function createDynamicEmailAccount(): Promise<MailTmAccount> {
  const maxDomainAttempts = 5;

  for (let attempt = 1; attempt <= maxDomainAttempts; attempt++) {
    await throttle();

    const domain = await getRandomDomain();
    const randomLetters = faker.string.alpha({ length: 8, casing: 'lower' });
    const randomDigits = faker.string.numeric(4);
    const address = `${randomLetters}${randomDigits}@${domain}`;
    const password = faker.internet.password({ length: 14 });

    try {
      await createAccount(address, password);
      const token = await getToken(address, password);
      return { address, password, token };
    } catch (err: any) {
      console.log(`Domain "${domain}" failed on attempt ${attempt}/${maxDomainAttempts}: ${err.message}`);
      if (attempt === maxDomainAttempts) {
        throw new Error(`All ${maxDomainAttempts} domain attempts failed. Last error: ${err.message}`);
      }
      const backoff = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s, 16s
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw new Error('Unreachable');
}