var multipart = require("parse-multipart");
const fs = require('fs-extra');
const json2csv = require("json2csv").parse;
import LatLon from 'https://cdn.jsdelivr.net/npm/geodesy@2/latlon-spherical.min.js';

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
                    if (coordinatesLength > 0) {
                        const p1 = LatLon.parse('11.0168, 76.9558');
                        const p2 = LatLon.parse('11.3410, 77.7172');
                        arrObj.push({
                            ...newObj,
                            "Geometry.Start.Longitude": i.geometry != null ? i.geometry.coordinates[0][0] : "No Data",
                            "Geometry.Start.Latitude": i.geometry != null ? i.geometry.coordinates[0][1] : "No Data",             
                            "Geometry.End.Longitude": i.geometry != null ? i.geometry.coordinates[coordinatesLength-1][0] : "No Data",               
                            "Geometry.End.Latitude": i.geometry != null ? i.geometry.coordinates[coordinatesLength-1][1] : "No Data",
                            "sample": parseFloat(p1.distanceTo(p2).toPrecision(4))
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