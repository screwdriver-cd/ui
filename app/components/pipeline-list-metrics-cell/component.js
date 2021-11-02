import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

@tagName('')
@classic
export default class PipelineListMetricsCell extends Component {
  @service
  shuttle;

  @computed('value')
  get jobId() {
    const { value } = this;

    return value && value.build && value.build.jobId ? value.build.jobId : '';
  }
}
