import { test, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';
import { faker } from '@faker-js/faker';
import {
  shopsByCountry,
  countries,
  deliveryMethodByCountry,
  insuranceOptions,
  PRICE_RANGE,
} from '../data/orderTestData';

const INVOICE_FILE_PATH = path.join(__dirname, '../data/sample-invoice.pdf');
const country = 'ԱՄՆ'; // fixed country for validation cases, doesn't need to run per-country


test.describe('Globbing — Add Parcel', () => {
  let loginPage: LoginPage;
  let orderPage: OrderPage;
  test.setTimeout(60000);


  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    await orderPage.goto();
  });

  for (const country of countries) {
  for (const shopName of shopsByCountry[country]) {
    test(`adds a parcel with country: ${country}, shop: ${shopName}`, async () => {
      const trackingNumber = `TRACK${faker.string.numeric(9)}`;
      const insuranceType = faker.helpers.arrayElement(insuranceOptions);
      const price = faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 });
      const orderName = faker.commerce.productName();

      test.info().annotations.push(
        { type: 'shop', description: shopName },
        { type: 'insurance', description: insuranceType },
        { type: 'price', description: price }
      );

      await orderPage.selectCountryByName(country);
      await orderPage.addParcel({
        trackingNumber,
        shopName,
        orderName,
        price,
        insuranceType,
        recipientName: 'Fyodor Fyodor',
        deliveryMethod: deliveryMethodByCountry[country],
        filePath: INVOICE_FILE_PATH,
      });
      await expect(orderPage.page).toHaveURL(/my-orders/);
    });
  }
}

  test('shows an error when tracking number is empty', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: '',
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: faker.commerce.productName(),
      price: faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }),
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('shows an error when order name is empty', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: '',
      price: faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }),
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('rejects a zero price', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: faker.commerce.productName(),
      price: '0',
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('rejects a negative price', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: faker.commerce.productName(),
      price: '-10',
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('does not submit without agreeing to terms', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.selectDeliveryMethodByName(deliveryMethodByCountry[country]);
    await orderPage.trackingNumberInput.fill(`TRACK${faker.string.numeric(9)}`);
    await orderPage.selectShopByName(faker.helpers.arrayElement(shopsByCountry[country]));
    await orderPage.fillOrderName(faker.commerce.productName());
    await orderPage.fillPrice(faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }));
    await orderPage.attachFile(INVOICE_FILE_PATH);
    await orderPage.selectInsuranceByName(faker.helpers.arrayElement(insuranceOptions));
    // deliberately skip agreeToTerms()
    await orderPage.selectRecipientByIndex(0);
    await orderPage.submit();
    await orderPage.expectErrorVisible();
  }); 

  test('rejects non-numeric characters in price', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: faker.commerce.productName(),
      price: 'abc',
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('accepts an order name with special characters', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: `Test & Order "#1" — 50% off!`,
      price: faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }),
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await expect(orderPage.page).toHaveURL(/my-orders/);
  });

  test('rejects an extremely long order name', async () => {
    await orderPage.selectCountryByName(country);
    await orderPage.addParcel({
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: faker.helpers.arrayElement(shopsByCountry[country]),
      orderName: faker.lorem.words(200), // way past any sane field limit
      price: faker.commerce.price({ min: PRICE_RANGE.min, max: PRICE_RANGE.max, dec: 2 }),
      insuranceType: faker.helpers.arrayElement(insuranceOptions),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod: deliveryMethodByCountry[country],
      filePath: INVOICE_FILE_PATH,
    });
    await orderPage.expectErrorVisible();
  });

  test('changing country after selecting a shop resets the shop selection', async () => {
    await orderPage.selectCountryByName('ԱՄՆ');
    await orderPage.selectShopByName(faker.helpers.arrayElement(shopsByCountry['ԱՄՆ']));
    await orderPage.selectCountryByName('Անգլիա');
    expect(orderPage.shopDropdownToggle).toHaveText('Խանութի անվանում')
  });

  

});