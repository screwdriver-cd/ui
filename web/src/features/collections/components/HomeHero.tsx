import { assetUrl } from '~/config/config';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import styles from '../collections.module.scss';

const QUICKSTARTS = [
  {
    name: 'node.js',
    url: 'https://github.com/screwdriver-cd-test/quickstart-nodejs'
  },
  {
    name: 'ruby',
    url: 'https://github.com/screwdriver-cd-test/quickstart-ruby'
  },
  {
    name: 'go',
    url: 'https://github.com/screwdriver-cd-test/quickstart-golang'
  },
  {
    name: 'generic',
    url: 'https://github.com/screwdriver-cd-test/quickstart-generic'
  }
];

export function HomeHero() {
  const t = useT();
  const [forkUrl, setForkUrl] = useState(QUICKSTARTS[0]!.url);

  return (
    <div className={styles.hero} data-testid="home-hero">
      <div className={styles.heroTop}>
        <img src={assetUrl('/assets/svg/Screwdriver_Icon_Full.svg')} alt="" />
        <h1>{t('collections.home.title')}</h1>
        <span>{t('collections.home.tagline')}</span>
      </div>
      <div className={styles.heroStart}>
        <div>
          <h2>{t('collections.home.steps')}</h2>
          <ul>
            <li>
              <span className={styles.heroNum} aria-hidden="true">
                {1}
              </span>
              <span>
                {t('collections.home.step1.prefix')}{' '}
                <select
                  aria-label={t('collections.home.step1.language')}
                  value={forkUrl}
                  onChange={event => setForkUrl(event.target.value)}
                >
                  {QUICKSTARTS.map(item => (
                    <option key={item.name} value={item.url}>
                      {item.name}
                    </option>
                  ))}
                </select>{' '}
                <a href={forkUrl} target="_blank" rel="noopener noreferrer">
                  {t('collections.home.step1.fork')}
                </a>
              </span>
            </li>
            <li>
              <span className={styles.heroNum} aria-hidden="true">
                {2}
              </span>
              <span>
                <Link to="/create">{t('collections.home.step2.link')}</Link>{' '}
                {t('collections.home.step2.suffix')}
              </span>
            </li>
            <li>
              <span className={styles.heroNum} aria-hidden="true">
                {3}
              </span>
              <span>{t('collections.home.step3')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
