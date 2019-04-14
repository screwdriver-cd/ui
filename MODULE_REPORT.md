## Module Report
### Unknown Global

**Global**: `Ember.Handlebars`

**Location**: `app/helpers/ansi-colorize.js` at line 19

```js
export function ansiColorize([message]) {
  // encode html content
  const m = Ember.Handlebars.Utils.escapeExpression(message);

  return htmlSafe(ansiUp.ansi_to_html(m));
```
