import { test, expect } from '@playwright/test';
import path from 'path';
import { faker } from '@faker-js/faker';

import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';

import {
  shopsByCountry,
  deliveryMethodByCountry,
  insuranceOptions,
  PRICE_RANGE,
} from '../data/orderTestData';

import { specialServices } from '../data/specialServiceData';

const INVOICE_FILE_PATH = path.join(
  __dirname,
  '../data/sample-invoice.pdf'
);

const COUNTRY = 'ԱՄՆ';
const SHOP_NAME = shopsByCountry[COUNTRY][0];

test.describe('Globbing — Special Services', () => {
  let loginPage: LoginPage;
  let orderPage: OrderPage;

  let createdTrackingNumbers: string[] = [];

  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    createdTrackingNumbers = [];

    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);

    await loginPage.goto();

    await loginPage.login(
      process.env.APP_USERNAME!,
      process.env.APP_PASSWORD!
    );

    await expect(page).toHaveURL(
      /\/profile\//,
      {
        timeout: 15000,
      }
    );

    await orderPage.goto();

    await orderPage.selectCountryByName(
      COUNTRY
    );
  });

  test.afterEach(async () => {
    const numbers = [...createdTrackingNumbers];

    createdTrackingNumbers = [];

    for (const trackingNumber of numbers) {
      try {
        await orderPage.deleteParcelByTrackingNumber(
          trackingNumber
        );
      } catch (error) {
        console.warn(
          `Cleanup failed for ${trackingNumber}:`,
          error
        );
      }
    }
  });

  /**
   * Creates the basic parcel data used by special-service tests.
   */
  function createParcelData() {
    return {
      trackingNumber: `TRACK${faker.string.numeric(9)}`,
      shopName: SHOP_NAME,
      orderName: faker.commerce.productName(),
      price: faker.commerce.price({
        min: PRICE_RANGE.min,
        max: PRICE_RANGE.max,
        dec: 2,
      }),
      insuranceType:
        faker.helpers.arrayElement(
          insuranceOptions
        ),
      recipientName: 'Fyodor Fyodor',
      deliveryMethod:
        deliveryMethodByCountry[COUNTRY],
      filePath: INVOICE_FILE_PATH,
    };
  }

//   test('adds a parcel with a special service', async () => {
//     const parcel = createParcelData();

//     const serviceId =
//       specialServices.holdAtWarehouse;

//     await orderPage.addParcel({
//       ...parcel,
//       specialServiceId: serviceId,
//     });

//     createdTrackingNumbers.push(
//       parcel.trackingNumber
//     );

//     await expect(orderPage.page).toHaveURL(
//       /\/my-orders\//,
//       {
//         timeout: 15000,
//       }
//     );
//   });

//   test('adds a special service and verifies the service item', async () => {
//     const parcel = createParcelData();

//     await orderPage.fillParcelDetails(parcel);

//     await orderPage.openSpecialServicesModal();

//     await orderPage.chooseSpecialService(
//       specialServices.holdAtWarehouse
//     );

//     await orderPage.confirmAddSpecialService();

//     await orderPage.expectServiceItemCount(1);

//     /*
//      * Replace the text below with the exact displayed
//      * service name when the service data is finalized.
//      */
//     await expect(
//       orderPage.serviceItems.first()
//     ).toBeVisible();

//     await orderPage.submit();

//     createdTrackingNumbers.push(
//       parcel.trackingNumber
//     );

//     await expect(orderPage.page).toHaveURL(
//       /\/my-orders\//,
//       {
//         timeout: 15000,
//       }
//     );
//   });

  // test('cancelling a special service does not add it to the parcel', async () => {
  //   const parcel = createParcelData();

  //   await orderPage.fillParcelDetails(parcel);

  //   await orderPage.expectServiceItemCount(0);

  //   await orderPage.openSpecialServicesModal();

  //   await orderPage.chooseSpecialService(
  //     specialServices.holdAtWarehouse
  //   );

  //   await orderPage.cancelAddSpecialService();

  //   await orderPage.expectServiceItemCount(0);

  //   await orderPage.submit();

  //   createdTrackingNumbers.push(
  //     parcel.trackingNumber
  //   );

  //   await expect(orderPage.page).toHaveURL(
  //     /\/my-orders\//,
  //     {
  //       timeout: 15000,
  //     }
  //   );
  // });
});