import classic from 'ember-classic-decorator';
import { classNames, classNameBindings } from '@ember-decorators/component';
import { equal } from '@ember/object/computed';
import Component from '@ember/component';
import { get } from '@ember/object';

@classic
@classNames('workflow-tooltip')
@classNameBindings('showTooltip', 'left')
export default class WorkflowTooltip extends Component {
  showTooltip = false;

  @equal('showTooltipPosition', 'left')
  left;

  didUpdateAttrs() {
    super.didUpdateAttrs(...arguments);

    const event = get(this, 'tooltipData.mouseevent');
    const el = this.element;

    // setting tooltip position
    if (el && event) {
      let top = event.layerY + get(this, 'tooltipData.sizes.ICON_SIZE');

      let left = this.left
        ? event.layerX - 20
        : event.layerX - el.offsetWidth / 2;

      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    }
  }
}
