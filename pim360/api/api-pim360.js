/**
 * Copyright (c) 2017 Datum360 Limited.
 * 
 * @fileOverview SDK like interface to use Pim360 APIs
 * @name api-pim360.js
 * @author Alex Ayyubov
 */

"use strict";

const request = require('request');
// Module that makes request to be a promise
const reqprom = require('request-promise');
const url = require('url');
const fs = require('fs');

// Different paths for different parts
const _paths = {
	// Login endpoint that returns acl360 token
	oauth: "/oauth2/token",
	// Context fields
	contextFields: "/api/context/fields",
	// objects retrieval, like: EIC
	objects: "/api/objects",
	// Submit a query object
	queries: "/api/queries",
	// Results for a particular query
	queryResults: "/api/queryresults",
	// ETL Timeline
	etlTimeline: "/api/timeline",
	// ETL Queue path to submit activities
	etlQueue: "/api/etl_queue/activities",
	// Saved custom views
	customViews: "/api/customviews",
	// File endpoint
	file: "/api/file",
	// Creating tag - doc model dbID links
	tagDocDbId: "/api/forge/links",
	// Object number parser
	objParser: "/api/allocator/parse",
	// Object allocator caches
	objParserCaches: "/api/allocator/caches",
	// Object allocator existance check by regex
	objParserExistence: "/api/allocator/check/existence"

};

// TODO: add parameter validation checks

module.exports = class PIM360Api {
	/**
	 * Object Constructor
	 *
	 * @param {Object} settings - { credentials: { username: , password: }, aclPath: , pimPath: , clsPath : }
	 */
	constructor(settings) {
		if (!(settings.credentials && settings.credentials.username && settings.credentials.password))
			return new Error("Credentials can not be empty");
		if (!(url.parse(settings.paths.acl) && url.parse(settings.paths.pim) && url.parse(settings.paths.cls)))
			return new Error("aclPath, pimPath, clsPath should be proper urls");

		this.settings = settings;
		this.paths = settings.paths;
		// Token holders for different services
		this.tokens = { 'pim': null, 'cls': '' };
	}
	/**
	 * POST Request Builder
	 * 
	 * @param {String} url  - the path to post 
	 * @param {Object} data - the data to post
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	postRequest(url, data, service) {
		// console.log("inside postRequest ---------->")
		let options = {
			url: url,
			body: data,
			auth: { bearer: this.tokens[service] },
			json: true
		};
		// Return request promise
		return reqprom.post(options).catch(err => {
			if (err.statusCode == 503) {
				return new Promise((res, rej) => {
					setTimeout(() => {
						return res(this.postRequest(url, data, service))
					}, 3000)
				});
			} else { return Promise.reject(err); }
		});
	}

	/**
	 * GET Request Builder
	 * 
	 * @param {String} url     - the path to get 
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	getRequest(url, service) {
		// console.log("inside getRequest --------->")
		let options = {
			url: url,
			auth: { bearer: this.tokens[service] },
			json: true
		};
		// Return request promise
		return reqprom.get(options).catch(err => {
			// console.log("err ------->"+err)
			if (err.statusCode == 503) {
				return new Promise((res, rej) => {
					// console.log("res -------");
					// console.log(res)
					setTimeout(() => {
						return res(this.getRequest(url, service))
					}, 3000)
				});
			}
			else {
				
				return Promise.reject(err);
			}
		});
	}

	/**
	 * HEAD Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	headRequest(url, service) {
		let options = {
			url: url,
			auth: { bearer: this.tokens[service] }
		};
		// Return request promise
		return reqprom.head(options).catch(err => {
			if (err.statusCode == 503) {
				return new Promise((res, rej) => {
					setTimeout(() => {
						return res(this.headRequest(url, service))
					}, 3000)
				});
			} else { return Promise.reject(err); }
		});
	}

	/**
	 * Get JWT token to the service
	 *
	 * @param {String} type - which service token to get 'pim' or 'cls'
	 * @return {Promise} 
	 */
	getToken(service) {
		let urlStr = url.resolve(this.paths.acl, _paths['oauth']);
		let creds = this.settings.credentials;

		// Checking service type
		if (['pim', 'cls'].indexOf(service) < 0)
			return Promise.reject(new Error('Token type is not valid, can be either "pim" or "cls"'));

		let postOptions = {
			uri: urlStr,
			auth: { user: creds.username, pass: creds.password },
			body: {
				grant_type: "client_credentials",
				// State service that the token will be used for
				service_url: this.paths[service]
			},
			json: true
		};

		return new Promise((resolve, reject) => {
			reqprom.post(postOptions)
				.then((response) => {
					this.tokens[service] = response.access_token;
					return resolve(response);
				}).catch((err) => {
					if (err.statusCode == 503) {
						return new Promise((res, rej) => {
							setTimeout(() => {
								return res(this.getToken(service))
							}, 3000)
						});
					} else {
						return reject(err);
					}
				});
		});
	}

	/**
	 * Get Context fields by type
	 *
	 * @param {String} itemType - item type within ['TAGGED_ITEM', 'EQUIPMENT_ITEM', 'DOCUMENT', 'EQUIPMENT_MODEL']
	 * @return {Promise}
	 */
	getContextFields(itemType = "TAGGED_ITEM") {
		let urlStr = url.resolve(this.paths.pim, `${_paths['contextFields']}/${itemType}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get EIC by ID
	 *
	 * @param {Number} eicID - EIC number 1,2,3,..
	 * @return {Promise}
	 */
	getEicByID(eicID) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['objects']}/EIC/id/${eicID}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get EIC by Handle
	 *
	 * @param {String} eicHdl - handle of the EIC
	 * @return {Promise}
	 */
	getEicByHandle(eicHdl) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['objects']}/EIC/${eicHdl}`);
		console.log("urlStr ----------");
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get Object by type and ID
	 *
	 * @param {String} type - type of the object TAGGED_ITEM, DOCUMENT etc.
	 * @param {String} objectID - ID 
	 * @return {Promise}
	 */
	getObjectByTypeAndID(type, objectID) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['objects']}/${type}/id/${objectID}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get Object by type and handle
	 *
	 * @param {String} type - type of the object TAGGED_ITEM, DOCUMENT etc.
	 * @param {String} objectHdl - handle of the item 
	 * @return {Promise}
	 */
	getObjectByTypeAndHdl(type, objectHdl) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['objects']}/${type}/${objectHdl}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Query runner
	 * 
	 * @param  {Object} query - saved query object in server
	 * @return {Promise}
	 */
	_runQuery(query, limit = 200, skip = 0) {
		// console.log("_runQuery ---------> limit " + limit + " skip "+ skip);
		let timestamp = new Date().valueOf();
		// let urlStr = url.resolve( this.paths.pim, `/api/${query.resulturl}?limit=${limit}&skip=${skip}&_=${timestamp}`);
		let urlStr = url.resolve(this.paths.pim, `/api${query.resulturl}?limit=${limit}&skip=${skip}`);
		// console.log("urlStr ----------> "+urlStr)
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get items by type and EIC ID
	 *
	 * @param {Number} eicID    - EIC number 1,2,3,..
	 * @param {String} itemType - item type within ['TAGGED_ITEM', 'EQUIPMENT_ITEM', 'DOCUMENT', 'EQUIPMENT_MODEL']
	 * @return {Promise}
	 */
	getItemsByEIC(eicID, itemType) {
		let urlStr = url.resolve(this.paths.pim, _paths['queries']);
		let context = null;
		return new Promise((resolve, reject) => {
			Promise.all([this.getContextFields(itemType), this.getEicByID(eicID), this.getNormalAttributes(eicID, itemType)])
				// Based on context and eic objects, construct query structure
				.then((results) => {
					// Getting results per each promise
					context = results[0];
					let eic = results[1];
					let normAttrs = results[2];

					// Adding parameters to the query
					return {
						"type": itemType,
						"eic": eic.hdl,
						"filter": { "logical": "", "items": [] },
						"fields": normAttrs
					}
					// Run submit query structure to get saved view
				}).then((queryStruct) => {
					// Submitting query, the return result is the saved view
					this.postRequest(urlStr, queryStruct, 'pim')
						.then((savedView) => {
							return this._runQuery(savedView)
						}).then((results) => {
							// Adding context fields so that we can resolve attribute handles afterwards
							results.context = context;
							resolve(results);
						}).catch(reject);
				}).catch(reject);
		});
	}

	/**
	 * Submit query to fetch results
	 *
	 * @param  {[type]} queryStruct - query in a form of object: 
	 *                              	{
	 *                              		type: object type
	 *                              		eic:  eic handle
	 *                              		fields: [ attribute handle(s) ]
	 *                              		filters: {
	 *                              			logical: AND or OR
	 *                              			items: [ {condition}s ]
	 *                              		}
	 *                              	}
	 * @param  {Number} limit       - number of rows to fetch
	 * @return {Promise}
	 */
	submitQuery(queryStruct, limit = 200, skip = 0) {
		let urlStr = url.resolve(this.paths.pim, _paths['queries']);
		return this.postRequest(urlStr, queryStruct, 'pim')
			.then((savedView) => {
				return this._runQuery(savedView, limit, skip);
			})
	}

	/**
	 * Get list of normal attributes for
	 *
	 * @param {Number} eicID    - EIC number 1,2,3,..
	 * @param {String} itemType - item type within ['TAGGED_ITEM', 'EQUIPMENT_ITEM', 'DOCUMENT', 'EQUIPMENT_MODEL']
	 * @return {Promise}
	 */
	getNormalAttributes(eicID, itemType) {
		return this.getEicByID(eicID)
			.then((result) => {
				let urlStr = url.resolve(this.paths.pim, `/api/normalattributes?objectType=${itemType}&eicHdl=${result.hdl}`);
				return this.getRequest(urlStr, 'pim')
			})
	}

	/**
	 * Get custom views
	 *
	 * @param {String} type   (optional) - type of the custom views, a value within ['LIVE_VIEW', 'PIVOT_STRUCTURE', 'DASHBOARD']
	 * @param {String} handle (optional) - handle of a particular custom view
	 * @return {Promise} 
	 */
	getCustomViews(type = '', handle = '') {
		// console.log("inside getCustomViews ---------->")
		//original url
		// let urlStr = url.resolve( this.paths.pim, `${_paths['customViews']}${(handle ? '/'+handle : '')}?type=${type}` );
		let urlStr = url.resolve(this.paths.pim, `${_paths['customViews']}${(handle ? '/' + handle : '')}${(type ? '?type=' + type : '')}`);
		// console.log("urlStr ---------")
		// console.log(urlStr)
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get activities
	 * 
	 * @param  {String} categories (optional) - categories of activities joined within ['REPORT', 'EXPORT', 'IMPORT', 'DELTA_REPORT', 'CLS_SNAPSHOT_IMPORT'] or 'ALL'
	 * @param  {String} handle     (optional) - handle of the particular activity
	 * @param  {String} eicHandle  (optional) - EIC handle to filter the activities
	 * @return {Promise}
	 */
	getActivities(categories = 'ALL', handle = '', eicHandle = '') {
		let urlStr = url.resolve(this.paths.pim, `${_paths['etlTimeline']}?categories=${categories}&hdl=${handle}&eic=${eicHandle}`);
		return this.getRequest(urlStr, 'pim')
	}

	parseObjectNumbers(objects, facNo, ensName) {
		let urlStr = url.resolve(this.paths.pim, _paths['objParser']);

		let dataToSend = {
			facility: facNo,
			ensName: ensName,
			objType: 'TAGGED_ITEM',
			taglist: objects
		}
		return this.postRequest(urlStr, dataToSend, 'pim');
	}

	/**
	 * Get tag number formats from object allocator for the given ENS
	 * 
	 * @param  {String} ens - ENS name
	 * @return {Promise}}
	 */
	getAllocatorCaches(ens) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['objParserCaches']}?ens=${ens}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Get tag matches by the given regex list
	 * 
	 * @param  {Array} tagRegList - ENS name
	 * @return {Promise}}
	 */
	checkExistence(tagRegList) {
		let urlStr = url.resolve(this.paths.pim, _paths['objParserExistence']);

		let dataToSend = {
			taglist: tagRegList
		}
		return this.postRequest(urlStr, dataToSend, 'pim');
	}

	/**
	 * Post tag - document model dbIds links
	 *
	 * @param {String} docNumber     - Document number to assign dbIds to
	 * @param {String} docType       - '2d' or '3d'
	 * @param {Array}  dbIdTagNoList - Array containing dbId and tag number i.e. [ [dbId, tagNo], ... ]
	 * @return {Promise}
	 */
	postTagDocObjectIdLinks(docNumber, docType, dbIdTagNoList) {
		let urlStr = url.resolve(this.paths.pim, _paths['tagDocDbId']);

		let tagDbLinksStr = dbIdTagNoList.map((dbIdTagLink) => { return dbIdTagLink.join("\t"); }).join("\n");

		let dataToSend = {
			type: docType,
			docNo: docNumber,
			content: tagDbLinksStr
		}
		return this.postRequest(urlStr, dataToSend, 'pim');
	}

	/**
	 * Geat activity parameters
	 * 
	 * @param  {String} handle - handle of the particular activity
	 * @return {Promise}
	 */
	getActivityParams(handle) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['etlQueue']}/${handle}`);
		return this.getRequest(urlStr, 'pim')
	}

	/**
	 * Create an activity to be run on PIM360
	 *
	 * @param  {String} handle         - handle of the activity which was used to get params
	 * @param  {Object} activityParams - an object containing activity properties
	 * @return {Promise}
	 */
	postActivity(handle, activityParams) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['etlQueue']}/${handle}`);
		return this.postRequest(urlStr, activityParams, 'pim')
	}

	getFileName(handle) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['file']}/${handle}`);
		return this.headRequest(urlStr, 'pim')
	}

	/**
	 * Get file from PIM360
	 * 
	 * @param  {String} handle - handle of the file
	 * @return {Stream} 
	 */
	getFile(handle) {
		let urlStr = url.resolve(this.paths.pim, `${_paths['file']}/${handle}`);
		let options = {
			url: urlStr,
			encoding: null,
			auth: { bearer: this.tokens['pim'] }
		};
		return request.get(options)
	}

	/**
	 * Upload file using path string
	 * 
	 * @param  {String} path - path of the local file
	 * @return {Promise}
	 */
	uploadFile(path) {
		return this.uploadFileStream(fs.createReadStream(path))
	}

	/**
	 * Upload file using stream
	 * 
	 * @param  {Stream} stream - readable stream
	 * @return {Promise}
	 */
	uploadFileStream(stream) {
		let options = {
			url: url.resolve(this.paths.pim, _paths['file']),
			auth: { bearer: this.tokens['pim'] },
			formData: {
				front: stream
			},
			json: true
		}
		return reqprom.post(options);
	}
}

