var multipart = require("parse-multipart");
const fs = require('fs-extra');
const json2csv = require("json2csv").parse;

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
                    let newKey = []
                    Object.keys(propertiesObj).map(
                        (i) => newKey.push(`Properties.${i}`)
                    )
                    let newObj = {};
                    Object.keys(propertiesObj).map(
                        (i, index) => {
                            newObj[newKey[index]] = propertiesObj[i]
                        }
                    )
                    arrObj.push({
                        ...newObj,
                        "Geometry.Latitude": i.geometry != null ? i.geometry.coordinates[0] : "No Data",
                        "Geometry.Longitude": i.geometry != null ? i.geometry.coordinates[1] : "No Data"
                    })
                })
                if (arrObj.length > 0) {
                    let fileName = new Date().getTime();
                    fs.writeFileSync(`D:/local/Temp/${orgFileName}.json`, JSON.stringify(arrObj))
                    resolve({ "download_link": `https://geajsontocsv.azurewebsites.net/api/pim360?function_name=download&file_name=${orgFileName}` })
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

const convertjson = function (request) {
    try {
        return new Promise((resolve, reject) => {
            try {
                let orgFileName = request.body.body.filename;
                let finalJSONData = JSON.parse(request.body.body.content);
                let arrObj = [];
                finalJSONData.features.map((i) => {
                    let propertiesObj = { ...i.properties }
                    let newKey = []
                    Object.keys(propertiesObj).map(
                        (i) => newKey.push(`Properties.${i}`)
                    )
                    let newObj = {};
                    Object.keys(propertiesObj).map(
                        (i, index) => {
                            newObj[newKey[index]] = propertiesObj[i]
                        }
                    )
                    arrObj.push({
                        ...newObj,
                        "Geometry.Latitude": i.geometry != null ? i.geometry.coordinates[0] : "No Data",
                        "Geometry.Longitude": i.geometry != null ? i.geometry.coordinates[1] : "No Data"
                    })
                })
                if (arrObj.length > 0) {
                    let fileName = new Date().getTime();
                    fs.writeFileSync(`D:/local/Temp/${orgFileName}.json`, JSON.stringify(arrObj))
                    resolve({ "download_link": `https://geajsontocsv.azurewebsites.net/api/pim360?function_name=download&file_name=${orgFileName}` })
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

const convertjsonanddownload = function (request) {
    try {
        return new Promise((resolve, reject) => {
            try {
                let orgFileName = request.body.body.filename;
                let finalJSONData = JSON.parse(request.body.body.content);
                let arrObj = [];
                finalJSONData.features.map((i) => {
                    let propertiesObj = { ...i.properties }
                    let newKey = []
                    Object.keys(propertiesObj).map(
                        (i) => newKey.push(`Properties.${i}`)
                    )
                    let newObj = {};
                    Object.keys(propertiesObj).map(
                        (i, index) => {
                            newObj[newKey[index]] = propertiesObj[i]
                        }
                    )
                    arrObj.push({
                        ...newObj,
                        "Geometry.Latitude": i.geometry != null ? i.geometry.coordinates[0] : "No Data",
                        "Geometry.Longitude": i.geometry != null ? i.geometry.coordinates[1] : "No Data"
                    })
                })
                if (arrObj.length > 0) {
                    let fields = Object.keys(fileData[0]);
                    const csv = json2csv(fileData, fields);
                    resolve(csv)
                    // let fileName = new Date().getTime();
                    // fs.writeFileSync(`D:/local/Temp/${orgFileName}.json`, JSON.stringify(arrObj))
                    // resolve({ "download_link": `https://geajsontocsv.azurewebsites.net/api/pim360?function_name=download&file_name=${orgFileName}` })
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
exports.dojson = convertjson;
exports.dojsonanddownload = convertjsonanddownload;