const convertfun = require('./functions/convert');

module.exports = async function (context, req) {
    let response = await convertfun.do(req)
    context.res = {
        headers: {
            'Content-Type': 'text/csv',
            "Content-Disposition": `attachment; filename=${"geojsontocsv-" + new Date().getTime() + ".csv"}`
        },
        body: response
    };
};