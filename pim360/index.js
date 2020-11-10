const convertfun = require('./functions/convert');
const download = require('./functions/download');
var multipart = require("parse-multipart");

module.exports = async function (context, req) {
    let response = {};
    const function_name = (req.query.function_name || "geojsontocsv");
    let file_name = (req.query.file_name || "");

    switch (function_name) {
        case "geojsontocsv":
            response = await convertfun.do(req)
            break;
        case "geojsontocsvflowversion":            
            var bodyBuffer = Buffer.from(request.body);
            var boundary = multipart.getBoundary(request.headers['content-type']);
            var parts = multipart.Parse(bodyBuffer, boundary);
            let orgFileName = parts[0].filename;
            file_name = (orgFileName || "");
            response = await convertfun.dojson(req)            
            break;
        case "geojsontocsvflowversionextendeddownload":
            response = await convertfun.dojsonanddownload(req)
            break;
        case "download":
            response = await download.do(req, file_name)
            break;

        default:
            break;
    }
    let csvHeader = {
        'Content-Type': 'text/csv',
        "Content-Disposition": `attachment; filename=${file_name + ".csv"}`,
        "cs-header-file-name": file_name+'.csv'
    }
    let jsonHeader = {
        'Content-Type': 'application/json',
    }
    context.res = {
        headers: function_name == "geojsontocsv" ? jsonHeader : csvHeader,
        body: response
    };
};