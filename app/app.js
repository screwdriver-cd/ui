import Application from '@ember/application';
import loadInitializers from 'ember-load-initializers';
import { run } from '@ember/runloop';
import Resolver from 'ember-resolver';
import config from './config/environment';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

loadInitializers(App, config.modulePrefix);

// Make sure that the height of the steps-list and the console is right.
function fixPartialViewHeight() {
    const minHeight = 300;
    const paddingBottom = 10;
    for (const element of document.getElementsByClassName('partial-view')) {
        element.style.height = '1px';
        element.style.minHeight = '1px';
        const rect = element.getBoundingClientRect();
        const height = window.innerHeight - (rect.top + rect.height) - paddingBottom;
        element.style.height = height + 'px';
        element.style.minHeight = minHeight + 'px';
    }
}

fixPartialViewHeight();
window.addEventListener('resize', fixPartialViewHeight);
window.setInterval(fixPartialViewHeight, 100);

if (config.environment === 'development') {
  run.backburner.DEBUG = true;
}

export default App;
