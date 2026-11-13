/**
 * Runtime configuration. Same keys and defaults as the Ember app's
 * config/environment.js `APP` block, overridden by
 * `window.SUPPLEMENTARY_CONFIG` (served by nginx from env vars).
 */
export interface AppConfig {
  rootURL: string;
  apiHost: string;
  apiNamespace: string;
  storeHost: string;
  storeNamespace: string;
  docUrl: string;
  slackUrl: string;
  releaseVersion: string;
  showAvatar: boolean;
  downloadArtifactDir: boolean;
  feedbackHostname: string;
  feedbackScript: string;
  feedbackConfig: string;
  buildReloadTimer: number;
  eventReloadTimer: number;
  logReloadTimer: number;
  maxLogLines: number;
  defaultLogPageSize: number;
}

type Supplementary = Partial<Record<string, string | number | boolean>>;

declare global {
  interface Window {
    SUPPLEMENTARY_CONFIG?: Supplementary;
  }
}

const toBool = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return value === true || value === 'true' || value === '1' || value === 1;
};

const toInt = (value: unknown, fallback: number) => {
  const n = parseInt(String(value), 10);

  return Number.isNaN(n) ? fallback : n;
};

const toStr = (value: unknown, fallback: string) =>
  value === undefined || value === null || value === '' ? fallback : String(value);

export function readConfig(supplementary: Supplementary = {}): AppConfig {
  const s = supplementary;
  const rootURL = toStr(s.ROOT_URL, '/').replace(/\/+$/, '');

  return {
    rootURL: rootURL === '' ? '/' : rootURL,
    apiHost: toStr(s.SDAPI_HOSTNAME, 'http://localhost:8080'),
    apiNamespace: toStr(s.SDAPI_NAMESPACE, 'v4'),
    storeHost: toStr(s.SDSTORE_HOSTNAME, 'http://localhost:8081'),
    storeNamespace: toStr(s.SDSTORE_NAMESPACE, 'v1'),
    docUrl: toStr(s.SDDOC_URL, 'http://docs.screwdriver.cd'),
    slackUrl: toStr(s.SLACK_URL, 'http://slack.screwdriver.cd'),
    releaseVersion: toStr(s.RELEASE_VERSION, 'stable'),
    showAvatar: toBool(s.SHOW_AVATAR, true),
    downloadArtifactDir: toBool(s.DOWNLOAD_ARTIFACT_DIR, true),
    feedbackHostname: toStr(s.FEEDBACK_HOSTNAME, ''),
    feedbackScript: toStr(s.FEEDBACK_SCRIPT, ''),
    feedbackConfig: toStr(s.FEEDBACK_CONFIG, ''),
    buildReloadTimer: toInt(s.BUILD_RELOAD_TIMER, 5000),
    eventReloadTimer: toInt(s.EVENT_RELOAD_TIMER, 60000),
    logReloadTimer: toInt(s.LOG_RELOAD_TIMER, 3000),
    maxLogLines: 1000,
    defaultLogPageSize: 10
  };
}

export const config: AppConfig = readConfig(
  typeof window === 'undefined' ? {} : window.SUPPLEMENTARY_CONFIG
);

export const apiBase = () => `${config.apiHost}/${config.apiNamespace}`;
export const storeBase = () => `${config.storeHost}/${config.storeNamespace}`;

/** URL for a static file under /assets, honouring ROOT_URL (nginx only rewrites html and css). */
export function assetUrl(path: string): string {
  const root = config.rootURL === '/' ? '' : config.rootURL;

  return `${root}${path}`;
}
