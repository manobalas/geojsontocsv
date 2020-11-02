// const createHandler = require("azure-function-express").createHandler;
// const express = require("express");
// const multer = require('multer');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'D:/local/Temp/');
//     },
//     filename: (req, file, cb) => {
//         console.log(file);
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype == 'application/json') {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// }
// const upload = multer({ storage: storage, fileFilter: fileFilter });

// // Create express app as usual
// const app = express();

// // app.post("/api/upload", (req, res) => {


// //     // reponse
// //     res.json({
// //         foo: req.params.foo,
// //         bar: req.params.bar
// //     });
// // });

// app.post('/api/upload', upload.single('file'), (req, res, next) => {
//     try {
//         res.json({
//             "message": "file got it"
//         });
//     } catch (error) {
//         res.json({
//             "message": "error"
//         });
//     }
// });

// // Binds the express app to an Azure Function handler
// module.exports = createHandler(app);

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
    var file = parts[0].data;

    // fs.writeFileSync('D:/local/Temp/settings.json', JSON.stringify(parts[0].data))

    context.res = { body : { name : parts[0].filename, type: parts[0].type, data: JSON.stringify(parts[0].data)}}; 
    context.done();  
};