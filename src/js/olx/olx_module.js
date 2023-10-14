const extractHtml = require('../functionality').extract_html_content;
const cleanArray = require('../functionality').clean_itens_in_array_without_url;
const throttleLoop = require('../functionality').throttle_loop;
const saveFile = require('../mixins/fs_functions').save_file;
const cheerio = require('cheerio');

module.exports = {
    urlParams: {
        baseUrl: 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj/rio-de-janeiro-e-regiao',
        minPrice: 10000,
        maxPrice: 100000,
        gnv: {
            gnvOptional: false,
            allowGnvOption: false,
        },
        htmlIdentifiers: {
            scriptId: '#__NEXT_DATA__',
            descriptionCatch: 'meta[property="og:description"]',
            initialDataId: '#initial-data',
        },
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

    async run() {
        const { htmlIdentifiers } = this.urlParams;
        const extractionUrl = this.url_builder(this.urlParams);
        const mainHtmlContent = await extractHtml(extractionUrl, {});
        saveFile('../src/log/', 'main.html', mainHtmlContent);

        if (!mainHtmlContent) {
            console.log('The HTML file returned blank, check the log for error details!');
            return;
        }

        console.log('Main HTML Extracted!');
        const $ = cheerio.load(mainHtmlContent);
        const $dataExtracted = $(htmlIdentifiers.scriptId).text();

        if (!$dataExtracted) {
            console.log('No data extracted from selected ID or Class');
            return;
        }

        const adsArray = cleanArray(JSON.parse($dataExtracted).props.pageProps.ads).map(this.ad_obj_builder);
        console.log(`Was load a total of ${adsArray.length} ads from OLX`);

        await throttleLoop(adsArray, async (element) => {
            console.log('Working in child html!');
            try {
                const childHtml = await extractHtml(element.url);
                const $child = cheerio.load(childHtml);
                const initialData = JSON.parse($child(htmlIdentifiers.initialDataId).attr('data-json')).ad;

                element.description = $child(htmlIdentifiers.descriptionCatch).attr('content');
                element.fipePrice = initialData.abuyFipePrice?.fipePrice || null;
                element.averageOlxPrice = initialData.abuyPriceRef?.price_p50 || null;
            } catch (error) {
                console.error(error);
            }
        }, 1000);

        saveFile('../src/public/', 'latestAds.json', JSON.stringify(adsArray));
    },
};
