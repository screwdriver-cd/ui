import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { printAST } from '@formatjs/icu-messageformat-parser/printer.js';

const FROM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TO = 'àƀçðéƒĝĥîĵķļɱñöþǫŕšţûṿŵẋýžÀƁÇÐÉƑĜĤÎĴĶĻṀÑÖÞǪŔŠŢÛṼŴẊÝŽ';
const MAP = new Map([...FROM].map((char, i) => [char, [...TO][i] as string]));

const accent = (text: string) => [...text].map(char => MAP.get(char) ?? char).join('');

function transform(elements: MessageFormatElement[]): MessageFormatElement[] {
  return elements.map(element => {
    switch (element.type) {
      case TYPE.literal:
        return { ...element, value: accent(element.value) };
      case TYPE.plural:
      case TYPE.select:
        return {
          ...element,
          options: Object.fromEntries(
            Object.entries(element.options).map(([key, option]) => [
              key,
              { ...option, value: transform(option.value) }
            ])
          )
        } as MessageFormatElement;
      case TYPE.tag:
        return { ...element, children: transform(element.children) };
      default:
        return element;
    }
  });
}

/**
 * Accents letters and pads by ~40% so layouts that only fit English text
 * show up. Placeholders, plural/select keywords and tags are preserved
 * because only literal text nodes of the parsed ICU message are changed.
 */
export function pseudoLocalize(message: string): string {
  const printed = printAST(transform(parse(message)));
  const pad = '~'.repeat(Math.ceil(message.length * 0.4));

  return `[${printed} ${pad}]`;
}

export function pseudoLocalizeAll(messages: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(messages).map(([id, text]) => [id, pseudoLocalize(text)])
  );
}
