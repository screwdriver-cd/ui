import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '~/test/render';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('cannot be dismissed while the request runs', async () => {
    let resolve: () => void = () => undefined;
    const onConfirm = vi.fn(() => new Promise<void>(r => (resolve = r)));
    const onClose = vi.fn();

    renderWithProviders(
      <ConfirmModal
        title="Start"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    resolve();
  });

  it('can be dismissed again after the request fails', async () => {
    const onClose = vi.fn();

    renderWithProviders(
      <ConfirmModal
        title="Start"
        confirmLabel="Yes"
        onConfirm={() => Promise.reject(new Error('nope'))}
        onClose={onClose}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('nope')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
