/*
 * Start communication with Google Translate Service
 */

"use strict";

(function ReD_FormTranslate_UI() {


	var box;
	var dragarea;
	var translation; 

	var DragHandlers = {

		offsetX : 0,
		offsetY : 0,

		start : function(e) {
			DragHandlers.offsetX = e.clientX - box.offsetLeft;
			DragHandlers.offsetY = e.clientY - box.offsetTop; 

			document.addEventListener('mousemove', DragHandlers.drag);
		},
	
		end : function(e) {
			document.removeEventListener('mousemove', DragHandlers.drag);
		},
	
		drag : function(e) {
			
			box.style.left = e.clientX - DragHandlers.offsetX + 'px';
			box.style.top  = e.clientY - DragHandlers.offsetY + 'px';
		},
	}
	
	var UI = {

		init : function () {
			
			box	= document.createElement('div');
			dragarea = document.createElement('div');
			translation = document.createElement('div');
	
			box.setAttribute('id', "red_formtranslate");
			dragarea.className = "dragarea";
			translation.className = "translation";
			
	
			dragarea.addEventListener('mousedown', DragHandlers.start);
			dragarea.addEventListener('mouseup'  , DragHandlers.end);
			
			box.appendChild(dragarea);
			box.appendChild(translation);
			document.body.appendChild(box);
	
			console.log("UI attached");
		},		
		
		remove: function () {
			document.body.removeChild(box);
			dragarea.removeEventListener('mousedown', DragHandlers.start);
			dragarea.removeEventListener('mouseup'  , DragHandlers.end);
		}
		
	}
	
	self.port.on("init", function() {
		UI.init();
	});

	self.port.on("response", function(response) {
		console.log("Response received: ", response);		
		translation.textContent = response;
	});
	
	self.port.on("destroy", function() {
		console.log("Destroy UI");
		UI.remove();
	});

})();





