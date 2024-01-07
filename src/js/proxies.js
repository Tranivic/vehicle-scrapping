const generateRandomNamber = require('./mixins/utils').generate_random_number;

exports.get_stored_proxy = (randomize, proxyIndex) => {
    const proxyList = require('../../public/proxies/proxies.json');

    if (randomize) {
        const randomNumber = generateRandomNamber(1, proxyList.length - 1);
        console.log(`Proxy selected for extract: ${randomNumber} - ${proxyList[randomNumber]}`);
        return proxyList[randomNumber];
    }
    return proxyList[proxyIndex];
};

exports.get_ip = async (page) => {
    await page.goto('https://httpbin.org/ip');
    const body = await page.$('body');
    const ip = await page.evaluate(body => body.textContent, body);
    return JSON.parse(ip).origin;
};


exports.rotate_proxy = (proxyLimit, proxyUsage) => {
    let currentProxyUsage = proxyUsage;
    if (currentProxyUsage >= proxyLimit) {
        const newProxyValue = this.get_stored_proxy(true, null);
        console.log("Proxy changed. New proxy value:", newProxyValue);
        return {  newProxyValue: newProxyValue };
    }
    console.log('Proxy not changed, this is the use: '+ currentProxyUsage)
    return { newProxyValue: null };
};


exports.autenticate_proxy = async (page, username, password) => {
    await page.authenticate({
        username: username,
        password: password,
    });
};