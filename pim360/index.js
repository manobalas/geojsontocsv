const convertfun = require('./functions/convert');
const download = require('./functions/download');
const convertLineStringToCSV = require('./functions/convertLineStringToCSV');

module.exports = async function (context, req) {
    let response = {};
    const function_name = (req.query.function_name || "geojsontocsv");
    // naming file
    let file_name = function_name == 'geojsontocsvflowversionextendeddownload' ? (req.body.body.filename || "") : (req.query.file_name || "");

    switch (function_name) {
        case "geojsontocsv":
            response = await convertfun.do(req)
            break;
        case "geojsontocsvflowversion":
            response = await convertfun.dojson(req)
            break;
        case "geojsontocsvflowversionextendeddownload":
            response = await convertfun.dojsonanddownload(req)
            break;
        case "linestringgeojsontocsvflowversion":
            response = await convertLineStringToCSV.do(req)
            break;
        case "linestringgeojsontocsvflowversion_pyth_theo":
            response = await convertLineStringToCSV.dopyteo(req)
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
        "cs-header-file-name": file_name + '.csv'
    }
    let jsonHeader = {
        'Content-Type': 'application/json',
    }
    context.res = {
        headers: function_name == "geojsontocsv" ? jsonHeader : csvHeader,
        body: response
    };
};