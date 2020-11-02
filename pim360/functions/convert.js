var multipart = require("parse-multipart");
const json2csv = require("json2csv").parse;

const convert = function (request) {
    try {
        return new Promise((resolve, reject) => {
            try {
                var bodyBuffer = Buffer.from(request.body);
                var boundary = multipart.getBoundary(request.headers['content-type']);
                var parts = multipart.Parse(bodyBuffer, boundary);
                let json = JSON.stringify(parts[0].data);
                let bufferOriginal = Buffer.from(JSON.parse(json).data);
                let finalJSONData = JSON.parse(bufferOriginal.toString());
                let arrObj = [];
                finalJSONData.features.map((i) => {
                    arrObj.push({
                        "Properties.Station": i.properties.Station,
                        "Geometry.Latitude": i.geometry.coordinates[0],
                        "Geometry.Longitude": i.geometry.coordinates[1]
                    })
                })

                if (arrObj.length > 0) {
                    let fields = Object.keys(arrObj[0]);
                    const csv = json2csv(arrObj, fields);
                    resolve(csv)
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