/*
 * Start communication with Google Translate Service
 */


(function ReD_FormTranslate_Stop() {

	console.log("Stop script attached", document.URL);

	var nodes = document.getElementsByClassName('ReD_FormTranslate_Node');
	
	if (nodes[0])
		nodes[0].oninput = null;
	
})();





