const { Beget } = require('node-beget')

const APP_CONFIG = require('../../../configs/app.json')
const { CDN_STATIC_IP } = APP_CONFIG

class BegetHoster {
  constructor ({ login, password }) {
    if (typeof (login) !== 'string' || !login) {
      throw new Error('Login incorrect.')
    }

    if (typeof (password) !== 'string' || !password) {
      throw new Error('Password incorrect.')
    }

    const credentials = {
      login,
      password
    }

    this.beget = new Beget(credentials)
  }

  async createDomain (domain) {
    const [hostname, ...rest] = domain.split('.')
    const zone = rest.join('.')

    try {
      const { id: zoneId } = await this._checkZone(zone)

      return this.beget.domain.addVirtual({ hostname, zone_id: zoneId })
    } catch (error) {
      throw error
    }
  }

  async setDNS (domain, params) {
    try {
      await this.beget.dns.changeRecords({
        fqdn: `${domain}`,
        records: {
          A: [
            { priority: 10, value: CDN_STATIC_IP }
          ],

          MX: [
            { priority: 10, value: 'mx1.beget.com.' },
            { priority: 20, value: 'mx2.beget.com.' }
          ],

          TXT: [
            { priority: 10, value: 'v=spf1 redirect=beget.com' }
          ]
        }
      })

      await params.reduce(async (p, { name, value }, i) => {
        await p

        return this.beget.dns.changeRecords({
          fqdn: `${name}.${domain}`,
          records: {
            CNAME: [
              { priority: 10, value }
            ]
          }
        })
      }, Promise.resolve())
    } catch (error) {
      throw error
    }
  }

  async _checkZone (name) {
    try {
      const result = await this.beget.domain.getZoneList()

      const zone = result[name] || null
      if (!zone) throw new Error(`Undefined domain zone.`)

      return zone
    } catch (error) {
      throw error
    }
  }
}

module.exports = BegetHoster
