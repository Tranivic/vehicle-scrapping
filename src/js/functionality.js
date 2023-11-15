exports.clean_not_matchs = (array, searchTermRecived) => {
    const cleanedArray = [];
    console.log('Cleaning array...');
    array.forEach(element => {
        const hasUrl = element.url;
        const searchTermRecivedEmpty = !searchTermRecived.length;
        const isSubjectMatch = (element.subject || '').toUpperCase().includes((searchTermRecived || '').toUpperCase());
        const isTitleMatch = (element.title || '').toUpperCase().includes((searchTermRecived || '').toUpperCase());
        if (hasUrl && (searchTermRecivedEmpty || isSubjectMatch || isTitleMatch)) {
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

exports.ads_ranking = (adsArray) => {
    const keywords = require('../../public/keywords.json');
    const badWords = keywords.badWords;
    const rankedAdsArray = []

    adsArray.map(element => {
        let elementScore = 5;

        const hasBadWord = badWords.some(badWord => {
            if (element.description.toUpperCase().includes(badWord.toUpperCase())) {
                return true;
            }
        });

        const diferenceFipePrice = element.fipePrice ? element.fipePrice - element.price : null;
        const diferenceAveragePrice = element.averageOlxPrice ? element.averageOlxPrice - element.price : null;
        const badPrice = (diferenceFipePrice && diferenceFipePrice > 15000) || (diferenceAveragePrice && diferenceAveragePrice > 15000);

        if (hasBadWord) { elementScore--; }
        if (badPrice) { elementScore--; }
        element.score = elementScore;
        rankedAdsArray.push(element);
    });

    return rankedAdsArray
};

