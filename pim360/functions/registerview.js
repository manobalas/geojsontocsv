
const fs = require('fs-extra');
const pimApis = require("../api/api-pim360");
const reqprom = require('request-promise');
const json2csv = require("json2csv").parse;


const get = function (register_view_name, objectType, EIC) {

    let pim = null;
    let eic_hdl = "";
    function authPim() {
        console.log("Authenticating ......")
        pim = new pimApis(JSON.parse(fs.readFileSync('D:/local/Temp/settings.json')));
        return pim.getToken('pim');
    }

    let arrData = [];
    function getFinalResult(queryResult, pageSize = 200, page = 0) {
        return pim._runQuery(queryResult, pageSize, page)
            .then((result) => {
                // Return when we have a status
                arrData.push(...result.data);
                console.log("Fetched " + arrData.length + " ......")
                if (result.hasmore) {
                    return getFinalResult(queryResult, pageSize, (arrData.length / pageSize) * 200)
                } else {
                    return Promise.resolve(arrData);
                }
            })
    }

    return new Promise((resolve, reject) => {
        try {
            let nameToFilter = register_view_name;            
            // authPim().then((authResponse) => {
            //     console.log("Authenticated!")
            //     return pim.getCustomViews("REGISTER", "");
            // })
            authPim().then((authResponse) => {
                console.log("Authenticated!");
                return pim.getEicByID(EIC);
            }).then((eic) => {
                eic_hdl = eic.hdl;                
                return pim.getCustomViews("REGISTER", "");
            }).then((arrLiveView) => {
                console.log("Working on it ......")
                let filterdData = arrLiveView.filter((e) => e.Name == nameToFilter);
                if (filterdData.length > 0) {
                    return pim.getCustomViews("", filterdData[0].Hdl)
                }
                else {
                    console.log("Could not found any data......");
                    console.log("Process finished !!!");
                    return process.exit();
                }
            }).then((result) => {
                console.log("Fetching Live View ......")
                let createQueryBody = {
                    "type": objectType,
                    "eic": eic_hdl.length > 0 ? eic_hdl : "",
                    "filter": result.Data.conditions,
                    "fields": result.Data.fields
                }
//                 resolve(createQueryBody)
                return pim.postRequest(JSON.parse(fs.readFileSync('D:/local/Temp/settings.json')).paths.pim + "api/queries", createQueryBody, 'pim')
            }).then((response) => {
                console.log("Fetching ......")
                return getFinalResult(response, 200, 0);
            }).then((finalResult) => {
                console.log("Finalizing ......")
                let arrFirstObjKeys = Object.keys(finalResult[0]).filter(e => typeof finalResult[0][e] == 'object')
                let arrModifiedData = [];
                finalResult.map((item) => {
                    let obj = {};
                    arrFirstObjKeys.map((key) => {
                        obj[item[key].name] = item[key].value;
                    });
                    arrModifiedData.push(obj);
                });
                let fields = Object.keys(arrModifiedData[0]);
                const csv = json2csv(arrModifiedData, fields);
                let finalll = type == "json" ? arrModifiedData : csv
                resolve(finalll)
            }).catch(err => {
                resolve(err)
            })
        } catch (error) {
            resolve(error)
        }
    })
}


exports.get = get;
