import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';

@tagName('')
@classic
export default class PipelineListJobCell extends Component {
  @computed('value')
  get build() {
    const { build } = this.value;

    if (!build) {
      return null;
    }

    return {
      id: build.id,
      icon: statusIcon(build.status),
      status: build.status
    };
  }

  @computed('value.jobName')
  get jobName() {
    return this.value.jobName;
  }
}
