import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class NewUIEventCardGroup extends Component {
  @tracked isExpanded = false;

  @tracked events;

  @action
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
}
