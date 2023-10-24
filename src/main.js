// Imports
const olxModule = require('./modules/olx/olx_module');

// Run
olxModule.fetchAds(olxModule.url_builder(olxModule.urlParams), true);