/**
 * True when an Enter keydown belongs to an IME composition (confirming a
 * conversion candidate) and must not be treated as "submit".
 * keyCode 229 covers browsers that report isComposing=false on that keydown.
 */
export function isImeEnter(event: { key: string; keyCode?: number; nativeEvent?: { isComposing?: boolean } }) {
  return event.key === 'Enter' && (event.nativeEvent?.isComposing === true || event.keyCode === 229);
}
