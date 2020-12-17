import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';

export default Component.extend({
  pipelineService: service('pipeline'),
  buildsLink: computed('pipelineService.buildsLink', function getBuildLink() {
    return this.get('pipelineService.buildsLink');
  }),
  classNames: ['row'],
  pipelineDescription: computed('pipeline', {
    get() {
      let description;

      if (this.pipeline.annotations) {
        if (this.pipeline.annotations['screwdriver.cd/pipelineDescription']) {
          description = this.pipeline.annotations['screwdriver.cd/pipelineDescription'].replace(
            /\n/g,
            '<br>'
          );
        }
      }

      return htmlSafe(description);
    }
  })
});
