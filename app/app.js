import Application from '@ember/application';
import loadInitializers from 'ember-load-initializers';
import { run } from '@ember/runloop';
import Resolver from 'ember-resolver';
import config from './config/environment';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver,
  LOG_TRANSITIONS: true,

  // Extremely detailed logging, highlighting every internal
  // step made while transitioning into a route, including
  // `beforeModel`, `model`, and `afterModel` hooks, and
  // information about redirects and aborted transitions
  LOG_TRANSITIONS_INTERNAL: true
});

loadInitializers(App, config.modulePrefix);

if (config.environment === 'development') {
  run.backburner.DEBUG = true;
}

export default App;
