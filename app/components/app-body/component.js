import Component from '@ember/component';
import { service } from '@ember/service';

export default class AppBody extends Component {
  @service router;

  get isPipelineRoute() {
    return this.router.currentRouteName.startsWith('pipeline');
  }
}
