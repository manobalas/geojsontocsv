/**
 * Copyright (c) 2018 Datum360 Limited.
 * 
 * @fileOverview SDK like interface to use Pim360 APIs
 * @name api-cls360.js
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
	// Domains
	domains: 'api/domains',
	// Classes
	classes: 'api/domains/#domHandle#/classes',
	// Templates
	templates: 'api/domains/#domHandle#/templates'
};

// TODO: add parameter validation checks

module.exports = class CLS360Api {
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
		this.tokens = { 'cls': null };
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
	 * Get JWT token to the service
	 *
	 * @param {String} type - which service token to get 'ddm' or 'cls'
	 * @return {Promise} 
	 */
	getToken ( service ) {
		let urlStr   = url.resolve( this.paths.acl, _paths['oauth'] );
		let creds = this.settings.credentials;

		// Checking service type
		if( service != 'cls')
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
	 * Get Domains
	 * @param  {String} domHandle - Optional domain handle to retrieve only one domain
	 * @return {Promise}
	 */
	getDomains( domHandle ) {
		let urlStr = url.resolve( this.paths.cls, `${_paths['domains']}${(domHandle ? "/"+domHandle : "")}` );
		return this.getRequest( urlStr, 'cls' )
	}

	/**
	 * Get classes
	 * 
	 * @param  {String} domHandle - Handle of the domain to look for the classes
	 * @param  {[type]} filter    - Supports operators “eq” (equal) and “cnt” (contains), combine conditions with "and". Fields and values that contain spaces need wrapping with [square braces]
	 * @param  {Number} pageSize  - Page size, defaults to 200
	 * @param  {Number} page      - Page to return, default is 0
	 * @return {Promise}
	 */
	getClasses ( domHandle, filter = null, pageSize = 200, page = 0 ) {
		let urlStr = url.resolve( this.paths.cls, `${_paths['classes'].replace("#domHandle#", domHandle)}?filter=${(filter || "")}&pageSize=${pageSize}&page=${page}` );
		return this.getRequest( urlStr, 'cls' )
	}

	/**
	 * Get templates
	 * 
	 * @param  {String} domHandle - Handle of the domain to look for the classes
	 * @param  {[type]} filter    - Supports operators “eq” (equal) and “cnt” (contains), combine conditions with "and". Fields and values that contain spaces need wrapping with [square braces]
	 * @param  {Number} pageSize  - Page size, defaults to 200
	 * @param  {Number} page      - Page to return, default is 0
	 * @return {Promise}
	 */
	getTemplates ( domHandle, filter = null, pageSize = 200, page = 0 ) {
		let urlStr = url.resolve( this.paths.cls, `${_paths['templates'].replace("#domHandle#", domHandle)}?filter=${(filter || "")}&pageSize=${pageSize}&page=${page}` );
		return this.getRequest( urlStr, 'cls' )
	}

	/**
	 * Get one class
	 * 
	 * @param  {String} domHandle - Handle of the domain to look for the classes
	 * @param  {[type]} filter    - Supports operators “eq” (equal) and “cnt” (contains), combine conditions with "and". Fields and values that contain spaces need wrapping with [square braces]
	 * @param  {Number} pageSize  - Page size, defaults to 200
	 * @param  {Number} page      - Page to return, default is 0
	 * @return {Promise}
	 */
	getOneClass ( domHandle, clsHandle ) {
		let urlStr = url.resolve( this.paths.cls, `${_paths['classes'].replace("#domHandle#", domHandle)}/${clsHandle}` );
		return this.getRequest( urlStr, 'cls' )
	}


}

