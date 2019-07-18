import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
  iframeUrl: undefined,

  iframeId: undefined,

  init() {
    this._super(...arguments);
    const iframeId = `${this.elementId}-iframe`;

    this.set('iframeId', iframeId);
  },

  handleMessageSendFromIframe(e) {
    const { href } = e.data;

    if (!this.get('isDestroyed') && !this.get('isDestroying') && href) {
      this.set('iframeUrl', href);
    }
  },

  handleMessageSendToIframe() {
    const { iframeId } = this;

    $(`#${this.iframeId}`).on('load', (/* e */) => {
      const currentIframe = document.getElementById(iframeId).contentWindow;

      currentIframe.postMessage(
        {
          state: 'ready'
        },
        '*'
      );
    });
  },

  didInsertElement() {
    window.addEventListener('message', this.handleMessageSendFromIframe.bind(this));
    this.handleMessageSendToIframe();
  },

  actions: {
    download() {
      const downloadLink = this.iframeUrl.replace('type=preview', 'type=download');

      window.open(downloadLink, '_blank');
    }
  }
});
