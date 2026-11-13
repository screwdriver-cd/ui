import { Link, useNavigate } from '@tanstack/react-router';
import { Dropdown, Nav } from 'react-bootstrap';
import { login, logout, useSession } from '~/auth/session';
import { Icon } from '~/components/Icon';
import { config } from '~/config/config';
import { useT } from '~/i18n/useT';
import { useScmContexts } from './LoginPage';

/** Initial-letter badge: the API exposes no avatar URL for the signed-in user (Ember shows avatars only on other users' links). */
function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Signed-in users get a menu (accounts, settings, sign out). Guests and
 * signed-out visitors get a plain "Sign in" link.
 */
export function ProfileMenu() {
  const t = useT();
  const navigate = useNavigate();
  const data = useSession(s => s.data);
  const { data: contexts = [] } = useScmContexts();

  if (!data || data.isGuest) {
    return (
      <Nav.Link as={Link} to="/login" title={t('nav.signInTitle')} className="sign-in">
        {t('nav.signIn')}
      </Nav.Link>
    );
  }

  return (
    <Dropdown as={Nav.Item} align="end">
      <Dropdown.Toggle as={Nav.Link} className="profile-menu" aria-label={t('nav.profile')}>
        {config.showAvatar ? <Avatar name={data.username} /> : null}
        <span className="username">{data.username}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Header>{t('nav.accounts')}</Dropdown.Header>
        {contexts
          .filter(c => !c.readOnly)
          .map(c =>
            c.context === data.scmContext ? (
              <Dropdown.ItemText key={c.context} className="active-account">
                {c.displayName}{' '}
                <Icon name="circleCheck" className="text-success" title={t('nav.accountActive')} />
                <span className="visually-hidden">{t('nav.accountActive')}</span>
              </Dropdown.ItemText>
            ) : (
              <Dropdown.Item key={c.context} as="button" className="inactive-account" onClick={() => void login(c.context)}>
                {c.displayName}
              </Dropdown.Item>
            )
          )}
        <Dropdown.Divider />
        <Dropdown.Item as={Link} to="/user-settings" title={t('nav.userSettings')}>
          {t('nav.userSettings')}
        </Dropdown.Item>
        <Dropdown.Item
          as="button"
          title={t('nav.signOutTitle')}
          onClick={async () => {
            await logout();
            void navigate({ to: '/login' });
          }}
        >
          {t('nav.signOut')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
