import { Icon } from '~/components/Icon';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { api } from '~/api/client';
import { PageLayout } from '~/components/PageLayout';
import { ScrollRegion } from '~/components/ScrollRegion';
import { WorkflowGraph, type JobAction } from '~/features/workflow-graph';
import { useT } from '~/i18n/useT';
import {
  connectedPipelineIds,
  mergeGraphs,
  pipelineNodeNames,
  type VizPipeline
} from '../lib/merge';
import styles from '../visualizer.module.scss';

const fetchPipeline = (id: string | number) =>
  api.get<VizPipeline>(`/pipelines/${id}`);

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);

  useEffect(() => {
    const h = setTimeout(() => setV(value), ms);

    return () => clearTimeout(h);
  }, [value, ms]);

  return v;
}

export function VisualizerPage() {
  const t = useT();
  const navigate = useNavigate();
  const { selectedPipelineId, selectedConnectedPipelineId } = useSearch({
    strict: false
  }) as {
    selectedPipelineId?: string;
    selectedConnectedPipelineId?: string;
  };
  const [text, setText] = useState('');
  const [composing, setComposing] = useState(false);
  const term = useDebounced(composing ? '' : text.trim(), 500);

  const results = useQuery({
    queryKey: ['visualizer', 'search', term],
    enabled: term.length > 0,
    queryFn: () =>
      api.get<VizPipeline[]>('/pipelines', {
        query: {
          page: 1,
          count: 50,
          sort: 'ascending',
          sortBy: 'name',
          search: term
        }
      })
  });

  const selected = useQuery({
    queryKey: ['visualizer', 'pipeline', selectedPipelineId],
    enabled: Boolean(selectedPipelineId),
    queryFn: () => fetchPipeline(selectedPipelineId as string)
  });
  const ids = useMemo(
    () => (selected.data ? connectedPipelineIds(selected.data) : []),
    [selected.data]
  );
  const connectedQueries = useQueries({
    queries: ids.map(id => ({
      queryKey: ['visualizer', 'pipeline', id],
      queryFn: () => fetchPipeline(id)
    }))
  });
  const connected = connectedQueries.flatMap(q => (q.data ? [q.data] : []));
  const connectedKey = connectedQueries
    .map(q => (q.data ? `${q.data.id}@${q.dataUpdatedAt}` : ''))
    .join(',');
  const graph = useMemo(
    () => (selected.data ? mergeGraphs(selected.data, connected) : null),
    // `connected` is a fresh array every render; ids plus fetch times identify the content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected.data, connectedKey]
  );
  const highlightId = selectedConnectedPipelineId ?? selectedPipelineId;
  // Choosing a connected pipeline emphasises its nodes in the merged graph.
  const focusId =
    selectedConnectedPipelineId &&
    selectedConnectedPipelineId !== selectedPipelineId
      ? selectedConnectedPipelineId
      : null;
  const highlightNodes = useMemo(
    () => (graph && focusId ? pipelineNodeNames(graph, focusId) : null),
    [graph, focusId]
  );
  const all = selected.data ? [selected.data, ...connected] : [];

  const select = (id: string | number, connectedId?: string | number) =>
    navigate({
      to: '/pipeline-visualizer',
      search: {
        selectedPipelineId: String(id),
        selectedConnectedPipelineId: String(connectedId ?? id)
      }
    });

  // The router honours the ROOT_URL basepath, so this is a client-side navigation like the pipeline pages'.
  const onJobAction = (action: JobAction) => {
    if (action.type === 'open-external') {
      navigate({ to: `/v2/pipelines/${action.pipelineId}` as never });
    }
  };

  return (
    <PageLayout scroll={false}>
      <div className={styles.layout}>
        <ScrollRegion className={styles.nav} style={{ flex: '0 0 16.667%' }}>
          <h4 className={styles.title}>{t('visualizer.pipeline')}</h4>
          <input
            className={styles.search}
            type="search"
            value={text}
            placeholder={t('visualizer.searchPlaceholder')}
            aria-label={t('visualizer.searchPlaceholder')}
            onChange={e => setText(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={e => {
              setComposing(false);
              setText(e.currentTarget.value);
            }}
          />
          <ul className={styles.list} aria-label={t('visualizer.results')}>
            {(results.data ?? []).map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={() => select(p.id)}
                >
                  {p.scmRepo?.name ?? p.name ?? p.id}
                </button>
              </li>
            ))}
          </ul>
          <h4 className={styles.title}>{t('visualizer.connected')}</h4>
          <ul className={styles.list}>
            {all.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.row}${
                    String(p.id) === highlightId ? ` ${styles.selected}` : ''
                  }`}
                  aria-current={String(p.id) === highlightId}
                  onClick={() => select(selectedPipelineId as string, p.id)}
                >
                  <span className={styles.ok} aria-hidden="true">
                    <Icon name="check" />
                  </span>
                  {p.scmRepo?.name ?? p.name ?? p.id}
                </button>
              </li>
            ))}
          </ul>
        </ScrollRegion>
        <div className={styles.canvas}>
          {graph ? (
            <WorkflowGraph
              graph={graph}
              readOnly
              onJobAction={onJobAction}
              highlightNodes={highlightNodes}
            />
          ) : (
            <p className={styles.empty}>{t('visualizer.empty')}</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
