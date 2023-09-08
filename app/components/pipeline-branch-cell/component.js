import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({
  name: alias('record.branch'),
  url: alias('record.url')
});
