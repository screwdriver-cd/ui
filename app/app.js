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

if (config.environment === 'development') {
  run.backburner.DEBUG = true;
}

export default App;
