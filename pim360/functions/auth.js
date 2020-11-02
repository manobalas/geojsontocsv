const fs = require('fs-extra');

const add = function (username, password, prefix_url) {
    return new Promise((resolve, reject) => {
        let authJSON = {
            "credentials": {
                "username": username,
                "password": password
            },
            "paths": {
                "acl": `https://${prefix_url}.acl360.io/`,
                "pim": `https://${prefix_url}.pim360.io/`,
                "cls": `https://${prefix_url}.cls360.io/`,
                "ddm": `https://${prefix_url}.ddm360.io/`
            }
        }
        try {
            fs.writeFileSync('D:/local/Temp/settings.json', JSON.stringify(authJSON))
            // console.log("Credentials Added!")
            resolve({"response": "Credentials Added!"})
        } catch (err) {
            //resolve(err)
resolve({"response": err})
            // console.error(err)
        }
    });
}


exports.add = add;
