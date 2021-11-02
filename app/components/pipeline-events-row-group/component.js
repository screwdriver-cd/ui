import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { get, set, action, computed } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class PipelineEventsRowGroup extends Component {
  events = [];

  @computed('expandedEventsGroup', 'events.[]')
  get isExpanded() {
    const expandedGroups = this.expandedEventsGroup;
    const { groupEventId } = this.events[0];

    return !!expandedGroups[groupEventId];
  }

  @action
  toggleExpanded() {
    this.expandedEventsGroup[this.events[0].groupEventId] = !this.isExpanded;
    set(this, 'expandedEventsGroup', { ...this.expandedEventsGroup });
  }
}
