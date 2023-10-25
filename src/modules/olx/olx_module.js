const cleanArray = require('../../js/functionality').clean_itens_in_array_without_url;
const throttleLoop = require('../../js/functionality').throttle_loop;
const saveFile = require('../../js/mixins/fs_functions').save_file;
const getIp = require('../../js/proxies').get_ip;
const getProxy = require('../../js/proxies').get_stored_proxy;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = {
    hits: [],
    config: {
        limtOfAdsFetched: null
    },
    proxys: {
        value: '',
        useLimit: 10,
        proxy: '',
        protocol: 'http://',
        user: 'rgzyljqe',
        password: 'w6tmehewftx4',
    },
    urlParams: {
        baseUrl: 'http://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj/rio-de-janeiro-e-regiao',
        searchTerm: 'renegade',
        minPrice: 50000,
        maxPrice: 85000,
        fromYear: 2015,
        gnv: {
            gnvOptional: false,
            allowGnvOption: false,
        },
    },

    htmlIdentifiers: {
        scriptId: '__NEXT_DATA__',
        descriptionCatch: 'meta[property="og:description"]',
        initialDataId: '#initial-data',
    },

    url_builder(urlObj) {
        let url = `${urlObj.baseUrl}${urlObj.localization || ''}`;

        if (urlObj.minPrice && urlObj.maxPrice) {
            url += `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrice}`;
        }

        if (urlObj.gnv.gnvOptional) {
            url += `&hgnv=${urlObj.gnv.allowGnvOption}&o=3`;
        }
        if (urlObj.searchTerm.length) {
            url += `&q=${urlObj.searchTerm}`;
        }
        if (urlObj.fromYear) {
            const yearBase2000 = 50;
            const relativeYear = (urlObj.fromYear - 2000) + yearBase2000;

            url += `&rs=${relativeYear}`;
        }
        console.log('Url para extração: ' + url);
        return url;
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
    async teste(array, receivedBrowser, customIndex, usingProxy) {
        let index = customIndex;
        let currentIndex = 0;

        for await (const element of array) {
            if (currentIndex < customIndex) {
                currentIndex++;
            } else {
                try {
                    if (this.proxys.useLimit <= 0 && usingProxy) {
                        this.rotateProxy();
                        return index;
                    }
                    const page = await receivedBrowser.newPage();
                    await page.goto(element.url, { waitUntil: 'domcontentloaded' });
                    await page.screenshot({ path: `../log/screenshots/ad[${index}].png`, fullPage: true });
                    const extractedChildData = await page.evaluate((htmlIdentifiers) => {
                        const initialData = JSON.parse(document.querySelector(htmlIdentifiers.initialDataId).getAttribute('data-json')).ad;
                        const description = document.querySelector(htmlIdentifiers.descriptionCatch).getAttribute('content');
                        const fipePrice = initialData.abuyFipePrice?.fipePrice || null;
                        const averageOlxPrice = initialData.abuyPriceRef?.price_p50 || null;
                        return { description, fipePrice, averageOlxPrice };
                    }, this.htmlIdentifiers);

                    element.description = extractedChildData.description;
                    element.fipePrice = extractedChildData.fipePrice;
                    element.averageOlxPrice = extractedChildData.averageOlxPrice;
                    this.hits.push(element);
                    saveFile('../log/', `adsObj.json`, JSON.stringify(this.hits));
                    index++;
                    if(usingProxy){
                        this.proxys.useLimit--;
                        console.log(`Proxy use remaning: ${this.proxys.useLimit}`);
                    }
                } catch (error) {
                    console.log('Error in child extracting');
                    console.error(error);
                    return index;
                }
            }
        }
        return null;
    },
    async fetchAds(url, useProxys) {
        if (useProxys) {
            this.proxys.value = getProxy(false, 0);
        }
        puppeteer.launch({ headless: "new", args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.value}` : ''] }).then(async browser => {
            try {
                const extractionUrl = url;
                const scriptOlxTagId = this.htmlIdentifiers.scriptId;
                const page = await browser.newPage();
                if (useProxys) {
                    await this.autenticateProxy(page);
                }

                await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
                const mainHtmlContent = await page.content();

                if (!mainHtmlContent) {
                    throw new Error('The HTML file returned blank, check the log for error details!');
                }

                saveFile('../log/', 'main.html', mainHtmlContent);
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

                const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads).map(this.ad_obj_builder);
                console.log(`Was load a total of ${adsArray.length} ads from OLX`);

                // // Fetchin html for ads
                console.log('Working in child html...');
                let indexStuck = 0;
                do {
                    indexStuck = await this.teste(adsArray, browser, indexStuck, true);
                } while (indexStuck);
                console.log('Process finished!');
            } catch (err) {
                console.log('Something is wrong: ' + err.message);
            }
            console.log('Fetch end!');
            await browser.close();
        });
    },
    rotateProxy() {
        console.log('Proxy limit reached...');
        this.proxys.value = getProxy(true);
        this.proxys.useLimit = 10;
        console.log('Changing to a new proxy...');
    },
    async autenticateProxy(page) {
        await page.authenticate({
            username: this.proxys.user,
            password: this.proxys.password,
        });
        console.log('System is acessing from proxy ip: ' + await getIp(page));
        this.proxys.useLimit--;
        console.log(`Proxy use remaning: ${this.proxys.useLimit}`);
    }
};
