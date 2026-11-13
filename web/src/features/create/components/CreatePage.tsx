import { Icon } from '~/components/Icon';
import { useMemo, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { SvgIcon } from '~/components/SvgIcon';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { useDocumentTitle } from '~/features/collections/lib/useDocumentTitle';
import { pipelineEventsPath } from '~/features/collections/lib/links';
import { useValidation } from '~/features/validator/lib/useValidation';
import { ValidatorResults } from '~/features/validator/components/ValidatorResults';
import { YamlEditor } from '~/features/validator/components/YamlEditor';
import {
  createPipeline,
  type CreatedPipeline,
  ExistingPipelineError,
  openOnboardingPr,
  useAutoDeployKeys,
  useTrustedTemplates
} from '../lib/api';
import { parseScmUrl, templateYaml } from '../lib/git';
import styles from '../create.module.scss';

export function CreatePage() {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const canAutoKeys = useAutoDeployKeys();

  const [scmUrl, setScmUrl] = useState('');
  const [hasRootDir, setHasRootDir] = useState(false);
  const [rootDir, setRootDir] = useState('');
  const [autoKeys, setAutoKeys] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [yaml, setYaml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: number; prUrl: string } | null>(
    null
  );
  // The pipeline this form already created. When opening its onboarding PR fails, a retry must
  // open the PR for it rather than create it again (which only answers "already exists").
  const createdFor = useRef<{ key: string; pipeline: CreatedPipeline } | null>(
    null
  );

  useDocumentTitle(t('create.title'));

  const { data: templates = [] } = useTrustedTemplates(useTemplate);
  const { result } = useValidation(useTemplate ? yaml : '');

  const trimmed = scmUrl.trim();
  const valid = trimmed.length > 0 && parseScmUrl(trimmed).valid;
  const showInvalid = trimmed.length > 0 && !valid;

  const grouped = useMemo(() => {
    const needle = templateFilter.trim().toLowerCase();
    const groups = new Map<string, typeof templates>();

    for (const template of templates) {
      if (
        needle &&
        !`${template.name} ${template.namespace}`.toLowerCase().includes(needle)
      ) {
        continue;
      }
      groups.set(template.namespace, [
        ...(groups.get(template.namespace) ?? []),
        template
      ]);
    }

    return [...groups.entries()];
  }, [templates, templateFilter]);

  const submit = async () => {
    if (!valid || saving) {
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const sourceDir = hasRootDir ? rootDir.trim() : '';
      const key = `${trimmed}\n${sourceDir}`;
      const pipeline =
        createdFor.current?.key === key
          ? createdFor.current.pipeline
          : await createPipeline({
              checkoutUrl: trimmed,
              rootDir: sourceDir,
              autoKeysGeneration: canAutoKeys && autoKeys
            });

      createdFor.current = { key, pipeline };

      if (useTemplate && yaml.trim()) {
        // The branch defaults to the repo's default branch when not given.
        const branch = pipeline.scmRepo?.branch;
        const checkoutUrl =
          trimmed.includes('#') || !branch ? trimmed : `${trimmed}#${branch}`;
        const prUrl = await openOnboardingPr(
          pipeline.id,
          checkoutUrl,
          yaml,
          sourceDir
        );

        setCreated({ id: pipeline.id, prUrl });
      } else {
        navigate({ to: pipelineEventsPath(pipeline.id) });
      }
    } catch (e) {
      if (e instanceof ExistingPipelineError) {
        navigate({ to: pipelineEventsPath(e.existingId) });
      } else {
        setError(
          e instanceof Error &&
            e.message &&
            !e.message.startsWith('Request failed')
            ? e.message
            : t('common.error')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout scroll={false}>
      <div className={styles.root}>
        <div className={styles.scroller}>
          <div className={styles.content}>
            <button
              type="button"
              className={styles.back}
              onClick={() => router.history.back()}
            >
              <SvgIcon name="arrowhead-left" size={20} />
              <span>{t('create.back')}</span>
            </button>
            <form
              className={styles.form}
              onSubmit={event => {
                event.preventDefault();
                submit();
              }}
            >
              {error ? (
                <div className={styles.info} role="alert">
                  {error}
                </div>
              ) : null}
              {created ? (
                <div
                  className={`${styles.info} ${styles.success}`}
                  role="status"
                >
                  {t('create.prCreated')}{' '}
                  <a
                    href={created.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {created.prUrl}
                  </a>{' '}
                  <Link to={pipelineEventsPath(created.id)}>
                    {t('create.goToPipeline')}
                  </Link>
                </div>
              ) : null}
              <section>
                <h1>{t('create.title')}</h1>
                <p className={styles.intro}>
                  {t('create.intro')}{' '}
                  <a
                    href="https://docs.screwdriver.cd/user-guide/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('create.quickstartLink')}
                  </a>
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  {t('create.repo.title')}
                </h2>
                <p className={styles.help}>{t('create.repo.help')}</p>
                <div className={styles.repoUrl}>
                  <Form.Control
                    type="text"
                    className={styles.textInput}
                    value={scmUrl}
                    placeholder={t('create.repo.placeholder')}
                    aria-label={t('create.repo.title')}
                    isInvalid={showInvalid}
                    isValid={valid}
                    onChange={event => setScmUrl(event.target.value)}
                    onKeyDown={event => {
                      // Enter while composing (IME) only confirms the candidate.
                      if (
                        event.key === 'Enter' &&
                        !event.nativeEvent.isComposing &&
                        event.keyCode !== 229
                      ) {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  {valid ? (
                    <span className={styles.valid} aria-hidden="true">
                      <Icon name="check" />
                    </span>
                  ) : null}
                </div>
                {showInvalid ? (
                  <Form.Text className={styles.invalid}>
                    {t('create.repo.invalid')}
                  </Form.Text>
                ) : null}
                <Form.Check
                  className={`mt-2 ${styles.normalWeight}`}
                  id="has-root-dir"
                  type="checkbox"
                  label={t('create.rootDir.toggle')}
                  checked={hasRootDir}
                  onChange={event => setHasRootDir(event.target.checked)}
                />
                {hasRootDir ? (
                  <Form.Control
                    className={styles.textInput}
                    value={rootDir}
                    placeholder={t('create.rootDir.placeholder')}
                    aria-label={t('create.rootDir.label')}
                    onChange={event => setRootDir(event.target.value)}
                  />
                ) : null}
                {canAutoKeys ? (
                  <Form.Check
                    className={`mt-2 ${styles.normalWeight}`}
                    id="auto-keys"
                    type="checkbox"
                    label={t('create.autoKeys')}
                    checked={autoKeys}
                    onChange={event => setAutoKeys(event.target.checked)}
                  />
                ) : null}
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  {t('create.yaml.title')}
                </h2>
                <p className={styles.help}>{t('create.yaml.help')}</p>
                <Form.Check
                  className={styles.normalWeight}
                  id="use-template"
                  type="checkbox"
                  label={t('create.yaml.useTemplate')}
                  checked={useTemplate}
                  onChange={event => setUseTemplate(event.target.checked)}
                />
                {useTemplate ? (
                  <div className="mt-2">
                    <div className={styles.templates}>
                      <Form.Control
                        size="sm"
                        type="search"
                        className="mb-1"
                        value={templateFilter}
                        placeholder={t('create.template.filter')}
                        aria-label={t('create.template.filter')}
                        onChange={event =>
                          setTemplateFilter(event.target.value)
                        }
                      />
                      <Form.Select
                        aria-label={t('create.template.select')}
                        value={templateKey}
                        onChange={event => {
                          const key = event.target.value;
                          const [namespace = '', name = ''] =
                            key.split('\u0000');

                          setTemplateKey(key);
                          if (key) {
                            setYaml(templateYaml(namespace, name));
                          }
                        }}
                      >
                        <option value="">
                          {grouped.length
                            ? t('create.template.placeholder')
                            : t('create.template.none')}
                        </option>
                        {grouped.map(([namespace, items]) => (
                          <optgroup key={namespace} label={namespace}>
                            {items.map(template => (
                              <option
                                key={`${namespace}/${template.name}`}
                                value={`${namespace}\u0000${template.name}`}
                              >
                                {template.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Form.Select>
                    </div>
                    <div className={`${styles.editorBox} mt-2`}>
                      <YamlEditor
                        value={yaml}
                        onChange={setYaml}
                        label={t('create.yaml.editorLabel')}
                      />
                    </div>
                    <div className={styles.results}>
                      <ValidatorResults yaml={yaml} result={result} />
                    </div>
                  </div>
                ) : null}
              </section>

              <button
                type="submit"
                className={styles.submit}
                disabled={!valid || saving}
                aria-busy={saving}
              >
                {saving ? t('create.submitting') : t('create.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
