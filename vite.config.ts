import { defineConfig } from 'vite';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isGitHubPagesRoot = repoName.toLowerCase().endsWith('.github.io');
const base = process.env.GITHUB_ACTIONS && repoName && !isGitHubPagesRoot
  ? `/${repoName}/`
  : '/';

export default defineConfig({
  base,
});
