import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';
import { tagName } from '@ember-decorators/component';
import ENV from 'screwdriver-ui/config/environment';

@classic
@tagName('')
export default class ArtifactPreview extends Component {
  iframeUrl = '';

  iframeId = '';

  init() {
    super.init(...arguments);
    this.set('iframeId', `${this.elementId}-iframe`);

    window.addEventListener(
      'message',
      this.handleMessageSendFromIframe.bind(this)
    );
  }

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
  }

  handleMessageSendToIframe() {
    const currentIframe = document.getElementById(this.iframeId).contentWindow;

    currentIframe.postMessage({ state: 'ready' }, '*');
  }

  @action
  download() {
    const downloadLink = this.iframeUrl.replace(
      'type=preview',
      'type=download'
    );

    window.open(downloadLink, '_blank');
  }
}
