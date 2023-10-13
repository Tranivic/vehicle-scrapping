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

    scrapHtmlClasses: {
        addLink: '.olx-ad-card__link-wrapper'
    },

    url_builder: (urlObj) => {
        let url = `${urlObj.baseUrl}${urlObj.localization ? urlObj.localization : ''}`;
        if (urlObj.minPrice && urlObj.maxPrice) {
            url = url + `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrice}`;
        }
        if (urlObj.gnv.gnvOptional) {
            url = url + `&hgnv=${urlObj.gnv.allowGnvOption}&o=3`;
        }
        console.log('Url para extração: ' + url)
        return url;
    }
};
