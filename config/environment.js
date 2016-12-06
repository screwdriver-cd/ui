/* jshint node: true */
module.exports = (environment) => {
  let ENV = {
    modulePrefix: 'screwdriver-ui',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
      SDAPI_HOSTNAME: 'http://localhost:8080',
      SDAPI_NAMESPACE: 'v4',
      BUILD_RELOAD_TIMER: 5000,     // 5 seconds
      EVENT_RELOAD_TIMER: 90000     // 1.5 minutes
    },
    moment: {
      allowEmpty: true // allow empty dates
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    // special config for production
    ENV.APP.SDAPI_HOSTNAME = 'https://api.screwdriver.cd';
  }

  ENV['ember-simple-auth'] = {
    routeAfterAuthentication: 'home',
    routeIfAlreadyAuthenticated: 'home'
  };

  ENV['ember-cli-toggle'] = {
    includedThemes: ['light'],
    defaultTheme: 'light',
    defaultSize: 'small'
  };

  return ENV;
};
