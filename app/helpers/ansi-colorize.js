import Ember from 'ember';

/**
 * Transform ansi color codes to html tags
 * @method ansiColorize
 * @param  {Array}     params   Values passed to helper
 * @return {String}             Html string
 */
export function ansiColorize([message]) {
  const m = Ember.Handlebars.Utils.escapeExpression(message);

  return Ember.String.htmlSafe(ansi_up.ansi_to_html(m));
}

export default Ember.Helper.helper(ansiColorize);
