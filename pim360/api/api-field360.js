/**
 * Copyright (c) 2019 Datum360 Limited.
 *  
 * @fileOverview SDK like interface to use Field360 APIs
 * @name api-field360.js
 * @author Alex Ayyubov
 */

const request = require('request');
// Module that makes request to be a promise
const reqprom = require('request-promise');


// Base url to access the Bim360 Field API
const _baseUrl = "https://developer.api.autodesk.com/bim360/checklists/v1/containers/3effd8c9-e8e2-4c05-974d-435a95396bfa/"

// API class definition
module.exports = class Field360Api {
	/**
	 * Constructor of the class
	 * @return {null}
	 */
	constructor ( token ) {
		this.token = token;
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
			url: url,
			body: data,
			auth: { bearer: this.token },
			json: true
		};
		// Return request promise
		return reqprom.post( options )
	}

	/**
	 * GET Request Builder
	 * 
	 * @param {String} url     - the path to get 
	 * @return {Promise}
	 */
	getRequest ( url ) {
		let options = {
			url: url,
			auth: { bearer: this.token },
			json: true
		};
		// Return request promise
		return reqprom.get( options )
	}

	/**
	 * HEAD Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @return {Promise}
	 */
	headRequest ( url ) {
		let options = {
			url: url,
			auth: { bearer: this.token }
		};
		// Return request promise
		return reqprom.head( options )
	}
	/**
	 * PATCH Request Builder
	 * 
	 * @param {String} url     - the path to get header 
	 * @return {Promise}
	 */
	patchRequest ( url, data ) {
		let options = {
			url: url,
			body: data,
			auth: { bearer: this.token },
			json: true
		};
		// Return request promise
		return reqprom.patch( options )
	}

	/**
	 * Gets the list of templates
	 * 
	 * @return {Promise}
	 */
	getTemplates () {
		let url = _baseUrl + "templates";
		return this.getRequest(url);
	}

	/**
	 * Create a checklist 
	 * 
	 * @param  {String} title      title of the checklist
	 * @param  {String|Number}     templateId id of the template to use
	 * @return {Promise}
	 */
	createChecklist (title, templateId) {
		let dataToSend = {
		  "data": {
		    "type": "instances",
		    "attributes": {
		      "title": String(title)
		    },
		    "relationships": {
		      "createdFrom": {
		        "data": {
		          "type": "templates",
		          "id": templateId
		        }
		      },
		      "container": {
		        "data": {
		          "type": "containers",
		          "id": "3effd8c9-e8e2-4c05-974d-435a95396bfa"
		        }
		      }
		    }
		  }
		}

		let url = _baseUrl + "instances";

		return this.postRequest(url, dataToSend);
	}

	/**
	 * Get checklist by id
	 * 
	 * @param  {String|Number} checklistId - id of the checklist
	 * @return {Promise}
	 */
	getChecklistById ( checklistId ) {
		let url = _baseUrl + "instances/" + checklistId + "?include=sections,sections.items,sections.items.attachments,sections.items.supplementalAttachments" ;
		return this.getRequest(url);
	}

	/**
	 * Update checklist item value
	 * 
	 * @param  {String|Number} itemId id of the checklist item
	 * @param  {String|Number} value  value for the checklist item
	 * @return {Promise}
	 */
	updateChecklistItem(itemId, value) {
		let dataToSend = {
		  "data": {
		    "type": "instance_items",
		    "id": String(itemId),
		    "attributes": {
		      "answer": value,
		      "responseType": {
		        "id": 5
		      }
		    }
		  }
		}

		let url = _baseUrl + "instance_items/" + itemId;
		return this.patchRequest(url, dataToSend);
	}

	/**
	 * Get completed checklist in descending order
	 * 
	 * @return {Promise}
	 */
	getLatestCompletedChecklists() {
		// let url = _baseUrl + "instances?queryFilter[status.id]=4&sort=-updatedAt&page[limit]=100";
		let url = _baseUrl + "instances?queryFilter[status.id]=4&queryFilter[status.id]=3&sort=-updatedAt&page[limit]=100";
		return this.getRequest(url);
	}
}
