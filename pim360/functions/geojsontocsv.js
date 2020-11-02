const multer = require('multer');
var upload = multer({ dest: 'uploads/' })

const upload = function (file, req) {
    return new Promise((resolve, reject) => {
        let temp = req.files
        resolve({"res": temp})
    })
}


exports.upload = upload;