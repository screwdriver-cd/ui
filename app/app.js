import classic from 'ember-classic-decorator';
import Application from '@ember/application';
import loadInitializers from 'ember-load-initializers';
import { run } from '@ember/runloop';
import Resolver from 'ember-resolver';
import config from 'screwdriver-ui/config/environment';

@classic
class App extends Application {
  modulePrefix = config.modulePrefix;

  podModulePrefix = config.podModulePrefix;

  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);

if (config.environment === 'development') {
  run.backburner.DEBUG = true;
}

export default App;
