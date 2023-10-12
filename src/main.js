// URLBASE: https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?pe=40000&ps=12000&hgnv=true
// 1º definir a url com todos os parametros necessários.
// 2º eu vou requisitar o HTMl do site de destino.
// 3º irei achar os links uteis.
// 4º irei abrir os links uteis.
// 5º irei analizar as informações uteis.
// 6º irei esportar as informações úteis.


// Libs import
// const cheerio = require('cheerio');
// const fs = require('fs');


// Imports
const extractHtml = require('./js/functionality').extract_html_content;
const olxUrlParams = require('./js/olx/olx_module').urlParams
const olxUrlBuilder = require('./js/olx/olx_module').url_builder

const runProject = async () => {
    const mainHtmlContent = await extractHtml(olxUrlBuilder(olxUrlParams), {})
    console.log(mainHtmlContent)
}

runProject();