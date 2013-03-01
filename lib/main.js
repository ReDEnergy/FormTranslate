/*
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Lesser Public License as published 
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Title			Live Translate 
 * Programmer		Gabriel Ivanica
 * Email			gabriel.ivanica@gmail.com
 * Description		Live translations using Google Translate 
 */


"use strict";


/*	
 * CommonJS Module import
 */

// SDK Modules
const data = require('sdk/self').data;
const {Cc, Ci, Cr} = require('chrome'); 	// Cc, Ci, Cm, Cr, Cu, components
const {Hotkey} = require('sdk/hotkeys');
const ss = require('sdk/simple-storage').storage;
const PageMod = require("sdk/page-mod");
const ContextMenu = require("sdk/context-menu");
const Tabs = require('sdk/tabs');
const Request = require("sdk/request").Request;


// Local Modules
const protocol = require('protocol/lib/index');
const PP = require('prettyprint');


// Initial instantiation  

const about_handler = protocol.about('formtranslate', {
	onRequest: function(request, response) {
		response.uri = data.url("home/home.html");
	}
});

const panel = require("sdk/panel").Panel({
	contentURL: data.url("home/home.html"),
	contentScriptFile: data.url('home/home.js')
});

const toolbar_button = require("toolbarbutton").ToolbarButton({
	id: "formtranslate",
	label: "FormTranslate",
	image: data.url("images/icon16.png"),
	panel: panel,
	onCommand: function () {
		loadPageMode();
		alert(3);
	}
});


// JS Libraries 
var JsLibrary = {
	context_menu : 'FormTranslateContext.js',
	event_worker : 'FormTranslateEvents.js',
	stop_worker : 'FormTranslateStop.js',
	worker_UI : 'FormTranslateUI.js',
}


// Main Object
var FormTranslate = {};
	
// Workers created for communication
FormTranslate.Workers = {
	
	active : false,
	
	wEvent : null,

	wUI : null,
	
	startNewInstance : function (URL) {
		
		this.stopActiveInstance();

		const workers = require("sdk/content/worker");
		
		var window = this.getActiveWindow();
		var event_window = this.getEventWindow(URL, window);
		
		if (event_window == null)
			return;
		
		this.wUI = Tabs.activeTab.attach({
			contentScriptFile: data.url(JsLibrary.worker_UI),
		});
		
		this.wEvent =  workers.Worker({
			window: event_window,
			contentScriptFile: data.url(JsLibrary.event_worker),
		});
	
		this.wUI.port.emit("init");
		this.wEvent.port.emit("init");
		
		this.startListening();
	},
	
	getEventWindow : function (URL, window) {

		if (window.document.URL === URL)
			return window;

		const window_utils = require("sdk/window/utils");
		var frames = window_utils.getFrames(window);
		
		for (var i in frames) {
			if (frames[i].document.URL === URL && frames[i].document.querySelector("[formtranslateid=true]"))
				return frames[i];
		}
		
		return null;
	},
	
	getActiveWindow : function () {

		const tabs_utils = require('sdk/tabs/utils');
		const window_utils = require("sdk/window/utils");
		
		var active_tab = tabs_utils.getActiveTab(window_utils.getMostRecentBrowserWindow());
		var window = tabs_utils.getTabContentWindow(active_tab);
		
		return window;
	},
	
	startListening : function () {
		
		this.active = true;
		
		this.wEvent.on("detach", function() {
			console.log("Event worker detached");
			this.active = false;
		}.bind(this));		

		this.wUI.on("detach", function() {
			console.log("UI worker detached");
			this.active = false;
		}.bind(this));		

		this.wEvent.port.on("translate", function (text) {
			console.log("To translate: ", text);
		});
	},
	
	stopActiveInstance : function () {
		
		if (this.active === false)
			return;

		this.wUI.port.emit("destroy");
		console.log("UI worker detached");
		this.wUI.destroy();

		this.wEvent.port.emit("destroy");
		console.log("Event worker detached");
		this.wEvent.destroy();
		
		this.active = false;
	},
	
};

// Object to handle communication with Google Translation Service
FormTranslate.QueryRequest = {

	COMPLETED : 0,
	PENDING : 1,

	request_status : 0,

	request_params : {
		client	: 't',
		ie		: 'UTF-8',		// input encoding
		oe		: 'UTF-8',		// output encoding
		sc		: 1,
		hl		: 'en',			// home language
		sl		: 'auto',		// selected/input language 
		tl		: 'ro',			// language for translation			
		multires: 1,
		text	: '',			// text to translate
	},
	
	makeRequest : function (text) {
		
		console.log(this.request_status);
		
		if (this.request_status == this.COMPLETED) {
			
			this.request_params["text"] = text;
			this.request_status = this.PENDING; 	
			
			Request({
				url: 'http://translate.google.com/translate_a/t',
				content: QueryRequest.request_params,
				onComplete: function (response) {
					
					console.log(typeof(response));
					
					QueryRequest.request_status = QueryRequest.COMPLETED;
					
					worker.port.emit("response", response.text);
					
				}
			}).get();	
		}
	}
};


ContextMenu.Item({
	
	label: "Live Translate This Form",

	context: ContextMenu.SelectorContext("input[type=text], textarea, div[contenteditable=true]"),
  
	contentScriptFile: data.url(JsLibrary.context_menu),
                 
	onMessage: function (obj) {

		PP.log(obj);

		if (obj.event === 'init')
			FormTranslate.Workers.startNewInstance(obj.value);
			
	}
});


// **********************************************************************************
// *	Load Addon

exports.main = function (options, callbacks) {

	// console.log(options.loadReason);
	var reasons = ["install", "enable", "upgrade"];
	var reason = reasons.indexOf(require('self').loadReason);

	about_handler.register();

	if (reason != -1) {
		toolbar_button.moveTo({
		    toolbarID: "nav-bar",
		    forceMove: true
		});
	}
};


// **********************************************************************************
// *	Unload Addon

exports.onUnload = function (reason) {
	// console.log (reason);

	about_handler.unregister()
	toolbar_button.destroy();
};
