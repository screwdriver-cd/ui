import Component from '@ember/component';
import { service } from '@ember/service';

export default class AppBody extends Component {
  @service router;

  get class() {
    if (
      this.router.currentRouteName.startsWith('pipeline') ||
      this.router.currentRouteName.startsWith('v2.pipeline')
    ) {
      return 'pipeline-page';
    }

    return 'container-fluid';
  }
}
