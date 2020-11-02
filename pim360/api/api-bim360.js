/**
 * Copyright (c) 2017 Datum360 Limited.
 *  
 * @fileOverview SDK like interface to use Bim360 APIs
 * @name api-bim360.js
 * @author Alex Ayyubov
 */

const request = require('request');
// Module that makes request to be a promise
const reqprom = require('request-promise');


// Base url to access the Bim360 Field API
const _baseUrl = "https://bim360field.autodesk.com"
// Different paths for different parts
const _paths  = {
	// Login endpoint that returns ticket (token)
	login   : "/api/login",
	// List of the projects endpoint
	projects: "/api/projects",
	// Particular project endpoint
	project : "/api/project",
	// Equipment list
	getEquipments : "/api/get_equipment",
	// Update equipments
	updateEquipments : "/api/equipment"
};

// API class definition
module.exports = class BIM360Api {
	/**
	 * Constructor of the class
	 * 
	 * @param  {String} userName 
	 * @param  {[type]} password
	 * @return {null}
	 */
	constructor ( userName, password ) {
		this.userName = userName;
		this.password = password;
		this.ticket = "";
	}

	/**
	 * URL builder
	 * 
	 * @param  {String} pathEnum - key to lookup the _paths object
	 * @return {String} the full url
	 */
	buildURL ( pathEnum ) {
		return `${_baseUrl}${_paths[pathEnum]}`;
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
			transform: BIM360Api.parseBody,
			form: data
		};
		// Return request promise
		return reqprom.post(options)
	}

	/**
	 * Login to get the ticket (token) to use in requests
	 * 
	 * TODO: There is nothing about the expiration of the ticket in the docs, 
	 * may be it will be good to just store ticket and then reuse it.
	 * @return {Promise}
	 */
	login () {
		return new Promise((resolve, reject) => {
			this.postRequest(this.buildURL('login'), {username: this.userName, password: this.password})
				.then((credentials) => {
					this.ticket = credentials.ticket;
					resolve(credentials);
				}).catch((err) => {
					reject(err);
				});
		});
	}

	/**
	 * Gets the list of projects from BIM360 Field
	 * 
	 * @return {Promise}
	 */
	getProjects () {
		if(!this.ticket)
			return Promise.reject(new Error('Session ticket is not defined'));
		return this.postRequest(this.buildURL('projects'), {ticket: this.ticket});
	}

	/**
	 * Get project by its name
	 * 
	 * @param  {String} name - name of the project to match
	 * @return {Promise}
	 */
	getProjectByName ( name ) {
		return new Promise( (resolve, reject) => {
			this.getProjects()
				.then( (projects) => {
					resolve(projects.filter( (project) => {return project.name === name; })[0]);
				}).catch(reject);
		});
	}

	/**
	 * Get project by its id
	 * 
	 * @param  {String} projectId - id or the project to retrieve
	 * @return {Promise}
	 */
	getProjectById ( projectId ) {
		if(!projectId || !this.ticket)
			return Promise.reject(new Error('Project id and/or session ticket is not defined'));
		return this.postRequest(this.buildURL('project'), {ticket: this.ticket, project_id: projectId});
	}

	/**
	 * Get equipments with all the data
	 * 
	 * @param  {String} projectId - id of the project
	 * @param  {Array} equipmentIds - array of equipment ids to fetch, if not given all items will be returned 
	 * @return {Promise}
	 */
	getEquipments ( projectId , equipmentIds) {
		if(!projectId || !this.ticket)
			return Promise.reject(new Error('Project id and/or session ticket is not defined'));

		let dataToSend = {
			ticket: this.ticket,
			project_id: projectId
		}

		if(equipmentIds && equipmentIds.length) {
			dataToSend.equipment_ids = equipmentIds.join(",");
			dataToSend.ids_only = 1;
		}

		return this.postRequest(this.buildURL('getEquipments'), dataToSend);
	}

	/**
	 * Update equipment. Equipment needs to be valid and existing in BIM 360 so that you can update it
	 * It is not possible to create a new object via API, it should be directly created in BIM360
	 * reference: https://bim360field.autodesk.com/apidoc/index.html#mobile_api_method_32
	 * 
	 * @param  {String} projectId - id of the project
	 * @param  {Array} equipments - BIM360 Field specific equipment objects array
	 * @return {Promise}
	 */
	updateEquipments ( projectId, equipments ) {
		if(!projectId || !this.ticket)
			return Promise.reject(new Error('Project id and/or session ticket is not defined'));

		if(equipments && !equipments.length)
			return Promise.reject(new Error('Equipment list is empty'));

		let dataToSend = {
			ticket: this.ticket,
			project_id: projectId,
			equipment: JSON.stringify(equipments)
		}

		return this.postRequest(this.buildURL('updateEquipments'), dataToSend);
	}

	/**
	 * JSON serializer of the response body
	 * 
	 * @param  {String} body
	 * @param  {Object} response
	 * @param  {Object} resolveWithFullResponse
	 * @return {JSON | String}
	 */
	static parseBody (body, response, resolveWithFullResponse) {
		// Content Type might have a charset definition, so equality check might fail
		if (response.headers['content-type'].indexOf('application/json') > -1) {
			return JSON.parse(body);
		} else {
			return body;
		}
	}
}
