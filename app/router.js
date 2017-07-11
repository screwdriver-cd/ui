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
  this.route('build', { path: '/builds/:build_id' }, function detailsRoute() {
    this.route('details');
  });
  this.route('pipeline', { path: '/pipelines/:pipeline_id' }, function secretsRoute() {
    this.route('secrets');
    this.route('builds', { path: '/' }, function buildRoute() {
      this.route('build', { path: 'builds/:build_id' });
    });
    this.route('options');
  });
  this.route('login');
  this.route('create');
  this.route('page-not-found', { path: '/*path' });
  this.route('search');
  this.route('user-settings');
  this.route('validator');
});
/* eslint-enable array-callback-return */

export default Router;
