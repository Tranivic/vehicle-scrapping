// URLBASE: https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?pe=40000&ps=12000&hgnv=true
// 1º definir a url com todos os parametros necessÃ¡rios.
// 2º eu vou requisitar o HTMl do site de destino.
// 3º irei achar os links uteis.
// 4º irei abrir os links uteis.
// 5º irei analizar as informaÃ§Ãµes uteis.
// 6º irei esportar as informaÃ§Ãµes Ãºteis.


// Libs import
const cheerio = require('cheerio');


// Imports
const extractHtml = require('./js/functionality').extract_html_content;
const olxModule = require('./js/olx/olx_module');




const runProject = async () => {
    const extractionUrl = olxModule.url_builder(olxModule.urlParams);
    const mainHtmlContent = await extractHtml(extractionUrl, {});
    let extractedLinks = '';

    if (mainHtmlContent) {
        console.log('HTML extraido!');

        const $ = cheerio.load(mainHtmlContent);
        const extractionClass = olxModule.scrapHtmlClasses.addLink;


        $(extractionClass).each((i, aTag) => {
            extractedLinks += ' new-line ' + $(aTag).attr('href') + ' end-line ';
        });

        console.log(extractedLinks);
    } else {
        console.log('Arquivo HTML retornou em branco, verificar o log para detalhes de erro!');
    }
};


runProject();