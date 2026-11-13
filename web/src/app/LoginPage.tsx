import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from '~/api/client';
import { assetUrl } from '~/config/config';
import { login } from '~/auth/session';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { consumeAttemptedUrl } from './attempted-url';

export interface ScmContext {
  context: string;
  displayName: string;
  readOnly?: boolean;
  autoDeployKeyGeneration?: boolean;
}

export function useScmContexts() {
  return useQuery({
    queryKey: ['auth', 'contexts'],
    queryFn: () => api.get<ScmContext[]>('/auth/contexts'),
    staleTime: Infinity
  });
}

function SignInIcon() {
  return (
    <svg className="login-button__icon" viewBox="0 0 512 512" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
      />
    </svg>
  );
}

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data: contexts = [] } = useScmContexts();
  const writable = contexts.filter(c => !c.readOnly);

  const signIn = async (event: React.MouseEvent, scmContext?: string) => {
    event.preventDefault();
    await login(scmContext);
    window.location.assign(assetUrl(consumeAttemptedUrl() ?? '/'));
    void navigate;
  };

  return (
    <PageLayout>
      <div className="login-button">
        <h2>{t('login.title')}</h2>
        <p>{t('login.description')}</p>
        <p>{t('login.popupNotice')}</p>
        {writable.length > 0 ? (
          writable.map(scm => (
            <p key={scm.context}>
              <a href="#authenticate" onClick={e => signIn(e, scm.context)}>
                <SignInIcon /> {t('login.signInWith', { name: scm.displayName })}
              </a>
            </p>
          ))
        ) : (
          <a href="#authenticate" onClick={e => signIn(e)}>
            <SignInIcon /> {t('login.signInDefault')}
          </a>
        )}
      </div>
    </PageLayout>
  );
}
