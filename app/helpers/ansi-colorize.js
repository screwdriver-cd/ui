import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/template';

const ansiUp = new AnsiUp();

ansiUp.use_classes = true;

/**
 * Transform ansi color codes to html tags
 * @method ansiColorize
 * @param  {Array}     params   Values passed to helper
 * @return {String}             Html string
 */
export function ansiColorize([message]) {
  return htmlSafe(ansiUp.ansi_to_html(message));
}

export default helper(ansiColorize);
