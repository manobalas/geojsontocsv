const json2csv = require("json2csv").parse;
const fs = require('fs-extra');

const download = function (request, file_name) {
    try {
        return new Promise((resolve, reject) => {
            try {
                let fileData = JSON.parse(fs.readFileSync(`D:/local/Temp/${file_name}.json`))
                if (fileData.length > 0) {
                    let fields = Object.keys(fileData[0]);
                    const csv = json2csv(fileData, fields);
                    resolve(csv)
                }
            } catch (error) {
                resolve({ "msg": "Error Code: 1stc" })
            }
        })
    } catch (error) {
        resolve({ "msg": "Error Code: 2ndc" })
    }
}

exports.do = download;