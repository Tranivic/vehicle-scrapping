// URLBASE: https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?pe=40000&ps=12000&hgnv=true
// 1º definir a url com todos os parametros necessários.
// 2º eu vou requisitar o HTMl do site de destino.
// 3º irei achar os links uteis.
// 4º irei abrir os links uteis.
// 5º irei analizar as informações uteis.
// 6º irei esportar as informações úteis.


// Libs
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const olxUrlParams = {
    baseUrl: 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/',
    localization: 'estado-rj',
    minPrixe: 20000,
    maxPrice: 56000,
    gnv: {
        gnvOptional: true,
        allowGnvOption: false,
    }
};

const url_builder = (urlObj) => {
    let url = `${urlObj.baseUrl}${urlObj.localization}`;
    if (urlObj.minPrixe && urlObj.maxPrice) {
        url = url + `?pe=${urlObj.maxPrice}&ps=${urlObj.minPrixe}`;
    }
    if (urlObj.gnv.gnvOptional) {
        url = url + `&hgnv=${urlObj.gnv.allowGnvOption}`;
    }
    return url;
};

const extract_html_content = async (url, params) => {
    try {
        const htmlContent = await axios.get(url, params);
        console.log(htmlContent.data);
        return htmlContent.data;
    } catch (err) {
        console.log('deu ruim na estração do html');
        console.log(err);
        return null;
    }
};

console.log('URl de Extração: ' + url_builder(olxUrlParams));



extract_html_content(url_builder(olxUrlParams), {});