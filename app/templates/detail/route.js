import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  template: service(),
  model(params) {
    return RSVP.all(
      this.get('template').getOneTemplate(params.name),
      this.get('template').getTemplateTags(params.name)
    ).then((arr) => {
      const [verPayload, tagPayload] = arr;

      tagPayload.forEach((tagObj) => {
        const verObj = verPayload.find(version => verPayload.version === tagPayload.version);
        if (verObj.tag !== undefined) {
          verObj.tag += ` ${tagObj.tag}`;
        } else {
          verObj.tag = tagObj.tag;
        }
      });

      return versions;
    })
  }
});
