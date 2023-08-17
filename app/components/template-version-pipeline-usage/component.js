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
        console.log(m);
        const lastRun =
          m.lastRun !== null
            ? moment(m.lastRun).format('MM/DD/YYYY')
            : '--/--/----';

        const branchWithDir = m.scmRepo.rootDir
          ? `${m.scmRepo.branch}:${m.scmRepo.rootDir}`
          : m.scmRepo.branch;

        return {
          name: m.name,
          branch: branchWithDir,
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
