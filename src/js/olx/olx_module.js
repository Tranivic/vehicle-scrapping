module.exports = {
    urlParams: {
        baseUrl: 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
        localization: 'estado-rj',
        minPrice: 20000, // Changed "minPrixe" to "minPrice"
        maxPrice: 56000,
        gnv: {
            gnvOptional: true,
            allowGnvOption: false,
        }
    },

    url_builder: (urlObj) => {
        let url = `${urlObj.baseUrl}${urlObj.localization}`;
        if (urlObj.minPrixe && urlObj.maxPrice) {
            url = url + `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrixe}`;
        }
        if (urlObj.gnv.gnvOptional) {
            url = url + `&hgnv=${urlObj.gnv.allowGnvOption}`;
        }
        return url;
    }
};
