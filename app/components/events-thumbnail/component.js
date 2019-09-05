/* global d3 */
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { select } from 'd3-selection';
const MAX_NUM_EVENTS_SHOWN = 20;

export default Component.extend({
  store: service(),
  events: null,

  didInsertElement() {
    const svg = select(this.element.getElementsByTagName('svg')[0]);
    const totalNumberOfEvents = this.events.length;
    const maxEvent = totalNumberOfEvents
      ? this.events.sort((e1, e2) => e2.duration - e1.duration)[0]
      : {};
    const maxDuration = maxEvent.duration || 100;
    const y = d3
      .scaleLinear()
      .domain([0, maxDuration])
      .range([0, 40]);

    // Fixed number of bars
    this.events = this.events.reverse().concat(
      Array(MAX_NUM_EVENTS_SHOWN - totalNumberOfEvents)
        .fill(1)
        .map(() => ({
          duration: maxDuration * Math.random(),
          statusColor: 'build-empty'
        }))
    );

    const bars = svg
      .selectAll('rect')
      .data(this.events)
      .enter()
      .append('rect')
      .attr('width', 10)
      .attr('height', event => y(event.duration))
      .attr('x', (build, idx) => 15 * idx)
      .attr('y', event => 40 - y(event.duration));

    // Show no matter how many we've got
    /*
    const bars = svg.selectAll('rect')
      .data(this.events.toArray().reverse())
      .enter()
      .append('rect')
      .attr('width', 600 / (3 * totalNumberOfEvents - 1))
      .attr('height', event => y(event.duration))
      .attr('x', (event, idx) => 900 / (3 * totalNumberOfEvents - 1) * idx)
      .attr('y', event => 40 - y(event.duration));
    */

    bars.each(function(bar) {
      this.classList.add(bar.statusColor.toLowerCase());
    });
  }
});
