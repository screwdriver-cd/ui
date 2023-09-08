import EmberRouter from '@ember/routing/router';
import config from 'screwdriver-ui/config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// This isn't really an array method, but eslint thinks it is
/* eslint-disable array-callback-return */
Router.map(function route() {
  this.route('home', { path: '/' });
  this.route('builds', { path: '/builds/:build_id' });
  this.route(
    'pipeline',
    { path: '/pipelines/:pipeline_id' },
    function secretsRoute() {
      this.route('jobs', function eventsRoute() {
        this.route('index', { path: '/' });
      });
      this.route('events', function eventsRoute() {
        this.route('show', { path: '/:event_id' });
      });
      this.route('secrets');
      this.route('build', { path: 'builds/:build_id' }, function stepsRoute() {
        this.route('index', { path: '/' });
        this.route('step', { path: 'steps/:step_id' });
        this.route('artifacts', function artifactsRoute() {
          this.route('index', { path: '/' });
          this.route('detail', { path: '/*file_path' });
        });
      });
      this.route('options');
      this.route('child-pipelines');
      this.route('pulls');
      this.route('metrics');
      this.route(
        'job-latest-build',
        { path: 'jobs/:job_name' },
        function latestJobRoute() {
          this.route('index', { path: '/' });
          this.route('artifacts', function artifactsRoute() {
            this.route('index', { path: '/' });
            this.route('detail', { path: '/*file_path' });
          });
          this.route('steps', { path: 'steps/:step_name' });
        }
      );
    }
  );
  this.route('login');
  this.route('create');
  this.route('page-not-found', { path: '/*path' });
  this.route('search');
  this.route('user-settings', function userSettingsRoute() {
    this.route('index', { path: '/' });
    this.route('access-tokens');
    this.route('preferences');
  });
  this.route('validator');

  this.route('dashboard', { path: '/dashboards' }, function dashboardsRoute() {
    this.route('index', { path: '/' });
    this.route('show', { path: '/:collection_id' });
  });
  this.route('templates', function templatesRoute() {
    this.route('namespace', { path: '/:namespace' });
    this.route('detail', { path: '/:namespace/:name' }, function detailRoute() {
      this.route('index', { path: '/' });
      this.route('version', { path: '/:version' });
    });
    this.route('template-usage', { path: '/:namespace/:name/:version/usage' });
  });
  this.route('commands', function commandsRoute() {
    this.route('namespace', { path: '/:namespace' });
    this.route('detail', { path: '/:namespace/:name' }, function detailRoute() {
      this.route('index', { path: '/' });
      this.route('version', { path: '/:version' });
    });
  });
  /* eslint-disable ember/no-shadow-route-definition */
  this.route('404', { path: '/*path' });

  this.route('pipeline-visualizer');
});
/* eslint-enable array-callback-return */

export default Router;
