const fs = require('fs');

exports.save_file = (filePath, fileName, fileData) => {
    const fullFilePath = filePath + fileName;

    fs.writeFile(fullFilePath, fileData, (err) => {
        if (err) {
            console.error('Error saving the file', err);
        } else {
            console.log(`The file ${fileName} was saved!`);
        }
    });
};

exports.create_folder = (folderName) =>{
    try {
        if (!fs.existsSync(folderName)) {
          fs.mkdirSync(folderName);
        }
      } catch (err) {
        console.error(err);
      }
}