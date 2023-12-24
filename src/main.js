const olxModule = require('./modules/olx/olx_module');
const saveFile = require('./js/mixins/fs_functions').save_file;


// Run
async function run(pageNumber) {
    try {
        let storedAds;
        storedAds = await olxModule.fetchAds(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?ctp=5&ctp=8&me=80000&ms=5000&pe=65000&q=ix35&rs=63&hgnv=false&o=${pageNumber}`), true);
        // storedAds = require('../log/adsObj.json');
        // Testing with less results
        // storedAds = await olxModule.fetchAds(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?ctp=5&ctp=8&me=30000&ms=5000&pe=65000&q=yaris&rs=63&hgnv=false&o=${pageNumber}`), true);
        saveFile('./log/', `result_page_${pageNumber}.json`, JSON.stringify(storedAds));
    } catch (err) {
        console.log('Run failed: ' + err.message);
    }
}

run(1);
