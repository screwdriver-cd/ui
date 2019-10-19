/* global d3, memoizerific */
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';
import { statusIcon } from 'screwdriver-ui/utils/build';
import $ from 'jquery';
import timeRange, { toCustomLocaleString, CONSTANT } from 'screwdriver-ui/utils/time-range';

const locked = Symbol('locked');

export default Controller.extend({
  router: service(),
  session: service(),
  queryParams: [
    {
      jobId: { type: 'string' }
    }
  ],
  inTrendlineView: false,
  isUTC: false,
  eventsChartName: 'eventsChart',
  buildsChartName: 'buildsChart',
  stepsChartName: 'stepsChart',
  selectedRange: '1wk',
  timeRanges: [
    { alias: '6hr', value: '6hr' },
    { alias: '12hr', value: '12hr' },
    { alias: '1d', value: '1d' },
    { alias: '1wk', value: '1wk' },
    { alias: '1mo', value: '1mo' },
    { alias: '3mo', value: '3mo' },
    { alias: '6mo', value: '180d' }
  ],
  successOnly: alias('model.successOnly'),
  selectedJobName: computed('model.jobId', 'metrics.jobMap', {
    get() {
      const jobId = this.get('model.jobId');
      const jobMap = this.get('metrics.jobMap');

      return Object.keys(jobMap).find(k => jobMap[k] === jobId);
    }
  }),
  startTime: alias('model.startTime'),
  endTime: alias('model.endTime'),
  measures: alias('metrics.measures'),
  metrics: alias('model.metrics'),
  jobs: computed('metrics.jobMap', {
    get() {
      const jobMap = this.get('metrics.jobMap');

      return Object.keys(jobMap)
        .map(j => j.toString())
        .sort((a, b) => jobMap[a] - jobMap[b]);
    }
  }),
  // flatpickr addon seems to prefer dates in string
  customRange: computed('startTime', 'endTime', {
    get() {
      return ['startTime', 'endTime'].map(t =>
        toCustomLocaleString(new Date(this.get(t)), {
          options: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }
        })
      );
    }
  }),
  init() {
    this._super(...arguments);
    this.reinit();
  },
  reinit() {
    // clear all those flags b/c this is a controller
    this.set('selectedRange', '1wk');
    this.set('inTrendlineView', false);
    this.set('isUTC', false);

    // safety step to release references
    this.set(this.eventsChartName, null);
    this.set(this.buildsChartName, null);
    this.set(this.stepsChartName, null);
  },
  /**
   * Memoized range generator
   * Generator code borrowed from MDN:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Sequence_generator_(range)
   *
   * @param {Number} start start of the range
   * @param {Number} stop  end of the range
   * @param {Number} step  step to increment
   */
  range: memoizerific(5)((start, stop, step) =>
    Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)
  ),
  eventMetrics: computed('metrics.events', {
    get() {
      let { queuedTime, imagePullTime, duration, total, status } = this.get('metrics.events');

      return {
        columns: [
          ['total', ...total],
          ['duration', ...duration],
          ['imagePullTime', ...imagePullTime],
          ['queuedTime', ...queuedTime]
        ],
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
        hide: this.inTrendlineView ? ['queuedTime', 'imagePullTime', 'duration'] : 'total',
        colors: {
          queuedTime: '#c5c5c5',
          imagePullTime: '#dfdfdf',
          duration: '#03af7a',
          total: '#0066df'
        },
        groups: [['queuedTime', 'imagePullTime', 'duration']],
        color(color, d) {
          // return color of the status of the corresponding event in the pipeline
          return d && d.id === 'duration' && status[d.index] !== 'SUCCESS' ? '#ff4b00' : color;
        }
      };
    }
  }),
  eventLegend: computed('inTrendlineView', 'metrics.events', {
    get() {
      if (this.inTrendlineView) {
        return [
          {
            key: 'total',
            name: 'Event Duration',
            style: htmlSafe('border-color:#0066df')
          }
        ];
      }

      return [
        {
          key: 'duration',
          name: 'Duration',
          style: htmlSafe('border-color:#03af7a #ff4b00 #ff4b00 #03af7a')
        },
        {
          key: 'queuedTime',
          name: 'Queued',
          style: htmlSafe('border-color:#c5c5c5')
        },
        {
          key: 'imagePullTime',
          name: 'Image Pull',
          style: htmlSafe('border-color:#dfdfdf')
        }
      ];
    }
  }),
  buildMetrics: computed('metrics.builds', 'jobs', {
    get() {
      const builds = this.get('metrics.builds');
      const { jobs } = this;

      return {
        json: builds,
        keys: {
          value: jobs
        },
        type: 'bar',
        groups: [jobs]
      };
    }
  }),
  buildLegend: computed('jobs}', {
    get() {
      const colors = this.get('color.pattern');

      return this.jobs.map((name, i) => ({
        key: name,
        name,
        style: htmlSafe(`border-color:${colors[i % colors.length]}`)
      }));
    }
  }),
  stepMetrics: computed('metrics.{steps,stepGroup}', {
    get() {
      const {
        steps: { data },
        stepGroup
      } = this.metrics;

      return {
        json: data,
        keys: {
          value: stepGroup
        },
        type: 'bar',
        groups: [stepGroup]
      };
    }
  }),
  stepLegend: computed('metrics.stepGroup}', {
    get() {
      const stepGroup = this.get('metrics.stepGroup');
      const colors = this.get('color.pattern');

      return stepGroup.map((name, i) => ({
        key: name,
        name,
        style: htmlSafe(`border-color:${colors[i % colors.length]}`)
      }));
    }
  }),
  // serves as a template for axis related configs
  axis: computed(function axis() {
    const self = this;
    let dateOptions;

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
        // no need to pass categories data because we are generating cutom ticks
        type: 'category',
        label: {
          get text() {
            return `${self.get('isUTC') ? 'UTC' : 'LOCAL'} DATE TIME`;
          },
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
          values(times, domain) {
            const [x0, x1] = domain.map(Math.floor);
            const offset = 1;
            const canvasWidth = self.get('eventsChart').internal.width;
            const diff = times[x1 - 2] - times[x0];
            let tickLabelWidth = 80;

            // show only date string if longer than a week
            // more specific mappings are possible
            if (diff > CONSTANT.WEEK) {
              tickLabelWidth = 70;
              dateOptions = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              };
            } else {
              dateOptions = undefined;
            }

            let step = 1;
            let values = self.range(x0, x1 - offset, step);

            const maxAllowedLabels = Math.floor(canvasWidth / tickLabelWidth);

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
          format(times, i) {
            const d = times[Math.floor(i)];
            const timeZone = self.get('isUTC') ? 'UTC' : undefined;

            // local date time string
            return d ? `${toCustomLocaleString(d, { timeZone, options: dateOptions })}` : '';
          }
        }
      }
    };
  }),
  generateAxis(metricType) {
    const { axis } = this;
    const times = this.get(`metrics.${metricType}.createTime`);

    let { values, format } = axis.x.tick;

    values = values.bind(null, times);
    format = format.bind(null, times);

    // override default with configured functions
    return { y: { ...axis.y }, x: { ...axis.x, tick: { ...axis.x.tick, values, format } } };
  },
  eventsAxis: computed('axis', 'metrics.events.createTime', 'isUTC', {
    get() {
      return this.generateAxis('events');
    }
  }),
  stepsAxis: computed('axis', 'metrics.steps', 'isUTC', {
    get() {
      return this.generateAxis('steps');
    }
  }),
  tooltip: computed('metrics.events', 'isUTC', {
    get() {
      const self = this;

      return {
        /**
         * Sieve for left position
         *
         * @returns {Object} contains left position for tooltip
         */
        position() {
          return { left: this.tooltipPosition(...arguments).left };
        },
        /**
         * Tooltip content generator
         *
         * @returns {String} safe HTML string to be displayed for tooltip
         */
        contents() {
          const [data, , , color] = arguments;
          const i = data[0].index;
          const router = self.get('router');
          const pipelineId = self.get('pipeline.id');
          const getBuildId = self.get('metrics.getBuildId');
          const timeZone = self.get('isUTC') ? 'UTC' : undefined;

          // compact destructure assignments
          const [{ sha, status, createTime }, buildId] =
            this.name === self.get('stepsChartName')
              ? [self.get('metrics.steps'), getBuildId('step', i)]
              : [self.get('metrics.events'), getBuildId('build', i)];
          const s = status[i];

          // collect grouped data and generate a map for data HTML
          const htmls = data
            .sort((a, b) => b.value - a.value)
            .reduce(
              (html, d) => {
                const c = d.id === 'duration' && s !== 'SUCCESS' ? '#ff4b00' : color(d.id);
                let { name } = d;
                let url;

                // add deep-link to build/step if possible
                if (this.name === self.get('stepsChartName')) {
                  url = router.urlFor('pipeline.build.step', pipelineId, buildId, name);
                } else if (this.name === self.get('buildsChartName')) {
                  url = router.urlFor('pipeline.build', pipelineId, buildId[name] || buildId);
                }

                if (url) {
                  name = `<a href="${url}" target="_blank">${name}</a>`;
                }

                if (d.value) {
                  html.keys.push(`<p class="legend" style="border-color:${c}">${name}</p>`);
                  html.values.push(
                    `<p>${humanizeDuration(d.value * 60 * 1e3, { round: true })}</p>`
                  );
                }

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
                <strong class="sha">#${(sha[i] || '').substr(0, 7)}</strong>
                <i aria-hidden="true" class="lock fa fa-fw fa-thumb-tack"></i>
                <i aria-hidden="true" class="clipboard fa fa-fw fa-clipboard"></i>
              </div>
              <div class="detail">
                <div class="key">
                  <p>Build Time</p>
                  ${htmls.keys.join('')}
                </div>
                <div class="value">
                  <p>${toCustomLocaleString(createTime[i], { timeZone })}</p>
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
    // first dozen were from designs, rest from random generator
    pattern: [
      '#87d812',
      '#fed800',
      '#1ac6f4',
      '#6e2ebf',
      '#1f77b4',
      '#aec7e8',
      '#ff7f0e',
      '#2ca02c',
      '#ffbb78',
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
      '#9edae5',
      '#dd6130',
      '#e0924e',
      '#e0e03e',
      '#29799e',
      '#0ad6d6',
      '#9549d8',
      '#6fc11d',
      '#5dfc5d',
      '#395fa0',
      '#ff60d7',
      '#f907ed',
      '#e5dc2b',
      '#46ceba',
      '#047255',
      '#5bc42b',
      '#ce1296',
      '#efd64a',
      '#4b0cd3',
      '#af3be5',
      '#63ff73',
      '#3e5cb7',
      '#f23eaa',
      '#76259e',
      '#60f2b3',
      '#ddbd1c',
      '#becc2c'
    ]
  },
  size: {
    height: 280
  },
  padding: {
    top: 20
  },
  transition: {
    duration: 300
  },
  interaction: {
    enabled: false
  },
  legend: {
    show: false
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
    r: 4
  },
  subchart: {
    show: false
  },
  zoom: {
    rescale: true
  },
  onInitFns: computed(function onInitOuter() {
    const self = this;
    const { eventsChartName, buildsChartName, stepsChartName } = this;

    /**
     * unlock tooltip
     *
     */
    function unlockTooltip() {
      this.tooltip.classed('locked', false);
    }

    /**
     * Set up custom elements and event handlers
     *
     */
    function setupExtras() {
      // add the cursor line
      const cursorLine = this.svg
        .append('line')
        .style('stroke', '#888')
        .style('stroke-dasharray', '3')
        .style('pointer-events', 'none')
        .attr('class', 'cursor-line')
        .attr('x1', -100)
        .attr('x2', -100)
        .attr('y1', 0)
        .attr('y2', this.height)
        .attr('transform', this.getTranslate('main'));

      let previousIndexDomain = null;

      this.api.tooltip[locked] = false;

      this.eventRect.on('mousedown.cursor', () => {
        // click again to unlock tooltip
        if (this.api.tooltip[locked]) {
          this.api.tooltip[locked] = false;
          previousIndexDomain = null;
          unlockTooltip.call(this);
          this.hideTooltip();

          return;
        }

        if (previousIndexDomain === null) {
          this.hideTooltip();
        } else {
          // clicked near data domain
          this.api.tooltip[locked] = true;
          this.tooltip.classed('locked', true);
        }
      });

      this.eventRect.on('mousemove.cursor', () => {
        const [x] = d3.mouse(this.eventRect.node());

        // always move the cursor line
        cursorLine.attr('x1', x).attr('x2', x);

        const rangeOffset = this.xAxis.tickOffset();

        // calculate reference distance for edges and midpoint of a bar
        // reuse the same for line chart
        const [leftEdgeDomain, midPointDomain, rightEdgeDomain] = [-1, 0, 1].map(n =>
          Math.floor(this.x.invert(x - rangeOffset * (1 - n * this.config.bar_width_ratio)))
        );
        const currentIndexDomain = rightEdgeDomain;

        // if all three are the same, we are outside of bar
        if (leftEdgeDomain === midPointDomain && midPointDomain === rightEdgeDomain) {
          previousIndexDomain = null;
          this.eventRect.classed('data', false);

          // remains locked if it was locked before
          if (this.api.tooltip[locked]) {
            return;
          }

          this.api.tooltip[locked] = false;
          this.hideTooltip();
        } else if (previousIndexDomain === null || currentIndexDomain !== previousIndexDomain) {
          this.eventRect.classed('data', true);

          if (this.api.tooltip[locked]) {
            return;
          }

          let hidden = new Set(this.hiddenTargetIds);

          previousIndexDomain = currentIndexDomain;
          this.showTooltip(
            this.data.targets.reduce((data, { id, values }) => {
              if (!hidden.has(id)) {
                data.push(this.addName(values[currentIndexDomain]));
              }

              return data;
            }, []),
            this.eventRect.node()
          );
        }
      });

      // escape hatch for last chance to cancel out tooltip effect
      this.selectChart.on('mouseleave', () => {
        previousIndexDomain = null;
        if (!this.api.tooltip[locked]) {
          this.hideTooltip();
        }
      });

      // copy all text inside the tooltip
      this.tooltip.on('click', () => {
        if (d3.event.target.classList.contains('clipboard')) {
          const range = document.createRange();
          const selection = window.getSelection();

          selection.removeAllRanges();
          range.selectNodeContents(this.tooltip.node());
          selection.addRange(range);
          document.execCommand('copy');
          selection.removeAllRanges();
        }
      });
    }

    /**
     * Set up drag and zoom
     *
     * @param {Array<String>} conjugateChartNames names of the conjugate chart, e.g. Events <-> Builds
     */
    function setupDragZoom(...conjugateChartNames) {
      // get the inverted domain values from d3
      const getZoomedDomain = selection => selection && selection.map(x => this.x.invert(x));
      const brush = d3
        .brushX()
        .on('start', () => {
          const [x0, x1] = getZoomedDomain(d3.event.selection);

          // this won't reset zoom level on every click drag event
          if (x0 !== x1 && Math.abs(x1 - x0) >= 1) {
            [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
              if (c) {
                c.unzoom();
              }
            });
          }

          this.svg.select(`.${this.CLASS.eventRects} .selection`).classed('hide', false);
        })
        .on('brush', () => {
          [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
            if (c) {
              unlockTooltip.call(c.internal);
              c.tooltip[locked] = false;
              c.internal.hideTooltip();
            }
          });
        })
        .on('end', () => {
          if (d3.event.selection === null) {
            return;
          }

          let zoomedDomain = getZoomedDomain(d3.event.selection);
          const offsetFromRightEdge = 0.01;
          const [x0, x1] = zoomedDomain;

          // need to have a tiny bit offset from right edge to prevent crossing over the next point
          zoomedDomain = [Math.floor(x0), Math.ceil(x1) - offsetFromRightEdge];

          [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
            if (c) {
              c.zoom(zoomedDomain);
            }
          });

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
     * @param {Array<String>} conjugateChartNames names of the conjugate chart
     */
    function onInitInner(chartName, ...conjugateChartNames) {
      self.set(chartName, this.api);
      setupExtras.call(this);
      setupDragZoom.apply(this, conjugateChartNames);
      shimHandlers.call(this);
    }

    return {
      [eventsChartName]() {
        onInitInner.call(this, eventsChartName, buildsChartName);
      },
      [buildsChartName]() {
        onInitInner.call(this, buildsChartName, eventsChartName);
      },
      [stepsChartName]() {
        onInitInner.call(this, stepsChartName);
      }
    };
  }),
  setDates(start, end) {
    if (this.startTime !== start || this.endTime !== end) {
      this.set('startTime', start);
      this.set('endTime', end);

      // send to router to refresh model accordingly
      this.send('setFetchDates', start, end);
    }
  },
  actions: {
    toggleTrendlineView(enabledTrendline) {
      const chart = this.eventsChart;
      const savedZoomDomain = chart.internal.x.orgDomain();

      this.set('inTrendlineView', enabledTrendline);

      if (enabledTrendline) {
        chart.show('total');
        chart.hide(['queuedTime', 'imagePullTime', 'duration']);
      } else {
        chart.show(['queuedTime', 'imagePullTime', 'duration']);
        chart.hide('total');
      }

      // restore previous zoom level
      chart.zoom(savedZoomDomain);
    },
    toggleSuccessOnly() {
      this.send('filterSuccessOnly');
    },
    selectJob(name) {
      const { [name]: id } = this.get('metrics.jobMap');

      if (id && this.selectedJobName !== name) {
        this.send('setJobId', id);
        this.transitionToRoute({ queryParams: { jobId: id } });
      } else {
        this.set('errorMessage', `Unknown Job: ${name}`);
      }
    },
    setTimeRange(range) {
      if (this.selectedRange === range) {
        return;
      }

      this.set('selectedRange', range);

      const { startTime, endTime } = timeRange(new Date(), range);

      // trigger router model change with new dates after both dates are set
      // endTime first cuz end time doesn't change within a minute
      // but startTime does per every range change
      this.setDates(startTime, endTime);
    },
    setCustomRange([start, end]) {
      this.set('selectedRange');

      // always set end to a minute before EOD, and of local time
      end.setHours(23, 59, 59);
      this.setDates(start.toISOString(), end.toISOString());
    },
    resetZoom(chartName, ...conjugateChartNames) {
      // pop the last item, which is the actual event object
      conjugateChartNames.pop();

      [this.get(chartName), ...conjugateChartNames.map(n => this.get(n))].forEach(c => {
        if (!c) {
          return;
        }

        // precise way to do unzoom
        const orgDomain = c.internal.subX.orgDomain();
        const [org0, org1] = orgDomain;
        const [x0, x1] = c.internal.x.orgDomain();

        if (org0 !== x0 || org1 !== x1) {
          c.zoom(orgDomain);
        }

        c.tooltip[locked] = false;
        c.internal.hideTooltip();
        c.internal.tooltip.classed('locked', false);
      });
    },
    onLegendHover(key, chartName) {
      this.get(chartName).focus(key);
    },
    onLegendHoverOut(chartName) {
      this.get(chartName).revert();
    },
    onLegendClick(key, chartName, { currentTarget, target }) {
      const chart = this.get(chartName);
      const wasHidden = currentTarget.classList.contains('unselected');

      // must have at least one legend/data displayed
      // empty chart could introduce issues around domain in c3
      if (
        !wasHidden &&
        chart.internal.data.targets.length - chart.internal.hiddenTargetIds.length === 1
      ) {
        return;
      }

      // override redraw to ditch drawing options
      // to prevent redraw resetting zoomed domain
      const internalRedraw = chart.internal.redraw;

      chart.internal.redraw = function redraw(...args) {
        internalRedraw.apply(this, args.slice(1));
      };

      // if clicked on "only"
      if (currentTarget !== target) {
        chart.show(key);
        chart.hide(Object.keys(chart.internal.config.data_types).filter(k => k !== key));
        $(currentTarget)
          .removeClass('unselected')
          .siblings()
          .addClass('unselected');
      } else {
        chart.toggle(key);
        currentTarget.classList.toggle('unselected');
      }

      chart.internal.redraw = internalRedraw;
    }
  }
});
