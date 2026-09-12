// Serves dist/ the way GitHub Pages does: under the base path, directories via
// index.html, a redirect onto the trailing slash and 404.html with a 404 status.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { hosting } from '../site.config.mjs';

const root = 'dist';
const port = Number(process.env.PORT ?? 4180);
const { base } = hosting;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

async function send(res, file, status = 200) {
  const body = await readFile(file);
  res.writeHead(status, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Content-Length': body.length,
  });
  res.end(body);
}

const notFound = (res) => send(res, join(root, '404.html'), 404);

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (base && (url.pathname === '/' || url.pathname === base)) {
    res.writeHead(302, { Location: `${base}/` });
    return res.end();
  }
  if (base && url.pathname !== base && !url.pathname.startsWith(`${base}/`))
    return notFound(res);
  const pathname = decodeURIComponent(url.pathname.slice(base.length)) || '/';
  let file = join(root, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  try {
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${base}${pathname}/${url.search}` });
        return res.end();
      }
      file = join(file, 'index.html');
      await stat(file);
    }
    await send(res, file);
  } catch {
    await notFound(res);
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Serving ${root}${base}/ at http://127.0.0.1:${port}${base}/`),
);
