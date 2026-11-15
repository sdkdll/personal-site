/* Genera los PNG del favicon de la plantilla a partir del SVG.
   Uso: node scripts/iconos.cjs                                        */
const path = require('path');
const fs = require('fs');

/* Busca playwright-core en el proyecto o en un npm cache conocido */
function loadPlaywright() {
  const candidates = [
    'playwright-core',
    'playwright',
    path.join(__dirname, '..', 'node_modules', 'playwright-core')
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* siguiente */
    }
  }
  console.error('  ! Instala playwright-core para generar los PNG: npm i -D playwright-core');
  process.exit(1);
}

const { chromium } = loadPlaywright();

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const SIZES = [
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 512, name: 'icon-512.png' }
];

(async () => {
  const svg = fs.readFileSync(path.join(ASSETS, 'favicon.svg'), 'utf8');
  const browser = await chromium.launch();

  for (const { size, name } of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
    );
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(ASSETS, name), omitBackground: true });
    console.log(`  ${name}  ${size}x${size}`);
    await page.close();
  }

  await browser.close();
})();
