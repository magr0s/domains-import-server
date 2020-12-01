const Hosters = require('./hosters')
const {
  StacksStackpach,
  SitesStackpath,
  CDNStackpath
} = require('stackpath-nodejs')
const { WebdomainMgr } = require('ispmanager-nodejs')

const APP_CONFIG = require('../../configs/app.json')
const SITE_CONFIG = require('../../configs/site.json')

const { HOSTERS } = APP_CONFIG

class DomainsImport {
  constructor (hoster, params = {}) {
    const {
      begetLogin,
      begetPassword,
      dreamhostLogin,
      dreamhostPassword,
      serverIP,
      stackpathId,
      stackpathSecret,
      ispManagerLogin,
      ispManagerPassword,
      ispManagerURL,
      proxyURL,
      proxyLogin,
      proxyPassword
    } = params

    if (!HOSTERS.includes(hoster)) {
      throw new Error(`Unknow ${hoster} hoster.`)
    }

    const hosterParams = {}

    switch (hoster) {
      case 'beget':
        Object.assign(hosterParams, {
          login: begetLogin,
          password: begetPassword
        })
        break

      case 'dreamhost':
        Object.assign(hosterParams, {
          login: dreamhostLogin,
          password: dreamhostPassword,
          proxy: {
            login: proxyLogin,
            password: proxyPassword,
            url: proxyURL
          }
        })
        break

      default: throw new Error(`The hoster ${hoster} is not installed.`)
    }

    this.hoster = new Hosters[hoster](hosterParams)

    const stackpathCredentials = {
      client_id: stackpathId,
      client_secret: stackpathSecret
    }

    this.serverIP = serverIP

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
    try {
      const dnsList = []

      // hoster register domain
      await this.hoster.createDomain(name)

      // cdn get stacks
      const {
        results: [{ id: stackId }]
      } = await this.sp.stacks.list()
        .then(data => {
          console.log('GET-STACKS', JSON.stringify(data))
          return data;
        });

      const siteOpts = {
        domain: name,

        origin: { hostname: this.serverIP },

        configuration: Object.assign(SITE_CONFIG, {
          staticHeader: [{ originPull: `Host: ${name}` }]
        })
      }

      // cdn add site
      const { site: { id: siteId } } = await this.sp.sites.add(stackId, siteOpts)
        .then(data => {
          console.log('ADD-SITE', JSON.stringify(data))
          return data;
        });

      // cdn get cname dns
      const { addresses: [dns1]} = await this.sp.cdn.dnsTargets(stackId, siteId)

      dnsList.push({
        type: 'CNAME',
        name: `www`,
        value: dns1
      })

      // cdn get scopes
      const { results: scopes } = await this.sp.cdn.getScopes(stackId, siteId)
        .then(data => {
          console.log('SCOPES', JSON.stringify(data))
          return data;
        });

      const { id: scopeId } = scopes.find(({ platform }) => (platform === 'CDS'));

      // cdn get cname dns
      const {
        verificationRequirements: [{
          dnsVerificationDetails: {
            records: [{
              name: dns2name,
              data: dns2
            }]
          }
        }]
      } = await this.sp.cdn.sslRequest(stackId, siteId)
          .then(data => {
            console.log('DNS', JSON.stringify(data))
            return data;
          });

      dnsList.push({
        type: 'CNAME',
        name: `${dns2name}`,
        value: dns2
      })

      // hoster set dns
      await this.hoster.setDNS(name, dnsList)

      const rules = [
        {
          name: 'MAIN_NO_CACHE',
          configuration: {
            originPullPolicy: [{
              enabled: true,
              expireSeconds: 0,
              expirePolicy: 'DO_NOT_CACHE',
              noCacheBehavior: 'spec',
              httpHeaders: '*',
              pathFilter: `*://${name}/`,
              methodFilter: null,
              headerFilter: null,
              statusCodeMatch: null
            }]
          }
        },
        {
          name: 'SETTING_NO_CACHE',
          configuration: {
            originPullPolicy: [{
              enabled: true,
              expireSeconds: 0,
              expirePolicy: 'DO_NOT_CACHE',
              noCacheBehavior: 'spec',
              httpHeaders: '*',
              pathFilter: `*://${name}/seting/`,
              methodFilter: null,
              headerFilter: null,
              statusCodeMatch: null
            }]
          }
        }
      ]

      // cdn set dynamic rules
      await rules.reduce(async (promise, rule) => {
        await promise

        return this.sp.cdn.addRule(stackId, siteId, scopeId, rule)
          .catch(error => (console.log('ERROR-CDN', error.toString())))
      }, Promise.resolve())

      // ips add domain
      await this.isp.domain.edit({
        name,
        email: `admin@${name}`
      })
    } catch (error) {
      throw error
    }
  }
}

module.exports = DomainsImport

