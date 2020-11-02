/**
 * Copyright (c) 2018 Datum360 Limited.
 * 
 * @fileOverview SDK like interface to use for SafeEx APIs
 * @name api-safeex.js
 * @author Alex Ayyubov
 */

"use strict";

// Module that makes request to be a promise
const reqprom = require('request-promise');
const https   = require('https');
const url     = require('url');
const fs      = require('fs');

// Different paths for different parts
const _paths  = {
	// Endpoint to get assets/facilities
	assets       : "rest/asset",
	// Endpoint to get the equipments
	equipments   : "rest/equipment",
	// Endpoint to get the attributes
	attributes   : "rest/attributes",
	// Endpoint to get/create equipment - attribute pairs
	attr_values  : "rest/equipment_attribute_value"
};

// TODO: add parameter validation checks
// 
// reqprom.debug = true

module.exports = class SafeExApi {
	/**
	 * Object Constructor
	 *
	 * @param {Object} settings - { credentials: { username: , password: }, aclPath: , pimPath: , clsPath : }
	 */
	constructor ( settings ) {
		if(!(settings.credentials && settings.credentials.username && settings.credentials.password))
			return new Error( "Credentials can not be empty" );
		if(!url.parse( settings.paths.safeex ))
			return new Error( "SafeEx should have aproper urls" );

		this.settings = settings;
		this.paths = settings.paths;

		this.agent = new https.Agent({rejectUnauthorized: false, port: 443, host: settings.paths.ips[0]})

	}

	_swapIPs () {
		let ip;
		const ipIndex = this.settings.paths.ips.indexOf(this.agent.options.host);
		if(ipIndex + 1 ==  this.settings.paths.ips.length) {
			ip = this.settings.paths.ips[0];
		} else {
			ip = this.settings.paths.ips[ipIndex+1];
		}
		this.agent = new https.Agent({rejectUnauthorized: false, port: 443, host: ip})
	}
	/**
	 * POST Request Builder
	 * 
	 * @param {String} url  - the path to post 
	 * @param {Object} data - the data to post
	 * @return {Promise}
	 */
	postRequest ( url, data ) {
		let options = {
			uri: url,
			body: data,
			agent: this.agent,
			auth: { user: this.settings.credentials.username, pass: this.settings.credentials.password },
			json: true,
			followAllRedirects: true
		};
		// Return request promise
		return reqprom.post( options ).catch( err => {
			console.log(err);
			if(err.error.code == 'ECONNREFUSED') { 
				return new Promise( (res, rej) => 
					{
						setTimeout( () => {
							this._swapIPs();
							return res(this.postRequest(url, data ))
						}, 1000 )
					});
			}
		});
	}

	/**
	 * PATCH Request Builder
	 * 
	 * @param {String} url  - the path to post 
	 * @param {Object} data - the data to post
	 * @return {Promise}
	 */
	patchRequest ( url, data ) {
		let options = {
			uri: url,
			body: data,
			agent: this.agent,
			auth: { user: this.settings.credentials.username, pass: this.settings.credentials.password },
			json: true,
			followAllRedirects: true
		};
		// Return request promise
		return reqprom.patch( options ).catch( err => {
			if(err.error.code == 'ECONNREFUSED') { 
				return new Promise( (res, rej) => 
					{
						setTimeout( () => {
							this._swapIPs();
							return res(this.patchRequest(url, data ))
						}, 1000 )
					});
			}
		});
	}

	/**
	 * PUT Request Builder
	 * 
	 * @param {String} url  - the path to post 
	 * @param {Object} data - the data to post
	 * @return {Promise}
	 */
	putRequest ( url, data ) {
		let options = {
			uri: url,
			body: data,
			agent: this.agent,
			auth: { user: this.settings.credentials.username, pass: this.settings.credentials.password },
			json: true,
			followAllRedirects: true
		};
		// Return request promise
		return reqprom.put( options ).catch( err => {
			if(err.error.code == 'ECONNREFUSED') { 
				return new Promise( (res, rej) => 
					{
						setTimeout( () => {
							this._swapIPs();
							return res(this.putRequest(url, data ))
						}, 1000 )
					});
			}
		});
	}

	/**
	 * GET Request Builder
	 * 
	 * @param {String} url     - the path to get 
	 * @return {Promise}
	 */
	getRequest ( url ) {
		let options = {
			uri: url,
			agent: this.agent,
			auth: { user: this.settings.credentials.username, pass: this.settings.credentials.password },
			json: true,
			followAllRedirects: true
		};
		// Return request promise
		return reqprom.get( options ).catch( err => {
			if(err.error.code == 'ECONNREFUSED') { 
				return new Promise( (res, rej) => 
					{
						setTimeout( () => {
							this._swapIPs();
							return res(this.getRequest(url ))
						}, 1000 )
					});
			}
		});
	}

	/**
	 * HEAD Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @return {Promise}
	 */
	headRequest ( url ) {
		let options = {
			uri: url,
			auth: { user: this.settings.credentials.username, pass: this.settings.credentials.password }
		};
		// Return request promise
		return reqprom.head( options ).catch( err => {
			if(err.error.code == 'ECONNREFUSED') { 
				return new Promise( (res, rej) => 
					{
						setTimeout( () => {
							this._swapIPs();
							return res(this.headRequest(url ))
						}, 1000 )
					});
			}
		});
	}

	/**
	 * Get Assets
	 * 
	 * @param  {Number} skip      - Amount of rows to skip
	 * @param  {Number} pageSize  - Amount of rows to fetch
	 * @return {Promise}
	 */
	getAssets ( skip = 0, pageSize = 200 ) {
		let urlStr = `${this.paths.safeex}${_paths['assets']}?format=json&limit=${pageSize}&offset=${skip}`;
		return this.getRequest( urlStr )
	}

	/**
	 * Get Equipments
	 * 
	 * @param  {Number} skip      - Amount of rows to skip
	 * @param  {Number} pageSize  - Amount of rows to fetch
	 * @return {Promise}
	 */
	getEquipments ( skip = 0, pageSize = 200 ) {
		let urlStr = `${this.paths.safeex}${_paths['equipments']}/?format=json&limit=${pageSize}&offset=${skip}`;
		return this.getRequest( urlStr )
	}

	/**
	 * Get Equipment
	 * 
	 * @param  {Number} equipId - unique id (pk) of the equipment
	 * @return {Promise}
	 */
	getOneEquipment ( equipId ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['equipments']}/${equipId}` );
		return this.getRequest( urlStr )
	}

	/**
	 * Create Equipment
	 * 
	 * @param  {Object} data - object
	 * @return {Promise}
	 */
	createEquipment ( data ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['equipments']}/` );
		return this.postRequest( urlStr, data )
	}

	/**
	 * Soft delete equipment
	 * 
	 * @param  {Object} equip - equipment object
	 * 
	 * @return {Promise}
	 */
	softDeleteEquipment ( equip ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['equipments']}/${equip.pk}/` ).toString();
		equip.deleted = true
		return this.putRequest( urlStr, equip )
	}

	/**
	 * Get Attributes
	 * 
	 * @param  {Number} skip      - Amount of rows to skip
	 * @param  {Number} pageSize  - Amount of rows to fetch
	 * @return {Promise}
	 */
	getAttributes ( skip = 0, pageSize = 200 ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['attributes']}?limit=${pageSize}&offset=${skip}` ).toString();
		return this.getRequest( urlStr )
	}

	/**
	 * Get Attribute
	 * 
	 * @param  {Number} attrId - unique id (pk) of the equipment
	 * @return {Promise}
	 */
	getOneAttribute ( attrId ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['attributes']}/${attrId}` );
		return this.getRequest( urlStr )
	}

	/**
	 * Get Attribute Values
	 * 
	 * @param  {Number} skip      - Amount of rows to skip
	 * @param  {Number} pageSize  - Amount of rows to fetch
	 * @return {Promise}
	 */
	getAttributeValues ( skip = 0, pageSize = 200 ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['attr_values']}?limit=${pageSize}&offset=${skip}` ).toString();
		return this.getRequest( urlStr )
	}

	/**
	 * Get Attribute Value
	 * 
	 * @param  {Number} attrId - unique id (pk) of the equipment/tag
	 * @return {Promise}
	 */
	getOneAttributeValue ( attrValId ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['attr_values']}/${attrId}` ).toString();
		return this.getRequest( urlStr )
	}

	/**
	 * Update attribute value
	 * 
	 * @param  {Object} data - { equipment: eqId, attribute: attrId, txtvalue: "", state: "current" }
	 * 
	 * @return {Promise}
	 */
	updateAttribute ( data ) {
		let urlStr = url.resolve( this.paths.safeex, `${_paths['attr_values']}/` ).toString();
		return this.postRequest( urlStr, data )
	}
}

