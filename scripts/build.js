// Copies the site into public/ with a version hash on the asset URLs,
// so browsers can cache them but still pick up changes right away.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');

/* Dominio canonico. Cambiarlo aqui actualiza canonical, OG, robots,
   sitemap y llms.txt de una sola vez. */
const DEFAULT_DOMAIN = 'https://personal-site-sdkdll.vercel.app';
const SITE_URL = (process.env.SITE_URL || DEFAULT_DOMAIN).replace(/\/+$/, '');

const pages = ['index.html', 'bio.html', 'music.html', '404.html'];
const dirs = ['css', 'js', 'assets'];
const textFiles = ['robots.txt', 'sitemap.xml', 'llms.txt'];

function hash(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

/** Escapa HTML */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Lee las canciones de js/tracks-data.js */
function readTracks() {
  const src = fs.readFileSync(path.join(root, 'js', 'tracks-data.js'), 'utf8');
  const sandbox = { window: {} };
  new Function('window', src)(sandbox.window);
  return sandbox.window.TRACKS || [];
}

/** Genera las filas de la lista como HTML real, para que el "view source"
    no este vacio. El formato es el mismo que pinta js/tracks.js. */
function trackRows() {
  return readTracks().map((t, i) => {
    const cover = t.cover
      ? `<span class="cover sk"><img src="${esc(t.cover)}" alt="" width="42" height="42" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
      : '<span class="cover"></span>';
    return [
      `        <a class="track" href="${esc(t.url || '#')}" target="_blank" rel="noopener noreferrer">`,
      `          <span class="num">${String(i + 1).padStart(2, '0')}</span>`,
      `          ${cover}`,
      '          <div class="meta">',
      `            <div class="name">${esc(t.title || '')}</div>`,
      `            <div class="artist">${esc(t.artist || '')}</div>`,
      '          </div>',
      `          <span class="len">${esc(t.length || '')}</span>`,
      '        </a>'
    ].join('\n');
  }).join('\n');
}

/** Inyecta las filas entre los marcadores TRACKS:START / TRACKS:END */
function injectTracks(html) {
  return html.replace(
    /(<!-- TRACKS:START -->)[\s\S]*?(<!-- TRACKS:END -->)/,
    (match, start, end) => start + '\n' + trackRows() + '\n      ' + end
  );
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const dir of dirs) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) copyDir(src, path.join(out, dir));
}

for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) continue;

  let html = fs.readFileSync(file, 'utf8');

  // La lista de canciones se escribe tambien en el fuente, para que el
  // servidor local (que sirve la raiz) tambien la muestre.
  if (page === 'music.html') {
    const next = injectTracks(html);
    if (next !== html) {
      fs.writeFileSync(file, next, 'utf8');
      html = next;
    }
  }

  html = html.replace(
    /(href|src)="(css|js|assets)\/([^"]+)"/g,
    (match, attr, dir, name) => {
      const target = path.join(root, dir, name);
      return fs.existsSync(target) ? `${attr}="${dir}/${name}?v=${hash(target)}"` : match;
    }
  );

  html = html.split(DEFAULT_DOMAIN).join(SITE_URL);

  fs.writeFileSync(path.join(out, page), html, 'utf8');
  console.log(`  ${page}`);
}

// Archivos de texto para buscadores y agentes de IA
for (const file of textFiles) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) continue;
  const text = fs.readFileSync(src, 'utf8').split('{{SITE_URL}}').join(SITE_URL);
  fs.writeFileSync(path.join(out, file), text, 'utf8');
  console.log(`  ${file}`);
}

console.log(`public/ ready (${SITE_URL})`);
