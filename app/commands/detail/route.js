import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  command: service(),
  model(params) {
    return RSVP.all([
      this.command.getOneCommand(params.namespace, params.name),
      this.command.getCommandTags(params.namespace, params.name)
    ]).then(arr => {
      const [verPayload, tagPayload] = arr;

      if (params.version) {
        const versionExists = verPayload.filter(t => t.version === params.version);
        const tagExists = tagPayload.filter(c => c.tag === params.version);

        if (tagExists.length === 0 && versionExists.length === 0) {
          this.transitionTo('/404');
        }
      }

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag ? `${taggedVerObj.tag} ${tagObj.tag}` : tagObj.tag;
        }
      });

      let result = {};

      result.commandData = verPayload;
      result.versionOrTagFromUrl = params.version;
      result.commandTagData = tagPayload;

      return result;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  },
  actions: {
    error(error) {
      if (error.status === 404) {
        this.transitionTo('/404');
      }

      return true;
    }
  }
});
