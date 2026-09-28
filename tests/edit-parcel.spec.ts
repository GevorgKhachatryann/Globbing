import { test, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';
import { faker } from '@faker-js/faker';
import {
  shopsByCountry,
  deliveryMethodByCountry,
  insuranceOptions,
  PRICE_RANGE,
} from '../data/orderTestData';

const INVOICE_FILE_PATH = path.join(__dirname, '../data/sample-invoice.pdf');
const country = 'ԱՄՆ';

const randomPrice = () =>
  faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 });

test.describe('Globbing — Edit Parcel', () => {
  let loginPage: LoginPage;
  let orderPage: OrderPage;
  let createdTrackingNumbers: string[] = [];
  let myOrdersUrl: string;
  let original: { trackingNumber: string; orderName: string; price: string };
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    createdTrackingNumbers = [];
    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    await orderPage.goto();

    // Arrange: create the parcel we are going to edit
    original = {
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      orderName: faker.commerce.productName(),
      price: randomPrice(),
    };
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      ...original,
      shopName: shopsByCountry[country][0],
      insuranceType: insuranceOptions[0],
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    createdTrackingNumbers.push(original.trackingNumber);
    await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });
    myOrdersUrl = page.url();
  });

  test.afterEach(async ({ page }) => {
    const numbers = [...createdTrackingNumbers];
    createdTrackingNumbers = [];
    for (const trackingNumber of numbers) {
      try {
        // failed-validation tests leave us on the edit page, so go back first
        await page.goto(myOrdersUrl);
        await orderPage.deleteParcelByTrackingNumber(trackingNumber);
      } catch (e) {
        console.warn(`Cleanup failed for ${trackingNumber}:`, e);
      }
    }
  });

  test('edit form is prefilled with the existing values', async () => {
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.expectFormValues(original);
  });

  test('edits the order name', async ({ page }) => {
    const newName = `${faker.commerce.productName()} edited`;
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({ orderName: { from: original.orderName, to: newName } });
    await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });

    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.expectFormValues({ orderName: newName });
  });

  test('edits the price', async ({ page }) => {
    const newPrice = '123.45';
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({ price: { from: original.price, to: newPrice } });
    await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });

    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.expectFormValues({ price: newPrice });
  });

  test('edits the tracking number', async ({ page }) => {
    const newTracking = `TRACK${faker.string.numeric(9)}`;
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({
      trackingNumber: { from: original.trackingNumber, to: newTracking },
    });
    await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });

    // cleanup must now target the new number
    createdTrackingNumbers = [newTracking];

    await orderPage.openEditParcel(newTracking);
    await orderPage.expectFormValues({ trackingNumber: newTracking });
  });

  test('edits several fields at once', async ({ page }) => {
    const newName = faker.commerce.productName();
    const newPrice = randomPrice();
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({
      orderName: { from: original.orderName, to: newName },
      price: { from: original.price, to: newPrice },
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
    });
    await expect(page).toHaveURL(/\/my-orders\//, { timeout: 15000 });

    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.expectFormValues({ orderName: newName, price: newPrice });
  });

  test('shows an error when order name is cleared', async () => {
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({ orderName: { from: original.orderName, to: '' } });
    await orderPage.expectErrorVisible();
  });

  test('shows an error when tracking number is cleared', async () => {
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editParcel({
      trackingNumber: { from: original.trackingNumber, to: '' },
    });
    await orderPage.expectErrorVisible();
  });

  for (const [label, badPrice] of [
    ['zero', '0'],
    ['negative', '-10'],
    ['non-numeric', 'abc'],
  ]) {
    test(`rejects a ${label} price on edit`, async () => {
      await orderPage.openEditParcel(original.trackingNumber);
      await orderPage.editParcel({ price: { from: original.price, to: badPrice } });
      await orderPage.expectErrorVisible();
    });
  }

  test('does not save changes when the edit is abandoned', async ({ page }) => {
    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.editOrderNameInput.fill('should not be saved');
    await page.goto(myOrdersUrl); // leave without submitting

    await orderPage.openEditParcel(original.trackingNumber);
    await orderPage.expectFormValues({ orderName: original.orderName });
  });
});