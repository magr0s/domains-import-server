const { Beget } = require('node-beget')
const {
  StacksStackpach,
  SitesStackpath,
  CDNStackpath
} = require('stackpath-nodejs')

const { WebdomainMgr } = require('ispmanager-nodejs')

const STATIC_SERVER_IP = '151.139.128.10'

class DomainsImport {
  constructor (params) {
    const {
      begetLogin,
      begetPassword,
      serverIP,
      stackpathId,
      stackpathSecret,
      ispManagerLogin,
      ispManagerPassword,
      ispManagerURL
    } = params

    const begetCredentials = {
      login: begetLogin,
      password: begetPassword
    }

    const stackpathCredentials = {
      client_id: stackpathId,
      client_secret: stackpathSecret
    }

    this.serverIP = serverIP

    this.beget = new Beget(begetCredentials)

    this.sp = {
      stacks: new StacksStackpach(stackpathCredentials),
      sites: new SitesStackpath(stackpathCredentials),
      cdn: new CDNStackpath(stackpathCredentials)
    }

    const ispOpts = {
      url: ispManagerURL,
      login: ispManagerLogin,
      password: ispManagerPassword
    }

    this.isp = {
      domain: new WebdomainMgr(ispOpts)
    }
  }

  async load (name) {
    const [hostname, ...rest] = name.split('.')
    const zone = rest.join('.')

    try {
      const { id: zoneId } = await this.checkZone(zone)

      await this.beget.domain.addVirtual({ hostname, zone_id: zoneId })
      await this.beget.dns.changeRecords({
        fqdn: `${name}`,
        records: {
          A: [
            { priority: 10, value: STATIC_SERVER_IP }
          ],
          MX: [
            { priority: 10, value: "mx1.beget.ru" },
            { priority: 20, value: "mx2.beget.ru" }
          ],
          "TXT": [
            { priority: 10, value: "v=spf1 redirect=beget.com" }
          ]
        }
      })

      const [{ id: stackId }] = await this.sp.stacks.list()

      const siteOpts = {
        domain: name,
        origin:  {
          hostname: this.serverIP
        },
        configuration: {
          originPullProtocol: {
            protocol: 'http'
          }
        }
      }

      const { id: siteId } = await this.sp.sites.add(stackId, siteOpts)

      const [dns1] = await this.sp.cdn.dnsTargets(stackId, siteId)
      await this.beget.dns.changeRecords({
        fqdn: `www.${name}`,
        records: {
          CNAME: [
            { priority: 10, value: dns1 }
          ]
        }
      })

      const scopes = await this.sp.cdn.getScopes(stackId, siteId)

      const { id: scopeId } = scopes.find(({ platform }) => (platform))

      const { verificationRequirements } = await this.sp.cdn.sslRequest(stackId, siteId)

      const [{
        dnsVerificationDetails: {
          records: [{
            name: dns2name,
            data: dns2
          }]
        }
      }] = verificationRequirements

      await this.beget.dns.changeRecords({
        fqdn: `${dns2name}.${name}`,
        records: {
          CNAME: [
            { priority: 10, value: dns2 }
          ]
        }
      })

      const rules = [
        {
          name: 'MAIN_NO_CACHE',
          configuration: {
            originPullPolicy: [{
              enable: true,
              expirePolicy: 'DO_NOT_CACHE',
              noCacheBehavior: 'spec',
              httpHeaders: '*',
              pathFilter: `*//:${name}/`
            }]
          }
        },
        {
          name: 'SETTING_NO_CACHE',
          configuration: {
            originPullPolicy: [{
              enable: true,
              expirePolicy: 'DO_NOT_CACHE',
              noCacheBehavior: 'spec',
              httpHeaders: '*',
              pathFilter: `*//:${name}/setting/`
            }]
          }
        }
      ]

      await rules.reduce(async (promise, rule) => {
        await promise

        return this.sp.cdn.addRule(stackId, siteId, scopeId, rule)
      }, Promise.resolve())

      await this.isp.domain.edit({
        name,
        email: `admin@${name}`
      })
    } catch (error) {
      throw error
    }
  }

  async checkZone (name) {
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

module.exports = DomainsImport
