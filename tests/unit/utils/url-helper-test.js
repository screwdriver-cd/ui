import { module, test } from 'qunit';
import {
  doesTextContainsLink,
  transformTextToClickableContent
} from 'screwdriver-ui/utils/url-helper';

const string =
  'Lorem ipsum dolor sit amet, https://abc.com consectetur adipiscing elit, sed do <img src="lorem" />eiusmod tempor incididunt ut <script>document.getElementById("lorem").innerHTML = "lorem epsum!";</script> http://xyz.org labore et dolore magna aliqua.';

const expectedTransformText =
  'Lorem ipsum dolor sit amet, <a href="https://abc.com" target="_blank" rel="noopener noreferrer">https://abc.com</a> consectetur adipiscing elit, sed do eiusmod tempor incididunt ut  <a href="http://xyz.org" target="_blank" rel="noopener noreferrer">http://xyz.org</a> labore et dolore magna aliqua.';

module('Unit | Utility | url-helper', function () {
  test('it checks if string contains a link', function (assert) {
    const isTextLinkable = doesTextContainsLink(string);

    assert.equal(isTextLinkable, true);
  });

  test('it makes links in a string clickable', function (assert) {
    const transformText = transformTextToClickableContent(string);

    assert.deepEqual(transformText, expectedTransformText);
  });
});
