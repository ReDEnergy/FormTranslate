/*
 * Start communication with Google Translate Service
 */


(function ReD_FormTranslate_Events() {

	console.log("Event script attached");

	var Events = {
		
		text : null,
		elem : null,
		timeoutID : null,
		get_value : true,
		
		inputChanged: function (e) {

			if (Events.get_value)
				Events.text = e.target.value;
			else
				Events.text = e.target.textContent;	

			console.log("text: ", Events.text);

			clearTimeout(Events.timeoutID);
			Events.timeoutID = setTimeout( Events.translateText, 1000);
			
		},			

		translateText : function () {
			console.log("Sent Translate Query: ", Events.text);
			self.port.emit('translate', Events.text);
		},

		startListen : function () {
			
			this.elem = document.querySelector("[formtranslateid=true]");

			if (this.elem.nodeName !== "INPUT" && this.elem.nodeName !== "TEXTAREA")
				this.get_value = false;
				
			this.elem.addEventListener('input', Events.inputChanged);
		},

		stopListen : function () {
			this.elem.removeEventListener('input', Events.inputChanged);
			this.elem.removeAttribute('formtranslateid');
		}
	}

	self.port.on("init", function() {
		Events.startListen();
	});
	
	self.port.on("destroy", function() {
		console.log("Destroy Events");
		Events.stopListen();
	});
	
})();





