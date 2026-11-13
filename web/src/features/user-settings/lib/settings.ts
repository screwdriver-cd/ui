import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/client';

export type TimestampFormat = 'LOCAL_TIMEZONE' | 'UTC';
export const TIMESTAMP_FORMATS: TimestampFormat[] = ['LOCAL_TIMEZONE', 'UTC'];

/**
 * GET /users/settings. Numeric keys are per-pipeline preferences and must be written back untouched,
 * as must keys only Ember uses (`displayJobNameLength`: the React graph fits names itself).
 */
export interface UserSettings {
  timestampFormat?: TimestampFormat;
  allowNotification?: boolean;
  [pipelineId: string]: unknown;
}

/** One cache entry for /users/settings, shared by global and per-pipeline preferences. */
export const settingsKey = ['user-settings'] as const;

/**
 * Read-modify-write against the server copy (never the cache), so a stale cached
 * value can't overwrite a setting saved elsewhere moments ago. A failed read aborts
 * the save rather than writing back a partial object.
 */
export async function saveMergedSettings(
  patch: UserSettings
): Promise<UserSettings> {
  const fresh = await api.get<UserSettings>('/users/settings');
  const merged = { ...fresh, ...patch };

  await api.put('/users/settings', { settings: merged });

  return merged;
}

export function useUserSettings() {
  return useQuery({
    queryKey: settingsKey,
    // Like Ember: a failed load just means "no saved settings".
    queryFn: () =>
      api.get<UserSettings>('/users/settings').catch(() => ({}) as UserSettings)
  });
}

export function useSaveUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserSettings) => saveMergedSettings(patch),
    onSuccess: merged => queryClient.setQueryData(settingsKey, merged)
  });
}

export function useResetUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete('/users/settings'),
    onSuccess: () => queryClient.setQueryData(settingsKey, {})
  });
}
