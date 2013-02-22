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

const data = require('sdk/self').data;
const {Cc, Ci, Cr} = require('chrome'); 	// Cc, Ci, Cm, Cr, Cu, components
const {Hotkey} = require('sdk/hotkeys');
const ss = require('sdk/simple-storage').storage;
const pageMod = require("sdk/page-mod");
const contextmenu = require("sdk/context-menu");
const tabs = require('sdk/tabs');
const Request = require("sdk/request").Request;

const protocol = require('protocol/lib/index');

const PP = require('prettyprint');

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


var workers = {};
var worker = null;

var FormTranslate = {

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
		
		if (FormTranslate.request_status == FormTranslate.COMPLETED) {
			
			FormTranslate.request_params["text"] = text;
			FormTranslate.request_status = FormTranslate.PENDING; 	
			
			Request({
				url: 'http://translate.google.com/translate_a/t',
				content: FormTranslate.request_params,
				onComplete: function (response) {
					
					console.log(typeof(response));
					
					FormTranslate.request_status = FormTranslate.COMPLETED;
					
					worker.port.emit("response", response.text);
					
				}
			}).get();	
		}
	}
};


contextmenu.Item({
	
	label: "Live Translate This Form",

	context: contextmenu.SelectorContext("input[type=text], textarea, div[contenteditable=true]"),
  
	contentScriptFile: data.url('formtranslatecontext.js'),
                 
	onMessage: function (obj) {

		PP.log(obj);
		initTabWorker(obj);
			
	}
});


function initTabWorker(obj) {

	const tabs_utils = require('sdk/tabs/utils');
	const window_utils = require("sdk/window/utils");
	const workers = require("sdk/content/worker");
	
	var active_tab = tabs_utils.getActiveTab(window_utils.getMostRecentBrowserWindow());
	var doc_window = tabs_utils.getTabContentWindow(active_tab);

	var worker_window = doc_window;

	console.log("Top: ", doc_window.document.URL);

	if (doc_window.document.URL !== obj.value) {
	
		var frames = window_utils.getFrames(doc_window);
	
		frames.forEach(function (window) {
			if (window.document.URL === obj.value)
				worker_window = window;
		})
	}
	
	worker =  workers.Worker({
	  window: worker_window,
		contentScriptFile: data.url('formtranslateUI.js'),
	});

	worker.port.emit("init");

	worker.port.on("response", function () {
	});
}

function stopWorker() {

	if (worker == null || worker.tab == null)
		return;
	
	pageMod.PageMod({
		include: worker.tab.url,
		contentScriptWhen: 'ready',
		attachTo: ["existing", "top", "frame"],
		contentScriptFile: data.url('formtranslatestop.js'),
  	});
	
	worker.port.emit("stop");
	
}

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
