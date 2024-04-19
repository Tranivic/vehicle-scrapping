const { Parser } = require('@json2csv/plainjs');
const saveFile = require('@mixins/fs_functions').save_file;
exports.generate_csv = (array, vehicleName) => {
    try {
        const parser = new Parser();
        const csv = parser.parse(array);
        saveFile('./csv/', `csv_${vehicleName || "vehicle"}_${new Date().valueOf()}.csv`, csv);
    } catch (err) {
        console.log(err);
    }
};
