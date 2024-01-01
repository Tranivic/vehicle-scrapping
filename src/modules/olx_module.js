const cleanArray = require('../js/functionality').clean_not_matchs;
const throttleLoop = require('../js/functionality').throttle_loop;
const saveFile = require('../js/mixins/fs_functions').save_file;
const getIp = require('../js/proxies').get_ip;
const getProxy = require('../js/proxies').get_stored_proxy;
const puppeteer = require('puppeteer-extra');
const rankedAds = require('../js/functionality').ads_ranking;
const getSearchTerm = require('../js/functionality').get_search_term;
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const puppeteerModule = require('../js/plugins/puppeteer')
puppeteer.use(StealthPlugin());

module.exports = {
    hits: [],
    config: {
        limitOfAdsFetched: null,
        stuckedIndex: 0,
        urlForUse: null,
        isUsingProxy: null,
    },
    proxys: {
        value: null,
        useLimit: 50,
        usage: 0,
        protocol: 'http://',
        user: 'tntexggl',
        password: 'xhmmlenq8uty',
    },
    urlParams: {
        baseUrl: 'http://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj/rio-de-janeiro-e-regiao',
        searchTerm: '',
        minPrice: 0,
        maxPrice: 0,
        fromYear: 0,
        gnv: {
            gnvOptional: false,
            allowGnvOption: false,
        },
    },

    htmlIdentifiers: {
        scriptId: '__NEXT_DATA__',
        descriptionHtml: 'meta[property="og:description"]',
        initialDataId: '#initial-data',
    },

    url_builder(urlObj, link) {
        if (urlObj) {
            let url = `${urlObj.baseUrl}${urlObj.localization || ''}`;

            if (urlObj.minPrice && urlObj.maxPrice) {
                url += `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrice}`;
            }
            if (urlObj.searchTerm.length) {
                url += `&q=${urlObj.searchTerm}`;
            }
            if (urlObj.fromYear) {
                const yearBase2000 = 50;
                const relativeYear = (urlObj.fromYear - 2000) + yearBase2000;

                url += `&rs=${relativeYear}`;
            }
            if (urlObj.gnv.gnvOptional) {
                url += `&hgnv=${urlObj.gnv.allowGnvOption}&o=3`;
            }
            console.log('Url para extração: ' + url);
            return url;
        }
        if (link) {
            console.log('Link para extração: ' + link);
            return link;
        }
    },

    ad_obj_builder(objc) {
        return {
            subject: objc.subject,
            title: objc.title,
            description: '',
            price: parseInt(objc.price.replace(/[^0-9]/g, '')),
            fipePrice: null,
            averageOlxPrice: null,
            listId: objc.listId,
            url: objc.url,
            thumbnail: objc.thumbnail,
            location: objc.location,
            vehiclePills: objc.vehiclePills,
            trackingSpecificData: objc.trackingSpecificData
        };
    },

    async extractMainData(useProxys, extractionUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                puppeteer.launch({ headless: 'new', args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] }).then(async browser => {
                    const page = await browser.newPage();
                    if (useProxys) {
                        await this.autenticateProxy(page);
                        await puppeteerModule.prevent_resource_download(page)
                    }
                    // const ip = await getIp(page)
                    // console.log("IP Acessing from extractMainData function: "+ ip)
                    const scriptOlxTagId = this.htmlIdentifiers.scriptId;
                    const searchTermInUrl = getSearchTerm(extractionUrl);
                    await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
                    const mainHtmlContent = await page.content();

                    if (!mainHtmlContent) {
                        throw new Error('The HTML file returned blank, check the log for error details!');
                    }

                    saveFile('./log/', 'main.html', mainHtmlContent);
                    console.log('Main HTML Extracted!');

                    const dataExtracted = await page.evaluate((scriptId) => {
                        const scriptTag = document.getElementById(scriptId);
                        if (scriptTag) {
                            return scriptTag.textContent;
                        } else {
                            return null;
                        }
                    }, scriptOlxTagId);

                    if (!dataExtracted) {
                        throw new Error(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website!`);
                    }

                    const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads, searchTermInUrl).map(this.ad_obj_builder);
                    console.log(`Was load a total of ${adsArray.length} matched ads from OLX`);
                    await browser.close();
                    if (!adsArray.length) {
                        reject('No ads fetched!');
                    }
                    resolve(adsArray)
                });

            } catch (err) {
                reject('Something is wrong: ' + err.message);
            }
        });
    },

    async adJsonBuilder(array, customIndex, usingProxy) {
        let index = customIndex;
        let currentIndex = 0;
        for await (const element of array) {
            if (currentIndex < customIndex) {
                currentIndex++;
            } else {
                try {
                    if (usingProxy) {
                        this.rotateProxy();
                    }
                    const browser = await puppeteer.launch({ headless: 'new', args: [usingProxy ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] });
                    const page = await browser.newPage();
                    if (usingProxy) {
                        await this.autenticateProxy(page);
                        await puppeteerModule.prevent_resource_download(page)
                    }
                    // const ip = await getIp(page)
                    // console.log("IP Acessing from adJsonBuilder function: "+ ip)
                    await page.goto(element.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await page.screenshot({ path: `./log/screenshots/ad[${index}].png`, fullPage: true });
                    const extractedChildData = await page.evaluate((htmlIdentifiers) => {
                        const initialData = JSON.parse(document.querySelector(htmlIdentifiers.initialDataId).getAttribute('data-json')).ad;
                        const descriptionHtml = document.querySelector(htmlIdentifiers.descriptionHtml).getAttribute('content');
                        const fipePrice = initialData.abuyFipePrice?.fipePrice || null;
                        const averageOlxPrice = initialData.abuyPriceRef?.price_p50 || null;
                        return { descriptionHtml, fipePrice, averageOlxPrice };
                    }, this.htmlIdentifiers);
                    element.description = extractedChildData.descriptionHtml;
                    element.descriptionFormated = extractedChildData.descriptionFormated;
                    element.fipePrice = extractedChildData.fipePrice;
                    element.averageOlxPrice = extractedChildData.averageOlxPrice;
                    this.hits.push(element);
                    index++;
                    await page.close();
                    await browser.close();
                } catch (err) {
                    console.log('Error in child extracting: ' + err.message);
                    console.log(`Restarting from index: ${index}...`);
                    return index;
                }
            }
        }
        return null;
    },

    async autenticateProxy(page) {
        await page.authenticate({
            username: this.proxys.user,
            password: this.proxys.password,
        });
    },

    async olxScrapRun(url, useProxys) {
        return new Promise(async (resolve, reject) => {
            try {
                this.config.isUsingProxy = useProxys;
                this.config.urlForUse = url;
                if (useProxys) {
                    this.proxys.value = getProxy(true, null);
                }
                const extractionUrl = url;
                const mainArray = await this.extractMainData(true, extractionUrl);


                do {
                    try {
                        this.config.stuckedIndex = await this.adJsonBuilder(mainArray, this.config.stuckedIndex, useProxys);
                    } catch (err) {
                        console.error('Error in adJsonBuilder loop:', err);
                        break;
                    }
                } while (this.config.stuckedIndex);
                
                const rankedAdsHits = rankedAds(this.hits, this.searchTerm);
                resolve(rankedAdsHits);
            } catch (err) {
                reject(err);
            }
        });
    },
    rotateProxy(){
        let proxyLimit = this.proxys.useLimit;
        let proxyUsage = this.proxys.usage;
    
        console.log("Proxy Limit:", proxyLimit);
        console.log("Current Proxy Usage:", proxyUsage);
    
        if(proxyUsage > proxyLimit){
            this.proxys.value = getProxy(true, null);
            this.proxys.usage = 0;
            console.log("Proxy changed. New proxy value:", this.proxys.value);
            return;
        }
    
        proxyUsage++;
        this.proxys.usage = proxyUsage;
    
        console.log("Updated Proxy Usage:", proxyUsage);
    }
};
