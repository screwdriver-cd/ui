import { api, ApiError, toSearch } from './client';
import { getSession } from '~/auth/session';

const jwt = (claims: object) =>
  `h.${btoa(JSON.stringify(claims))}.s`;

describe('toSearch', () => {
  it('serialises scalars, arrays as key[] and skips empty values', () => {
    expect(toSearch({ count: 10, ids: [1, 2], skip: undefined, none: null })).toBe(
      '?count=10&ids%5B%5D=1&ids%5B%5D=2'
    );
    expect(toSearch()).toBe('');
  });
});

describe('api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('sends the bearer token, credentials and JSON body', async () => {
    getSession().set({
      username: 'u',
      scope: ['user'],
      isGuest: false,
      token: jwt({ username: 'u', scope: ['user'] })
    });
    fetchMock.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));

    await expect(api.put('/pipelines/4', { settings: { public: true } })).resolves.toEqual({
      ok: true
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, any];

    expect(url).toBe('http://localhost:8080/v4/pipelines/4');
    expect(init.method).toBe('PUT');
    expect(init.credentials).toBe('include');
    expect(init.headers.Authorization).toMatch(/^Bearer /);
    expect(init.headers['Content-Type']).toContain('application/json');
    expect(init.body).toBe('{"settings":{"public":true}}');
  });

  it('targets the store host when asked', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await api.get('/builds/1/ARTIFACT-MANIFEST.json', { host: 'store' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8081/v1/builds/1/ARTIFACT-MANIFEST.json');
  });

  it('throws ApiError with the parsed body, and logs out on 401', async () => {
    getSession().set({
      username: 'u',
      scope: ['user'],
      isGuest: false,
      token: jwt({ username: 'u', scope: ['user'] })
    });
    fetchMock.mockResolvedValue(
      new Response('{"statusCode":401,"message":"nope"}', { status: 401 })
    );

    const error = (await api.get('/pipelines/4').catch(e => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('nope');
    expect(getSession().isAuthenticated).toBe(false);
  });

  it('keeps a session renewed while a request with the old token was pending', async () => {
    const user = { username: 'u', scope: ['user'], isGuest: false };
    let respond: (r: Response) => void = () => undefined;

    getSession().set({ ...user, token: jwt({ ...user, jti: 'old' }) });
    fetchMock.mockReturnValue(new Promise<Response>(resolve => (respond = resolve)));

    const pending = api.get('/pipelines/4').catch(e => e);

    getSession().set({ ...user, token: jwt({ ...user, jti: 'new' }) });
    respond(new Response('{"statusCode":401,"message":"nope"}', { status: 401 }));

    expect(((await pending) as ApiError).status).toBe(401);
    expect(getSession().isAuthenticated).toBe(true);
  });

  it('returns text for raw requests (build logs)', async () => {
    fetchMock.mockResolvedValue(new Response('line1\nline2', { status: 200 }));
    await expect(api.get('/builds/1/steps/x/logs', { raw: true })).resolves.toBe('line1\nline2');
  });
});
