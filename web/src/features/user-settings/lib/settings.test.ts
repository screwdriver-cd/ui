import { api } from '~/api/client';
import { saveMergedSettings } from './settings';

vi.mock('~/api/client', () => ({ api: { get: vi.fn(), put: vi.fn() } }));

describe('saveMergedSettings', () => {
  it('merges the patch into the server copy, not a cached one', async () => {
    vi.mocked(api.get).mockResolvedValue({
      timestampFormat: 'UTC',
      '9': { showPRJobs: false }
    });
    vi.mocked(api.put).mockResolvedValue({});

    const saved = await saveMergedSettings({ '1': { showPRJobs: true } });

    expect(api.put).toHaveBeenCalledWith('/users/settings', {
      settings: {
        timestampFormat: 'UTC',
        '9': { showPRJobs: false },
        '1': { showPRJobs: true }
      }
    });
    expect(saved).toEqual({
      timestampFormat: 'UTC',
      '9': { showPRJobs: false },
      '1': { showPRJobs: true }
    });
  });

  it('does not write when the fresh read fails', async () => {
    vi.mocked(api.put).mockClear();
    vi.mocked(api.get).mockRejectedValue(new Error('boom'));

    await expect(
      saveMergedSettings({ timestampFormat: 'UTC' })
    ).rejects.toThrow('boom');
    expect(api.put).not.toHaveBeenCalled();
  });
});
