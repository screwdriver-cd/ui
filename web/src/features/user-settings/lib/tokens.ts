import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/client';

export interface Token {
  id: number;
  name: string;
  description?: string;
  lastUsed?: string | null;
  expiresAt?: string | null;
  value?: string;
  options?: { permission?: string };
}

export const PERMISSIONS = ['read', 'execute', 'write', 'all'] as const;

export type ExpiryKey = 'day1' | 'day30' | 'day90' | 'year1' | 'never';
export const EXPIRY_KEYS: ExpiryKey[] = [
  'day1',
  'day30',
  'day90',
  'year1',
  'never'
];

/** ISO date for the option, or '' for "No expiration" (what the API expects). */
export function expiresAt(key: ExpiryKey, now = new Date()): string {
  const date = new Date(now);

  switch (key) {
    case 'day1':
      date.setDate(date.getDate() + 1);
      break;
    case 'day30':
      date.setDate(date.getDate() + 30);
      break;
    case 'day90':
      date.setDate(date.getDate() + 90);
      break;
    case 'year1':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return '';
  }

  return date.toISOString();
}

export const tokensKey = ['tokens'] as const;

export function useTokens() {
  return useQuery({
    queryKey: tokensKey,
    queryFn: () => api.get<Token[]>('/tokens')
  });
}

export function useTokenMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: tokensKey });

  return {
    create: useMutation({
      mutationFn: (body: {
        name: string;
        description?: string;
        expiresAt: string;
        options: { permission: string };
      }) => api.post<Token>('/tokens', body),
      onSuccess: refresh
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...body
      }: {
        id: number;
        name?: string;
        description?: string;
        expiresAt?: string;
        options?: { permission: string };
      }) => api.put<Token>(`/tokens/${id}`, body),
      onSuccess: refresh
    }),
    refreshValue: useMutation({
      mutationFn: ({
        id,
        expiresAt: expires
      }: {
        id: number;
        expiresAt?: string;
      }) =>
        api.put<Token>(
          `/tokens/${id}/refresh`,
          expires === undefined ? {} : { expiresAt: expires }
        ),
      onSuccess: refresh
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/tokens/${id}`),
      onSuccess: refresh
    })
  };
}
