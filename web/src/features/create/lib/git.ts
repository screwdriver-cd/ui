/**
 * Parse a git or https checkout url (port of app/utils/git.js parse).
 * Accepts `git@host:owner/repo.git#branch:rootDir` and `https://host/owner/repo.git#branch`.
 */
export interface ParsedScmUrl {
  valid: boolean;
  server?: string;
  owner?: string;
  repo?: string;
  branch?: string | null;
}

// The \u3000 (ideographic space) allowance in branch names matches the Ember regex.
const SCM_URL =
  /^(?:(?:https:\/\/(?:[^@/:\s]+@)?)|git@|org-\d+@)+([^/:\s]+)(?:\/|:)([^/:\s]+)\/([^\s]+?)(?:\.git)(#[^:\u3000\s]*\u3000[^:\u3000\s]*|#[^:\u3000\s]+)?(:[^:\u3000\s]*\u3000[^:\u3000\s]*|:[^:\u3000\s]+)?$/;

export function parseScmUrl(scmUrl: string): ParsedScmUrl {
  const match = scmUrl.match(SCM_URL);

  if (!match) {
    return { valid: false };
  }

  return {
    valid: true,
    server: match[1],
    owner: match[2],
    repo: match[3],
    branch: match[4] ? match[4].slice(1) : null
  };
}

export const templateYaml = (namespace: string, name: string) =>
  `jobs:\n  main:\n    template: ${namespace}/${name}\n    requires: [~pr, ~commit]\n`;
