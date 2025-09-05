import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import { NotFoundError } from '../../utils/not-found-error';

export default Route.extend({
  router: service(),
  command: service(),
  model(params) {
    return RSVP.all([
      this.command.getOneCommand(params.namespace, params.name),
      this.command.getCommandTags(params.namespace, params.name)
    ]).then(arr => {
      const [verPayload, tagPayload] = arr;

      if (verPayload.length === 0) {
        throw new NotFoundError('Command not found');
      }

      tagPayload.forEach(tagObj => {
        const taggedVerObj = verPayload.find(
          verObj => verObj.version === tagObj.version
        );

        if (taggedVerObj) {
          taggedVerObj.tag = taggedVerObj.tag
            ? `${taggedVerObj.tag} ${tagObj.tag}`
            : tagObj.tag;
        }
      });

      const result = {};

      result.namespace = params.namespace;
      result.name = params.name;
      result.commandData = verPayload;
      result.commandTagData = tagPayload;

      return result;
    });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.reset();
  }
});
