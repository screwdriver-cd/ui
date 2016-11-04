/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
    'ember-font-awesome': {
      useScss: true // for ember-cli-sass
    },
    fingerprint: {
      exclude: ['supplementary_config', 'unknown_user']
    },
    svg: {
      paths: ['public/assets/svg']
    }
  });

  app.import('./bower_components/ansi_up/ansi_up.js');
  app.import('./bower_components/humanize-duration/humanize-duration.js');

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
