/* global c3 */
import Component from '@ember/component';

export default Component.extend({
  tagName: 'div',
  chart: null,
  didInsertElement() {
    this._super(...arguments);
    this.draw();
  },
  didUpdateAttrs() {
    this._super(...arguments);

    if (this.isDestroying || this.isDestroyed) {
      return;
    }

    const chart = this.get('chart');

    chart.unload({
      done: () => {
        chart.destroy();
        this.draw();
      }
    });
  },
  willDestroyElement() {
    this._super(...arguments);
    this.get('chart').destroy();
    this.set('chart', null);
  },
  draw() {
    const chart = c3.generate({
      axis: this.get('axis'),
      bar: this.get('bar'),
      bindto: this.element,
      color: this.get('color'),
      data: this.get('data'),
      grid: this.get('grid'),
      interaction: this.get('interaction'),
      legend: this.get('legend'),
      oninit: this.get('oninit'),
      onrendered: this.get('onrendered'),
      onresized: this.get('onresized'),
      padding: this.get('padding'),
      point: this.get('point'),
      size: this.get('size'),
      subchart: this.get('subchart'),
      tooltip: this.get('tooltip'),
      transition: this.get('transition'),
      zoom: this.get('zoom')
    });

    chart.internal.name = this.get('name');
    this.set('chart', chart);
  }
});
