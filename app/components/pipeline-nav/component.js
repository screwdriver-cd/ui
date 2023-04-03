import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { inject as service } from '@ember/service';

export default Component.extend({
  pipelineService: service('pipeline'),
  buildsLink: reads('pipelineService.buildsLink'),
  pipelineDescription: computed('pipeline.annotations', {
    get() {
      let description;

      if (this.pipeline.annotations) {
        if (this.pipeline.annotations['screwdriver.cd/pipelineDescription']) {
          description = this.pipeline.annotations[
            'screwdriver.cd/pipelineDescription'
          ].replace(/\n/g, '<br>');
        }
      }

      return htmlSafe(description);
    }
  })
});
