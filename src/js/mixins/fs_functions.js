const fs = require('fs');

const createFolder = (folderName) => {
	try {
		if (!fs.existsSync(folderName)) {
			fs.mkdirSync(folderName);
		}
	} catch (err) {
		console.error(err);
	}
};
exports.save_file = (filePath, fileName, fileData) => {
	const fullFilePath = filePath + fileName;
	createFolder(filePath)
	fs.writeFile(fullFilePath, fileData, (err) => {
		if (err) {
			console.error('Error saving the file', err);
		} else {
			console.log(`The file ${fileName} was saved!`);
		}
	});
};
