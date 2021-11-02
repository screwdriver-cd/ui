import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import Component from '@ember/component';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

@tagName('')
@classic
export default class Feedback extends Component {
  didInsertElement() {
    super.didInsertElement(...arguments);
    if (
      ENV.APP.FEEDBACK_HOSTNAME &&
      ENV.APP.FEEDBACK_SCRIPT &&
      ENV.APP.FEEDBACK_CONFIG
    ) {
      $.getScript(ENV.APP.FEEDBACK_SCRIPT, () => {
        const { objName, version, params } = JSON.parse(
          ENV.APP.FEEDBACK_CONFIG
        );

        setTimeout(() => {
          window[objName][version](params);
        }, 2000);
      });
    }
  }
}
