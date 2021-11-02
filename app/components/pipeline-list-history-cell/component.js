import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { computed } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class PipelineListHistoryCell extends Component {
  @computed('value')
  get builds() {
    return this.value;
  }
}
