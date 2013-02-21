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

		style : {
			red_formtranslate : " width: 200px; height: 150px; padding: 5px; position: fixed; top: 300px; left: 300px;  background-color: #FFF;	border: 1px solid #43A6E1; z-index: 1000; resize: both; overflow: hidden; -moz-box-sizing: border-box; ",
			dragarea : " width: 100%; height: 30px; background: rgba(67, 166, 241, 0.5); float: left;",
			translation : "width: 100%; min-height: 50px;"		
		},
		
		init : function () {
			
			box	= document.createElement('div');
			dragarea = document.createElement('div');
			translation = document.createElement('div');
	
			box.setAttribute('id', "red_formtranslate");
	
			box.setAttribute('style', this.style.red_formtranslate);
			dragarea.setAttribute('style', this.style.dragarea);
			translation.setAttribute('style', this.style.translation);
	
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
	

	var Events = {
		
		text : null,
		elem : null,
		timeoutID : null,
		get_value : true,
		
		inputChanged: function (e) {

			if (Events.get_value)
				Events.text = Events.elem.textContent;
			else
				Events.text = Events.elem.value;	
			
			clearTimeout(Events.timeoutID);

			Events.timeoutID = setTimeout(Events.translateText, 1000);
		},			

		translateText : function () {
			console.log("Sent Translate Query: ", text);
			// self.port.emit('translate', text);
		},

		startListen : function () {
			
			this.elem = document.querySelector("[formtranslateid=true]");

			console.log("Start listen on ", this.elem.id);

			if (this.elem.nodeName !== "INPUT" && this.elem.nodeName !== "TEXTAREA")
				this.get_value = false;
				
			console.log(this.get_value);
				
			this.elem.addEventListener('input', function (e) {
				console.log("text: ", e.target.value);
				Events.text = e.target.value;
				clearTimeout(Events.timeoutID);
				Events.timeoutID = setTimeout(Events.translateText, 1000);
			});
		},

		stopListen : function () {
			this.elem.removeEventListener('input', Events.inputChanged);
		}		
	}
	

	self.port.on("response", function(response) {
		console.log("Response received: ", response);		
		translation.textContent = response;
	});

	self.port.on("init", function() {
		UI.init();
		Events.startListen();
	});
	
	self.port.on("stop", function() {
		UI.remove();
	});
	
})();





