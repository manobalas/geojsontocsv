
const upload = function (file, some) {
    return new Promise((resolve, reject) => {
        let temp = some.rawBody
        resolve({file, temp})
    })
}


exports.upload = upload;