const puppeteer = jest.createMockFromModule("puppeteer");

let fakeData = {};

class PageStub {
  setViewport() {}
  goto(url) {
    this.currentUrl = url;
  }
  type() {}
  $eval() {}
  waitForSelector() {}
  evaluate() {
    if (!fakeData[this.currentUrl]) {
      console.error(`No fake data associated to url "${this.currentUrl}"`);
    }
    return Promise.resolve(JSON.stringify(fakeData[this.currentUrl]));
  }
}

const browser = {
  close: () => Promise.resolve(),
  newPage: () => Promise.resolve(new PageStub()),
};
puppeteer.launch = () => browser;

puppeteer.__setFakeData = (data) => (fakeData = data);
export default puppeteer;
