import { useState } from 'react';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { useDocumentTitle } from '~/features/collections/lib/useDocumentTitle';
import { useValidation } from '../lib/useValidation';
import { ValidatorResults } from './ValidatorResults';
import { YamlEditor } from './YamlEditor';
import styles from '../validator.module.scss';

export function ValidatorPage() {
  const t = useT();
  const [yaml, setYaml] = useState('');
  const { result, pending } = useValidation(yaml);

  useDocumentTitle(t('validator.title'));

  return (
    <PageLayout scroll={false}>
      <div className={styles.split}>
        <div className={styles.pane}>
          <section
            className={`${styles.pane} ${styles.inputPane}`}
            aria-label={t('validator.input.title')}
          >
            <div className={styles.paneHeader}>
              <h2>{t('validator.input.title')}</h2>
            </div>
            <p className={styles.hint}>{t('validator.input.hint')}</p>
            <YamlEditor
              value={yaml}
              onChange={setYaml}
              label={t('validator.input.editorLabel')}
            />
          </section>
        </div>
        <div className={styles.pane}>
          <section
            className={`${styles.pane} ${styles.resultsPane}`}
            aria-label={t('validator.results.title')}
            aria-busy={pending}
          >
            <div className={styles.paneHeader}>
              <h2 className="visually-hidden">
                {t('validator.results.title')}
              </h2>
              {pending ? (
                <span className={styles.hint}>
                  {t('validator.results.validating')}
                </span>
              ) : null}
            </div>
            <div className={styles.results}>
              <ValidatorResults yaml={yaml} result={result} split />
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
