import { faker } from '@faker-js/faker';
import { getRandomDomain, createAccount, getToken, MailTmAccount } from './mailtm';

export async function createDynamicEmailAccount(): Promise<MailTmAccount> {
  const maxDomainAttempts = 5;

  for (let attempt = 1; attempt <= maxDomainAttempts; attempt++) {
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
      // brief pause before trying a different domain
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Unreachable');
}