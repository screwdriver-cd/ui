import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

@tagName('')
@classic
export default class PipelineList extends Component {
  // start all child pipelines
  @service('pipeline-startall')
  start;

  errorMessage = '';

  isShowingModal = false;

  @action
  startAll() {
    this.set('isShowingModal', true);

    return this.start
      .startAll(this.pipeline.id)
      .catch(error => this.set('errorMessage', error))
      .finally(() => this.set('isShowingModal', false));
  }
}
