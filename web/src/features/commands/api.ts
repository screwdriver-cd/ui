import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '~/api/client';
import { formatTemplates } from '~/features/templates/format';
import type { TemplateItem, TemplateTag } from '~/features/templates/types';

const enc = encodeURIComponent;

export interface CommandVersion extends TemplateItem {
  format?: 'docker' | 'habitat' | 'binary' | string;
  docker?: { image?: string; command?: string };
  habitat?: { mode?: string; package?: string; command?: string };
  binary?: { file?: string };
  usage?: string;
}

export function useCommands(namespace?: string) {
  return useQuery({
    queryKey: ['commands', namespace ?? null],
    queryFn: async ({ signal }) => {
      const list = await api.get<CommandVersion[]>('/commands', {
        query: { compact: true, sortBy: 'createTime', namespace },
        signal
      });

      // One entry per command (the API returns every version).
      return formatTemplates(list, { dedupe: true }).map(c => ({ ...c, fullName: `${c.namespace}/${c.name}` }));
    }
  });
}

export function useCommand(namespace: string, name: string) {
  return useQuery({
    queryKey: ['command', namespace, name],
    queryFn: async ({ signal }) => {
      const [versions, tags] = await Promise.all([
        api.get<CommandVersion[]>(`/commands/${enc(namespace)}/${enc(name)}`, { signal }),
        api.get<TemplateTag[]>(`/commands/${enc(namespace)}/${enc(name)}/tags`, { signal })
      ]);

      if (versions.length === 0) {
        throw new ApiError(404, undefined, 'Command not found');
      }

      return {
        versions: versions.map(v => ({
          ...v,
          tag: tags
            .filter(t => t.version === v.version)
            .map(t => t.tag)
            .join(' ')
        })),
        tags
      };
    }
  });
}

export function useCommandMutations(namespace: string, name: string) {
  const qc = useQueryClient();
  const base = `/commands/${enc(namespace)}/${enc(name)}`;

  return {
    remove: useMutation({
      mutationFn: () => api.delete(base),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['commands'] })
    }),
    trust: useMutation({
      mutationFn: (trusted: boolean) => api.put(`${base}/trusted`, { trusted }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['command'] })
    })
  };
}
