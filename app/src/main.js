require('module-alias/register');
const olxModule = require('@modules/olx_module');
const saveFile = require('@mixins/fs_functions').save_file;
const generateCsv = require("@plugins/json2csv").generate_csv;

// Run
async function run() {
    try {
        const searchTerm = 'cruze';
        let storedAds;
        storedAds = await olxModule.olxScrapRun(olxModule.url_builder(`https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?f=p&me=80000&ms=5000&pe=65000&q=${searchTerm}&rs=63&o=1`), true, true);
        saveFile('./log/', `result_${searchTerm}_${new Date().valueOf()}.json`, JSON.stringify(storedAds));
        generateCsv(storedAds,searchTerm);
        console.log('Finished!');
    } catch (err) {
        console.log('Run failed: ' + err);
    }
}

run();