import { Dropdown, Nav } from 'react-bootstrap';
import { SvgIcon } from '~/components/SvgIcon';
import { config } from '~/config/config';
import { useT } from '~/i18n/useT';

const BLOG_URL = 'http://blog.screwdriver.cd';
const GITHUB_URL = 'https://github.com/screwdriver-cd';

/** Documentation, community links and the running release version. */
export function HelpMenu() {
  const t = useT();

  return (
    <Dropdown as={Nav.Item} align="end">
      <Dropdown.Toggle as={Nav.Link} className="help-menu" aria-label={t('nav.help')}>
        <SvgIcon name="help-circle" size={20} />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href={config.docUrl} target="_blank" rel="noopener noreferrer" title={t('nav.docsTitle')}>
          {t('nav.docs')}
        </Dropdown.Item>
        <Dropdown.ItemText className="release text-muted">
          {t('nav.release', { version: config.releaseVersion })}
        </Dropdown.ItemText>
        <Dropdown.Divider />
        <Dropdown.Item href={BLOG_URL} target="_blank" rel="noopener noreferrer">
          {t('nav.blog')}
        </Dropdown.Item>
        <Dropdown.Item href={config.slackUrl} target="_blank" rel="noopener noreferrer">
          {t('nav.slack')}
        </Dropdown.Item>
        <Dropdown.Item href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          {t('nav.github')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
