import { parseScmUrl, templateYaml } from './git';

describe('parseScmUrl', () => {
  it('accepts ssh and https urls with optional branch', () => {
    expect(
      parseScmUrl('git@github.com:screwdriver-cd/ui.git#main')
    ).toMatchObject({
      valid: true,
      server: 'github.com',
      owner: 'screwdriver-cd',
      repo: 'ui',
      branch: 'main'
    });
    expect(
      parseScmUrl('https://github.com/screwdriver-cd/ui.git')
    ).toMatchObject({ valid: true, branch: null });
  });

  it('rejects anything else', () => {
    expect(parseScmUrl('not a url').valid).toBe(false);
    expect(parseScmUrl('git@github.com:screwdriver-cd/ui').valid).toBe(false);
  });

  it('builds the template yaml', () => {
    expect(templateYaml('ns', 'tpl')).toContain('template: ns/tpl');
  });
});
