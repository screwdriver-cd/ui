import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-step-collection'],
  autoscroll: true,

  /**
   * Set up scroll listener when component has been rendered
   * @method didRender
   */
  didRender() {
    this._super(...arguments);

    const w = this.$(window);
    const d = this.$(window.document);

    d.scroll(() => {
      const scrollPercentage = ((d.scrollTop() + w.height()) / d.height()) * 100;

      if (scrollPercentage > 99) {
        Ember.run(() => this.set('autoscroll', true));
      } else {
        Ember.run(() => this.set('autoscroll', false));
      }
    });
  },

  /**
   * Remove scroll listener when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);
    this.$(window.document).off('scroll');
  }
});
