const KEY = 'sd-attempted-url';

/** Where to return after login (ember-simple-auth's `attemptedTransition`). */
export function rememberAttemptedUrl(url: string) {
  try {
    sessionStorage.setItem(KEY, url);
  } catch {
    // not remembered
  }
}

export function consumeAttemptedUrl(): string | null {
  try {
    const url = sessionStorage.getItem(KEY);

    sessionStorage.removeItem(KEY);

    return url;
  } catch {
    return null;
  }
}
