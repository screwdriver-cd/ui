import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({
  name: alias('record.name'),
  pipelineId: alias('record.id')
});
