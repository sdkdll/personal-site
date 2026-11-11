// Copies the site into public/ with a version hash on the asset URLs,
// so browsers can cache them but still pick up changes right away.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');

const pages = ['index.html', 'bio.html', 'music.html'];
const dirs = ['css', 'js', 'assets'];

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

  html = html.replace(
    /(href|src)="(css|js|assets)\/([^"]+)"/g,
    (match, attr, dir, name) => {
      const target = path.join(root, dir, name);
      return fs.existsSync(target) ? `${attr}="${dir}/${name}?v=${hash(target)}"` : match;
    }
  );

  fs.writeFileSync(path.join(out, page), html, 'utf8');
  console.log(`  ${page}`);
}

console.log('public/ ready');
