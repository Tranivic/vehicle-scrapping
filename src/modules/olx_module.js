const cleanArray = require('../js/functionality').clean_not_matchs;
const puppeteer = require('puppeteer-extra');
const rankedAds = require('../js/functionality').ads_ranking;
const getSearchTerm = require('../js/functionality').get_search_term;
const puppeteerModule = require('../js/plugins/puppeteer');
const rotateProxy = require('../js/proxies').rotate_proxy;
const autenticateProxy = require('../js/proxies').autenticate_proxy;
const getIp = require('../js/proxies').get_ip;
const getProxy = require('../js/proxies').get_stored_proxy;
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = {
    hits: [],
    config: {
        stuckedIndex: 0,
    },
    proxys: {
        value: null,
        useLimit: 10,
        usage: 0,
        protocol: 'http://',
        user: 'ismkmycd',
        password: 'ug4a5ubsm23k',
    },

    htmlIdentifiers: {
        scriptId: '__NEXT_DATA__',
        descriptionHtml: 'meta[property="og:description"]',
        initialDataId: '#initial-data',
    },

    url_builder(link) {
        console.log('Link para extração: ' + link);
        return link;
    },

    adObjctBuilder(objc) {
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
                puppeteer.launch({ headless: "new", args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] }).then(async browser => {
                    const page = await browser.newPage();
                    if (useProxys) {
                        await autenticateProxy(page, this.proxys.user, this.proxys.password);
                        await puppeteerModule.prevent_resource_download(page);
                        const ip = await getIp(page)
                        console.log(`Acessing from im ${ip}`)
                        this.proxys.usage++;
                    }
                    const scriptOlxTagId = this.htmlIdentifiers.scriptId;
                    const searchTermInUrl = getSearchTerm(extractionUrl);
                    await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
                    const mainHtmlContent = await page.content();
                    if (!mainHtmlContent) {
                        reject('HTML is empty');
                    }
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
                        resolve(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website!`);
                        return
                    }
                    const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads, searchTermInUrl).map(this.adObjctBuilder);
                    console.log(`Was load a total of ${adsArray.length} matched ads from OLX`);
                    await browser.close();
                    if (!adsArray.length) {
                        reject('No ads fetched!');
                    }
                    resolve(adsArray);
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
                        const newProxy = rotateProxy(this.proxys.useLimit, this.proxys.usage).newProxyValue;
                        if (newProxy) {
                            this.proxys.value = newProxy;
                            this.proxys.usage = 0;
                        }
                    }
                    const browser = await puppeteer.launch({ headless: "new", args: [usingProxy ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] });
                    const page = await browser.newPage();
                    if (usingProxy) {
                        await autenticateProxy(page, this.proxys.user, this.proxys.password);
                        await puppeteerModule.prevent_resource_download(page);
                        const ip = await getIp(page)
                        console.log(`Acessing from ip ${ip}`)
                        this.proxys.usage++;
                    }
                    await page.goto(element.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
                    console.log(`Extracted ${index + 1} of ${array.length}`);
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

    async olxScrapRun(url, useProxys) {
        return new Promise(async (resolve, reject) => {
            try {
                if (useProxys) {
                    this.proxys.value = getProxy(true, null);
                }
                const extractionUrl = url;
                const mainArrayResponse = await this.extractMainData(true, extractionUrl);
                if(typeof mainArrayResponse === String){
                    reject(mainArrayResponse)
                }
                console.log("Scrapping ads from olx...");
                do {
                    try {
                        this.config.stuckedIndex = await this.adJsonBuilder(mainArrayResponse, this.config.stuckedIndex, useProxys);
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
};
