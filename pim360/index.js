const convertfun = require('./functions/convert');

module.exports = function (context, req) {
    let response = await convertfun.do(req)
    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: response
    };
};