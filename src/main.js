const fs = require('fs');
const olxModule = require('./modules/olx/olx_module');
const saveFile = require('./js/mixins/fs_functions').save_file;
const rankedAds = require('./js/functionality').ads_ranking;

const pageStart = 1;
const pageLimit = 1;

// Run
async function run(pageNumber) {
    try {
        let storedAds;
        storedAds = await olxModule.fetchAds(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?ctp=5&ctp=8&me=80000&ms=5000&pe=65000&q=ix35&rs=63&hgnv=false&o=${pageNumber}`), true);
        // Testing with less results
        // storedAds = await olxModule.fetchAds(olxModule.url_builder(null, `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-rj?ctp=5&ctp=8&me=30000&ms=5000&pe=65000&q=yaris&rs=63&hgnv=false&o=${pageNumber}`), true);
        // storedAds = require('../log/adsObj.json');
        rankedStoredAds = rankedAds(storedAds);
        saveFile('./log/', `adsObj.json`, JSON.stringify(storedAds));
        saveFile('./log/', `result_until_page_${pageNumber}.json`, JSON.stringify(rankedStoredAds));

        pageNumber++;
        if (pageNumber <= pageLimit) {
            await run(pageNumber);
        } else {
            console.log('Finished!');
            return;
        }
    } catch (err) {
        console.log('Run failed: ' + err.message);
    }
}


async function recursiveRun() {
    if (pageStart >= 1 && pageStart <= pageLimit) {
        for (let page = pageStart; page <= pageLimit; page++) {
            await run(page);
        }
    } else {
        console.log('Page start or page limit is incorrect!');
    }

}

recursiveRun();
