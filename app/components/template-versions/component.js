import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import moment from 'moment';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import { compareVersions } from 'compare-versions';

export default Component.extend({
  userSettings: service(),
  theme: service('emt-themes/ember-bootstrap-v5'),
  timestampPreference: null,
  columns: [
    {
      title: 'VERSION',
      component: 'template-version-list-version-cell',
      sortedBy: 'version',
      sortFunction: (a, b) => {
        return compareVersions(a, b);
      },
      resizable: true,
      width: '40%',
      minResizeWidth: 350
    },
    {
      title: 'PUBLISHED',
      propertyName: 'publishedTime',
      className: 'published-time-cell',
      componentForFooterCell: 'template-version-list-footer-total-cell',
      sortFunction: (a, b) => {
        const aStartTime = get(a, 'lastObject.createTime');
        const bStartTime = get(b, 'lastObject.createTime');

        return moment.compare(moment(aStartTime), moment(bStartTime));
      },
      resizable: false,
      width: '20%',
      minResizeWidth: 150
    },
    {
      title: 'PIPELINES',
      component: 'template-version-list-pipeline-cell',
      propertyName: 'metrics.pipelineCount',
      className: 'metric-cell',
      componentForFooterCell:
        'template-version-list-footer-pipeline-count-cell',
      resizable: false,
      width: '10%',
      minResizeWidth: 150
    },
    {
      title: 'JOBS',
      propertyName: 'metrics.jobCount',
      className: 'metric-cell',
      componentForFooterCell: 'template-version-list-footer-job-count-cell',
      resizable: false,
      width: '10%',
      minResizeWidth: 150
    },
    {
      title: 'BUILDS',
      propertyName: 'metrics.buildCount',
      className: 'metric-cell',
      componentForFooterCell: 'template-version-list-footer-build-count-cell',
      resizable: false,
      width: '10%',
      minResizeWidth: 150
    },
    {
      title: 'ACTIONS',
      propertyName: 'actions',
      className: 'actions-cell',
      disableSorting: true,
      component: 'template-version-list-actions-cell',
      resizable: false,
      width: '10%',
      minResizeWidth: 150
    }
  ],

  async init() {
    this._super(...arguments);
    this.theme.table = 'table table-condensed table-sm';
    const userPreferences = await this.userSettings.getUserPreference();

    if (userPreferences) {
      this.set('timestampPreference', userPreferences.timestampFormat);
    }
  },

  didDestroyElement() {
    this._super(...arguments);
    this.set('jobsDetails', []);
  },

  data: computed(
    'isAdmin',
    'removeVersion',
    'templates.[]',
    'timestampPreference',
    {
      get() {
        const { templates, isAdmin, timestampPreference } = this;

        return templates.map(template => {
          const {
            name,
            namespace,
            fullName,
            version,
            createTime,
            trusted,
            metrics,
            tag
          } = template;

          let publishedTime;

          if (timestampPreference === 'UTC') {
            publishedTime = `${toCustomLocaleString(new Date(createTime), {
              timeZone: 'UTC'
            })}`;
          } else {
            publishedTime = `${toCustomLocaleString(new Date(createTime))}`;
          }

          const actionsData = {
            removeVersion: this.removeVersion.bind(this),
            fullName,
            version,
            isAdmin
          };

          return {
            name,
            namespace,
            version,
            trusted,
            tag,
            publishedTime,
            metrics: {
              jobCount: metrics.jobs.count,
              buildCount: metrics.builds.count,
              pipelineCount: metrics.pipelines.count
            },
            actions: actionsData
          };
        });
      }
    }
  ),

  removeVersion(fullName, version) {
    this.onRemoveVersion(fullName, version);
  },

  actions: {
    timeRangeChange(startTime, endTime) {
      this.onTimeRangeChange(startTime, endTime);
    }
  }
});
