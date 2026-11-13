import { onTestFinished } from 'vitest';

/**
 * Redefines `key` on `target` for the current test only, restoring it when the test finishes,
 * pass or fail. Call it from a test or a `beforeEach`. `vi.stubGlobal` covers globals; this is
 * for prototypes and objects such as `navigator`.
 */
export function patchProperty(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor
) {
  const original = Object.getOwnPropertyDescriptor(target, key);

  Object.defineProperty(target, key, { configurable: true, ...descriptor });
  onTestFinished(() => {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  });
}
