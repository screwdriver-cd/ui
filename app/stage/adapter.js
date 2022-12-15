import BaseAdapter from 'screwdriver-ui/application/adapter';
import { inject as service } from '@ember/service';

export default BaseAdapter.extend({
  shuttle: service(),

  // eslint-disable-next-line no-unused-vars
  findHasMany(store, snapshot, url, relationship) {
    const { id } = snapshot;
    const type = snapshot.modelName;
    const finalURL = this.urlPrefix(
      url,
      this.buildURL(type, id, snapshot, 'findHasMany')
    );

    return this.ajax(finalURL, 'GET');
  },

  // eslint-disable-next-line no-unused-vars
  handleResponse(status, headers, payload, requestData) {
    return this._super(...arguments);
  },

  async queryRecord(store, type, query) {
    const { pipelineId, eventId } = query;

    const data = await this.shuttle.fetchStages(pipelineId, eventId);

    return data;
  },

  query(store, type, query) {
    const { pipelineId, eventId } = query;

    return this.shuttle.fetchStages(pipelineId, eventId);
  }
});
