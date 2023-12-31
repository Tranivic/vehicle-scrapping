const olxModule = require('./modules/olx_module');
const saveFile = require('./js/mixins/fs_functions').save_file;
const createFolder = require('./js/mixins/fs_functions').create_folder

// Run
async function run(pageNumber) {
    try {
        createFolder('./log')
        createFolder('./log/screenshots')
        let storedAds;
        // storedAds = await olxModule.olxScrapRun(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?ctp=5&ctp=8&me=80000&ms=5000&pe=65000&q=creta&rs=63&hgnv=false&o=${pageNumber}`), true);
        // storedAds = require('../log/adsObj.json');
        // Testing with less results
        storedAds = await olxModule.olxScrapRun(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?me=80000&ms=5000&pe=65000&q=fluence&rs=63&o=${pageNumber}`), true);
        saveFile('./log/', `result_page_${pageNumber}.json`, JSON.stringify(storedAds));
    } catch (err) {
        console.log('Run failed: ' + err.message);
    }
}

run(1);
