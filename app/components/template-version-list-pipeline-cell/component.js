import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({
  namespace: alias('record.namespace'),
  name: alias('record.name'),
  version: alias('record.version'),
  pipelineCount: alias('record.metrics.pipelineCount')
});
