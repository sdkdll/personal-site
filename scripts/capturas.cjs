/* Captura las pantallas de la plantilla para el README.
   Uso: node scripts/capturas.cjs [url]                                  */
const path = require('path');
const fs = require('fs');

/* Busca playwright-core en el proyecto o en un sitio conocido */
function loadPlaywright() {
  const candidates = [
    'playwright-core',
    'playwright',
    path.join(__dirname, '..', 'node_modules', 'playwright-core'),
    'C:/Users/Bksss/OneDrive/Documentos/Proyecto predeterminado/node_modules/playwright-core'
  ];
  for (const c of candidates) {
    try { return require(c); } catch { /* siguiente */ }
  }
  console.error('  ! Instala playwright-core para generar las capturas');
  process.exit(1);
}

const { chromium } = loadPlaywright();

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BASE = process.argv[2] || 'https://personal-site-sdkdll.vercel.app';

const SHOTS = [
  { name: 'preview.png', path: '/', width: 1200, height: 760, full: false },
  { name: 'preview-bio.png', path: '/bio', width: 1200, height: 760, full: false },
  { name: 'preview-music.png', path: '/music', width: 1200, height: 760, full: false },
  { name: 'preview-mobile.png', path: '/', width: 420, height: 820, full: false }
];

(async () => {
  fs.mkdirSync(ASSETS, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });

  for (const shot of SHOTS) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.goto(BASE + shot.path, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ASSETS, shot.name), fullPage: shot.full });
    console.log(`  ${shot.name}  ${shot.width}x${shot.height}`);
  }

  await browser.close();
  console.log(`\n  capturas listas en ${ASSETS}\n`);
})();
