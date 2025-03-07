const { Parser } = require('@json2csv/plainjs');
const saveFile = require('@utils/fs_functions').save_file;
exports.generate_csv = (array, vehicleName) => {
    for (let i = 0; i < array.length; i++) {
        for (let key in array[i]) {
            if (typeof array[i][key] === 'object') {
                if(array[i][key].enabled){
                    array[i] = {
                        ...array[i],
                        [array[i][key].label]: array[i][key].value
                    }
                }
                delete array[i][key]
            }
        }
    }
    try {
        const parser = new Parser();
        const csv = parser.parse(array);
        saveFile('./csv/', `csv_${vehicleName || "vehicle"}_${new Date().valueOf()}.csv`, csv);
    } catch (err) {
        console.log(err);
    }
};
