const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const userAgentRND = require('random-useragent')

puppeteer.use(StealthPlugin())

const APP_CONFIG = require('../../../configs/app.json')
const {
  WAIT_OPTIONS,
  DREAMHOST_URL,
  CDN_STATIC_IP,
  PAGE_URLS
} = APP_CONFIG

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

      // auth
      await this._go()
      await this._form('form.login-form', [
        { element: '#username', value: this.login },
        { element: '#password', value: this.password }
      ])

      // add domain
      await this._go(PAGE_URLS.MANAGE_DOMAIN)

      await this._form('#dnsform', [
        { element: '#dns-domain', value: domain }
      ])

      const error = await this._checkDomainAdd()

      if (error) throw new Error('You can`t add that domain')
    } catch (error) {
      throw error
    }
  }

  async setDNS (domain, params) {
    try {
      const dns = [
        { type: 'A', value: CDN_STATIC_IP },
        ...params
      ]

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
      }, Promise.resolve())

      await this._closeBrowser()
    } catch (error) {
      throw error
    }
  }

  async _checkDomainAdd () {
    return this.page.waitForSelector('.Alert.Alert--error', { timeout: 2000 })
  }

  async _form(element, data) {
    try {
      await data.reduce(async (p, { element, value, type = 'input' }) => {
        await p

        switch (type) {
          case 'select':
            return this.page.select(element, value)

          default: return this.page.type(element, value)
        }
      }, Promise.resolve())

      return Promise.all([
        this.page.waitForNavigation(WAIT_OPTIONS),
        (typeof (element) === 'string')
          ? this.page.$eval(element, form => (form.submit()))
          : element.$eval('[type="submit"]', btn => (btn.click()))
      ])
    } catch (error) {
      throw error
    }
  }

  _go (endpoint = '') {
    return this.page.goto(`${DREAMHOST_URL}/index.cgi${endpoint}`)
  }

  async _initBrowser () {
    try {
      this.browser = await puppeteer.launch({
        args: [
          `--proxy-server=${this.proxy.url}`
        ]
      })

      this.page = await this.browser.newPage()

      await this.page.setUserAgent(userAgentRND.toString())
      await this.page.authenticate({
        username: this.proxy.login,
        password: this.proxy.password
      })
    } catch (error) {
      throw error
    }
  }

  _closeBrowser () {
    return this.browser.close()
  }
}

module.exports = DreamhostHoster
