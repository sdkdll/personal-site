/* ============================================================
   sdk.dll — Auditoria del sitio
   Comprueba de forma automatica las señales de "sitio vibecodeado"
   y los requisitos basicos de calidad (SEO, a11y, seguridad).

   Uso:  node scripts/audit.cjs
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SRC = ROOT;

const PAGES = ['index.html', 'bio.html', 'music.html', '404.html'];

const results = [];
const add = (ok, label, detail) => results.push({ ok, label, detail: detail || '' });

function read(file, base = PUBLIC) {
  const p = path.join(base, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

/* ---------- 1. Contenido real en el HTML ---------- */
const html = {};
for (const p of PAGES) html[p] = read(p) || '';

/* La home es un panel de presencia: el texto largo vive en la bio.
   Bio y musica si deben traer el contenido completo en el HTML. */
const MIN_TEXT = { 'index.html': 250, 'bio.html': 400, 'music.html': 250 };

for (const p of ['index.html', 'bio.html', 'music.html']) {
  const h = html[p];
  const text = h
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  add(text.length > MIN_TEXT[p], `View source con contenido real (${p})`, `${text.length} caracteres de texto`);
}

const bioParas = (html['bio.html'].match(/<p data-i18n="(bio\.p\d|about\.p\d)">([^<]{20,})/g) || []).length;
add(bioParas >= 3, 'Bio con los párrafos en el HTML', `${bioParas}`);

const songRows = (html['music.html'].match(/class="(song-row|track)"/g) || []).length;
add(songRows >= 3, 'Lista de canciones en el HTML', `${songRows}`);

/* ---------- 2. Títulos y descripciones únicos ---------- */
const titles = PAGES.map((p) => (html[p].match(/<title>([^<]*)<\/title>/) || [])[1]);
add(new Set(titles).size === titles.length, 'Títulos únicos por página', titles.map((t) => (t || '').slice(0, 26)).join(' | '));

const descs = PAGES.map((p) => (html[p].match(/<meta name="description" content="([^"]*)"/) || [])[1]);
add(descs.every((d) => d && d.length > 50 && d.length < 175), 'Meta description única y con largo útil',
  descs.map((d) => (d || '').length).join(' / ') + ' caracteres');

/* ---------- 3. Canonical, OG, JSON-LD ---------- */
for (const p of ['index.html', 'bio.html', 'music.html']) {
  const h = html[p];
  add(/<link rel="canonical" href="https?:\/\/[^"]+"/.test(h), `Canonical en ${p}`);
  add(/property="og:title"/.test(h) && /property="og:image"/.test(h) && /property="og:url"/.test(h), `Open Graph completo en ${p}`);
  add(/name="twitter:card"/.test(h), `Twitter card en ${p}`);
  const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ok = false;
  let detail = 'sin JSON-LD';
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      ok = true;
      detail = j['@type'] || (j['@graph'] || []).map((x) => x['@type']).join(' + ');
    } catch (e) {
      detail = 'JSON inválido: ' + e.message;
    }
  }
  add(ok, `Datos estructurados en ${p}`, detail);
}

/* ---------- 4. Encabezados ---------- */
for (const p of ['index.html', 'bio.html', 'music.html']) {
  const h = html[p];
  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  add(h1s === 1, `Un solo <h1> en ${p}`, `${h1s}`);
  add(/<html lang="[a-z]{2}"/.test(h), `Atributo lang en ${p}`);
  add(/<meta charset="utf-8">/i.test(h), `Charset declarado en ${p}`);
  add(/rel="icon"/.test(h) && /rel="manifest"/.test(h) && /apple-touch-icon/.test(h), `Favicon + manifest + apple-touch en ${p}`);
  add(/<main[\s>]/i.test(h) && /id="main"/.test(h), `Landmark <main> en ${p}`);
  add(/class="skip-link"/.test(h), `Enlace de salto en ${p}`);
  const imgs = h.match(/<img[^>]*>/g) || [];
  const sinAlt = imgs.filter((i) => !/\salt=/.test(i)).length;
  add(sinAlt === 0, `Todas las <img> con alt en ${p}`, `${imgs.length} imágenes`);
}

/* ---------- 5. Archivos para buscadores y agentes ---------- */
for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  const c = read(f);
  add(!!c && c.length > 40, `Existe ${f}`, c ? `${c.length} bytes` : 'falta');
}
const robots = read('robots.txt') || '';
const blanket = /^\s*Disallow:\s*\/\s*$/m.test(robots);
add(!blanket, 'robots.txt no bloquea a los rastreadores', blanket ? 'Disallow: / global' : 'sin bloqueo global');
add(/GPTBot/.test(robots) && /ClaudeBot/.test(robots) && /PerplexityBot/.test(robots), 'robots.txt permite explícitamente a los asistentes de IA');
add(/Sitemap:\s*https?:\/\//.test(robots), 'robots.txt apunta al sitemap');
const sitemap = read('sitemap.xml') || '';
add((sitemap.match(/<loc>/g) || []).length >= 3, 'sitemap.xml con las 3 páginas', `${(sitemap.match(/<loc>/g) || []).length} URLs`);
add(!/{{SITE_URL}}/.test(sitemap + robots), 'Sin tokens sin resolver en robots/sitemap');

/* ---------- 6. Sin degradés ----------
   Se permiten solo los degradés monocromos (viñetas, sombras). Lo que
   no se permite es un degradé entre dos colores fuertes distintos. */
function isAchromatic(color) {
  const hex = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length < 6) return true;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12;
  }
  const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const r = +rgb[1], g = +rgb[2], b = +rgb[3];
    return Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12;
  }
  return true; // transparent, currentColor, etc.
}

function strongGradients(text) {
  const out = [];
  const re = /(?:linear|radial|conic)-gradient\(([^;]*?)\)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const stops = m[1].match(/#[0-9a-f]{3,8}|rgba?\([^)]*\)/gi) || [];
    const chromatic = stops.filter((c) => !isAchromatic(c));
    if (chromatic.length > 1) out.push(m[0].slice(0, 60));
  }
  return out;
}

const css = read('css/style.css') || '';
const badGradients = strongGradients(css);
add(badGradients.length === 0, 'Sin degradés de dos colores fuertes',
  badGradients.length ? badGradients.join(' | ') : 'solo monocromos');

const purple = (css.match(/#a855f7|#7e22ce|#c084fc|#818cf8|168,\s*85,\s*247/gi) || []).length;
add(purple === 0, 'Sin púrpuras en el CSS', `${purple} encontrados`);

const jsFiles = fs.existsSync(path.join(PUBLIC, 'js')) ? fs.readdirSync(path.join(PUBLIC, 'js')) : [];
let jsPurple = 0;
for (const f of jsFiles) {
  const c = read(path.join('js', f)) || '';
  jsPurple += (c.match(/168,\s*85,\s*247|#a855f7/g) || []).length;
}
add(jsPurple === 0, 'Sin púrpuras en el JS', `${jsPurple} encontrados`);

/* ---------- 7. Sin secretos en el código ---------- */
const SECRET_PATTERNS = [
  /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,  // JWT
  /sk-[A-Za-z0-9]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /client_secret\s*[:=]\s*["'][^"']{12,}["']/i,
  /api[_-]?key\s*[:=]\s*["'][^"']{12,}["']/i,
  /Bearer\s+[A-Za-z0-9._-]{30,}/
];
let leaks = 0;
const scan = [];
for (const dir of ['js', 'css', 'assets']) {
  const full = path.join(PUBLIC, dir);
  if (!fs.existsSync(full)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|css|html|json)$/.test(e.name)) continue;
      const c = fs.readFileSync(p, 'utf8');
      SECRET_PATTERNS.forEach((re) => { if (re.test(c)) { leaks++; scan.push(p.replace(PUBLIC, 'public')); } });
    }
  };
  walk(full);
}
for (const p of PAGES) {
  const c = read(p) || '';
  SECRET_PATTERNS.forEach((re) => { if (re.test(c)) { leaks++; scan.push(p); } });
}
add(leaks === 0, 'Sin claves ni tokens en el código que llega al navegador', leaks ? scan.join(', ') : '0 hallazgos');

/* ---------- 8. Source maps ---------- */
let maps = 0;
const walkMaps = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkMaps(p);
    else if (e.name.endsWith('.map')) maps++;
  }
};
walkMaps(PUBLIC);
add(maps === 0, 'Sin source maps en el despliegue', `${maps}`);

/* ---------- 9. 404 ---------- */
const e404 = html['404.html'];
add(!!e404 && /<h1/i.test(e404), 'Página 404 con su propio <h1>');
add(/name="robots" content="noindex/.test(e404 || ''), 'La 404 está en noindex');

/* ---------- 10. Tamaño del paquete ---------- */
let bytes = 0;
const walkSize = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkSize(p);
    else bytes += fs.statSync(p).size;
  }
};
walkSize(PUBLIC);
add(bytes < 700 * 1024, 'Sin bundle gigante', `${Math.round(bytes / 1024)} KB totales`);

/* ---------- 11. Cabeceras de seguridad ---------- */
const headers = (read('_headers') || '') + (read('vercel.json', SRC) || '');
add(/Content-Security-Policy/.test(headers), 'CSP definida');
add(/Strict-Transport-Security/.test(headers), 'HSTS activa');
add(/Permissions-Policy/i.test(headers), 'Permissions-Policy definida');

/* ---------- 12. Rate limiting en el servidor ---------- */
const apiSrc = read('server/app.js', SRC) || read('api/index.js', SRC) || '';
add(/rateLimit\(/.test(apiSrc), 'Rate limiting en el servidor');
add((apiSrc.match(/rateLimit\(/g) || []).length >= 1, 'Rate limiting en el servidor', `${(apiSrc.match(/rateLimit\(/g) || []).length} limitador(es)`);
const hasOwnerApi = /\/api\/kv\//.test(apiSrc);
if (hasOwnerApi) {
  add(/isOwner|OWNER_TOKEN/.test(apiSrc), 'Comprobación de propietario en el servidor');
  add(/startsWith\('_'\)/.test(apiSrc), 'Las claves privadas del KV no se devuelven a los visitantes');
} else {
  add(/helmet/.test(apiSrc), 'Cabeceras de seguridad con helmet en el servidor');
}

/* ---------- 13. Imágenes con dimensiones ---------- */
let sinDim = 0;
for (const p of PAGES) {
  const imgs = (html[p].match(/<img[^>]*>/g) || []);
  sinDim += imgs.filter((i) => !/width=/.test(i) || !/height=/.test(i)).length;
}
add(sinDim === 0, 'Todas las imágenes con width y height (evita CLS)', `${sinDim} sin dimensiones`);

/* ---------- Resultado ---------- */
const ok = results.filter((r) => r.ok).length;
const bad = results.length - ok;

console.log('\n  AUDITORÍA DEL SITIO\n');
for (const r of results) {
  console.log(`  ${r.ok ? 'OK  ' : 'FALLA'}  ${r.label}${r.detail ? '  — ' + r.detail : ''}`);
}
console.log(`\n  ${ok}/${results.length} comprobaciones correctas${bad ? `, ${bad} pendientes` : ''}\n`);

process.exit(bad ? 1 : 0);
