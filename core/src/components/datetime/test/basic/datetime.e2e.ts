import { expect } from '@playwright/test';
import type { E2EPage } from '@utils/test/playwright';
import { test } from '@utils/test/playwright';

test.describe('datetime: closing time popover', () => {
  test('it should not change months', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/ionic-team/ionic-framework/issues/25438',
    });

    await page.setContent(`
      <ion-datetime></ion-datetime>
    `);

    const ionPopoverDidPresent = await page.spyOnEvent('ionPopoverDidPresent');
    const ionPopoverDidDismiss = await page.spyOnEvent('ionPopoverDidDismiss');
    const timeButton = page.locator('.time-body');
    const calendarMonthYear = page.locator('ion-datetime .calendar-month-year');
    const currentMonthAndYear = await calendarMonthYear.evaluate((el: HTMLElement) => el.innerText);

    await timeButton.click();
    await ionPopoverDidPresent.next();

    await page.keyboard.press('Escape');

    await ionPopoverDidDismiss.next();
    await page.waitForChanges();

    await expect(calendarMonthYear).toHaveText(currentMonthAndYear);
  });
});

test.describe('datetime: selecting a day', () => {
  const testHighlight = async (page: E2EPage, datetimeID: string) => {
    const today = new Date();
    await page.goto('/src/components/datetime/test/basic');
    await page.setIonViewport();

    const todayBtn = page.locator(
      `#${datetimeID} .calendar-day[data-day='${today.getDate()}'][data-month='${today.getMonth() + 1}']`
    );

    await expect(todayBtn).toHaveClass(/calendar-day-today/);
    await expect(todayBtn).not.toHaveClass(/calendar-day-active/);

    await todayBtn.click();
    await page.waitForChanges();

    await expect(todayBtn).toHaveClass(/calendar-day-active/);
  };

  test('should not highlight a day until one is selected', async ({ page }) => {
    await testHighlight(page, 'inline-datetime-no-value');
  });

  test('should not highlight a day until one is selected, with default-buttons', async ({ page }) => {
    await testHighlight(page, 'custom-datetime');
  });
  test('should update the active day', async ({ page }) => {
    await page.setContent(`
      <ion-datetime show-default-buttons="true" value="2021-12-25T12:40:00.000Z"></ion-datetime>
    `);

    const activeDay = page.locator('ion-datetime .calendar-day-active');

    await expect(activeDay).toHaveText('25');

    const dayBtn = page.locator('ion-datetime .calendar-day[data-day="13"][data-month="12"]');
    await dayBtn.click();
    await page.waitForChanges();

    await expect(activeDay).toHaveText('13');
  });
});

test.describe('datetime: confirm date', () => {
  test('should not update value if Done was clicked without selecting a day first', async ({ page }) => {
    await page.goto('/src/components/datetime/test/basic');

    const datetime = page.locator('#custom-datetime');

    const value = await datetime.evaluate((el: HTMLIonDatetimeElement) => el.value);
    expect(value).toBeUndefined();

    await datetime.evaluate(async (el: HTMLIonDatetimeElement) => {
      await el.confirm();
    });
    const valueAgain = await datetime.evaluate((el: HTMLIonDatetimeElement) => el.value);
    expect(valueAgain).toBeUndefined();
  });
  test('should set the date value based on the selected date', async ({ page }) => {
    await page.setContent(`
      <button id="bind">Bind datetimeMonthDidChange event</button>
      <ion-datetime value="2021-12-25T12:40:00.000Z"></ion-datetime>
      <script type="module">
        import { InitMonthDidChangeEvent } from '/src/components/datetime/test/utils/month-did-change-event.js';
        document.querySelector('button').addEventListener('click', function() {
          InitMonthDidChangeEvent();
        });
      </script>
    `);

    const datetimeMonthDidChange = await page.spyOnEvent('datetimeMonthDidChange');
    const eventButton = page.locator('button#bind');
    await eventButton.click();

    const buttons = page.locator('ion-datetime .calendar-next-prev ion-button');
    await buttons.nth(1).click();

    await datetimeMonthDidChange.next();

    const datetime = page.locator('ion-datetime');
    await datetime.evaluate((el: HTMLIonDatetimeElement) => el.confirm());

    // Value may include timezone information so we need to check
    // that the value at least includes the correct date/time info.
    const value = (await datetime.evaluate((el: HTMLIonDatetimeElement) => el.value))!;
    expect(value.includes('2021-12-25T12:40:00')).toBe(true);
  });
});

test.describe('datetime: footer', () => {
  test('should render default buttons', async ({ page }) => {
    await page.setContent('<ion-datetime value="2022-05-03" show-default-buttons="true"></ion-datetime>');

    const cancelButton = page.locator('ion-datetime #cancel-button');
    await expect(cancelButton).toHaveText('Cancel');

    const confirmButton = page.locator('ion-datetime #confirm-button');
    await expect(confirmButton).toHaveText('Done');

    const datetime = page.locator('ion-datetime');
    expect(await datetime.screenshot()).toMatchSnapshot(
      `datetime-footer-default-buttons-${page.getSnapshotSettings()}.png`
    );
  });
  test('should render clear button', async ({ page }) => {
    await page.setContent('<ion-datetime value="2022-05-03" show-clear-button="true"></ion-datetime>');

    const clearButton = page.locator('ion-datetime #clear-button');
    await expect(clearButton).toHaveText('Clear');

    const datetime = page.locator('ion-datetime');
    expect(await datetime.screenshot()).toMatchSnapshot(
      `datetime-footer-clear-button-${page.getSnapshotSettings()}.png`
    );
  });
  test('should render default and clear buttons', async ({ page }) => {
    await page.setContent(
      '<ion-datetime value="2022-05-03" show-default-buttons="true" show-clear-button="true"></ion-datetime>'
    );

    const cancelButton = page.locator('ion-datetime #cancel-button');
    await expect(cancelButton).toHaveText('Cancel');

    const confirmButton = page.locator('ion-datetime #confirm-button');
    await expect(confirmButton).toHaveText('Done');

    const clearButton = page.locator('ion-datetime #clear-button');
    await expect(clearButton).toHaveText('Clear');

    const datetime = page.locator('ion-datetime');
    expect(await datetime.screenshot()).toMatchSnapshot(
      `datetime-footer-default-clear-buttons-${page.getSnapshotSettings()}.png`
    );
  });
  test('should render custom buttons', async ({ page }) => {
    await page.setContent(`
      <ion-datetime value="2022-05-03">
        <ion-buttons slot="buttons">
          <ion-button id="custom-button" color="primary">Hello!</ion-button>
        </ion-buttons>
      </ion-datetime>
    `);

    const customButton = page.locator('ion-datetime #custom-button');
    await expect(customButton).toBeVisible();

    const datetime = page.locator('ion-datetime');
    expect(await datetime.screenshot()).toMatchSnapshot(
      `datetime-footer-custom-buttons-${page.getSnapshotSettings()}.png`
    );
  });
});

test.describe('datetime: swiping', () => {
  test.beforeEach(({ skip }) => {
    skip.rtl();
    skip.mode('ios', 'This does not have mode-specific logic.');
  });
  test('should move to prev month by swiping', async ({ page }) => {
    await page.setContent(`
      <ion-datetime value="2022-05-03"></ion-datetime>
    `);

    await page.waitForSelector('.datetime-ready');

    const calendarBody = page.locator('ion-datetime .calendar-body');
    const calendarHeader = page.locator('ion-datetime .calendar-month-year');

    await expect(calendarHeader).toHaveText(/May 2022/);

    await calendarBody.evaluate((el: HTMLElement) => (el.scrollLeft = 0));
    await page.waitForChanges();

    await expect(calendarHeader).toHaveText(/April 2022/);
  });
  test('should move to next month by swiping', async ({ page }) => {
    await page.setContent(`
      <ion-datetime value="2022-05-03"></ion-datetime>
    `);

    await page.waitForSelector('.datetime-ready');

    const calendarBody = page.locator('ion-datetime .calendar-body');
    const calendarHeader = page.locator('ion-datetime .calendar-month-year');

    await expect(calendarHeader).toHaveText(/May 2022/);

    await calendarBody.evaluate((el: HTMLElement) => (el.scrollLeft = el.scrollWidth));
    await page.waitForChanges();

    await expect(calendarHeader).toHaveText(/June 2022/);
  });
  test('should not re-render if swipe is in progress', async ({ page, skip }) => {
    skip.browser('webkit', 'Wheel is not available in WebKit');

    await page.setContent(`
      <ion-datetime value="2022-05-03"></ion-datetime>
    `);

    await page.waitForSelector('.datetime-ready');

    const calendarBody = page.locator('ion-datetime .calendar-body');
    const calendarHeader = page.locator('ion-datetime .calendar-month-year');

    await expect(calendarHeader).toHaveText(/May 2022/);

    const box = await calendarBody.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(-50, 0);
      await page.waitForChanges();

      await expect(calendarHeader).toHaveText(/May 2022/);
    }
  });
});

test.describe('datetime: visibility', () => {
  test('should reset month/year interface when hiding datetime', async ({ page, skip }) => {
    skip.rtl();
    skip.mode('md');

    await page.setContent(`
      <ion-datetime></ion-datetime>
    `);

    await page.waitForSelector('.datetime-ready');

    const monthYearButton = page.locator('ion-datetime .calendar-month-year');
    const monthYearInterface = page.locator('ion-datetime .datetime-year');
    const datetime = page.locator('ion-datetime');

    await monthYearButton.click();
    await page.waitForChanges();

    await expect(monthYearInterface).toBeVisible();

    await datetime.evaluate((el: HTMLIonDatetimeElement) => el.style.setProperty('display', 'none'));
    await expect(datetime).toBeHidden();

    await datetime.evaluate((el: HTMLIonDatetimeElement) => el.style.removeProperty('display'));
    await expect(datetime).toBeVisible();

    // month/year interface should be reset
    await expect(monthYearInterface).toBeHidden();
  });
});
