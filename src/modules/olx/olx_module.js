const cleanArray = require('../../js/functionality').clean_itens_in_array_without_url;
const throttleLoop = require('../../js/functionality').throttle_loop;
const saveFile = require('../../js/mixins/fs_functions').save_file;
const getProxy = require('../../js/proxies').get_stored_proxy;
const getIp = require('../../js/proxies').get_ip;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = {
    config: {
        pageToFetch: 4,
        limtOfAdsFetched: null
    },
    proxys: {
        uses: 0,
        proxy: '',
        protocol: 'http://',
        user: 'rgzyljqe',
        password: 'w6tmehewftx4',
    },
    urlParams: {
        baseUrl: 'http://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj/rio-de-janeiro-e-regiao',
        minPrice: 10000,
        maxPrice: 100000,
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
    async fetchAds(url, useProxys) {

        if (useProxys) {
            this.proxys.proxy = getProxy(true);
        }

        puppeteer.launch({ headless: "new", args: [useProxys ? `--proxy-server=${this.proxys.protocol}${this.proxys.proxy}` : ''] }).then(async browser => {
            try {
                const extractionUrl = url;
                const scriptOlxTagId = this.htmlIdentifiers.scriptId;
                const page = await browser.newPage();
                await page.authenticate({
                    username: this.proxys.user,
                    password: this.proxys.password,
                });
                if (useProxys) {
                    console.log('System is acessing from ip: ' + await getIp(page));
                }
                await page.goto(extractionUrl, { waitUntil: 'domcontentloaded' });
                const mainHtmlContent = await page.content();


                if (!mainHtmlContent) {
                    throw new Error('The HTML file returned blank, check the log for error details!');
                }

                saveFile('../log/', 'main.html', mainHtmlContent);
                console.log('Main HTML Extracted!');

                const dataExtracted = await page.evaluate((scriptId) => {
                    console.log(scriptId);
                    const scriptTag = document.getElementById(scriptId);
                    if (scriptTag) {
                        return scriptTag.textContent;
                    } else {
                        return null; a;
                    }
                }, scriptOlxTagId);

                if (!dataExtracted) {
                    throw new Error(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website!`);
                }

                console.log('script tag extraida');

                const adsArray = cleanArray(JSON.parse(dataExtracted).props.pageProps.ads).map(this.ad_obj_builder);
                console.log(`Was load a total of ${adsArray.length} ads from OLX`);

                // Fetchin html for ads
                let counter = 1;
                console.log('Working in child html...');
                await throttleLoop(adsArray, async (element) => {
                    try {
                        const page = await browser.newPage();
                        await page.goto(element.url, { waitUntil: 'domcontentloaded' });
                        await page.screenshot({ path: `../log/screenshots/ad[${counter}].png`, fullPage: true });
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
                    } catch (error) {
                        console.error(error);
                    }
                    counter++;
                }, 1000);

                saveFile('../log/', 'latestAds.json', JSON.stringify(adsArray));
                await browser.close();
            } catch (err) {
                console.log('Something is wrong!');
                console.log(err);
            }
        });
    },
};
