import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  errorMessage: '',
  pipelines: reads('model.pipelines'),
  pipeline: reads('model.pipeline')
});
