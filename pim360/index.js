var multipart = require("parse-multipart");
const fs = require('fs-extra');


module.exports = function (context, request) {  
    context.log('JavaScript HTTP trigger function processed a request.'); 
    // encode body to base64 string
    var bodyBuffer = Buffer.from(request.body);
    // get boundary for multipart data e.g. ------WebKitFormBoundaryDtbT5UpPj83kllfw
    var boundary = multipart.getBoundary(request.headers['content-type']);
    // parse the body
    var parts = multipart.Parse(bodyBuffer, boundary);
    // var file = parts[0].data;

    let json = JSON.stringify(parts[0].data);
    let bufferOriginal = Buffer.from(JSON.parse(json).data);
    let finalJSONData = bufferOriginal.toString();
    // fs.writeFileSync('D:/local/Temp/settings.json', JSON.stringify(parts[0].data))

    context.res = { body : { name : parts[0].filename, type: parts[0].type, data: finalJSONData}}; 
    context.done();  
};