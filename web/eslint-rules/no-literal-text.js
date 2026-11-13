/**
 * Like formatjs/no-literal-string-in-jsx, but only reports strings that
 * contain a letter or digit. `{' '}`, `›`, `·`, `/` and emoji glyphs are layout, not
 * copy, and the formatjs rule cannot be told to ignore them.
 */
const HAS_WORD = /[\p{L}\p{N}]/u;
const ATTRS = new Set(['title', 'placeholder', 'alt', 'aria-label', 'aria-description']);

function check(context, node) {
  if (!node) {
    return;
  }
  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'string' && HAS_WORD.test(node.value)) {
        context.report({ node, messageId: 'literal' });
      }
      break;
    case 'TemplateLiteral':
      if (node.quasis.some(q => HAS_WORD.test(q.value.cooked ?? q.value.raw))) {
        context.report({ node, messageId: 'literal' });
      }
      break;
    case 'BinaryExpression':
      if (node.operator === '+') {
        check(context, node.left);
        check(context, node.right);
      }
      break;
    case 'ConditionalExpression':
      check(context, node.consequent);
      check(context, node.alternate);
      break;
    case 'LogicalExpression':
      check(context, node.left);
      check(context, node.right);
      break;
    default:
  }
}

export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: { literal: 'User-visible text must come from t(): add a key to the feature locales.' }
  },
  create(context) {
    return {
      JSXText(node) {
        if (HAS_WORD.test(node.value)) {
          context.report({ node, messageId: 'literal' });
        }
      },
      'JSXElement > JSXExpressionContainer'(node) {
        check(context, node.expression);
      },
      JSXAttribute(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : '';

        if (!ATTRS.has(name) || !node.value) {
          return;
        }
        if (node.value.type === 'Literal') {
          check(context, node.value);
        } else if (node.value.type === 'JSXExpressionContainer') {
          check(context, node.value.expression);
        }
      }
    };
  }
};
