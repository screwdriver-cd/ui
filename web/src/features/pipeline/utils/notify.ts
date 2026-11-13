const FROM = ['QUEUED', 'RUNNING'];
const ICONS: Record<string, string> = {
  SUCCESS: '✅',
  FAILURE: '❌',
  ABORTED: '⛔'
};

/** Same rule as Ember's event card: only a running event that reached a final status notifies. */
export function shouldNotify(
  before: string | undefined,
  next: string,
  allowed: boolean
): boolean {
  return (
    allowed &&
    before !== undefined &&
    FROM.includes(before) &&
    next in ICONS &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  );
}

export function notifyBuildStatus(
  pipelineName: string | undefined,
  eventId: number,
  next: string
) {
  const notification = new Notification(`SD.cd ${pipelineName ?? ''}`.trim(), {
    body: `${ICONS[next]} ${next}: Event ${eventId}`,
    icon: '/assets/icons/android-chrome-144x144.png'
  });

  notification.onclick = () => window.focus();
}
