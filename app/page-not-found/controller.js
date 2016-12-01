import Ember from 'ember';

export default Ember.Controller.extend({
  statusCode: 404,
  errorMessage: 'Unknown error',
  backgroundImage: Ember.computed('statusCode', {
    get() {
      let statusCode = this.get('statusCode');

      let image = '500-error-page.png';

      if (statusCode < 500) {
        image = '404-error-page.png';
      }

      return image;
    }
  })
});
