import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

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
    }
  ],
  getBranch(pipeline) {
    const { branch, rootDir } = pipeline.scmRepo;

    return rootDir ? `${branch}#${rootDir}` : branch;
  },
  data: computed('template', 'pipelines', {
    async get() {
      const { pipelines } = this;
      const _pipelines = await pipelines;
      // console.log(_pipelines);

      return _pipelines.map(pipeline => {
        return {
          name: pipeline.name,
          branch: this.getBranch(pipeline),
          lastRunDate: pipeline.lastRunEvent.startTime,
          url: pipeline.hubUrl
        };
      });
    }
  }),

  hasPipelines: computed('pipelines', {
    async get() {
      const { pipelines } = this;

      return (await pipelines).length > 0;
    }
  })
});
