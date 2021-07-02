import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  queryParams: {
    selectedPipelineId: {
      refreshModel: true
    },
    selectedConnectedPipelineId: {
      refreshModel: false
    }
  },
  routeAfterAuthentication: 'pipeline-visualizer',
  titleToken: 'Pipeline Visualizer',

  async model(params) {
    this._super(...arguments);
    const { selectedPipelineId, selectedConnectedPipelineId } = params;
    console.log('selectedPipelineId', selectedPipelineId, 'selectedConnectedPipelineId', selectedConnectedPipelineId);

    let model = {};

    try {
      let selectedPipeline = null;
      let selectedConnectedPipeline = null;

      if (selectedPipelineId) {
        selectedPipeline = await this.store.findRecord('pipeline', selectedPipelineId);
        model.selectedPipeline = selectedPipeline;
      }

      try {
        if (selectedPipeline && selectedConnectedPipelineId) {
          if (selectedPipelineId === selectedConnectedPipelineId) {
            selectedConnectedPipeline = selectedPipeline;
          } else {
            selectedConnectedPipeline = await this.store.findRecord('pipeline', selectedConnectedPipelineId);
          }

          model.selectedConnectedPipeline = selectedConnectedPipeline;
        }
      } catch (e) {
        console.log('err from selectedConnectedPipelineId', e);
      }

    } catch (e) {
      console.log('err from route', e);
    } finally {
      return model;
    }
  },

  setupController(controller, model) {
    this._super(...arguments);
    const { selectedPipeline, selectedConnectedPipeline } = model;

    if (selectedPipeline) {
      controller.setProperties({ selectedPipeline, selectedConnectedPipeline });
      controller.selectPipeline(selectedPipeline);
    }
  }
});
