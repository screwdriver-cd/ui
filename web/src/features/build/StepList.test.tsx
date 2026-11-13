import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '~/test/render';
import { StepList } from './StepList';

const steps = [
  { name: 'sd-setup-init', startTime: '2020-01-01T00:00:00Z', endTime: '2020-01-01T00:00:03Z', code: 0 },
  { name: 'install', startTime: '2020-01-01T00:00:03Z', endTime: '2020-01-01T00:01:05Z', code: 1 },
  { name: 'test', startTime: '2020-01-01T00:01:05Z' },
  { name: 'publish' },
  { name: 'sd-teardown-artifacts', startTime: '2020-01-01T00:02:00Z', endTime: '2020-01-01T00:02:01Z', code: 0 }
];

describe('StepList', () => {
  it('groups setup and teardown steps collapsed, user steps visible with status and duration', () => {
    renderWithProviders(<StepList steps={steps} selected={null} onSelect={() => undefined} />);

    expect(screen.queryByText('sd-setup-init')).toBeNull();
    expect(screen.queryByText('sd-teardown-artifacts')).toBeNull();
    expect(screen.getByRole('button', { name: /install/ })).toHaveTextContent('1m 2s');
    expect(within(screen.getByRole('button', { name: /install/ })).getByRole('img', { name: 'Failed' })).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /^.*test$/ })).getByRole('img', { name: 'Running' })).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /publish/ })).getByRole('img', { name: 'Not started' })).toBeInTheDocument();
  });

  it('expands the group holding the selected step and reports selection', async () => {
    const onSelect = vi.fn();

    renderWithProviders(<StepList steps={steps} selected="sd-setup-init" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /sd-setup-init/ }));
    expect(onSelect).toHaveBeenCalledWith('sd-setup-init');
    expect(screen.getByRole('button', { name: /sd-setup-init/ })).toHaveAttribute('aria-current', 'step');
  });

  it('toggles the teardown group', async () => {
    renderWithProviders(<StepList steps={steps} selected={null} onSelect={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: /Teardown/ }));
    expect(screen.getByText('sd-teardown-artifacts')).toBeInTheDocument();
  });
});
