import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  theme: service('emt-themes/ember-bootstrap-v5'),
  timestampPreference: null,
  columns: [
    {
      title: 'NAME',
      resizable: true,
      component: 'pipeline-usage-table-name',
      sortedBy: 'name'
    },
    {
      title: 'BRANCH',
      resizable: true,
      component: 'pipeline-branch-cell'
    },
    {
      title: 'LAST RUN',
      resizable: true,
      propertyName: 'lastRunDate'
    },
    {
      title: 'ADMIN',
      resizable: true,
      propertyName: 'admins',
      component: 'pipeline-usage-admin-cell'
    }
  ],
  data: computed('pipelineMetrics', {
    async get() {
      return (await this.pipelineMetrics).map(m => {
        const lastRun =
          m.lastRun !== null
            ? moment(m.lastRun).format('MM/DD/YYYY')
            : '--/--/----';

        const branchWithDir = m.scmRepo.rootDir
          ? `${m.scmRepo.branch}:${m.scmRepo.rootDir}`
          : m.scmRepo.branch;

        const admins = Object.keys(m.admins).join(',');

        return {
          id: m.id,
          name: m.name,
          branch: branchWithDir,
          url: m.scmRepo.url,
          lastRunDate: lastRun,
          admins
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
