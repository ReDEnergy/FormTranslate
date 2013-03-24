/*
 * Identify DOM element for listen
 */

"use strict";

(function ReD_FormTranslate_Context_ID() {

	console.log("Context Menu Script Attached");

	function Message (event_name, obj_msg) {
	  this.event = event_name;
	  this.value = obj_msg;
	}
	
	self.on("click", function (node, data) {
		
		if (node.getAttribute('formtranslateid'))
			return;

		node.setAttribute('formtranslateid', 'true');
		self.postMessage(new Message('init', null));
	});

}) ();





