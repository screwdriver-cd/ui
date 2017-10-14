import Component from '@ember/component';

/* eslint-disable max-len */
const langs = [
  { name: 'node.js', url: 'https://github.com/screwdriver-cd-test/quickstart-nodejs' },
  { name: 'ruby', url: 'https://github.com/screwdriver-cd-test/quickstart-ruby' },
  { name: 'go', url: 'https://github.com/screwdriver-cd-test/quickstart-golang' },
  { name: 'generic', url: 'https://github.com/screwdriver-cd-test/quickstart-generic' }
];
/* eslint-enable max-len */

export default Component.extend({
  languages: langs,
  actions: {
    changeLanguage() {
      this.set('forkUrl', this.$('select').val());
    }
  },
  forkUrl: langs[0].url
});
