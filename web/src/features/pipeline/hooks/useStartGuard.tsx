import { useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { create } from 'zustand';
import { useSession } from '~/auth/session';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import { useScmContexts } from '../api/queries';
import type { ScmContext } from '../types';

interface StartWarning {
  pipelineId: number;
  message: string;
}

const useStartWarning = create<{ warning: StartWarning | null }>(() => ({
  warning: null
}));

const clear = () => useStartWarning.setState({ warning: null });

/**
 * The SCM to sign in to before starting events of a pipeline in `scmContext`, or null when the
 * current login will do. Starting with another SCM's token fails with "Bad credentials", and that
 * 401 signs the user out.
 */
export function scmToSignIn(
  scmContext: string | undefined,
  current: string | undefined,
  contexts: ScmContext[]
): string | null {
  if (!current || !scmContext || current === scmContext) return null;

  const scm = contexts.find(c => c.context === scmContext);

  // Events of a read-only SCM do not need a matching login.
  if (scm?.readOnly) return null;

  return scm?.displayName || scmContext;
}

/**
 * Checks the SCM before a start or restart dialog opens (Ember `scm.canStartPipeline`). Returns a
 * check that is false, and shows the warning, when the user has to switch accounts first.
 */
export function useStartGuard(
  pipeline: { id: number; scmContext?: string } | undefined
): () => boolean {
  const t = useT();
  const current = useSession(s => s.data?.scmContext);
  const { data: contexts = [] } = useScmContexts();

  return () => {
    const scm = pipeline
      ? scmToSignIn(pipeline.scmContext, current, contexts)
      : null;

    useStartWarning.setState({
      warning:
        pipeline && scm
          ? {
              pipelineId: pipeline.id,
              message: t('pipeline.start.scmMismatch', { scm })
            }
          : null
    });

    return !scm;
  };
}

/** The warning of a blocked start, until it is dismissed or the page changes. */
export function StartWarningAlert({ pipelineId }: { pipelineId: number }) {
  const warning = useStartWarning(s => s.warning);
  const pathname = useRouterState({ select: s => s.location.pathname });

  useEffect(clear, [pathname]);

  if (warning?.pipelineId !== pipelineId) return null;

  return (
    <Alert
      variant="warning"
      dismissible
      onClose={clear}
      className="pipeline-state-message"
      id="scm-mismatch-warning"
    >
      <Icon name="triangleExclamation" /> {warning.message}
    </Alert>
  );
}
