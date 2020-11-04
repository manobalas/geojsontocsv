var multipart = require("parse-multipart");
const fs = require('fs-extra');

const convert = function (request) {
    try {
        return new Promise((resolve, reject) => {
            try {
                var bodyBuffer = Buffer.from(request.body);
                var boundary = multipart.getBoundary(request.headers['content-type']);
                var parts = multipart.Parse(bodyBuffer, boundary);
                let orgFileName = parts[0].filename;
                let json = JSON.stringify(parts[0].data);
                let bufferOriginal = Buffer.from(JSON.parse(json).data);
                let finalJSONData = JSON.parse(bufferOriginal.toString());
                let arrObj = [];
                finalJSONData.features.map((i) => {
                    let propertiesObj = { ...i.properties }
                    arrObj.push({
                        ...propertiesObj,
                        "Geometry_Latitude": i.geometry != null ? i.geometry.coordinates[0] : "No Data",
                        "Geometry_Longitude": i.geometry != null ? i.geometry.coordinates[1] : "No Data"
                    })
                })
                if (arrObj.length > 0) {
                    let fileName = new Date().getTime();
                    fs.writeFileSync(`D:/local/Temp/${orgFileName}.json`, JSON.stringify(arrObj))
                    resolve({ "download_link": `https://geajsontocsv.azurewebsites.net/api/pim360?function_name=download&file_name=${fileName}` })
                } else {
                    resolve({ "message": "No data / Something went wrong" })
                }
            } catch (error) {
                resolve({ "msg": error })
            }
        })
    } catch (error) {
        resolve({ "msg": error })
    }
}

exports.do = convert;