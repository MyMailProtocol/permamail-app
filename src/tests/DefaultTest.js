import { Builder, By, Key, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { describe, it, beforeEach, before, after } from 'mocha';

const NEW_ACCOUNT_KEY = '/Users/richardgale/Downloads/4FR0gGA4N_EOHvNo-24nn_RhPUUp0ZFruh3Ha0x4H5w.json';
const EXISTING_ACCOUNT_KEY = '/Users/richardgale/Downloads/-RspiT35Zo5YIu1uWMaid0Tx5TQL3B5lbaGrWyHmuFU.json'

describe('KeyDropper', () => {
  let driver;

  before(() => {
    driver = new Builder().forBrowser('chrome').build();
  });

  it('New instance should go to KeyDropper', async () => {
    await driver.get('http://localhost:3000');

    const title = await driver.getTitle();
    expect(title).to.equal('Inbox');

    const keyDropper = await driver.wait(until.elementLocated(By.id('file')), 10000);
    expect(keyDropper).to.not.equal(undefined);
  });

  it('Bad file should stay on KeyDropper', async () => {
    await driver.get('http://localhost:3000');

    const keyDropper = await driver.wait(until.elementLocated(By.id('file')), 10000);
    expect(keyDropper).to.not.equal(undefined);

    await keyDropper.sendKeys('/Users/richardgale/Downloads/dm6Dnaxe.jpg');

    await driver.findElement(By.id('file'));
  });

  it('Good file should go to inbox', async () => {
    await driver.get('http://localhost:3000');

    const keyDropper = await driver.wait(until.elementLocated(By.id('file')), 10000);
    expect(keyDropper).to.not.equal(undefined);

    await keyDropper.sendKeys(NEW_ACCOUNT_KEY);

    const text = await driver.wait(until.elementLocated(By.tagName('h1'))).getText();
    expect(text).to.equal('Inbox');
  });

  after(async () => {
    await driver.quit();
  });
});

describe('New User Experience', () => {
  let driver;

  before(() => {
    driver = new Builder().forBrowser('chrome').build();
  });

  before(async () => {
    await driver.get('http://localhost:3000');
    await driver.manage().deleteAllCookies();
    await driver.get('http://localhost:3000');

    const dropper = await driver.wait(until.elementLocated(By.id('file')), 10000);
    await dropper.sendKeys(NEW_ACCOUNT_KEY);
  });

  it('Login', async () => {
    await driver.wait(until.elementLocated(By.id('new')), 10000);

    const inboxItems = await driver.findElements(By.id('inboxItem'));
    expect(inboxItems.length).to.equal(1);
  });

  after(async () => {
    await driver.quit();
  });
});
