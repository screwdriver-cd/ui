import { screen } from '@testing-library/react';
import { mockFetch } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import type { Pipeline, SdEvent } from '../../types';
import { EventHistoryModal } from './EventHistoryModal';

afterEach(() => vi.unstubAllGlobals());

describe('EventHistoryModal', () => {
  it('reports a failed read instead of an empty history', async () => {
    mockFetch([[/\/pipelines\/1\/events$/, () => 500]]);
    renderWithProviders(
      <EventHistoryModal
        pipeline={{ id: 1, state: 'ACTIVE' } as Pipeline}
        event={
          { id: 9, pipelineId: 1, groupEventId: 9, type: 'pipeline' } as SdEvent
        }
        onClose={vi.fn()}
      />
    );

    expect(
      await screen.findByText('Something went wrong.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
