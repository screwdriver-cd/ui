import Component from '@ember/component';

export default Component.extend({
  classNameBindings: [':required-warning', 'hidden:hidden'],
  hidden: false,
  tagName: 'span'
});
