const fs = require('fs-extra');

const auth = require('./functions/auth');
const attributes = require('./functions/attributes');
const liveview = require('./functions/liveview');
const registerview = require('./functions/registerview');
const importfun = require('./functions/importfun');
const geojsontocsv = require('./functions/geojsontocsv');

module.exports = async function (context, req) {

    const username = (req.query.username);
    const password = (req.query.password);
    const purl = (req.query.purl);
    const tag_number = (req.query.tag_number);
    const live_view_name = (req.query.live_view_name);
    const objectType = (req.query.objectType);
    // some
    const EIC = (req.query.EIC) == undefined ? '' : (req.query.EIC);
    const register_view_name = (req.query.register_view_name);

    // example
    const filebody = (req.body && req.body.file);
    const some = (req.body && req.body.some);

    const function_name = (req.query.function_name || "attributes");

    let result = "";

    switch (function_name) {
        case "auth":
            result = await auth.add(username, password, purl)
            break;
        case "attributes":
            result = await attributes.get(tag_number, function_name)
            break;
        case "csvattributes":
            result = await attributes.get(tag_number, function_name)
            break;
        case "liveview":
            result = await liveview.get(live_view_name, objectType, EIC, "csv")
            break;
        case "registerview":
            result = await registerview.get(register_view_name, objectType, EIC, "csv")
            break;
        case "jsonliveview":
            result = await liveview.get(live_view_name, objectType, EIC, "json")
            break;
        case "jsonregisterview":
            result = await registerview.get(register_view_name, objectType, EIC, "json")
            break;
        case "import":
            result = await importfun.upload(filebody, req)
            break;
        case "geojsonTocsv":
            result = await geojsontocsv.upload(filebody, req)
            break;

        default:
            break;
    }

    let normalHeader = {
        'Content-Type': 'text/csv',
        "Content-Disposition": `attachment; filename=${function_name + new Date().getTime() + ".csv"}`
    }

    let jsonHeader = {
        'Content-Type': 'application/json',
    }

    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: function_name == "auth" || function_name == "import" || function_name == "attributes" || function_name == "jsonliveview" || function_name == "jsonregisterview" ? jsonHeader : normalHeader,
        body: result
    };
}
