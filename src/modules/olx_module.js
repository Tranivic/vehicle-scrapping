const cleanArray = require('@utils/functionality').clean_not_matchs;
const puppeteer = require('puppeteer-extra');
const setIsFakePriceAdsArray = require('@utils/functionality').set_is_fake_price;
const getSearchTerm = require('@utils/functionality').get_search_term;
const puppeteerModule = require('@plugins/puppeteer');
const rotateProxy = require('@utils/proxies').rotate_proxy;
const autenticateProxy = require('@utils/proxies').autenticate_proxy;
const getIp = require('@utils/proxies').get_ip;
const getProxy = require('@utils/proxies').get_stored_proxy;
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

    adadObjecttBuilder(adObject) {
        const objectBuilded = {
            title: adObject.title,
            description: '',
            price: adObject.price ? parseInt(adObject.price.replace(/[^0-9]/g, '')) : null,
            fipePrice: null,
            averageOlxPrice: null,
            listId: adObject.listId,
            url: adObject.url,
            thumbnail: adObject.thumbnail,
            location: adObject.location,
            imagesCount: adObject.images.length,
        };
        if ('trackingSpecificData' in adObject) {
            adObject.trackingSpecificData.forEach((prop) => {
                objectBuilded[prop.key] = prop.value;
            });
        }
        if ('properties' in adObject) {
            adObject.properties.forEach((prop) => {
                objectBuilded[prop.name] = prop.value;
            });
        }
        return objectBuilded;
    },

    async extractMainData(useProxys, extractionUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                puppeteer.launch({ headless: "new", args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] }).then(async browser => {
                    const page = await browser.newPage();
                    if (useProxys) {
                        await autenticateProxy(page, this.proxys.user, this.proxys.password);
                        await puppeteerModule.prevent_resource_download(page);
                        const ip = await getIp(page);
                        console.log(`Acessing from ip ${ip}`);
                        this.proxys.usage++;
                    }
                    const scriptOlxTagId = this.htmlIdentifiers.scriptId;
                    const searchTermInUrl = getSearchTerm(extractionUrl);
                    await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
                    const mainHtmlContent = await page.content();
                    if (!mainHtmlContent) {
                        await browser.close();
                        console.log('HTML is empty');
                        resolve(null);
                    } else {
                        console.log('Main HTML Extracted!');
                    }
                    const dataExtracted = await page.evaluate((scriptId) => {
                        const scriptTag = document.getElementById(scriptId);
                        if (scriptTag) {
                            return scriptTag.textContent;
                        } else {
                            return null;
                        }
                    }, scriptOlxTagId);

                    if (dataExtracted === null) {
                        await browser.close();
                        console.log(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website! or proxy problem!`);
                        resolve(null);
                        return;
                    }
                    const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads, searchTermInUrl).map(this.adadObjecttBuilder);
                    console.log(`Was load a total of ${adsArray.length} matched ads from OLX`);
                    await browser.close();
                    if (!adsArray.length) {
                        console.log('No ads fetched!');
                        resolve(null);
                    }
                    resolve(adsArray);
                });

            } catch (err) {
                reject('Something is wrong: ' + err);
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
                const browser = await puppeteer.launch({ headless: "new", args: [usingProxy ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] }).then();
                try {
                    if (usingProxy) {
                        const newProxy = rotateProxy(this.proxys.useLimit, this.proxys.usage).newProxyValue;
                        if (newProxy) {
                            this.proxys.value = newProxy;
                            this.proxys.usage = 0;
                        }
                    }
                    const page = await browser.newPage();
                    if (usingProxy) {
                        await autenticateProxy(page, this.proxys.user, this.proxys.password);
                        await puppeteerModule.prevent_resource_download(page);
                        const ip = await getIp(page);
                        console.log(`Acessing from ip ${ip}`);
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
                    console.log('Error in child extracting: ' + err);
                    console.log(`Restarting from index: ${index}...`);
                    this.proxys.usage = this.proxys.useLimit;
                    await browser.close();
                    return index;
                }
            }
        }
        return null;
    },

    async olxScrapRun(url, useProxys, paginate) {
        return new Promise(async (resolve, reject) => {
            try {
                if (useProxys) {
                    this.proxys.value = getProxy(true, null);
                }
                let mainArrayResponse = await this.extractMainData(true, url);
                if (!mainArrayResponse) {
                    reject();
                    return;
                }
                if (paginate && mainArrayResponse.length === 50) {
                    console.log('Paginating...');
                    for (let page = 2; page <= 200; page++) {
                        let newUrl = new URL(url);
                        newUrl.searchParams.set("o", page);
                        console.log(`New url for extract page ${page}: ${newUrl}`);
                        let pageArrayResponse = await this.extractMainData(true, newUrl);
                        if (pageArrayResponse) {
                            console.log('Arrays merged');
                            mainArrayResponse = mainArrayResponse.concat(pageArrayResponse);
                        }
                        if (!pageArrayResponse || pageArrayResponse.length < 50) {
                            console.log('Stoping pagination');
                            break;
                        }
                    }
                }
                let lastIndex = null;
                let attempts = 0;
                do {
                    try {
                        if (attempts <= 10) {
                            this.config.stuckedIndex = await this.adJsonBuilder(mainArrayResponse, this.config.stuckedIndex, useProxys);
                            if (lastIndex !== this.config.stuckedIndex) {
                                lastIndex = this.config.stuckedIndex;
                                attempts = 0;
                            } else {
                                attempts++;
                            }
                        } else {
                            throw new Error('Attempts number exceded!');
                        }
                    } catch (err) {
                        console.error('Error in adJsonBuilder loop:', err);
                        break;
                    }
                } while (this.config.stuckedIndex || this.config.stuckedIndex === 0);
                const setIsFakePriceAdsArrayHits = setIsFakePriceAdsArray(this.hits, this.searchTerm);
                resolve(setIsFakePriceAdsArrayHits);
            } catch (err) {
                reject("Error in olxScrapRun function" + err);
            }
        });
    },
};
