// const settings = require("../settings.json");
const fs = require('fs-extra');
const pimApis = require("../api/api-pim360");
const reqprom = require('request-promise');
const json2csv = require("json2csv").parse;


const get = function (tag_number, function_name) {
    try {
        const settings = fs.readFileSync('D:/local/Temp/settings.json')
        // if (settings) {
            function authPim() {
                console.log("Authenticating ......")
                let pim = new pimApis(JSON.parse(fs.readFileSync('D:/local/Temp/settings.json')));
                return pim.getToken('pim');
            }

            function fetchAttributes(tagnumber, token) {
                console.log("Fetching Attributes ......");
                let url = JSON.parse(fs.readFileSync('D:/local/Temp/settings.json')).paths.pim + "api/objects/TAGGED_ITEM/id/" + tagnumber;
                let options = {
                    url: url,
                    headers: { Authorization: 'Bearer ' + token },
                    json: true
                };
                return reqprom.get(options)
            }
            return new Promise((resolve, reject) => {
                authPim().then((authResponse) => {
                    console.log("Authenticated!")
                    fetchAttributes(tag_number, authResponse.access_token)
                        .then((reposonse) => {
                            console.log("Fetched Attributes!")
                            try {
                                let arrkeys = Object.keys(reposonse.attrs);
                                let obj = {};
                                let arrModifiedData = [];
                                arrkeys.map((key) => {
                                    obj[reposonse.attrs[key].name] = reposonse.attrs[key].value;
                                    return '';
                                });
                                let fields = Object.keys(obj);
                                const csv = json2csv(obj, fields);
                                let finalll = function_name == "csvattributes" ? csv : obj;
                                resolve(finalll)
                            } catch (error) {
                                resolve("Something Went Wrong")
                            }
                        }).catch(() => {
                            resolve("Not Found / Something Went Wrong")
                        })
                });

            });
        // }
    } catch (error) {
        resolve(error)
    }
}


exports.get = get;
