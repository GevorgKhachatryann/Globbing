import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';
import { faker } from '@faker-js/faker';

// TODO: WORK IN PROGRESS — this test file is not complete yet.

// Each country has its own shop list (the dropdown options differ per country).
// TODO: fill in the real shop names per country — these are placeholders based on what's been seen so far.
const shopsByCountry: Record<string, string[]> = {
  USA: ['A.L.C.', '1people', 'AHparts','ALDO SHOES','ALYX Studio'],
  England: ['ARKET', 'AXXA', 'Adidas UK','AllBeauty','Amazon UK'],
  China: ['AliExpress', 'Tmall','Vmall','JD','Taobao'],
  Germany: ['Amazon', 'ASOS Germany', 'Amigo Germany'],
  Italy: ['Armani Beauty','Bershka Italy','C&A'],
  Dubai: ['Burjauto', 'Carbox','JUMBO'],
  Russia: ['ANBIK', 'Askona','Befree'],
  Greece: ['Adopt', 'Bershka Greece','Zara Greece'],
  Korea: ['Able Shop', 'Apple Korea'],
  Spain: ['Benetton Spain', 'Bibs Spain','Calvin Klein Spain'],
};

const countries = ['USA','England','China','Germany','Italy','Dubai','Russia','Greece','Korea','Spain'];

const deliveryMethodByCountry: Record<string, string> = {
  USA: 'USA express',
  England: 'England express',
  China: 'China express',
  Germany: 'Germany express',
  Italy: 'Italy ground',
  Dubai: 'Dubai express',
  Russia: 'Russia express',
  Greece: 'Greece ground',
  Korea: 'Korea express',
  Spain: 'Spain ground',
};

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
    test(`adds a parcel with country: ${country}, and shopName: ${shopsByCountry[country][0]}`, async () => {
      const trackingNumber = `TRACK${faker.string.numeric(9)}`;
      const shopName = faker.helpers.arrayElement(shopsByCountry[country]);

      await orderPage.selectCountryByName(country);
      await orderPage.addParcel({
        trackingNumber: trackingNumber,
        shopName: shopName,
        orderName: 'My order',
        price: '25.00',
        insuranceType: ' Up to 50,000 | 600 dram ',
        recipientName: 'Fyodor Fyodor',
        deliveryMethod:  deliveryMethodByCountry[country],
      });
      await expect(orderPage.page).toHaveURL(/my-orders/);
    });
  }
});