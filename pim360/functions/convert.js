var multipart = require("parse-multipart");
const json2csv = require("json2csv").parse;

const convert = function (request) {
    return new Promise((resolve, reject) => {
        // encode body to base64 string
        var bodyBuffer = Buffer.from(request.body);
        // get boundary for multipart data e.g. ------WebKitFormBoundaryDtbT5UpPj83kllfw
        var boundary = multipart.getBoundary(request.headers['content-type']);
        // parse the body
        var parts = multipart.Parse(bodyBuffer, boundary);
        // var file = parts[0].data;

        let json = JSON.stringify(parts[0].data);
        let bufferOriginal = Buffer.from(JSON.parse(json).data);
        let finalJSONData = JSON.parse(bufferOriginal.toString());
        // fs.writeFileSync('D:/local/Temp/settings.json', JSON.stringify(parts[0].data))

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
    })
}

exports.do = convert;