import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// This isn't really an array method, but eslint thinks it is
/* eslint-disable array-callback-return */
Router.map(function route() {
  this.route('home', { path: '/' });
  this.route('builds', { path: '/builds/:build_id' });
  this.route('pipeline', { path: '/pipelines/:pipeline_id' }, function secretsRoute() {
    this.route('events');
    this.route('secrets');
    this.route('build', { path: 'builds/:build_id' });
    this.route('options');
    this.route('child-pipelines');
  });
  this.route('login');
  this.route('create');
  this.route('page-not-found', { path: '/*path' });
  this.route('search');
  this.route('user-settings');
  this.route('validator');

  this.route('dashboard', { path: '/dashboards/' }, function dashboardsRoute() {
    this.route('show', { path: '/:collection_id' });
  });
  this.route('templates', function templatesRoute() {
    this.route('namespace', { path: '/namespaces/:namespace' });
    this.route('detail', { path: '/namespaces/:namespace/names/:name' });
  });
  this.route('commands', function commandsRoute() {
    this.route('namespace', { path: '/namespaces/:namespace' });
    this.route('detail', { path: '/namespaces/:namespace/names/:name' });
  });
});
/* eslint-enable array-callback-return */

export default Router;
