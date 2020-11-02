/**
 * Copyright (c) 2018 Datum360 Limited.
 * 
 * @fileOverview SDK like interface to use Pim360 APIs
 * @name api-ddm360.js
 * @author Alex Ayyubov
 */

"use strict";

const request = require('request');
// Module that makes request to be a promise
const reqprom = require('request-promise');
const url     = require('url');
const fs      = require('fs');

// Different paths for different parts
const _paths  = {
	// Login endpoint that returns acl360 token
	oauth   : "/oauth2/token",
	// Deliverables
	deliverables: 'api/deliverables',
	// Documents
	documents: 'api/documents'
};

// TODO: add parameter validation checks

module.exports = class DDM360Api {
	/**
	 * Object Constructor
	 *
	 * @param {Object} settings - { credentials: { username: , password: }, aclPath: , pimPath: , clsPath : }
	 */
	constructor ( settings ) {
		if(!(settings.credentials && settings.credentials.username && settings.credentials.password))
			return new Error( "Credentials can not be empty" );
		if(!(url.parse( settings.paths.acl ) && url.parse( settings.paths.pim) && url.parse( settings.paths.cls ) && url.parse( settings.paths.ddm )))
			return new Error( "aclPath, pimPath, clsPath, ddmPath should be proper urls" );

		this.settings = settings;
		this.paths = settings.paths;
		// Token holders for different services
		this.tokens = { 'ddm': null };
	}
	/**
	 * POST Request Builder
	 * 
	 * @param {String} url  - the path to post 
	 * @param {Object} data - the data to post
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	postRequest ( url, data, service ) {
		let options = {
			url: url,
			body: data,
			auth: { bearer: this.tokens[service] },
			json: true
		};
		// Return request promise
		return reqprom.post( options )
	}

	/**
	 * GET Request Builder
	 * 
	 * @param {String} url     - the path to get 
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	getRequest ( url, service ) {
		let options = {
			url: url,
			auth: { bearer: this.tokens[service] },
			json: true
		};
		// Return request promise
		return reqprom.get( options )
	}

	/**
	 * HEAD Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	headRequest ( url, service ) {
		let options = {
			url: url,
			auth: { bearer: this.tokens[service] }
		};
		// Return request promise
		return reqprom.head( options )
	}
	/**
	 * PATCH Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @param {String} service - the service to which to connect to 
	 * @return {Promise}
	 */
	patchRequest ( url, service ) {
		let options = {
			url: url,
			auth: { bearer: this.tokens[service] }
		};
		// Return request promise
		return reqprom.patch( options )
	}

	/**
	 * Get JWT token to the service
	 *
	 * @param {String} type - which service token to get 'ddm' or 'cls'
	 * @return {Promise} 
	 */
	getToken ( service ) {
		let urlStr   = url.resolve( this.paths.acl, _paths['oauth'] );
		let creds = this.settings.credentials;

		// Checking service type
		if( service != 'ddm')
			return Promise.reject( new Error('Token type is not valid') );

		let postOptions = {
				uri : urlStr,
				auth: { user: creds.username, pass: creds.password },
				body: { 
					grant_type: "client_credentials",
					// State service that the token will be used for
					service_url: this.paths[service]
				},
				json: true
			};

		let self = this;

		return new Promise((resolve, reject) => {
			reqprom.post(postOptions)
				.then( (response) => {
					self.tokens[service] = response.access_token;
					return resolve(response);
				}).catch(reject);
		});
	}

	/**
	 * Get Deliverable by handle
	 *
	 * @param {String} delHandle - handle of the deliverable
	 * @return {Promise}
	 */
	getOneDeliverable ( delHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}` );
		return this.getRequest( urlStr, 'ddm' )
	}

	/**
	 * Get Deliverables
	 *
	 * @param {Number|String} eicNumber - EIC Number (optional)
	 * @return {Promise}
	 */
	getDeliverables ( eicNumber, pageSize = 200, page = 0 ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/delivered?eicNumber=${(eicNumber || -1)}&pageSize=${pageSize}&page=${page}` );
		return this.getRequest( urlStr, 'ddm' )
	}

	/**
	 * Get Document by handle
	 *
	 * @param {String} docHandle - handle of the document
	 * @return {Promise}
	 */
	getOneDocument( docHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['documents']}/${docHandle}` );
		return this.getRequest( urlStr, 'ddm' )
	}

	/**
	 * Get Documents
	 *
	 * @return {Promise}
	 */
	getDocuments ( pageSize = 200, page = 0 ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['documents']}?pageSize=${pageSize}&page=${page}` );
		return this.getRequest( urlStr, 'ddm' )
	}

	/**
	 * Create deliverable
	 *
	 * @param {Number} eicNo             - EIC number 1,2,3,..
	 * @param {String} docNo             - document number 
	 * @param {String} revisionId        - revision label for the deliverable
	 * @param {String} responsiblePerson - the person who is responsible to deliver document
	 * @param {String} dueDate           - due date or the deliverable, defined as 'YYYY-MM-DD' 
	 * 
	 * @return {Promise}
	 */
	createDeliverable ( eicNo, docNo, revisionId, responsiblePerson, facId, dueDate ) {
		let dataToSend = {
			eicNumber: eicNo,
			pimDocId: docNo,
			revisionName: revisionId,
			personResponsible: responsiblePerson,
			facId: facId,
			// dates are dates with no time, string in format YYYY-MM-DD
			dueDate: dueDate
		};

		let urlStr = url.resolve( this.paths.ddm, _paths['deliverables'] );
		return this.postRequest( urlStr, dataToSend, 'ddm' );
	}

	/**
	 * Get revisions list for deliverable
	 * 
	 * @param  {String} delHandle - deliverable handle
	 * 
	 * @return {Promise}
	 */
	getDeliverableRevisions (delHandle) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}/revision` );
		return this.getRequest( urlStr, 'ddm' )
	}

	/**
	 * Download a file from DDM360
	 * 
	 * @param {String} delHandle - handle of the deliverable
	 * @param {string} fileHandle - handle of the file to download
	 * 
	 * @return {Stream} 
	 */
	getDeliverableFile ( delHandle, fileHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}/files/${fileHandle}/content` );
		let options = {
				url  : urlStr,
				encoding: null,
				auth : { bearer: this.tokens['ddm'] }
			};
		return request.get( options )
	}

	/**
	 * Download a file from DDM360
	 * 
	 * @param {String} delHandle - handle of the deliverable
	 * @param {String} revHandle - handle of the deliverable
	 * @param {String} versionHandle - handle of the deliverable
	 * @param {string} fileHandle - handle of the file to download
	 * 
	 * @return {Stream} 
	 */
	getDocumentFile ( docHandle, revHandle, versionHandle, fileHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['documents']}/${docHandle}/revisions/${revHandle}/versions/${versionHandle}/files/${fileHandle}/content` );
		let options = {
				url  : urlStr,
				encoding: null,
				auth : { bearer: this.tokens['ddm'] }
			};
		return request.get( options )
	}

	/**
	 * Upload file using path string
	 *
	 * @param  {String} delHandle - deliverable handle
	 * @param  {String} filePath      - path of the local file
	 * 
	 * @return {Promise}
	 */
	uploadDeliverableFile ( delHandle, filePath ) {
		return this.uploadDeliverableFileStream( delHandle, fs.createReadStream( filePath ) )
	}

	/**
	 * Upload file using stream
	 *
	 * @param {String} delHandle - deliverable handle
	 * @param {Stream} stream - readable stream
	 * 
	 * @return {Promise}
	 */
	uploadDeliverableFileStream ( delHandle, stream ) {
		let options = {
				url  : url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}/files` ),
				auth : { bearer: this.tokens['ddm'] },
				formData: {
					front: stream
				},
				json: true
			}

		return reqprom.post( options );
	}
	/**
	 * Upload the given file to Forge and submit translation
	 * 
	 * @param  {String} delHandle  - deliverable handle
	 * @param  {String} fileHandle - handle of the file to upload to forge
	 *
	 * @return {Promise}
	 */
	uploadToForge ( delHandle, fileHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}/files/${fileHandle}/forgeupload` );
		return this.patchRequest( urlStr, 'ddm' );
	}

	/**
	 * Get the status of the Forge submit and translation
	 * 
	 * @param  {String} delHandle  - deliverable handle
	 * @param  {String} fileHandle - handle of the file to upload to forge
	 *
	 * @return {Promise}
	 */
	getForgeStatus ( delHandle, fileHandle ) {
		let urlStr = url.resolve( this.paths.ddm, `${_paths['deliverables']}/${delHandle}/files/${fileHandle}/forgeupload` );
		return this.getRequest( urlStr, 'ddm' );
	}

	// Submit aliases
	submitAliases (params, data) {
		var urlStr = url.resolve( this.paths.ddm, `${_paths["documents"]}/${params.docHdl}/revisions/${params.revHdl}/versions/${params.verHdl}/files/${params.fileHdl}/aliases`);
		return this.postRequest( urlStr, data, 'ddm' );
	}

	/**
	 * Get tags for the document file
	 * @param  {Object} params
	 * @param  {String} params.docHdl  - document handle
	 * @param  {String} params.revHdl  - revision handle
	 * @param  {String} params.verHdl  - version handle
	 * @param  {String} params.fileHdl  - file handle
	 * @param  {Number} limit - row count to return
	 * @param  {Number} offset  - skip row count
	 * 
	 * @return {Promise}
	 */
	getTagsOnDocumentFile (params, limit = 200, offset = 0) {
		var urlStr = url.resolve( this.paths.ddm, `${_paths["documents"]}/${params.docHdl}/revisions/${params.revHdl}/versions/${params.verHdl}/files/${params.fileHdl}/tags`);
		urlStr += "?limit="+limit+"&offset="+offset;
		return this.getRequest( urlStr, 'ddm' );
	}

	/**
	 * Validate tags for document file with pim
	 * @param  {Object} params
	 * @param  {String} params.docHdl  - document handle
	 * @param  {String} params.revHdl  - revision handle
	 * @param  {String} params.verHdl  - version handle
	 * @param  {String} params.fileHdl  - file handle
	 * @param  {[String]} data - list of tag handles
	*/
	validateTags (params, data) {
		var urlStr = url.resolve( this.paths.ddm, `${_paths["documents"]}/${params.docHdl}/revisions/${params.revHdl}/versions/${params.verHdl}/files/${params.fileHdl}/tags/validate`);
		return this.postRequest( urlStr, data, 'ddm' );
	}
}

