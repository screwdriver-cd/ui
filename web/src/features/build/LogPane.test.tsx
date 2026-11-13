import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockLayout } from '~/test/layout';
import { patchProperty } from '~/test/patch';
import { renderWithProviders } from '~/test/render';
import { LogPane, formatLogTime } from './LogPane';

const lines = [
  { t: Date.UTC(2020, 0, 1, 10, 0, 0), m: '\u001b[31mred text\u001b[0m', n: 0 },
  { t: Date.UTC(2020, 0, 1, 10, 0, 5), m: '<script>alert(1)</script>', n: 1 }
];

describe('LogPane', () => {
  beforeEach(() => mockLayout());
  afterEach(() => vi.restoreAllMocks());

  it('renders ANSI colours and escapes HTML', () => {
    renderWithProviders(
      <LogPane lines={lines} stepName="test" inProgress={false} buildStartTime="2020-01-01T10:00:00Z" />
    );
    const log = screen.getByTestId('build-log');

    expect(within(log).getByText('red text')).toHaveStyle({ color: 'rgb(187, 0, 0)' });
    expect(log.querySelector('script')).toBeNull();
    expect(within(log).getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });

  it('shows a placeholder message instead of lines', () => {
    renderWithProviders(<LogPane lines={[]} message="Click a step to see logs" stepName={null} inProgress />);
    expect(screen.getByText('Click a step to see logs')).toBeInTheDocument();
  });

  it('cycles and remembers the timestamp format', async () => {
    renderWithProviders(<LogPane lines={lines} stepName="test" inProgress={false} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Local Timestamp' }));
    expect(screen.getByRole('button', { name: 'UTC Timestamp' })).toBeInTheDocument();
    expect(screen.getByText('10:00:00')).toBeInTheDocument();
    expect(localStorage.getItem('screwdriver.logs.timeFormat')).toBe('datetimeUTC');
  });

  it('only offers download once the step is done', async () => {
    const { rerender } = renderWithProviders(<LogPane lines={lines} stepName="test" inProgress />);

    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
    rerender(<LogPane lines={lines} stepName="test" inProgress={false} />);
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('refuses to download a partial log when the earlier lines fail to load, and lets the user retry', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');

    patchProperty(URL, 'createObjectURL', { value: createObjectURL });
    patchProperty(URL, 'revokeObjectURL', { value: vi.fn() });
    const onLoadAll = vi
      .fn<() => Promise<typeof lines>>()
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce(lines);
    const user = userEvent.setup();

    renderWithProviders(<LogPane lines={lines.slice(1)} stepName="test" inProgress={false} hasEarlier onLoadAll={onLoadAll} />);
    await user.click(screen.getByRole('button', { name: 'Download', expanded: false }));
    const submit = screen.getAllByRole('button', { name: 'Download' }).at(-1)!;

    await user.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the whole log. Try again.');
    expect(createObjectURL).not.toHaveBeenCalled();

    await user.click(submit);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(await (createObjectURL.mock.calls[0] as unknown as [Blob])[0].text()).toBe('\u001b[31mred text\u001b[0m\n<script>alert(1)</script>\n');
  });

  it('localises the toolbar', () => {
    renderWithProviders(<LogPane lines={lines} stepName="test" inProgress={false} />, { locale: 'ja' });
    expect(screen.getByRole('button', { name: 'ローカル時刻' })).toBeInTheDocument();
  });
});

describe('formatLogTime', () => {
  const t = Date.UTC(2020, 0, 1, 10, 1, 5);

  it('formats elapsed times from build and step start', () => {
    expect(formatLogTime('datetimeUTC', t, undefined, undefined, 'en')).toBe('10:01:05');
    expect(formatLogTime('elapsedBuild', t, t - 65_000, undefined, 'en')).toMatch(/1m\s*5s/);
    expect(formatLogTime('elapsedStep', t, undefined, t - 3000, 'en')).toMatch(/3s/);
    expect(formatLogTime('datetime', undefined, 0, 0, 'en')).toBe('');
  });
});
