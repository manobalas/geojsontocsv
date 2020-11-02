const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'application/json') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Create express app as usual
const app = express();

// app.post("/api/upload", (req, res) => {


//     // reponse
//     res.json({
//         foo: req.params.foo,
//         bar: req.params.bar
//     });
// });

app.post('/api/upload', upload.single('file'), (req, res, next) => {
    try {
        res.json({
            "message": "file got it"
        });
    } catch (error) {
        res.json({
            "message": "error"
        });
    }
});

// Binds the express app to an Azure Function handler
module.exports = createHandler(app);