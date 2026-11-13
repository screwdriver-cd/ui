import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from '../routes';

const parent = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};
const child = (id: number, name: string, state: string) => ({
  id,
  name,
  scmContext: 'github:github.com',
  scmRepo: { name, branch: 'master', url: `https://github.com/${name}` },
  state
});

function render(
  children: object[] | object[][],
  startAll: number | (() => Response) = 201
) {
  // Several pages when given a list of pages; the API answers past the end with an empty page.
  const pages = (
    Array.isArray(children[0]) ? children : [children]
  ) as object[][];
  const mocks = mockFetch([
    [/\/pipelines\/1$/, () => parent],
    [/\/pipelines\/3$/, () => ({})],
    [
      /\/pipelines\/1\/startall$/,
      typeof startAll === 'number' ? () => startAll : startAll
    ],
    [
      /\/pipelines$/,
      url => pages[Number(url.searchParams.get('page') ?? 1) - 1] ?? []
    ],
    [
      /\/auth\/contexts$/,
      () => [{ context: 'github:github.com', displayName: 'github.com' }]
    ],
    [/\/users\/settings$/, () => ({})]
  ]);

  return renderFeature(createRoutes, '/v2/pipelines/1/child-pipelines').then(
    () => mocks
  );
}

const forbidden = (message: string) =>
  new Response(JSON.stringify({ statusCode: 403, message }), { status: 403 });

describe('child pipelines', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('shows branch links, accounts, states and deletes an inactive child', async () => {
    const { fn } = await render([
      child(2, 'child/one', 'ACTIVE'),
      child(3, 'child/two', 'INACTIVE')
    ]);
    const table = await screen.findByRole('table');

    expect(await within(table).findByText('child/one')).toBeInTheDocument();
    expect(
      screen.getByText(/one or more inactive pipelines/)
    ).toBeInTheDocument();
    expect(
      within(table).getAllByRole('link', { name: /master/ })[0]
    ).toHaveAttribute('href', 'https://github.com/child/one');
    expect(within(table).getAllByText('github.com')).toHaveLength(2);
    expect(within(table).getByText('Inactive')).toBeInTheDocument();
    expect(
      within(table).queryByRole('button', { name: 'Delete child/one' })
    ).toBeNull();

    await userEvent.click(
      within(table).getByRole('button', { name: 'Delete child/two' })
    );
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Delete' });

    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByRole('textbox'), 'child/two');
    await userEvent.click(confirm);
    await waitFor(() =>
      expect(
        fn.mock.calls.some(
          ([url, init]) =>
            String(url).endsWith('/pipelines/3') && init?.method === 'DELETE'
        )
      ).toBe(true)
    );
  });

  it('disables start all when no child is active', async () => {
    await render([child(3, 'child/two', 'INACTIVE')]);

    expect(await screen.findByText('child/two')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start all child pipelines' })
    ).toBeDisabled();
  });

  it('lists children past the first page and counts them all', async () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      child(10 + i, `child/c${i}`, 'ACTIVE')
    );

    await render([many.slice(0, 50), many.slice(50)]);

    expect(await screen.findByText('child/c59')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Start all child pipelines' })
    );
    expect(await screen.findByRole('dialog')).toHaveTextContent('60');
  });

  it('closes start all instead of offering a retry when only some children started', async () => {
    const { fn } = await render([child(2, 'child/one', 'ACTIVE')], () =>
      forbidden(
        'Failed to start some child pipelines due to lack of permissions.'
      )
    );
    const startAlls = () =>
      fn.mock.calls.filter(([url]) => String(url).endsWith('/startall'));

    await userEvent.click(
      await screen.findByRole('button', { name: 'Start all child pipelines' })
    );
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Start all child pipelines'
      })
    );

    expect(
      await screen.findByText(/Some child pipelines could not be started/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(startAlls()).toHaveLength(1);
  });

  it('keeps start all open with the error when the user cannot start any child', async () => {
    await render([child(2, 'child/one', 'ACTIVE')], () =>
      forbidden('User alice does not have push permission for this repo')
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Start all child pipelines' })
    );
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Start all child pipelines' })
    );

    expect(
      await within(dialog).findByText(
        'User alice does not have push permission for this repo'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Some child pipelines could not be started/)
    ).toBeNull();
  });
});
