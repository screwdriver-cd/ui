import Application from '@ember/application';
import loadInitializers from 'ember-load-initializers';
import { _backburner } from '@ember/runloop';
import Resolver from 'ember-resolver';
import config from 'screwdriver-ui/config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;

  podModulePrefix = config.podModulePrefix;

  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);

if (config.environment === 'development') {
  _backburner.DEBUG = true;
}
