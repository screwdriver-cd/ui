import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import Ember from 'ember';

const ansiUp = new AnsiUp();

// Prevent double-encoding
ansiUp.escape_for_html = false;
ansiUp.use_classes = true;

/**
 * Transform ansi color codes to html tags
 * @method ansiColorize
 * @param  {Array}     params   Values passed to helper
 * @return {String}             Html string
 */
export function ansiColorize([message]) {
  // encode html content
  const m = Ember.Handlebars.Utils.escapeExpression(message);

  return htmlSafe(ansiUp.ansi_to_html(m));
}

export default helper(ansiColorize);
