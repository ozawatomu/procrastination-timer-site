import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { hosting } from '../site.config.mjs';

const root = resolve('dist');
const { origin, base, domain } = hosting;
const prefix = `${origin}${base}`;
const host = new URL(origin).hostname;
const playId = 'com.tomuozawa.procrastinationtimer';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(resolve(dir, entry.name))
          : resolve(dir, entry.name),
      ),
    )
  ).flat();
}

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

// Turns a same-site URL into the dist file that serves it.
function distPath(url) {
  assert(
    url.pathname === base || url.pathname.startsWith(`${base}/`),
    `outside base: ${url.href}`,
  );
  const local = decodeURIComponent(url.pathname.slice(base.length)) || '/';
  return resolve(root, `.${local}`, local.endsWith('/') ? 'index.html' : '');
}

const files = await walk(root);
const pages = files.filter((file) => extname(file) === '.html');
const titles = new Set();
const canonicalUrls = [];
let storeLinks = 0;

for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const route = `/${relative(root, file).replace(/index\.html$/, '')}`;
  const canonical = $('link[rel="canonical"]').attr('href');
  assert.equal(canonical, `${prefix}${route}`, `canonical: ${route}`);
  assert.equal($('html').attr('lang'), 'en-GB', `lang: ${route}`);
  assert.equal($('h1').length, 1, `one h1: ${route}`);
  assert(
    $('title').text() && !titles.has($('title').text()),
    `unique title: ${route}`,
  );
  titles.add($('title').text());
  assert(
    $('meta[name="description"]').attr('content'),
    `description: ${route}`,
  );
  assert.equal($('meta[property="og:url"]').attr('content'), canonical);
  const ogImage = $('meta[property="og:image"]').attr('content');
  assert(await exists(distPath(new URL(ogImage))), `og:image file: ${route}`);
  const schemas = $('script[type="application/ld+json"]')
    .map((_, script) => JSON.parse($(script).html()))
    .get();
  if (route === '/') {
    assert(
      schemas.some((schema) =>
        [schema['@type']].flat().includes('SoftwareApplication'),
      ),
      'home JSON-LD',
    );
    const digits = $('[data-readout="studying"]').first().text().trim();
    assert.match(digits, /^\d+:\d{2}(:\d{2})?$/, 'server-rendered readout');
  }
  if (route === '/404.html')
    assert.match($('meta[name="robots"]').attr('content'), /noindex/);
  else canonicalUrls.push(canonical);

  const refs = [];
  $('[href], [src]').each((_, el) =>
    refs.push($(el).attr('href') ?? $(el).attr('src')),
  );
  $('[srcset]').each((_, el) =>
    $(el)
      .attr('srcset')
      .split(',')
      .forEach((item) => refs.push(item.trim().split(/\s/)[0])),
  );
  for (const ref of refs) {
    if (/^(mailto:|tel:|data:)/.test(ref)) continue;
    assert.notEqual(ref, '#', `placeholder link: ${route}`);
    assert(!ref.startsWith('http://'), `insecure link ${ref}: ${route}`);
    const url = new URL(ref, canonical);
    if (url.hostname === 'play.google.com') {
      storeLinks += 1;
      assert.equal(url.searchParams.get('id'), playId);
      const campaign = new URLSearchParams(url.searchParams.get('referrer'));
      assert.equal(campaign.get('utm_source'), host);
      assert.equal(campaign.get('utm_medium'), 'website');
      assert.match(campaign.get('utm_campaign'), /^website_/);
    }
    if (url.origin !== origin) continue;
    const target = distPath(url);
    assert(await exists(target), `Missing ${ref} from ${route}`);
    if (url.hash && extname(target) === '.html') {
      const targetDoc =
        target === file ? $ : load(await readFile(target, 'utf8'));
      assert(
        targetDoc(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).length,
        `Missing anchor ${ref} from ${route}`,
      );
    }
  }
  if (route === '/' && storeLinks === 0)
    assert(
      $('.store-chip').length >= 2,
      'coming-soon chips while no store is live',
    );
}

const index = await readFile(resolve(root, 'sitemap-index.xml'), 'utf8');
assert(index.includes(`${prefix}/sitemap-0.xml`), 'sitemap index URL');
const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8');
for (const url of canonicalUrls)
  assert(sitemap.includes(`<loc>${url}</loc>`), `Missing sitemap URL ${url}`);
assert(!sitemap.includes('404'), '404 must not be in sitemap');
assert(
  (await readFile(resolve(root, 'robots.txt'), 'utf8')).includes(
    `${prefix}/sitemap-index.xml`,
  ),
  'robots sitemap URL',
);
assert(await exists(resolve(root, '.nojekyll')), '.nojekyll');
if (domain)
  assert.equal((await readFile(resolve(root, 'CNAME'), 'utf8')).trim(), domain);
else assert(!(await exists(resolve(root, 'CNAME'))), 'CNAME without a domain');
for (const file of files.filter((f) => extname(f) === '.css')) {
  for (const match of (await readFile(file, 'utf8')).matchAll(
    /url\(["']?(\/[^)'"\s]+)["']?\)/g,
  ))
    assert(
      await exists(distPath(new URL(match[1], origin))),
      `CSS asset ${match[1]}`,
    );
}
console.log(
  `Verified ${pages.length} pages under ${prefix}: links, images, metadata, ${storeLinks} store links, sitemap, robots and fonts.`,
);
