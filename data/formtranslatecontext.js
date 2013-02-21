/*
 * Identify DOM element for listen
 */

"use strict";

(function ReD_FormTranslate_Context_ID() {

	console.log("Identification attached");

	function Message (event_name, obj_msg) {
	  this.event = event_name;
	  this.value = obj_msg;
	}
	
	self.on("click", function (node, data) {

		self.postMessage(new Message('init', document.URL));

		node.setAttribute('formtranslateid', 'true');
		
	});

}) ();





