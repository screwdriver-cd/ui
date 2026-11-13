import { assetUrl } from '~/config/config';
import { Link, Outlet, useParams } from '@tanstack/react-router';
import { PipelineBanners } from '~/features/pipeline/components/PipelineBanners';
import { Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useLocale } from '~/i18n/I18nProvider';
import { SUPPORTED_LOCALES } from '~/i18n/locale';
import { SvgIcon } from '~/components/SvgIcon';
import { useT } from '~/i18n/useT';
import { useSession } from '~/auth/session';
import { HeaderSearch } from './HeaderSearch';
import { HelpMenu } from './HelpMenu';
import { ProfileMenu } from './ProfileMenu';

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ja: '日本語' };

export function AppShell() {
  const t = useT();
  // Guests are "authenticated" for the API but cannot create pipelines.
  const canCreate = useSession(s => s.isAuthenticated && !s.data?.isGuest);
  const { locale, setLocale } = useLocale();
  // Pipeline pages show their own strip (pipeline banners, then the global ones).
  const { pipelineId } = useParams({ strict: false }) as { pipelineId?: string };

  return (
    <div className="app-shell">
      <header>
        <Navbar expand="md" variant="dark" style={{ background: 'var(--sd-header-bg)' }} className="px-3">
          <Navbar.Brand as={Link} to="/" title={t('nav.home')}>
            <img src={assetUrl("/assets/svg/Screwdriver_Logo_FullWhite.svg")} alt={t('nav.brand')} height={28} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="app-nav" />
          <Navbar.Collapse id="app-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                {t('nav.collection')}
              </Nav.Link>
              <Dropdown as={Nav.Item}>
                <Dropdown.Toggle as={Nav.Link} className="tools">
                  {t('nav.tools')}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/validator">
                    {t('nav.validator')}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/templates/job">
                    {t('nav.jobTemplate')}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/templates/pipeline">
                    {t('nav.pipelineTemplate')}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/commands">
                    {t('nav.commands')}
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/pipeline-visualizer">
                    {t('nav.visualizer')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              {canCreate ? (
                <Nav.Link as={Link} to="/create" className="create-pipeline">
                  <SvgIcon name="add-circle" size={20} className="me-1" />
                  {t('nav.createPipeline')}
                </Nav.Link>
              ) : null}
            </Nav>
            <HeaderSearch />
            <Nav className="align-items-md-center">
              <HelpMenu />
              <Dropdown as={Nav.Item} align="end">
                <Dropdown.Toggle as={Nav.Link} aria-label={t('nav.language')}>
                  {LANGUAGE_NAMES[locale] ?? locale}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {SUPPORTED_LOCALES.map(code => (
                    <Dropdown.Item key={code} active={code === locale} onClick={() => setLocale(code)}>
                      {LANGUAGE_NAMES[code]}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <ProfileMenu />
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        {pipelineId === undefined ? <PipelineBanners /> : null}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
