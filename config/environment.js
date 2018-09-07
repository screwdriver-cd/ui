'use strict';

module.exports = (environment) => {
  let ENV = {
    modulePrefix: 'screwdriver-ui',
    environment,
    rootURL: '/',
    locationType: 'auto',
    contentSecurityPolicyHeader: 'Content-Security-Policy',
    contentSecurityPolicy: {
      'style-src': [
        "'self'",
        // Glimmer [ember] and ACE Editor [validator] add styles to elements at run time, this makes it impossible to precalculate all possible shas for inline styles
        "'unsafe-inline'"
      ],
      'connect-src': [
        "'self'"
      ],
      // JSTree web worker
      'worker-src': [
        'blob:'
      ],
      'img-src': [
        "'self'",
        'https:',
        // ace editor
        'data:',
        // github avatars
        '*.githubusercontent.com',
        // bitbucket avatars
        'bitbucket.org/account/*/avatar/*'
      ]
    },
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
      SDSTORE_HOSTNAME: 'http://localhost:8081',
      SDSTORE_NAMESPACE: 'v1',
      BUILD_RELOAD_TIMER: 5000, // 5 seconds
      EVENT_RELOAD_TIMER: 60000, // 1 minutes
      LOG_RELOAD_TIMER: 1000,
      NUM_EVENTS_LISTED: 5,
      MAX_LOG_LINES: 1000,
      MAX_LOG_PAGES: 10,
      FORCE_RELOAD_WAIT: 100 // Wait 100ms before force reload
    },
    moment: {
      allowEmpty: true // allow empty dates
    }
  };

  if (environment === 'development') {
    const localAppConfig = require('./local.js'); // eslint-disable-line global-require

    if (localAppConfig) {
      Object.assign(ENV.APP, localAppConfig);
    }

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
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
    ENV.APP.SDAPI_HOSTNAME = 'https://api.screwdriver.cd';
    ENV.APP.SDSTORE_HOSTNAME = 'https://store.screwdriver.cd';
  }

  ENV['ember-toggle'] = {
    defaultSize: 'small'
  };

  ENV.contentSecurityPolicy['connect-src'].push(ENV.APP.SDAPI_HOSTNAME);
  ENV.contentSecurityPolicy['connect-src'].push(ENV.APP.SDSTORE_HOSTNAME);

  return ENV;
};
