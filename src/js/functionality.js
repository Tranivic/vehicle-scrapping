const axios = require('axios');

exports.extract_html_content = async (url, customProxy) => {
    try {
        const response = await axios.get(url, {
            proxy: {
                host: customProxy.split(':')[0],
                port: parseInt(customProxy.split(':')[1]),
            },
        });
        console.log(response.data)
        return response.data;
    } catch (err) {
        console.error('Erro ao extrair conteúdo HTML:', err);
        return null;
    }
};

exports.clean_itens_in_array_without_url = (array) => {
    const cleanedArray = [];
    array.forEach(element => {
        if (element.url) {
            cleanedArray.push(element);
        }
    });
    return cleanedArray;
};

exports.throttle_loop = async (array, callback, delay) => {
    for (const item of array) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        await callback(item);
    }
};