const extractHtml = require('../functionality').extract_html_content;
const cleanArray = require('../functionality').clean_itens_in_array_without_url;
const throttleLoop = require('../functionality').throttle_loop;
const saveFile = require('../mixins/fs_functions').save_file;
const cheerio = require('cheerio');

module.exports = {
    config: {
        pageToFetch: 4,
        limtOfAdsFetched: null
    },

    urlParams: {
        baseUrl: 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj/rio-de-janeiro-e-regiao',
        minPrice: 10000,
        maxPrice: 100000,
        gnv: {
            gnvOptional: false,
            allowGnvOption: false,
        },
    },

    htmlIdentifiers: {
        scriptId: '#__NEXT_DATA__',
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

    async fetchAds(url) {
        try {
            const extractionUrl = url;
            const mainHtmlContent = await extractHtml(extractionUrl, {});

            if (!mainHtmlContent) {
                throw new Error('The HTML file returned blank, check the log for error details!');
            }

            saveFile('../src/log/', 'main.html', mainHtmlContent);
            console.log('Main HTML Extracted!');
            const $ = cheerio.load(mainHtmlContent);
            const $dataExtracted = $(this.htmlIdentifiers.scriptId).text();

            if (!$dataExtracted) {
                throw new Error(`No data extracted from selected ID or Class, check the ${this.htmlIdentifiers.scriptId} if its still equal to OLX website!`);
            }

            const adsArray = cleanArray(JSON.parse($dataExtracted).props.pageProps.ads).map(this.ad_obj_builder);
            console.log(`Was load a total of ${adsArray.length} ads from OLX`);

            // Fetchin html for ads
            await throttleLoop(adsArray, async (element) => {
                console.log('Working in child html!');
                try {
                    const childHtml = await extractHtml(element.url, {});
                    const $child = cheerio.load(childHtml);
                    const initialData = JSON.parse($child(this.htmlIdentifiers.initialDataId).attr('data-json')).ad;

                    element.description = $child(this.htmlIdentifiers.descriptionCatch).attr('content');
                    element.fipePrice = initialData.abuyFipePrice?.fipePrice || null;
                    element.averageOlxPrice = initialData.abuyPriceRef?.price_p50 || null;
                } catch (error) {
                    console.error(error);
                }
            }, 1000);

            saveFile('../src/public/', 'latestAds.json', JSON.stringify(adsArray));

        } catch (err) {
            console.log(err);
        }

    },
};
