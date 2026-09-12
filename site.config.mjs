// Single switch between GitHub project-page hosting and a custom domain.
// Project page: origin is the github.io host and base is the repo name.
// Custom domain: origin is https://<domain>, base is '' and domain is set
// (which also writes public/CNAME expectations into scripts/check-build.mjs).
export const hosting = {
  origin: 'https://ozawatomu.github.io',
  base: '/procrastination-timer-site',
  domain: null,
};
