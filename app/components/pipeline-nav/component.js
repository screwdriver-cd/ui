import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({
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
