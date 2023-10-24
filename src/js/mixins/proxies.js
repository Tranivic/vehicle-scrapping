const generateRandomNamber = require('./utils').generate_random_number;

exports.get_stored_proxy = (randomize, proxyIndex) => {
    const proxyList = require('../../../public/proxies/proxies.json');

    if (randomize) {
        const randomNumber = generateRandomNamber(1, proxyList.length);
        console.log(`Proxy selected for extract: ${randomNumber} - ${proxyList[randomNumber]}`)
        return proxyList[randomNumber];
    }
    return proxyList[proxyIndex];
};