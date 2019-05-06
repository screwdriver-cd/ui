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

    const { chart } = this;

    chart.unload({
      done: () => {
        chart.destroy();
        this.draw();
      }
    });
  },
  willDestroyElement() {
    this._super(...arguments);
    this.chart.destroy();
    this.set('chart', null);
  },
  draw() {
    const chart = c3.generate({
      axis: this.axis,
      bar: this.bar,
      bindto: this.element,
      color: this.color,
      data: this.data,
      grid: this.grid,
      interaction: this.interaction,
      legend: this.legend,
      oninit: this.oninit,
      onrendered: this.onrendered,
      onresized: this.onresized,
      padding: this.padding,
      point: this.point,
      size: this.size,
      subchart: this.subchart,
      tooltip: this.tooltip,
      transition: this.transition,
      zoom: this.zoom
    });

    chart.internal.name = this.name;
    this.set('chart', chart);
  }
});
