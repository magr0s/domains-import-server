const { default: PQueue } = require('p-queue');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

puppeteer.use(StealthPlugin());

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: '248fff844400cfd1ceaee9def83bd2af'
    }
  })
);

// https://github.com/puppeteer/puppeteer/issues/594#issuecomment-325919885
process.setMaxListeners(Infinity);

const APP_CONFIG = require('../../../configs/app.json');
const {
  WAIT_OPTIONS,
  DREAMHOST_URL,
  CDN_STATIC_IP,
  PAGE_URLS
} = APP_CONFIG;

const pquque = new PQueue({ concurrency: 1 });
class DreamhostHoster {
  constructor (params = {}) {
    const { login, password, proxy } = params

    if (typeof (login) !== 'string' || !login) {
      throw new Error('Login incorrect.')
    }

    if (typeof (password) !== 'string' || !password) {
      throw new Error('Password incorrect.')
    }

    if (typeof (proxy) !== 'object' || Object.keys(proxy).length !== 3) {
      throw new Error('Proxy incorrect.')
    }

    this.login = login
    this.password = password
    this.proxy = proxy
  }

  async createDomain (domain) {
    try {
      await this._initBrowser()

      console.log('DREAMHOST', 'BROWSER INIT', 'OK');

      // auth
      await this._go()
      console.log('DREAMHOST', 'OPEN SITE', 'OK');

      await this._form('form.login-form', [
       { element: '#username', value: this.login },
       { element: '#password', value: this.password }
      ]);

      console.log('DREAMHOST', 'LOGIN', 'OK');

      // add domain
      await this._go(PAGE_URLS.MANAGE_DOMAIN);

      console.log('DREAMHOST', 'OPEN DOMAIN MANAGE', 'OK');

      await this._form('#dnsform', [
       { element: '#dns-domain', value: domain }
      ]);

      console.log('DREAMHOST', 'WORK WITH DNS', 'OK');

      const error = await this._checkDomainAdd()

      if (error) throw new Error('You can`t add that domain');

    } catch (error) {
      if (typeof (this.browser) !== 'undefined')
        await this.browser.close();

      throw error
    }
  }

  async setDNS (domain, params) {
    const dns = [
      {
        type: 'A',
        value: CDN_STATIC_IP
      },
      {
        type: 'A',
        name: '*',
        value: CDN_STATIC_IP
      },
      ...params
    ];

    // edit domain
    await dns.reduce(async (p, { type, name, value }) => {
      await p
      await this._go(PAGE_URLS.SET_DNS + domain)

      const fields = []

      fields.push({
        element: '#type',
        value: type,
        type: 'select'
      })

      fields.push({
        element: '#value',
        value
      })

      name && fields.push({
        element: '#name',
        value: `${name}`
      })

      const [, form] = await this.page.$$('form')

      return this._form(form, fields)
    }, Promise.resolve());

    await this.browser.close();
  }

  _checkDomainAdd () {
    return this.page.waitForSelector('.Alert.Alert--error', { timeout: 2000 })
      .catch(() => (false));
  }

  async _form(element, data) {
    const queued = data.map(({ element, value, type }) => {
      const isSelect = type === 'select';

      return isSelect
        ? () => (this.page.select(element, value))
        : () => (this.page.type(element, value));
    });

    await pquque.addAll(queued);

    await Promise.all([
      this.page.waitForNavigation(WAIT_OPTIONS),
      (typeof (element) === 'string')
        ? this.page.$eval(element, form => (form.submit()))
        : element.$eval('[type="submit"]', btn => (btn.click()))
    ]);

    await this.page.solveRecaptchas();
  }

  async _go (endpoint = '') {
    await this.page.goto(`${DREAMHOST_URL}/index.cgi${endpoint}`, WAIT_OPTIONS);
    await this.page.solveRecaptchas();
  }

  async _initBrowser () {
    this.browser = await puppeteer.launch({
      // headless: false,
      args: [
        `--proxy-server=${this.proxy.url}`
      ]
    });

    this.page = await this.browser.newPage();

    const proxyHasCredentials = this.proxy.login && this.proxy.password;

    if (proxyHasCredentials) {
      await this.page.authenticate({
        username: this.proxy.login,
        password: this.proxy.password
      });
    }
  }

  _closeBrowser () {
    return this.browser.close();
  }
}

module.exports = DreamhostHoster
