import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import timeRange from 'screwdriver-ui/utils/time-range';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  router: service(),
  template: service(),
  templateData: null,
  templateDataFiltered: null,
  templateTagData: null,
  startTime: null,
  endTime: null,
  fetchAll: true,
  fetchFiltered: false,
  init() {
    this._super(...arguments);
    const { startTime, endTime } = timeRange(new Date(), '1yr');

    // these are used for querying, so they are in ISO8601 format
    this.set('startTime', startTime);
    this.set('endTime', endTime);

    this.set('fetchAll', true);
    this.set('fetchFiltered', false);
  },
  afterModel() {
    this.set('fetchAll', false);
    this.set('fetchFiltered', false);
  },
  model(params) {
    this._super(...arguments);

    const { startTime, endTime, fetchAll, fetchFiltered } = this;

    return RSVP.all([
      fetchAll
        ? this.template.getOneTemplateWithMetrics(
            `${params.namespace}/${params.name}`
          )
        : RSVP.resolve(this.templateData),
      fetchAll || fetchFiltered
        ? this.template.getOneTemplateWithMetrics(
            `${params.namespace}/${params.name}`,
            {
              startTime,
              endTime
            }
          )
        : RSVP.resolve(this.templateDataFiltered),
      fetchAll
        ? this.template.getTemplateTags(params.namespace, params.name)
        : this.templateTagData
    ]).then(arr => {
      let [templateData, templateDataFiltered, templateTagData] = arr;

      templateData = templateData.filter(t => t.namespace === params.namespace);

      if (templateData.length === 0) {
        this.router.transitionTo('/404');
      }

      templateTagData.forEach(tagObj => {
        [templateData, templateDataFiltered].forEach(verPayload => {
          const taggedVerObj = verPayload.find(
            verObj => verObj.version === tagObj.version
          );

          if (taggedVerObj) {
            taggedVerObj.tag = taggedVerObj.tag
              ? `${taggedVerObj.tag} ${tagObj.tag}`
              : tagObj.tag;
          }
        });
      });

      this.setProperties({
        templateData,
        templateTagData,
        templateDataFiltered
      });

      return {
        namespace: params.namespace,
        name: params.name,
        templateData,
        templateTagData,
        templateDataFiltered,
        filter: {
          startTime,
          endTime
        }
      };
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  },
  actions: {
    setFetchDates(startTime, endTime) {
      this.set('startTime', startTime);
      this.set('endTime', endTime);
      this.set('fetchFiltered', true);
      this.refresh();
    },
    refreshModel: function refreshModel() {
      this.set('fetchAll', true);
      this.refresh();
    },
    error(error) {
      if (error.status === 404) {
        this.router.transitionTo('/404');
      }

      return true;
    }
  }
});
