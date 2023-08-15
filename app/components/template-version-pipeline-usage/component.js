import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  userSettings: service(),
  theme: service('emt-themes/ember-bootstrap-v5'),
  timestampPreference: null,
  columns: [
    {
      title: 'NAME',
      resizable: true,
      propertyName: 'name'
    },
    {
      title: 'BRANCH',
      resizable: true,
      propertyName: 'branch'
    },
    {
      title: 'URL',
      resizable: true,
      propertyName: 'url'
    },
    {
      title: 'LAST RUN',
      resizable: true,
      propertyName: 'lastRunDate'
    },
    {
      title: 'ADMIN',
      resizable: true,
      propertyName: 'admins'
    }
  ],
  data: computed('pipelineMetrics', {
    async get() {
      return (await this.pipelineMetrics).map(m => {
        const lastRun =
          m.lastRun !== null
            ? moment(m.lastRun).format('YYYY-MM-DD')
            : '----/--/--';

        return {
          name: m.name,
          branch: m.scmRepo.branch,
          url: m.scmRepo.url,
          lastRunDate: lastRun,
          admins: Object.keys(m.admins)
        };
      });
    }
  }),

  hasPipelines: computed('pipelineMetrics', {
    async get() {
      return (await this.pipelineMetrics).length > 0;
    }
  })
});
