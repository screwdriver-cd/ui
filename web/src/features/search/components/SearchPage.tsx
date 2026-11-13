import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { CloseButton } from 'react-bootstrap';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PageLayout } from '~/components/PageLayout';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import { CollectionDropdown } from '~/features/collections/components/CollectionDropdown';
import { CollectionsFlyout } from '~/features/collections/components/CollectionsFlyout';
import {
  searchPipelines,
  useCollectionMutations
} from '~/features/collections/lib/api';
import { pipelineEventsPath } from '~/features/collections/lib/links';
import { useDocumentTitle } from '~/features/collections/lib/useDocumentTitle';
import type {
  Collection,
  PipelineSummary
} from '~/features/collections/lib/types';
import { branchUrlEncode, useScmContexts } from '../lib/api';
import { SearchInput } from './SearchInput';
import { ScrollRegion } from '~/components/ScrollRegion';
import styles from '../search.module.scss';

// Pipelines of a monorepo share repo and branch; Ember tells them apart as `branch:rootDir`.
const searchBranch = ({ scmRepo }: PipelineSummary) =>
  scmRepo.rootDir ? `${scmRepo.branch}:${scmRepo.rootDir}` : scmRepo.branch;

export function SearchPage() {
  const t = useT();
  const navigate = useNavigate();
  const { query = '' } = useSearch({ strict: false }) as { query?: string };
  const isAuthenticated = useSession(s => s.isAuthenticated);
  const { data: contexts = [] } = useScmContexts();
  const { addPipelines } = useCollectionMutations();
  const [draft, setDraft] = useState(query);
  const [draftFor, setDraftFor] = useState(query);
  const [message, setMessage] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);

  useDocumentTitle(t('search.title'));
  // Follow the URL (back/forward, header search) without an effect.
  if (draftFor !== query) {
    setDraftFor(query);
    setDraft(query);
  }

  // The API matches the search term without whitespace.
  const term = query.replace(/\s/g, '');
  const pipelines = useInfiniteQuery({
    queryKey: ['search', term],
    queryFn: ({ pageParam }) => searchPipelines(term, pageParam),
    initialPageParam: 1,
    // Like Ember, page until one comes back empty: with several SCMs a page holds up to
    // NUM_PIPELINES_LISTED per SCM, so its size says nothing about what is left.
    getNextPageParam: (last, _all, lastPage) =>
      last.length > 0 ? lastPage + 1 : undefined
  });

  const rows: PipelineSummary[] = pipelines.data?.pages.flat() ?? [];
  const accountName = (context?: string) =>
    contexts.find(c => c.context === context)?.displayName ?? context ?? '';

  const submit = (value: string) => {
    navigate({
      to: '/search',
      search: { query: value.trim() || undefined }
    } as never);
  };

  const add = async (pipeline: PipelineSummary, collection: Collection) => {
    try {
      await addPipelines.mutateAsync({
        id: collection.id,
        pipelineIds: [pipeline.id]
      });
      setMessage({
        type: 'success',
        text: t('search.addSuccess', { name: collection.name })
      });
    } catch {
      setMessage({
        type: 'warning',
        text: t('search.addError', { name: collection.name })
      });
    }
  };

  return (
    <PageLayout scroll={false}>
      <div className={styles.layout} data-authenticated={isAuthenticated}>
        {isAuthenticated ? <CollectionsFlyout /> : null}
        <section className={styles.main} aria-label={t('search.title')}>
          <ScrollRegion>
            <div className={styles.list}>
              <div className={styles.toolbar}>
                <SearchInput
                  value={draft}
                  onChange={setDraft}
                  onSubmit={submit}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.placeholder')}
                />
              </div>
              {message ? (
                <div
                  className={`${styles.info} ${styles[message.type]}`}
                  role="alert"
                >
                  <span>{message.text}</span>
                  <CloseButton
                    className="ms-auto"
                    onClick={() => setMessage(null)}
                  />
                </div>
              ) : null}
              <div className={styles.numResults} aria-live="polite">
                {pipelines.isPending
                  ? t('common.loading')
                  : pipelines.isError
                  ? t('common.error')
                  : rows.length === 0
                  ? t('search.noResults')
                  : t('search.results', { count: rows.length })}
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.appId}>{t('search.column.name')}</th>
                    <th className={styles.branch}>
                      {t('search.column.branch')}
                    </th>
                    <th className={styles.account}>
                      {t('search.column.account')}
                    </th>
                    {isAuthenticated ? <th>{t('search.column.add')}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(pipeline => (
                    <tr key={pipeline.id}>
                      <td className={styles.appId}>
                        <Link
                          to={pipelineEventsPath(pipeline.id)}
                          title={pipeline.scmRepo.name}
                        >
                          {pipeline.scmRepo.name}
                        </Link>
                      </td>
                      <td className={styles.branch}>
                        <a
                          href={branchUrlEncode(pipeline.scmRepo.url)}
                          title={searchBranch(pipeline)}
                        >
                          <Icon name="codeBranch" /> {searchBranch(pipeline)}
                        </a>
                      </td>
                      <td className={styles.account}>
                        {accountName(pipeline.scmContext)}
                      </td>
                      {isAuthenticated ? (
                        <td>
                          <CollectionDropdown
                            ariaLabel={t('search.addTo', {
                              name: pipeline.scmRepo.name
                            })}
                            onSelect={collection => add(pipeline, collection)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {pipelines.hasNextPage ? (
                <button
                  type="button"
                  className={styles.showMore}
                  disabled={pipelines.isFetchingNextPage}
                  onClick={() => pipelines.fetchNextPage()}
                >
                  {t('search.showMore')}
                </button>
              ) : null}
            </div>
          </ScrollRegion>
        </section>
      </div>
    </PageLayout>
  );
}
