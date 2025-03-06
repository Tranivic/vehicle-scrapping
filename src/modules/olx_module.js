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
            price: adObject.price,
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
        const browser = await puppeteer.launch({ headless: false, args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : '', '--no-sandbox'] });
        const page = await browser.newPage();

        if (useProxys) {
            await autenticateProxy(page, this.proxys.user, this.proxys.password);
            const ip = await getIp(page);
            console.log(`Acessing from ip ${ip}`);
            this.proxys.usage++;
        }
        await puppeteerModule.prevent_resource_download(page);

        await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
        const mainHtmlContent = await page.content();

        if (!mainHtmlContent) {
            await browser.close();
            console.log('HTML is empty');
            return null;
        }

        console.log('Main HTML Extracted!');
        const scriptOlxTagId = this.htmlIdentifiers.scriptId;
        const dataExtracted = await page.evaluate((scriptId) => {
            const scriptTag = document.getElementById(scriptId);
            return scriptTag ? scriptTag.textContent : null;
        }, scriptOlxTagId);

        await browser.close();

        if (!dataExtracted) {
            console.log(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website! or proxy problem!`);
            return null;
        }

        const searchTermInUrl = getSearchTerm(extractionUrl);
        const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads, searchTermInUrl).map(this.adadObjecttBuilder);
        console.log(`Was load a total of ${adsArray.length} matched ads from OLX`);

        return adsArray.length ? adsArray : null;
    },

    async processAd(ad, browser, usingProxy) {
        const page = await browser.newPage();
        try {
            if (usingProxy) {
                await autenticateProxy(page, this.proxys.user, this.proxys.password);
                const ip = await getIp(page);
                console.log(`Acessing from ip ${ip}`);
                this.proxys.usage++;
            }
            await puppeteerModule.prevent_resource_download(page);

            await page.goto(ad.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            const extractedChildData = await page.evaluate((htmlIdentifiers) => {
                const initialData = JSON.parse(document.querySelector(htmlIdentifiers.initialDataId).getAttribute('data-json')).ad;
                const descriptionHtml = document.querySelector(htmlIdentifiers.descriptionHtml).getAttribute('content');
                const fipePrice = initialData.abuyFipePrice?.fipePrice || null;
                const averageOlxPrice = initialData.abuyPriceRef?.price_p50 || null;
                return { descriptionHtml, fipePrice, averageOlxPrice };
            }, this.htmlIdentifiers);

            ad.description = extractedChildData.descriptionHtml;
            ad.fipePrice = extractedChildData.fipePrice;
            ad.averageOlxPrice = extractedChildData.averageOlxPrice;
            this.hits.push(ad);
            console.log(`Extracted ${ad.listId}`);
        } catch (err) {
            console.log(`Error processing ad ${ad.listId}: ${err}`);
        } finally {
            await page.close();
        }
    },

    async olxScrapRun(url, useProxys, paginate) {
        try {
            if (useProxys) {
                this.proxys.value = getProxy(true, null);
            }

            let mainArrayResponse = await this.extractMainData(useProxys, url);
            if (!mainArrayResponse) {
                throw new Error('No ads fetched from main page');
            }

            if (paginate && mainArrayResponse.length === 50) {
                await this.paginate(url, useProxys, mainArrayResponse);
            }

            const browser = await puppeteer.launch({ headless: false, args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : '', '--no-sandbox'] });
            const batchSize = 10;
            for (let i = 0; i < mainArrayResponse.length; i += batchSize) {
                const batch = mainArrayResponse.slice(i, i + batchSize);
                await Promise.all(batch.map(ad => this.processAd(ad, browser, useProxys)));
            }

            await browser.close();
            const setIsFakePriceAdsArrayHits = setIsFakePriceAdsArray(this.hits, getSearchTerm(url));
            return setIsFakePriceAdsArrayHits;
        } catch (err) {
            console.error("Error in olxScrapRun function:", err);
            throw err;
        }
    },

    async paginate(url, useProxys, mainArrayResponse) {
        for (let page = 2; page <= 99999999999; page++) {
            const newUrl = new URL(url);
            newUrl.searchParams.set("o", page);
            console.log(`New url for extract page ${page}: ${newUrl}`);
            let pageArrayResponse = await this.extractMainData(useProxys, newUrl);
            if (pageArrayResponse) {
                mainArrayResponse = mainArrayResponse.concat(pageArrayResponse);
            }
            if (!pageArrayResponse || pageArrayResponse.length < 50) {
                console.log('Stopping pagination');
                break;
            }
        }
    }
};