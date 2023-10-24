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