import { faker } from '@faker-js/faker';

export interface RegistrationTestData {
  firstName: string;
  lastName: string;
  password: string;
  repeatPassword: string;
  phoneNumber: string;
}

/**
 * Builds a random-but-valid set of registration form values. Pass overrides
 * to control specific fields for negative test cases (e.g. a weak password).
 * Doesn't set a phoneCountryCode by default — leaves whatever the form's
 * default (+374) is selected.
 */
export function generateRegistrationData(
  overrides: Partial<Omit<RegistrationTestData, 'repeatPassword'>> = {},
): RegistrationTestData {
  const password = overrides.password ?? `Qa${faker.internet.password({ length: 10 })}1!`;

  return {
    firstName: overrides.firstName ?? faker.person.firstName(),
    lastName: overrides.lastName ?? faker.person.lastName(),
    password,
    repeatPassword: password,
    phoneNumber: overrides.phoneNumber ?? faker.string.numeric(8),
  };
}

/** Generates a mail.tm-safe local part unique to this test run. */
export function generateMailTmLocalPart(prefix: string = 'qa.globbing'): string {
  return `${prefix}.${Date.now()}.${faker.string.alphanumeric(5).toLowerCase()}`;
}

// Plain alphanumeric on purpose — avoids ruling in/out special-character
// handling quirks on mail.tm's side while we're still diagnosing the 401.
export const MAIL_TM_PASSWORD = 'TempMail2026xyz';