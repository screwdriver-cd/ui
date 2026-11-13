import { useEffect, useState } from 'react';
import { validateYaml, type ValidationResult } from './validate';

const DEBOUNCE_MS = 250;

/** Validates `yaml` against the API (debounced, latest request wins). */
export function useValidation(yaml: string) {
  // The result is stored with the text it was computed for, so "pending" and
  // "empty" are derived during render instead of being set from the effect.
  const [settled, setSettled] = useState<{
    yaml: string;
    result: ValidationResult;
  } | null>(null);
  const hasText = Boolean(yaml.trim());

  useEffect(() => {
    if (!hasText) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      validateYaml(yaml, controller.signal).then(
        result => {
          // An answer can land after its abort; only the latest text may settle.
          if (!controller.signal.aborted) {
            setSettled({ yaml, result });
          }
        },
        () => {
          // aborted: a newer request is in flight
        }
      );
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [yaml, hasText]);

  return {
    result: hasText && settled ? settled.result : null,
    pending: hasText && settled?.yaml !== yaml
  };
}
