import Component from '@ember/component';

export default Component.extend({
  classNames: ['build-step'],
  classNameBindings: ['isOpen'],
  isOpen: false,
  autoClose: true,
  autoOpen: true,

  // Called when component will render again
  willRender() {
    this._super(...arguments);
    this.setOpen();
  },

  actions: {
    // Opens display of logs, turn off auto close of logs when step is done
    toggleOpen() {
      this.set('isOpen', !this.get('isOpen'));
      this.set('autoClose', false);
      this.set('autoOpen', false);
    },
    // turn off auto close of logs when step is done when user clicks on logs
    cancelAutoClose() {
      this.set('autoClose', false);
      this.set('autoOpen', false);
    }
  },

  /**
   * Determine if logs should displayed or not, when component is re-rendered
   * @method shouldOpen
   */
  setOpen() {
    const isOpen = this.get('isOpen');
    const autoClose = this.get('autoClose');
    const autoOpen = this.get('autoOpen');
    const code = this.get('code');
    const startTime = this.get('startTime');
    const endTime = this.get('endTime');
    // if code is defined and not 0, or step is running
    const shouldOpen = !!(code || (startTime && !endTime));

    // open the logs when the step is running and are not already displayed
    if (shouldOpen && !isOpen && autoOpen) {
      this.set('isOpen', true);
    // close the logs when the step has finished successfully, are currently open,
    // and the user hasn't stopped logs from closing
    } else if (!shouldOpen && isOpen && autoClose) {
      this.set('isOpen', false);
    }
  }
});
