const convertfun = require('./functions/convert');
const download = require('./functions/download');

module.exports = async function (context, req) {
    let response = {};
    const function_name = (req.query.function_name || "geojsontocsv");
    const file_name = (req.query.file_name || "");
    switch (function_name) {
        case "geojsontocsv":
            response = await convertfun.do(req)
            break;
        case "geojsontocsv_file":
            response = await convertfun.dofile(req)
            break;
        case "download":
            response = await download.do(req, file_name)
            break;

        default:
            break;
    }
    let csvHeader = {
        'Content-Type': 'text/csv',
        "Content-Disposition": `attachment; filename=${file_name + ".csv"}`
    }
    let jsonHeader = {
        'Content-Type': 'application/json',
    }
    context.res = {
        headers: function_name == "geojsontocsv" || function_name == "download" ? jsonHeader : csvHeader,
        body: response
    };
};