'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    autoImport: {
      forbidEval: true
    },
    // Add options here
    'ember-font-awesome': {
      useScss: true // for ember-cli-sass
    },

    flatpickr: {
      theme: 'airbnb'
    },

    fingerprint: {
      exclude: ['supplementary_config', 'unknown_user']
    },

    svg: {
      paths: ['public/assets/svg']
    },

    ace: {
      // TODO: create screwdriver mode
      modes: ['yaml']
    },

    'ember-bootstrap': {
      bootstrapVersion: 3,
      importBootstrapFont: true,
      importBootstrapCSS: false
    },

    babel: {
      plugins: []
    }
  });

  app.import('node_modules/ansi_up/ansi_up.js');
  app.import('node_modules/humanize-duration/humanize-duration.js');
  app.import('node_modules/d3/dist/d3.min.js');
  app.import('node_modules/c3/c3.min.js');
  app.import('node_modules/c3/c3.min.css');
  app.import('node_modules/memoizerific/memoizerific.min.js');
  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
