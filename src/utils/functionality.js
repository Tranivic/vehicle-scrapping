exports.clean_not_matchs = (array, searchTermRecived) => {
    console.log('Cleaning array...');
    const cleanedArray = [];
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

exports.set_is_fake_price = (adsArray) => {
    const keywords = require('@public/keywords.json');
    const priceWords = keywords.fakePriceWords;
    const setedArray = [];

    adsArray.map(element => {
        const hasBadWord = priceWords.some(badWord => {
            if (element.description.toUpperCase().includes(badWord.toUpperCase())) {
                return true;
            }
        });
        element.fake_price = hasBadWord ? "sim" : "não";
        setedArray.push(element);
    });
    return setedArray;
};

exports.get_search_term = (url) => {
    const linkUrl = new URL(url);
    const searchTerm = linkUrl.searchParams.get("q");
    console.log('The search term is: ' + searchTerm);
    return searchTerm;
};

