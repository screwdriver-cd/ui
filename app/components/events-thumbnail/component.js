/* global d3 */
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { select } from 'd3-selection';
const MAX_NUM_EVENTS_SHOWN = 20;
const RANDOM_NUMS = new Array(MAX_NUM_EVENTS_SHOWN).fill(0).map(() => Math.random());

export default Component.extend({
  store: service(),
  events: null,
  pipelineId: undefined,

  didInsertElement() {
    const getParameters = svg => {
      const chartSize = parseInt(svg.style('width'), 10);
      const barSpace = (chartSize * 0.96) / MAX_NUM_EVENTS_SHOWN;
      const barWidth = (barSpace * 2) / 3;
      const barInterval = barSpace - barWidth;
      const paddingLeft = chartSize * 0.02 - barInterval / 2;
      const paddingRight = chartSize * 0.02 + barInterval / 2;

      return [barSpace, barWidth, paddingLeft, paddingRight];
    };

    const svg = select(this.element.getElementsByTagName('svg')[0]);
    let [barSpace, barWidth, paddingLeft, paddingRight] = getParameters(svg);
    const totalNumberOfEvents = this.events.length;
    const maxEvent = totalNumberOfEvents
      ? this.events.sort((e1, e2) => e2.duration - e1.duration)[0]
      : {};
    const maxDuration = maxEvent.duration || 100;
    const y = d3
      .scaleLinear()
      .domain([0, maxDuration])
      .range([0, 40]);

    // Add padding to the svg element so that it stays symmetrical
    svg.style('padding', `0 ${paddingLeft} 0 ${paddingRight}`);

    // Fixed number of bars
    if (this.events.length < MAX_NUM_EVENTS_SHOWN) {
      this.events = [
        ...this.events.reverse(),
        ...RANDOM_NUMS.slice(totalNumberOfEvents - MAX_NUM_EVENTS_SHOWN, MAX_NUM_EVENTS_SHOWN).map(
          randomNum => ({
            duration: maxDuration * randomNum,
            statusColor: 'build-empty'
          })
        )
      ];
    } else {
      this.events = this.events.slice(0, MAX_NUM_EVENTS_SHOWN).reverse();
    }

    const bars = svg
      .selectAll('rect')
      .data(this.events)
      .enter()
      .append('rect')
      .attr('width', barWidth)
      .attr('height', event => y(event.duration))
      .attr('x', (build, idx) => barSpace * idx)
      .attr('y', event => 40 - y(event.duration));

    bars.each(function addColor(bar) {
      this.classList.add(bar.statusColor);
    });

    d3.select(window).on(`resize.${this.pipelineId}`, function resize() {
      [barSpace, barWidth, paddingLeft, paddingRight] = getParameters(svg);

      // change padding to the svg element so that it stays symmetrical
      svg.style('padding', `0 ${paddingLeft} 0 ${paddingRight}`);

      // change bar width and spacing to keep the thumbnail responsive
      bars.attr('width', barWidth).attr('x', (build, idx) => barSpace * idx);
    });
  }
});
