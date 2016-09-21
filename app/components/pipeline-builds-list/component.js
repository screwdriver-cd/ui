import Ember from 'ember';

export default Ember.Component.extend(Ember.PromiseProxyMixin, {
  workflow: Ember.computed('jobs', {
    get() {
      const workflow = [];

      // get a sub-workflow object to clone
      this.get('jobs').forEach(j => {
        workflow.push({
          id: j.get('id'),
          name: j.get('name')
        });
      });

      return workflow;
    }
  }),

  builds: Ember.computed('buildList', 'workflow', {
    get() {
      const combined = this.get('buildList');
      const workflow = this.get('workflow');

      if (!combined || !workflow) {
        return [];
      }

      const shas = {};
      let result = [];

      combined.forEach(build => {
        const sha = build.get('sha');

        // create a workflow based on shas
        if (!shas[sha]) {
          shas[sha] = Ember.copy(workflow, true);
        }

        // add the build info to correct job in the workflow
        shas[sha].some(j => {
          if (j.id === build.get('jobId') && !j.build) {
            j.build = build;

            return true;
          }

          return false;
        });
      });

      // put the results into an array
      Object.keys(shas).forEach(key => {
        result.push(shas[key]);
      });

      // sort by create time of main job
      return result.sort((a, b) => {
        const bBuild = b[0].build || Ember.Object.create();
        const aBuild = a[0].build || Ember.Object.create();

        return bBuild.get('number') - aBuild.get('number');
      });
    }
  })
});
