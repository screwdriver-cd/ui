import Component from '@ember/component';
import { get } from '@ember/object';
import { equal } from '@ember/object/computed';

export default Component.extend({
  classNames: 'workflow-tooltip',
  classNameBindings: ['showTooltip', 'left'],
  showTooltip: false,
  left: equal('showTooltipPosition', 'left'),

  didUpdateAttrs() {
    this._super(...arguments);

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
});
