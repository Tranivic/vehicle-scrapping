require('module-alias/register');
const olxModule = require('@modules/olx_module');
const saveFile = require('@mixins/fs_functions').save_file;
const createFolder = require('@mixins/fs_functions').create_folder;

// Run
async function run(pageNumber) {
    try {
        const searchTerm = 'elantra'
        createFolder('./log');
        let storedAds;
        storedAds = await olxModule.olxScrapRun(olxModule.url_builder(`https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?me=80000&ms=5000&pe=65000&q=${searchTerm}&rs=63&o=${pageNumber}`), true, true);
        saveFile('./log/', `result_${searchTerm}_${new Date().valueOf()}.json`, JSON.stringify(storedAds));
    } catch (err) {
        console.log('Run failed: ' + err);
    }
}

run(1);
