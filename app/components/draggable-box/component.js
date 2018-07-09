import $ from 'jquery';

import Component from '@ember/component';


export default Component.extend({


	drag(draggable, header) {
		console.log('inside drag function')
		header.onmousedown = dragMouseDown;

		let startx = 0;
		let starty = 0;
		let endx = 0;
		let endy = 0;

		function dragMove(e){
			console.log('dragmove')
			e = e || window.event;

			endx = startx - e.clientX;
			endy = starty - e.clientY;
			startx = e.clientX;
			starty = e.clientY;
			draggable.style.top = (draggable.offsetTop - endy) + 'px';
			draggable.style.left = (draggable.offsetLeft - endx) + 'px';
		}

		function dragRemove(e){
			document.onmousemove = null;
			document.onmouseup = null;
		}

		function dragMouseDown(e) {
			console.log('dragdown')
			e = e || window.event;

			startx = e.clientX;
			starty = e.clientY;

			document.onmousemove = dragMove;
			document.onmouseup = dragRemove;
		}
	},


	didRender(){
		var box = document.getElementById('draggable');
		var header = document.getElementById('draggableheader');
		console.log(box)
		this.drag(box, header);

	},

	

});
