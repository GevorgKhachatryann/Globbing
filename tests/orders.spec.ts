import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';

// TODO: WORK IN PROGRESS — this test file is not complete yet.

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

    // const countries = ['USA'];

    // for (const country of countries) {
    // test(`adds a parcel with country: ${country}`, async () => {
    //     // await orderPage.openAddParcelForm();
    //     await orderPage.selectCountryByName(country);
    //     await orderPage.addParcel({
    //     trackingNumber: 'TRACK123456789',
    //     shopName: 'A.L.C.',
    //     orderName: 'My order',
    //     price: '25.00',
    //     insuranceType: ' Up to 50,000 | 600 dram ',
    //     recipientName: 'Fyodor Fyodor',
    //     });
    //     await orderPage.submit();
    //     await orderPage.page.waitForTimeout(10000); 
    //     await expect(orderPage.page).toHaveURL(/my-orders/);
    // });
    // }
});