import { useState, type KeyboardEvent } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Virtuoso } from 'react-virtuoso';
import { useT } from '~/i18n/useT';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  isSearchable,
  isValidSha,
  SEARCH_FIELDS,
  SEARCH_MAX_LENGTH,
  useEventSearch,
  type SearchField
} from '../../hooks/useEventSearch';
import type { Pipeline, SdEvent } from '../../types';
import { EventCard } from './EventCard';

export const SEARCH_DEBOUNCE_MS = 500;

interface Props {
  pipeline: Pipeline;
  isPr: boolean;
  lastSuccessfulEventId?: number;
  latestCommitSha?: string;
  allowEventAction?: boolean;
  onClose: () => void;
  /** Called when a result is chosen (the card also navigates to it). */
  onSelect?: (event: SdEvent) => void;
  debounceMs?: number;
}

/** "Search for an event": by commit message, sha, creator or commit author. */
export function SearchEventModal({
  pipeline,
  isPr,
  lastSuccessfulEventId,
  latestCommitSha,
  allowEventAction,
  onClose,
  onSelect,
  debounceMs = SEARCH_DEBOUNCE_MS
}: Props) {
  const t = useT();
  const [field, setField] = useState<SearchField>('message');
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input.trim(), debounceMs);
  const invalidSha =
    field === 'sha' && input.trim() !== '' && !isValidSha(input.trim());
  // Switching field or clearing the input must not keep showing the old field's matches.
  const active = isSearchable(field, input) ? debounced : '';
  const search = useEventSearch({
    pipelineId: pipeline.id,
    isPr,
    field,
    input: active
  });
  const results = search.data?.pages.flat() ?? [];
  const searching = active !== '' && (search.isPending || search.isFetching);

  const onKeyDown = (e: KeyboardEvent) => {
    // Escape clears the query first and only then closes the dialog.
    if (e.key === 'Escape' && input.length > 0) {
      e.stopPropagation();
      e.preventDefault();
      setInput('');
    }
  };

  return (
    <Modal
      show
      onHide={onClose}
      centered
      className="pipeline-modal"
      id="search-event-modal"
      onKeyDown={onKeyDown}
    >
      <Modal.Header closeButton>
        <Modal.Title as="h5">{t('pipeline.search.title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="search-description">{t('pipeline.search.description')}</p>
        <div id="search-input" className="d-flex gap-2 mb-2">
          <Form.Select
            id="search-field-select"
            aria-label={t('pipeline.search.field')}
            style={{ width: 'auto' }}
            value={field}
            onChange={e => setField(e.target.value as SearchField)}
          >
            {SEARCH_FIELDS.map(f => (
              <option key={f} value={f}>
                {t(`pipeline.search.field.${f}`)}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            type="search"
            autoFocus
            maxLength={SEARCH_MAX_LENGTH}
            aria-label={t('pipeline.search.input')}
            placeholder={t('pipeline.search.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>
        {invalidSha ? (
          <div className="invalid-sha text-danger" role="alert">
            {t('pipeline.search.invalidSha')}
          </div>
        ) : search.isError && results.length === 0 ? (
          <div className="no-results text-danger" role="alert">
            {t('common.error')}{' '}
            <Button
              variant="link"
              size="sm"
              className="p-0 align-baseline"
              onClick={() => void search.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="no-results text-muted" role="status">
            {searching ? (
              <Spinner size="sm" animation="border" />
            ) : (
              t('pipeline.search.noResults')
            )}
          </div>
        ) : (
          <div id="search-results" style={{ height: '50vh' }}>
            <Virtuoso<SdEvent>
              data={results}
              computeItemKey={(_, event) => event.id}
              endReached={() => {
                if (search.hasNextPage && !search.isFetchingNextPage) {
                  void search.fetchNextPage();
                }
              }}
              itemContent={(_, event) => (
                <EventCard
                  pipeline={pipeline}
                  event={event}
                  lastSuccessfulEventId={lastSuccessfulEventId}
                  latestCommitSha={latestCommitSha}
                  allowEventAction={allowEventAction}
                  onSelect={picked => {
                    onSelect?.(picked);
                    onClose();
                  }}
                />
              )}
            />
            {search.isFetchingNextPage ? (
              <div className="loading-more text-center">
                <Spinner size="sm" animation="border" />
              </div>
            ) : null}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          {t('pipeline.common.close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
