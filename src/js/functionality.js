const axios = require('axios')

exports.extract_html_content = async (url, params) => {
    try {
        const htmlContent = await axios.get(url, params);
        return htmlContent.data;
    } catch (err) {
        console.log('deu ruim na estração do html');
        console.log(err);
        return null;
    }
};