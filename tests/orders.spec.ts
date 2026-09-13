import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';
import { faker } from '@faker-js/faker';
import { 
  shopsByCountry,
  countries, 
  deliveryMethodByCountry, 
  insuranceOptions,
  PRICE_RANGE 
  } from '../data/orderTestData';

test.describe('Globbing — Add Parcel', () => {
  let loginPage: LoginPage;
  let orderPage: OrderPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
    await expect(page).toHaveURL(/profile/);

    await orderPage.goto();
  });

  for (const country of countries) {
    test(`adds a parcel with country: ${country}`, async () => {
      const trackingNumber = `TRACK${faker.string.numeric(9)}`;
      const shopName = faker.helpers.arrayElement(shopsByCountry[country]);
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
      });
      await expect(orderPage.page).toHaveURL(/my-orders/);
    });
  }
});