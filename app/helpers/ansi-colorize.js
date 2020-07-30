import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

const ansiUp = new AnsiUp();

// AnsiUp Configs:
ansiUp.escape_for_html = false;
ansiUp.use_classes = true;
ansiUp.url_whitelist = { http: 1, https: 1 };

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
