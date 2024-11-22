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
      this.route('jobs', function jobsRoute() {
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
    this.route('pipeline', function pipelineTemplate() {
      this.route(
        'namespace',
        { path: '/:namespace' },
        function namespaceRoute() {
          this.route('index', { path: '/' });
        }
      );

      this.route(
        'detail',
        { path: '/:namespace/:name' },
        function pipelineTemplateDetail() {
          this.route('index', { path: '/' });
          this.route('version', { path: '/:version' });
        }
      );
    });

    this.route('job', function jobTemplate() {
      this.route(
        'namespace',
        { path: '/:namespace' },
        function namespaceRoute() {
          this.route('index', { path: '/' });
        }
      );

      this.route(
        'detail',
        { path: '/:namespace/:name' },
        function jobTemplateDetail() {
          this.route('index', { path: '/' });
          this.route('version', { path: '/:version' });
        }
      );

      this.route('template-usage', {
        path: '/:namespace/:name/:version/usage'
      });
    });

    // backward compatibility:
    // 1) /templates/namespace to /templates/job/namespace
    // 2) /templates/namespace/name to /templates/job/namespace/name
    /* eslint-disable ember/no-shadow-route-definition */
    this.route('catch-all', { path: '/*path' });
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

  this.route('v2', function v2Route() {
    this.route('index', { path: '/' });
    this.route(
      'pipeline',
      { path: '/pipelines/:pipeline_id' },
      function pipelinesRoute() {
        this.route('secrets');
        this.route('options');
        this.route('metrics');

        this.route('events', function eventsRoute() {
          this.route('show', { path: '/:event_id' });
        });
        this.route('jobs');
        this.route('pulls', function pullsRoute() {
          this.route('show', { path: '/:pull_request_number' });
        });
        this.route(
          'build',
          { path: 'builds/:build_id' },
          function buildRoute() {}
        );
      }
    );
  });
});
/* eslint-enable array-callback-return */

export default Router;
