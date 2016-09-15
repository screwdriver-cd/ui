import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// This isn't really an array method, but eslint thinks it is
/* eslint-disable array-callback-return */
Router.map(function route() {
  this.route('home', { path: '/' });
  this.route('build', { path: '/builds/:build_id' });
  this.route('pipeline', { path: '/pipelines/:pipeline_id' }, function secretsRoute() {
    this.route('secrets');
  });
  this.route('login');
  this.route('create');
  this.route('error', { path: '/*path' });
});
/* eslint-enable array-callback-return */

export default Router;
