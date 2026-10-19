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

import {
  specialServices,
  specialServiceIds,
} from '../data/specialServiceData';

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

/*
 * Edit-page special services on ONE shared parcel.
 *
 * - The parcel is created in beforeAll and deleted in afterAll.
 * - Serial mode + retries: 0 guarantees at most one parcel per run
 *   (a failure would otherwise restart the worker and re-run beforeAll).
 *   Trade-off: if a test fails, the remaining tests in this group are skipped.
 * - afterEach removes any services left on the parcel, so each test
 *   starts from a parcel with no services.
 */
test.describe('Globbing — Special Services on an existing parcel', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  // Stable ids instead of Armenian/English labels (see OrderPage).
  const USA_COUNTRY_ID = 6;
  const USA_EXPRESS_METHOD_ID = 49;
  const INSURANCE_UP_TO_50000_ID = 2;

  let loginPage: LoginPage;
  let orderPage: OrderPage;

  let sharedParcel: {
    trackingNumber: string;
    editUrl: string;
  } | undefined;

  test.setTimeout(90000);

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(120000);

    const page = await browser.newPage({
      baseURL: testInfo.project.use.baseURL,
    });

    try {
      const setupLogin = new LoginPage(page);
      const setupOrder = new OrderPage(page);

      await setupLogin.goto();

      await setupLogin.login(
        process.env.APP_USERNAME!,
        process.env.APP_PASSWORD!
      );

      await expect(page).toHaveURL(/\/profile\//, {
        timeout: 15000,
      });

      const trackingNumber = `TRACK${faker.string.numeric(9)}`;

      await setupOrder.goto();
      await setupOrder.selectCountryById(USA_COUNTRY_ID);
      await setupOrder.selectDeliveryMethodById(
        USA_EXPRESS_METHOD_ID
      );
      await setupOrder.trackingNumberInput.fill(trackingNumber);
      await setupOrder.selectShopByName(SHOP_NAME);
      await setupOrder.fillOrderName(
        faker.commerce.productName()
      );
      await setupOrder.fillPrice(
        faker.commerce.price({
          min: PRICE_RANGE.min,
          max: PRICE_RANGE.max,
          dec: 2,
        })
      );
      await setupOrder.attachFile(INVOICE_FILE_PATH);
      await setupOrder.selectInsuranceById(
        INSURANCE_UP_TO_50000_ID
      );
      await setupOrder.agreeToTerms();
      await setupOrder.selectRecipientByIndex(0);
      await setupOrder.submit();

      await expect(page).toHaveURL(/\/my-orders\//, {
        timeout: 15000,
      });

      // Set before anything else can fail, so afterAll can delete it.
      sharedParcel = {
        trackingNumber,
        editUrl: '',
      };

      sharedParcel.editUrl =
        await setupOrder.getEditParcelUrl(trackingNumber);

      console.log(
        `Shared parcel created: ${trackingNumber} (${sharedParcel.editUrl})`
      );
    } finally {
      await page.close();
    }
  });

  test.afterAll(async ({ browser }, testInfo) => {
    test.setTimeout(120000);

    if (!sharedParcel) {
      return;
    }

    const page = await browser.newPage({
      baseURL: testInfo.project.use.baseURL,
    });

    try {
      const cleanupLogin = new LoginPage(page);
      const cleanupOrder = new OrderPage(page);

      await cleanupLogin.goto();

      await cleanupLogin.login(
        process.env.APP_USERNAME!,
        process.env.APP_PASSWORD!
      );

      await expect(page).toHaveURL(/\/profile\//, {
        timeout: 15000,
      });

      // Report whether the parcel still exists BEFORE we delete it
      // (a probe parcel once disappeared on its own — cause unknown).
      if (sharedParcel.editUrl) {
        const status =
          await cleanupOrder.getParcelEditPageStatus(
            sharedParcel.editUrl
          );

        console.log(
          `Shared parcel ${sharedParcel.trackingNumber} before cleanup: ` +
            `edit page HTTP ${status} (${status === 200 ? 'exists' : 'missing'})`
        );

        if (status !== 200) {
          return;
        }
      }

      await page.goto('/profile/my-orders');

      await cleanupOrder.deleteParcelByTrackingNumber(
        sharedParcel.trackingNumber
      );

      console.log(
        `Shared parcel deleted: ${sharedParcel.trackingNumber}`
      );
    } catch (error) {
      console.warn(
        `Cleanup failed for ${sharedParcel.trackingNumber}:`,
        error
      );
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    orderPage = new OrderPage(page);

    await loginPage.goto();

    await loginPage.login(
      process.env.APP_USERNAME!,
      process.env.APP_PASSWORD!
    );

    await expect(page).toHaveURL(/\/profile\//, {
      timeout: 15000,
    });

    expect(
      sharedParcel?.editUrl,
      'shared parcel was not created in beforeAll'
    ).toBeTruthy();

    expect(
      await orderPage.getParcelEditPageStatus(
        sharedParcel!.editUrl
      ),
      `shared parcel ${sharedParcel!.trackingNumber} has disappeared`
    ).toBe(200);
  });

  test.afterEach(async ({ page }) => {
    if (!sharedParcel?.editUrl) {
      return;
    }

    try {
      await page.goto(sharedParcel.editUrl);

      await orderPage.removeAllSpecialServices();
    } catch (error) {
      console.warn(
        `Service cleanup failed for ${sharedParcel.trackingNumber}:`,
        error
      );
    }
  });

  test('SS-P: Hold is still listed after Save Changes and reopening the edit page', async ({ page }) => {
    await page.goto(sharedParcel!.editUrl);

    await orderPage.expectSpecialServiceNotListed(
      specialServiceIds.hold
    );

    const saveResult = await orderPage.addSpecialServiceById(
      specialServiceIds.hold
    );

    expect(saveResult).toMatchObject({ status: 'OK' });

    // Lands on My Orders
    await orderPage.saveChanges();

    // "Waiting" with the special-service variant of the status
    await orderPage.expectParcelStatusWaiting(
      sharedParcel!.trackingNumber,
      true
    );

    await page.goto(sharedParcel!.editUrl);

    await orderPage.expectSpecialServiceListed(
      specialServiceIds.hold
    );

    await expect(
      orderPage.getSpecialServiceCard(specialServiceIds.hold)
    ).toHaveClass(/\bactivated\b/);
  });

  test('SS-P: removed Hold is gone after reload', async ({ page }) => {
    // Arrange: a saved Hold
    await page.goto(sharedParcel!.editUrl);

    await orderPage.addSpecialServiceById(
      specialServiceIds.hold
    );

    await orderPage.saveChanges();

    await page.goto(sharedParcel!.editUrl);

    await orderPage.expectSpecialServiceListed(
      specialServiceIds.hold
    );

    // Act
    const cancelResult =
      await orderPage.removeSpecialServiceById(
        specialServiceIds.hold
      );

    expect(cancelResult).toMatchObject({ status: 'OK' });

    // Assert
    await page.reload();

    await orderPage.expectSpecialServiceNotListed(
      specialServiceIds.hold
    );

    await expect(
      orderPage.getSpecialServiceCard(specialServiceIds.hold)
    ).not.toHaveClass(/\bactivated\b/);
  });
});