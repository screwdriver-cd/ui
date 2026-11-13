import { Icon } from '~/components/Icon';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { api } from '~/api/client';
import { useT } from '~/i18n/useT';
import { sanitizeHtml } from '../utils/sanitize';

export interface Banner {
  id: number;
  message: string;
  type?: string;
  isActive?: boolean;
  scope?: 'GLOBAL' | 'PIPELINE';
  scopeId?: number | null;
}

const STALE = 5 * 60_000;

/**
 * Pipeline banners first, then global ones, like Ember's banners service. Without a pipeline:
 * the global banners alone (Ember's app-body shows them on every page).
 */
export function useBanners(pipelineId?: number): Banner[] {
  const global = useQuery({
    queryKey: ['banners', 'GLOBAL'],
    staleTime: STALE,
    queryFn: () =>
      api
        .get<Banner[]>('/banners', {
          query: { isActive: true, scope: 'GLOBAL' }
        })
        .catch(() => [] as Banner[])
  });
  const pipeline = useQuery({
    queryKey: ['banners', pipelineId],
    staleTime: STALE,
    enabled: pipelineId !== undefined,
    queryFn: () =>
      api
        .get<Banner[]>('/banners', {
          query: { isActive: true, scope: 'PIPELINE', scopeId: pipelineId }
        })
        .catch(() => [] as Banner[])
  });

  return [
    ...(pipelineId !== undefined ? pipeline.data ?? [] : []),
    ...(global.data ?? [])
  ];
}

/** One banner at a time with "n of m" and previous/next when there are several. */
export function PipelineBanners({ pipelineId }: { pipelineId?: number }) {
  const t = useT();
  const banners = useBanners(pipelineId);
  const [index, setIndex] = useState(0);

  if (banners.length === 0) {
    return null;
  }

  const current = Math.min(index, banners.length - 1);
  const banner = banners[current] as Banner;
  const step = (delta: number) =>
    setIndex((current + delta + banners.length) % banners.length);

  return (
    <Alert
      variant="info"
      className="pipeline-banners d-flex align-items-center gap-2 m-0 py-2 rounded-0 border-0"
      id="banners"
    >
      <div id="banner" className="flex-grow-1" role="status">
        <span aria-hidden="true">
          <Icon name="circleInfo" />{' '}
        </span>
        <span
          className="message"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(banner.message) }}
        />
      </div>
      <div id="banner-controls" className="d-flex align-items-center gap-1">
        <span id="banner-count">
          {t('pipeline.banners.count', {
            index: current + 1,
            total: banners.length
          })}
        </span>
        {banners.length > 1 ? (
          <>
            <Button
              id="previous-banner"
              size="sm"
              variant="outline-primary"
              aria-label={t('pipeline.banners.previous')}
              onClick={() => step(-1)}
            >
              <Icon name="chevronLeft" />
            </Button>
            <Button
              id="next-banner"
              size="sm"
              variant="outline-primary"
              aria-label={t('pipeline.banners.next')}
              onClick={() => step(1)}
            >
              <Icon name="chevronRight" />
            </Button>
          </>
        ) : null}
      </div>
    </Alert>
  );
}
