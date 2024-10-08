import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  iframeUrl: '',

  iframeId: '',

  init() {
    this._super(...arguments);
    this.set('iframeId', `${this.elementId}-iframe`);
  },

  handleMessageSendFromIframe(e) {
    if (!this.isDestroyed && !this.isDestroying) {
      const { state, href } = e.data;

      if (e.origin === `${ENV.APP.SDSTORE_HOSTNAME}`) {
        if (state === 'loaded') {
          this.handleMessageSendToIframe();
        } else if (state === 'redirect' && href) {
          this.set('iframeUrl', href);
        }
      }
    }
  },

  handleMessageSendToIframe() {
    const currentIframe = document.getElementById(this.iframeId).contentWindow;

    currentIframe.postMessage({ state: 'ready' }, '*');
  },

  didInsertElement() {
    this._super(...arguments);
    window.addEventListener(
      'message',
      this.handleMessageSendFromIframe.bind(this)
    );
  },

  actions: {
    download() {
      const downloadLink = this.iframeUrl.replace(
        'type=preview',
        'type=download'
      );

      window.open(downloadLink, '_blank');
    },
    downloadAll() {
      // https://api.screwdriver.cd/v4/documentation#/v4/getV4BuildsIdArtifacts
      // Reconstruct the downloadLink from the env var since iframeUrl is not available for directory-level access.
      const downloadLink = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/builds/${this.buildId}/artifacts`;

      window.open(downloadLink, '_blank');
    }
  }
});
