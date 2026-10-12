import { test, expect } from '@playwright/test';
import path from 'path';
import { faker } from '@faker-js/faker';

import { RegistrationPage } from '../pages/RegistrationPage';
import { RegistrationStepTwoPage } from '../pages/RegistrationStepTwoPage';
import { OrderPage } from '../pages/OrderPage';

import { createDynamicEmailAccount } from '../utils/dynamicEmail';
import { waitForMessage, getMessageBody, extractConfirmationLink } from '../utils/mailtm';
import { saveWeeklyAccount, updateOrdersPlaced } from '../utils/weeklyAccountStore';

import {
  shopsByCountry,
  countries,
  deliveryMethodByCountry,
  insuranceOptions,
  PRICE_RANGE,
} from '../data/orderTestData';

const INVOICE_FILE_PATH = path.join(__dirname, '../data/sample-invoice.pdf');

// How many different orders to place each week (override: WEEKLY_ORDERS=6)
const ORDERS_PER_WEEK = Number(process.env.WEEKLY_ORDERS ?? 4);

test.describe('Globbing — Weekly mail.tm account with orders', () => {
  test.setTimeout(15 * 60 * 1000);

  test('registers a NEW account on a mail.tm mailbox and places different orders', async ({ page }, testInfo) => {
    // The config runs 3 browsers; we want exactly ONE weekly account.
    test.skip(testInfo.project.name !== 'chromium', 'Weekly account is created in chromium only');

    const registrationPage = new RegistrationPage(page);
    const stepTwoPage = new RegistrationStepTwoPage(page);
    const orderPage = new OrderPage(page);

    // 1. Create the mailbox and SAVE IT FIRST — so the director can open the
    //    inbox even if registration or an order fails later.
    const mailbox = await createDynamicEmailAccount();
    saveWeeklyAccount(mailbox.address, mailbox.password);

    // 2. Register on Globbing with that mailbox (same flow as profile-settings.spec.ts)
    const firstName = faker.person.firstName().replace(/[^a-zA-Z]/g, '');
    const lastName = faker.person.lastName().replace(/[^a-zA-Z]/g, '');
    const globbingPassword = faker.internet.password({ length: 12 }) + '1A!';

    await registrationPage.goto();
    await registrationPage.registerIndividual({
      firstName,
      lastName,
      email: mailbox.address,
      password: globbingPassword,
      phoneNumber: faker.string.numeric(9),
    });

    // 3. Confirm the email through the mailbox
    const message = await waitForMessage(mailbox.token, { timeoutMs: 30000 });
    const htmlBody = await getMessageBody(mailbox.token, message.id);
    await page.goto(extractConfirmationLink(htmlBody));
    await expect(page).toHaveURL(/congratulations/);
    await registrationPage.clickOnChoosePickupPoint();
    await stepTwoPage.clickRandomSeeMoreButton();
    await stepTwoPage.clickChooseButton();
    await stepTwoPage.expectRegistrationComplete();

    // 4. Place DIFFERENT orders: unique country + shop combinations
    const combos = countries.flatMap((country) =>
      shopsByCountry[country].map((shopName) => ({ country, shopName }))
    );
    const chosen = faker.helpers.shuffle(combos).slice(0, ORDERS_PER_WEEK);

    let placed = 0;
    for (const { country, shopName } of chosen) {
      await test.step(`Order ${placed + 1}: ${country} / ${shopName}`, async () => {
        await orderPage.goto();
        await orderPage.selectCountryByName(country);
        await orderPage.addParcel({
          trackingNumber: `TRACK${faker.string.numeric(9)}`,
          shopName,
          orderName: faker.commerce.productName(),
          price: faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }),
          insuranceType: faker.helpers.arrayElement(insuranceOptions),
          // ASSUMPTION: a fresh account's recipient is the name it registered with.
          // Your other specs use 'Fyodor Fyodor', which only exists on APP_USERNAME.
        //   recipientName: `${firstName} ${lastName}`,
          deliveryMethod: deliveryMethodByCountry[country],
          filePath: INVOICE_FILE_PATH,
        });
        await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });
        placed++;
        updateOrdersPlaced(mailbox.address, placed);
      });
    }

    console.log(`Weekly run finished: ${placed} orders placed for ${mailbox.address}`);

    // IMPORTANT: no cleanup here on purpose — the orders and the account must stay.
  });
});