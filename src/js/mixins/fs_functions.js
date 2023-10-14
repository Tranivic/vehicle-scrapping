const fs = require('fs');

exports.save_file = (filePath, fileName, fileData) => {
    const fullFilePath = filePath + fileName

    fs.writeFile(fullFilePath, fileData, (err) => {
        if (err) {
            console.error('Error saving the file', err);
        } else {
            console.log(`The file ${fileName} was saved!`);
        }
    });
};