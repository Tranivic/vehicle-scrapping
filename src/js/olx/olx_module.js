const extractHtml = require('../functionality').extract_html_content;
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
        }
    },

    htmlIdentifiers: {
        scriptId: '#__NEXT_DATA__'
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
            console.log('HTML Extracted!');
            const $ = cheerio.load(mainHtmlContent);
            const extractionId = this.htmlIdentifiers.scriptId;
            const $dataExtracted = $(extractionId).text();;
            const adsArray = JSON.parse($dataExtracted).props.pageProps.ads;
            const filePath = './src/public/ads.json';

            fs.writeFile(filePath, JSON.stringify(adsArray), (err) => {
                if (err) {
                    console.error('Error writing JSON file:', err);
                } else {
                    console.log('JSON data has been written to the file successfully.');
                }
            });

        } else {
            console.log('The HTML file returned blank, check the log for error details!');
        }
    }
};
