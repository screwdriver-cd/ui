/* global d3, memoizerific */
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { htmlSafe } from '@ember/string';
import { statusIcon } from 'screwdriver-ui/utils/build';
import timeRange from 'screwdriver-ui/utils/time-range';

export default Controller.extend({
  inTrendlineView: false,
  eventsChartName: 'eventsChart',
  buildsChartName: 'buildsChart',
  selectedRange: '1wk',
  timeRanges: ['6hr', '12hr', '1d', '1wk', '1mo'],
  endTime: alias('model.endTime'),
  startTime: alias('model.startTime'),
  measures: alias('metrics.measures'),
  metrics: alias('model.metrics'),
  /**
   * Memoized range generator
   * Generator code borrowed from MDN:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Sequence_generator_(range)
   *
   * @param {Number} start start of the range
   * @param {Number} stop  end of the range
   * @param {Number} step  step to increment
   */
  range: memoizerific(10)((start, stop, step) =>
    Array.from({ length: ((stop - start) / step) + 1 }, (_, i) => start + (i * step))
  ),
  eventMetrics: computed('metrics.events', {
    get() {
      const inTrendlineView = this.get('inTrendlineView');
      const { queuedTime, imagePullTime, duration, total, status } = this.get(
        'metrics.events'
      );

      return {
        columns: [queuedTime, imagePullTime, duration, total],
        types: {
          queuedTime: 'bar',
          imagePullTime: 'bar',
          duration: 'bar',
          total: 'line'
        },
        names: {
          queuedTime: 'Queued',
          imagePullTime: 'Image Pull',
          duration: 'Duration',
          total: 'Event Duration'
        },
        hide: inTrendlineView ? ['queuedTime', 'imagePullTime', 'duration'] : 'total',
        colors: {
          queuedTime: '#c5c5c5',
          imagePullTime: '#dfdfdf',
          duration: '#16c045',
          total: '#0066df'
        },
        groups: [['queuedTime', 'imagePullTime', 'duration']],
        color(color, d) {
          // return color of the status of the corresponding event in the pipeline
          return d && d.id === 'duration' && status[d.index] !== 'SUCCESS' ? '#ea0000' : color;
        }
      };
    }
  }),
  buildMetrics: computed('metrics.{builds,jobGroup}', {
    get() {
      const { builds, jobGroup } = this.get('metrics');
      const jobArray = Array.from(jobGroup)
        .sort()
        .map(j => j.toString());

      return {
        json: builds,
        keys: {
          value: jobArray
        },
        type: 'bar',
        groups: [jobArray]
      };
    }
  }),
  axis: computed('metrics.events', {
    get() {
      const self = this;
      const times = this.get('metrics.events.createTime');

      return {
        y: {
          tick: {
            outer: false
          },
          padding: {
            top: 10,
            bottom: 0
          }
        },
        x: {
          type: 'category',
          categories: times,
          label: {
            text: 'LOCAL DATE TIME',
            position: 'outer-center'
          },
          height: 70,
          tick: {
            centered: true,
            outer: false,
            fit: false,
            multiline: true,
            multilineMax: 2,
            width: 80,
            /**
             * Generate the responsive row of tick labels for x-axis
             *
             * @param {Array<Number>} domain array containing the start and end of the current domain
             * @returns {Array<Number>} array containing the indexes of desired tick labels
             */
            values(domain) {
              const [x0, x1] = domain.map(Math.floor);
              const offset = 1;
              const tickLabelWidth = 80;
              const canvasWidth = self.get('eventsChart').internal.width;
              const maxAllowedLabels = Math.floor(canvasWidth / tickLabelWidth);

              let step = 1;
              let values = self.range(x0, x1 - offset, step);

              // loop for better displayed labels
              while (values.length > maxAllowedLabels) {
                step += 2;
                values = self.range(x0, x1 - offset, step);
              }

              return values;
            },
            /**
             * Tick label formatter
             *
             * @param {Number} i domain value for which the tick label locates
             * @returns
             */
            format(i) {
              const d = times[Math.floor(i)];

              // local date time string
              return d ? `${d.toLocaleString()}` : '';
            }
          }
        }
      };
    }
  }),
  legend: computed('metrics.events', {
    get() {
      const inTrendlineView = this.get('inTrendlineView');

      return {
        position: 'inset',
        inset: {
          anchor: 'top-right',
          y: -30,
          step: 1
        },
        hide: inTrendlineView ? ['queuedTime', 'imagePullTime', 'duration'] : 'total'
      };
    }
  }),
  tooltip: computed('metrics.events', {
    get() {
      const self = this;

      return {
        /**
         * Tooltip content generator
         *
         * @returns {String} safe HTML string to be displayed for tooltip
         */
        contents() {
          const { sha, status, createTime } = self.get('metrics.events');
          const [data, , , color] = arguments;
          const i = data[0].index;
          const s = status[i];

          // collect grouped data and generate a map for data HTML
          const htmls = data.reduce(
            (html, d) => {
              const c = d.id === 'duration' && s !== 'SUCCESS' ? '#ea0000' : color(d.id);

              html.keys.push(`<p><span style="border-color:${c}"></span>${d.name}</p>`);
              html.values.push(`<p>${humanizeDuration(d.value * 60 * 1e3, { round: true })}</p>`);

              return html;
            },
            {
              keys: [],
              values: []
            }
          );

          return htmlSafe(
            `<div class="${s}">
              <div class="status">
                <i aria-hidden="true" class="fa fa-fw fa-${statusIcon(s, true)}"></i>
                <strong class="sha">#${sha[i].substr(0, 7)}</strong>
              </div>
              <div class="detail">
                <div class="key">
                  <p>Build Time</p>
                  ${htmls.keys.join('')}
                </div>
                <div class="value">
                  <p>${new Date(createTime[i]).toLocaleString()}</p>
                  ${htmls.values.join('')}
                </div>
              </div>
            </div>`
          );
        }
      };
    }
  }),
  color: {
    pattern: [
      '#87d812',
      '#fed800',
      '#1ac6f4',
      '#6e2ebf',
      '#6e2ebf',
      '#6e2ebf',
      '#1f77b4',
      '#aec7e8',
      '#ff7f0e',
      '#ffbb78',
      '#2ca02c',
      '#98df8a',
      '#d62728',
      '#ff9896',
      '#9467bd',
      '#c5b0d5',
      '#8c564b',
      '#c49c94',
      '#e377c2',
      '#f7b6d2',
      '#7f7f7f',
      '#c7c7c7',
      '#bcbd22',
      '#dbdb8d',
      '#17becf',
      '#9edae5'
    ]
  },
  size: {
    height: 280
  },
  transition: {
    duration: 250
  },
  grid: {
    y: {
      show: true
    }
  },
  bar: {
    width: {
      ratio: 0.6
    }
  },
  point: {
    show: false
  },
  subchart: {
    show: false
  },
  zoom: {
    rescale: true
  },
  onrendered() {
    if (this.svg) {
      // remove the extra box generated by c3 on legend
      this.svg.select(`.${this.CLASS.legendBackground}`).remove();
    }
  },
  onInitFns: computed(function onInitOuter() {
    const self = this;
    const eventsChartName = this.get('eventsChartName');
    const buildsChartName = this.get('buildsChartName');

    /**
     * Set up drag and zoom
     *
     * @param {String} conjugateChartName name of the conjugate chart, e.g. Events <-> Builds
     */
    function setupDragZoom(conjugateChartName) {
      // get the inverted domain values from d3
      const getZoomedDomain = selection => selection && selection.map(x => this.x.invert(x));
      const brush = d3
        .brushX()
        .on('start', () => {
          const [x0, x1] = getZoomedDomain(d3.event.selection);

          // this won't reset zoom level on every click drag event
          if (x0 !== x1 && Math.abs(x1 - x0) >= 1) {
            this.api.unzoom();
            self.get(conjugateChartName).unzoom();
          }

          this.svg.select(`.${this.CLASS.eventRects} .selection`).classed('hide', false);
        })
        .on('end', () => {
          if (d3.event.selection === null) {
            return;
          }

          let zoomedDomain = getZoomedDomain(d3.event.selection);
          const [x0, x1] = zoomedDomain;

          zoomedDomain = [Math.floor(x0), Math.ceil(x1)];

          this.api.zoom(zoomedDomain);
          self.get(conjugateChartName).zoom(zoomedDomain);

          this.svg.select(`.${this.CLASS.eventRects} .selection`).classed('hide', true);
        });

      // make the default event listening area also the overlay for d3 brush for drag event
      d3.select(this.eventRect.data([{ type: 'overlay' }]).node().parentElement).call(brush);

      // remove the default overlay area generated by d3 brush
      this.main.select('.overlay').remove();
    }

    /**
     * Set up different shims for overriding c3 behaviors
     *
     */
    function shimHandlers() {
      this.windowFocusHandler = Function.prototype;
    }

    /**
     * Custom init callback for setting up custom behaviors
     *
     * @param {String} chartName name of the targeted chart
     * @param {String} conjugateChartName name of the conjugate chart
     */
    function onInitInner(chartName, conjugateChartName) {
      self.set(chartName, this.api);
      setupDragZoom.call(this, conjugateChartName);
      shimHandlers.call(this);
    }

    return {
      [eventsChartName]() {
        onInitInner.call(this, eventsChartName, buildsChartName);
      },
      [buildsChartName]() {
        onInitInner.call(this, buildsChartName, eventsChartName);
      }
    };
  }),
  setDate(which, value, immediate) {
    const v = value === '' ? undefined : value;

    if (which && this.get(which) !== v) {
      this.set(which, v);

      // send to router to refresh model accordingly
      this.send('setDates', which, v, immediate);
    }
  },
  actions: {
    setChartRef(chartName, chartInstance) {
      this.set(chartName, chartInstance);
    },
    toggleTrendlineView(enabledTrendline) {
      const chart = this.get('eventsChart');
      const savedZoomDomain = chart.internal.x.orgDomain();

      this.set('inTrendlineView', enabledTrendline);

      if (enabledTrendline) {
        chart.show('total', { withLegend: true });
        chart.hide(['queuedTime', 'imagePullTime', 'duration'], { withLegend: true });
      } else {
        chart.show(['queuedTime', 'imagePullTime', 'duration'], { withLegend: true });
        chart.hide('total', { withLegend: true });
      }

      // restore previous zoom level
      chart.zoom(savedZoomDomain);
    },
    setTimeRange(range) {
      if (this.get('selectedRange') === range) {
        return;
      }

      this.set('selectedRange', range);

      const { startTime, endTime } = timeRange(new Date(), range);

      // trigger router model change with new dates after both dates are set
      this.setDate('startTime', startTime);
      this.setDate('endTime', endTime, true);
    },
    setStartDate(value) {
      this.setDate('startTime', value, true);
      this.set('selectedRange');
    },
    setEndDate(value) {
      this.setDate('endTime', value, true);
      this.set('selectedRange');
    },
    resetZoom(chartName, conjugateChartName) {
      // precise way to do unzoom
      [this.get(chartName), this.get(conjugateChartName)].forEach((c) => {
        const orgDomain = c.internal.subX.orgDomain();
        const [org0, org1] = orgDomain;
        const [x0, x1] = c.internal.x.orgDomain();

        if (org0 !== x0 || org1 !== x1) {
          c.zoom(orgDomain);
        }
      });
    }
  }
});
