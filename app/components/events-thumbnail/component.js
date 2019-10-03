/* global d3 */
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { select } from 'd3-selection';
const MAX_NUM_EVENTS_SHOWN = 20;
const RANDOM_NUMS = new Array(MAX_NUM_EVENTS_SHOWN).fill(0).map(() => Math.random());

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
      RANDOM_NUMS.slice(totalNumberOfEvents - MAX_NUM_EVENTS_SHOWN, MAX_NUM_EVENTS_SHOWN).map(
        randomNum => ({
          duration: maxDuration * randomNum,
          statusColor: 'build-empty'
        })
      )
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

    bars.each(function addColor(bar) {
      this.classList.add(bar.statusColor.toLowerCase());
    });
  }
});
