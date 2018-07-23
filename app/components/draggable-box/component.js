import Component from '@ember/component';

export default Component.extend({
  drag(draggable, header) {
    console.log(draggable, header)

    let startx = 0;
    let starty = 0;
    let endx = 0;
    let endy = 0;

    /**
    * Repositions draggable box
    * @param {object} event The drag event.
    */
    function dragMove(event) {
      let e = event;

      e = e || window.event;

      endx = startx - e.clientX;
      endy = starty - e.clientY;
      startx = e.clientX;
      starty = e.clientY;

      let top = draggable.offsetTop - endy;
      let left = draggable.offsetLeft - endx;

      draggable.style.top = `${top}px`;
      draggable.style.left = `${left}px`;
    }

    /**
    * Removes events
    */
    function dragRemove() {
      document.onmousemove = null;
      document.onmouseup = null;
    }

    /**
    * add events to event listeners
    * @param {object} event The mouse down event.
    */
    function dragMouseDown(event) {
      let e = event;

      e = e || window.event;

      startx = e.clientX;
      starty = e.clientY;

      document.onmousemove = dragMove;
      document.onmouseup = dragRemove;
    }

    header.onmousedown = dragMouseDown;
  },

  didRender() {
    let box = document.getElementById('draggable');
    let drag = document.getElementsByClassName('drag')[0];

    this.drag(box, drag);
  }
});
