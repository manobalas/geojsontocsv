var multipart = require("parse-multipart");
const fs = require('fs-extra');
const json2csv = require("json2csv").parse;

function getMiles(i) {
    return i * 0.000621371192;
}

function distanceCalc(lat1, lon1, lat2, lon2) {
    // const R = 6371e3; // metres
    // const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    // const φ2 = lat2 * Math.PI / 180;
    // const Δφ = (lat2 - lat1) * Math.PI / 180;
    // const Δλ = (lon2 - lon1) * Math.PI / 180;
    // const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    //     Math.cos(φ1) * Math.cos(φ2) *
    //     Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // const d = R * c; // in metres
    // // return Math.round(d / 1000);
    // return d;
    function sqr(x) { return x * x; }
    function cosDeg(x) { return Math.cos(x * Math.PI / 180.0); }
    var earthCyclePerimeter = 40000000.0 * cosDeg((lat1 + lat2) / 2.0);
    var dx = (lon1 - lon2) * earthCyclePerimeter / 360.0;
    var dy = 37000000.0 * (lat1 - lat2) / 360.0;
    return Math.sqrt(sqr(dx) + sqr(dy));
}

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

                // todo // add logic to reject if the type is not linestring

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
                    let coordinatesLength = i.geometry.coordinates.length;
                    let cumulative_totalM = 0;
                    if (coordinatesLength > 0) {
                        i.geometry.coordinates.map((coordinate, index) => {
                            let totalM = 0
                            if (coordinatesLength === index + 1) {
                                // last one // ignore
                            } else {
                                // others
                                let dist = distanceCalc(
                                    parseFloat(i.geometry.coordinates[index][1]),
                                    parseFloat(i.geometry.coordinates[index][0]),
                                    parseFloat(i.geometry.coordinates[index + 1][1]),
                                    parseFloat(i.geometry.coordinates[index + 1][0])
                                );
                                totalM = totalM + dist;
                                cumulative_totalM = cumulative_totalM + dist;
                                arrObj.push({
                                    ...newObj,
                                    "Geometry.Start.Latitude": i.geometry != null ? i.geometry.coordinates[index][1] : "No Data",
                                    "Geometry.Start.Longitude": i.geometry != null ? i.geometry.coordinates[index][0] : "No Data",
                                    "Geometry.End.Latitude": i.geometry != null ? i.geometry.coordinates[index + 1][1] : "No Data",
                                    "Geometry.End.Longitude": i.geometry != null ? i.geometry.coordinates[index + 1][0] : "No Data",
                                    "Distance in Kilo Meters": totalM / 1000,
                                    "Cumulative Distance in Kilo Meters": cumulative_totalM / 1000,
                                    "Distance in Miles": getMiles(totalM),
                                    "Cumulative Distance in Miles": getMiles(cumulative_totalM),
                                })
                            }
                        })
                    } else {
                        arrObj.push({
                            ...newObj,
                            "Geometry.Start.Latitude": "No Data",
                            "Geometry.Start.Longitude": "No Data",
                            "Geometry.End.Latitude": "No Data",
                            "Geometry.End.Longitude": "No Data"
                        })
                    }
                })
                if (arrObj.length > 0) {
                    let fields = Object.keys(arrObj[0]);
                    const csv = json2csv(arrObj, fields);
                    resolve(csv)
                } else {
                    resolve({ "message": "No data / Something went wrong" })
                }
            } catch (error) {
                resolve({ "msg": JSON.stringify(error) })
            }
        })
    } catch (error) {
        resolve({ "msg": JSON.stringify(error) })
    }
}

exports.do = convert;