import { api } from '~/api/client';
import { getToken } from '~/auth/session';
import { apiBase } from '~/config/config';
import { saveMergedSettings } from '~/features/user-settings/lib/settings';
import type { Pipeline, SdEvent, Secret, Token } from '../types';

export interface StartEventBody {
  pipelineId: number;
  startFrom: string;
  startAction:
    | 'START_FROM_LATEST_COMMIT'
    | 'START_FROM_EVENT'
    | 'RESTART_FROM_EVENT';
  causeMessage: string;
  parentEventId?: number;
  groupEventId?: number;
  prNum?: number;
  sha?: string;
  meta?: { parameters: Record<string, unknown> };
}

/**
 * POST /events. The API answers 201 with the event, or 200 plus an
 * X-Status-Message header when there was no job to start; the shared client
 * hides headers so this one reads the Response itself.
 */
export async function startEvent(
  body: StartEventBody
): Promise<{ event: SdEvent; statusMessage: string | null }> {
  const token = getToken();
  const response = await fetch(`${apiBase()}/events`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw Object.assign(
      new Error(
        parsed?.message ?? `Request failed with status ${response.status}`
      ),
      {
        status: response.status
      }
    );
  }

  return {
    event: parsed as SdEvent,
    statusMessage: response.headers.get('X-Status-Message')
  };
}

export const stopEvent = (eventId: number) =>
  api.put(`/events/${eventId}/stop`);
export const stopBuild = (buildId: number) =>
  api.put(`/builds/${buildId}`, { status: 'ABORTED' });

export const updatePipeline = (
  pipelineId: number,
  body: Record<string, unknown>
) => api.put<Pipeline>(`/pipelines/${pipelineId}`, body);

export const syncPipeline = (
  pipelineId: number,
  type: 'webhooks' | 'pullrequests' | 'pipeline'
) =>
  api.post(
    `/pipelines/${pipelineId}/sync${type === 'pipeline' ? '' : `/${type}`}`
  );

export const deletePipeline = (pipelineId: number) =>
  api.delete(`/pipelines/${pipelineId}`);

export const startAllChildren = (pipelineId: number) =>
  api.post(`/pipelines/${pipelineId}/startall`);

export const createSecret = (body: {
  pipelineId: number;
  name: string;
  value: string;
  allowInPR: boolean;
}) => api.post<Secret>('/secrets', body);
export const updateSecret = (
  id: number,
  body: { value?: string; allowInPR?: boolean }
) => api.put<Secret>(`/secrets/${id}`, body);
export const deleteSecret = (id: number) => api.delete(`/secrets/${id}`);

export interface TokenBody {
  name: string;
  description?: string;
  expiresAt?: string;
  options?: { permission: string };
}

export const createToken = (pipelineId: number, body: TokenBody) =>
  api.post<Token>(`/pipelines/${pipelineId}/tokens`, body);
export const updateToken = (
  pipelineId: number,
  tokenId: number,
  body: Partial<TokenBody>
) => api.put<Token>(`/pipelines/${pipelineId}/tokens/${tokenId}`, body);
export const refreshToken = (
  pipelineId: number,
  tokenId: number,
  body: { expiresAt?: string }
) => api.put<Token>(`/pipelines/${pipelineId}/tokens/${tokenId}/refresh`, body);
export const deleteToken = (pipelineId: number, tokenId: number) =>
  api.delete(`/pipelines/${pipelineId}/tokens/${tokenId}`);

export const setJobState = (
  jobId: number,
  state: 'ENABLED' | 'DISABLED',
  message: string
) => api.put(`/jobs/${jobId}`, { state, stateChangeMessage: message || ' ' });

export const clearCache = (
  pipelineId: number,
  scope: 'pipelines' | 'jobs',
  cacheId: number
) =>
  api.delete(`/pipelines/${pipelineId}/caches`, { query: { scope, cacheId } });

/** Merges the patch into the server copy of the settings; returns the saved object. */
export const saveUserSettings = (patch: Record<string, unknown>) =>
  saveMergedSettings(patch);
