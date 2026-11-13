import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/client';

export interface ScmContext {
  context: string;
  displayName: string;
}

export function useScmContexts() {
  return useQuery({
    queryKey: ['scm-contexts'],
    // No catch: a cached [] would last the session (staleTime Infinity), while a failed read is
    // asked again on the next mount. Callers treat missing data as no contexts.
    queryFn: () => api.get<ScmContext[]>('/auth/contexts'),
    staleTime: Infinity
  });
}

/** `#` in a branch must be encoded when the repo url is used as a link (same as Ember's branch-url-encode). */
export const branchUrlEncode = (url: string | undefined) => (url ? url.replace(/#/g, '%23') : url);
