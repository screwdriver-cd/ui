import Ember from 'ember';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

let App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

// Detect and store previous path for redirection after login
Ember.Route.reopen({
  afterModel: function(resolvedModel, transition) {
    transition.then(() => {
      App.currentPath = this.get('router.url');
    });
  },
  deactivate() {
    App.previousPath = App.currentPath;
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
