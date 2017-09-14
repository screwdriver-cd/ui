/* eslint-env node */
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
      SDSTORE_HOSTNAME: 'http://localhost:80',
      SDSTORE_NAMESPACE: 'v1',
      BUILD_RELOAD_TIMER: 5000, // 5 seconds
      EVENT_RELOAD_TIMER: 90000, // 1.5 minutes
      LOG_RELOAD_TIMER: 1000,
      NUM_EVENTS_LISTED: 5,
      MAX_LOG_LINES: 1000
    },
    moment: {
      allowEmpty: true // allow empty dates
    }
  };

  if (environment === 'development') {
    ENV.APP.EVENT_RELOAD_TIMER = 5000;
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
    ENV.APP.SDSTORE_HOSTNAME = 'https://store.screwdriver.cd';
  }

  ENV['ember-toggle'] = {
    defaultSize: 'small'
  };

  return ENV;
};
