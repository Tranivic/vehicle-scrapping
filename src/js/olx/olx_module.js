const extractHtml = require('../functionality').extract_html_content;
const cleanArray = require('../functionality').clean_itens_in_array_without_url;
const throttleLoop = require('../functionality').throttle_loop;
const saveFile = require('../mixins/fs_functions').save_file;
const cheerio = require('cheerio');
const fs = require('fs');

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
            descriptionClass: '.ad__sc-1sj3nln-1'
        },
    },

    url_builder: function (urlObj) {
        let url = `${urlObj.baseUrl}${urlObj.localization ? urlObj.localization : ''}`;
        if (urlObj.minPrice && urlObj.maxPrice) {
            url = url + `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrice}`;
        }
        if (urlObj.gnv.gnvOptional) {
            url = url + `&hgnv=${urlObj.gnv.allowGnvOption}&o=3`;
        }
        console.log('Url para extração: ' + url);
        return url;
    },

    run: async function () {
        const extractionUrl = this.url_builder(this.urlParams);
        const mainHtmlContent = await extractHtml(extractionUrl, {});

        if (mainHtmlContent) {
            console.log('Main HTML Extracted!');
            const $ = cheerio.load(mainHtmlContent);
            const extractionId = this.urlParams.htmlIdentifiers.scriptId;
            const $dataExtracted = $(extractionId).text();;

            if ($dataExtracted) {
                const adsArray = cleanArray(JSON.parse($dataExtracted).props.pageProps.ads);
                console.log(`Was load a total of ${adsArray.length} ads from OLX`);

                await throttleLoop(adsArray, async (element) => {
                    console.log('Working in child html!')
                    try {
                        const childHtml = await extractHtml(element.url);
                        const $ = cheerio.load(childHtml);
                        const $descriptionExtracted = $('meta[property="og:description"]').attr('content');;;
                        if ($descriptionExtracted) {
                            element = {
                                descriprion: $descriptionExtracted
                            };
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }, 0);
                saveFile('../public/', 'latestAds.json', JSON.stringify(adsArray));
            } else {
                console.log('No data stracted from selected ID or Class');
            }

        } else {
            console.log('The HTML file returned blank, check the log for error details!');
        }
    }
};
