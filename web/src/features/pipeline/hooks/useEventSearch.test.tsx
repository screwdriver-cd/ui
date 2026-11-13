import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { mockFetch, signIn, signOut } from '~/test/feature-router';
import type { SdEvent } from '../types';
import {
  isSearchable,
  isValidSha,
  SEARCH_PAGE_SIZE,
  type SearchField,
  useEventSearch
} from './useEventSearch';

const events = (from: number, count: number) =>
  Array.from(
    { length: count },
    (_, i) => ({ id: from + i, pipelineId: 1 }) as SdEvent
  );
const param = (c: { search: string }, name: string) =>
  new URLSearchParams(c.search).get(name);

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

const search = (
  opts: Partial<{
    pipelineId: number;
    isPr: boolean;
    field: SearchField;
    input: string;
  }> = {}
) =>
  renderHook(
    props =>
      useEventSearch({
        pipelineId: 1,
        isPr: false,
        field: 'message',
        input: 'fix',
        ...props
      }),
    { wrapper, initialProps: opts }
  );

describe('isValidSha', () => {
  it('accepts 1 to 40 lowercase hex characters', () => {
    expect(isValidSha('a')).toBe(true);
    expect(isValidSha('deadbeef')).toBe(true);
    expect(isValidSha('0'.repeat(40))).toBe(true);
  });

  it('rejects uppercase, non-hex, empty and over-long input', () => {
    expect(isValidSha('DEADBEEF')).toBe(false);
    expect(isValidSha('xyz')).toBe(false);
    expect(isValidSha('')).toBe(false);
    expect(isValidSha('0'.repeat(41))).toBe(false);
  });
});

describe('isSearchable', () => {
  it('needs non-blank input', () => {
    expect(isSearchable('message', '   ')).toBe(false);
    expect(isSearchable('message', ' fix ')).toBe(true);
  });

  it('only accepts a hex sha for the sha field, after trimming', () => {
    expect(isSearchable('sha', 'not-a-sha')).toBe(false);
    expect(isSearchable('sha', ' abc123 ')).toBe(true);
    // Other fields take any text.
    expect(isSearchable('creator', 'not-a-sha')).toBe(true);
  });
});

describe('useEventSearch', () => {
  beforeEach(() => signIn());
  afterEach(() => signOut());

  it('asks for the first page with the field, the trimmed input and the event type', async () => {
    const { calls } = mockFetch([
      [/\/pipelines\/7\/events$/, () => events(1, 3)]
    ]);
    const { result } = search({
      pipelineId: 7,
      field: 'author',
      input: '  bruce  '
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls).toHaveLength(1);
    expect(param(calls[0]!, 'author')).toBe('bruce');
    expect(param(calls[0]!, 'type')).toBe('pipeline');
    expect(param(calls[0]!, 'page')).toBe('1');
    expect(param(calls[0]!, 'count')).toBe(String(SEARCH_PAGE_SIZE));
    expect(result.current.data?.pages[0]).toHaveLength(3);
  });

  it('searches PR events in PR mode', async () => {
    const { calls } = mockFetch([[/\/events$/, () => []]]);
    const { result } = search({ isPr: true, field: 'sha', input: 'abc' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(param(calls[0]!, 'type')).toBe('pr');
    expect(param(calls[0]!, 'sha')).toBe('abc');
  });

  it('does not call the API for blank input or an invalid sha', async () => {
    const { calls } = mockFetch([[/\/events$/, () => []]]);
    const blank = search({ input: '   ' });
    const badSha = search({ field: 'sha', input: 'ABC' });

    // Give any (wrongly) enabled query a chance to fire.
    await act(async () => {});
    expect(calls).toHaveLength(0);
    expect(blank.result.current.fetchStatus).toBe('idle');
    expect(badSha.result.current.fetchStatus).toBe('idle');
  });

  it('pages on while pages are full and stops at a short page', async () => {
    const { calls } = mockFetch([
      [
        /\/events$/,
        url =>
          url.searchParams.get('page') === '1'
            ? events(1, SEARCH_PAGE_SIZE)
            : events(100, 4)
      ]
    ]);
    const { result } = search();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(param(calls[1]!, 'page')).toBe('2');
    expect(result.current.hasNextPage).toBe(false);
  });

  it('runs a fresh search when the input changes', async () => {
    const { calls } = mockFetch([[/\/events$/, () => []]]);
    const { result, rerender } = search({ input: 'one' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ input: 'two' });
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(param(calls[1]!, 'message')).toBe('two');
    expect(param(calls[1]!, 'page')).toBe('1');
  });

  it('treats inputs that differ only by surrounding spaces as the same search', async () => {
    const { calls } = mockFetch([[/\/events$/, () => []]]);
    const { result, rerender } = search({ input: 'fix' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ input: ' fix  ' });
    await act(async () => {});
    expect(calls).toHaveLength(1);
  });
});
