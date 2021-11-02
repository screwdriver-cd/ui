import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

/* eslint-disable max-len */
const langs = [
  {
    name: 'node.js',
    url: 'https://github.com/screwdriver-cd-test/quickstart-nodejs'
  },
  {
    name: 'ruby',
    url: 'https://github.com/screwdriver-cd-test/quickstart-ruby'
  },
  {
    name: 'go',
    url: 'https://github.com/screwdriver-cd-test/quickstart-golang'
  },
  {
    name: 'generic',
    url: 'https://github.com/screwdriver-cd-test/quickstart-generic'
  }
];
/* eslint-enable max-len */

@classic
export default class HomeHero extends Component {
  languages = langs;

  @action
  changeLanguage() {
    this.set('forkUrl', this.element.querySelector('select').value);
  }

  forkUrl = langs[0].url;
}
