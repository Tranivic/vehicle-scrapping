require('module-alias/register');
const olxModule = require('@modules/olx_module');
const saveFile = require('@mixins/fs_functions').save_file;
const generateCsv = require("@plugins/json2csv").generate_csv;

// Run
async function run() {
    try {
        let storedAds;
        const url = 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj/rio-de-janeiro-e-regiao?me=100000&ms=5000&q=ix35';
        const urlObject = new URL(url);
        const searchParams = new URLSearchParams(urlObject.search);
        const searchTerm = searchParams.get('q');
        storedAds = await olxModule.olxScrapRun(olxModule.url_builder(url), true, true);
        saveFile('./log/', `result_${searchTerm || null}_${new Date().valueOf()}.json`, JSON.stringify(storedAds));
        generateCsv(storedAds,searchTerm);
        console.log('Finished!');
    } catch (err) {
        console.log('Run failed: ' + err);
    }
}

run();