/* Genera assets/og-image.png (1200x630) para las tarjetas de redes.
   Uso: node scripts/og.cjs                                          */

const path = require('path');
const fs = require('fs');

/* Busca playwright-core en el proyecto, en el repo padre o en el global */
function loadPlaywright() {
  const candidates = [
    'playwright-core',
    'playwright',
    path.join(__dirname, '..', 'node_modules', 'playwright-core'),
    path.join(__dirname, '..', '..', 'node_modules', 'playwright-core')
  ];
  for (const c of candidates) {
    try { return require(c); } catch { /* siguiente */ }
  }
  console.error('  ! Necesitas playwright-core: npm i -D playwright-core');
  process.exit(1);
}

const { chromium } = loadPlaywright();

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px; overflow:hidden; position:relative;
    background:#0a0a0d; color:#f4f1ea;
    font-family:"Segoe UI", Inter, system-ui, sans-serif;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 88px;
  }
  .frame { position:absolute; inset:36px; border:1px solid rgba(216,197,161,0.18); }
  .rain { position:absolute; inset:0; }
  .rain i {
    position:absolute; width:2px; border-radius:2px;
    background:rgba(216,197,161,0.22);
  }
  .left { position:relative; z-index:2; }
  .kicker {
    font-size:19px; letter-spacing:0.42em; text-transform:uppercase;
    color:#a8794a; font-weight:600; margin-bottom:24px;
  }
  .rule { width:74px; height:3px; background:#d8c5a1; margin-bottom:30px; }
  h1 { font-size:104px; line-height:0.96; font-weight:800; letter-spacing:-4px; margin-bottom:26px; }
  .sub { font-size:31px; line-height:1.4; font-weight:300; color:rgba(244,241,234,0.68); max-width:640px; }
  .links { margin-top:34px; display:flex; gap:26px; font-size:22px; color:rgba(244,241,234,0.5); }
  .links b { color:#d8c5a1; font-weight:600; }
  .right { position:relative; z-index:2; display:flex; align-items:center; }
  .mark {
    width:300px; height:300px; border-radius:60px;
    background:#0f1216; border:1px solid rgba(216,197,161,0.18);
    display:grid; place-items:center;
  }
  .mark svg { width:210px; height:210px; }
</style></head>
<body>
  <div class="frame"></div>
  <div class="rain" id="rain"></div>
  <div class="left">
    <div class="kicker">your.name</div>
    <div class="rule"></div>
    <h1>your.name</h1>
    <p class="sub">Your name. Your work. Your links.</p>
    <div class="links">
      <span><b>github</b> @your-username</span>
      <span><b>discord</b> @your-username</span>
    </div>
  </div>
  <div class="right">
    <div class="mark">
      <svg viewBox="0 0 64 64">
        <g stroke="#3c4a58" stroke-width="2.6" stroke-linecap="round" opacity=".55">
          <path d="M13 21v9"/><path d="M52 25v8"/><path d="M19 38v8"/><path d="M45 36v8"/>
        </g>
        <g stroke="#8a6a3f" stroke-width="2.6" stroke-linecap="round" opacity=".8">
          <path d="M34 13v7"/>
        </g>
        <circle cx="49" cy="16" r="6" fill="#d8c5a1" opacity=".9"/>
        <circle cx="46.4" cy="14.2" r="6" fill="#0f1216"/>
        <path d="M37 24.5c-2.2-2.1-5-3.2-8.3-3.2-4.8 0-8.1 2.5-8.1 6.1 0 3.5 2.7 5.2 8.3 6.2 5.6 1 8.4 2.7 8.4 6.2 0 3.7-3.3 6.2-8.4 6.2-3.5 0-6.4-1.2-8.7-3.4"
              fill="none" stroke="#d8c5a1" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
<script>
  const rain = document.getElementById('rain');
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('i');
    const h = 30 + Math.random() * 80;
    d.style.height = h + 'px';
    d.style.left = Math.random() * 1200 + 'px';
    d.style.top = Math.random() * 630 + 'px';
    d.style.opacity = 0.25 + Math.random() * 0.55;
    rain.appendChild(d);
  }
</script>
</body></html>`;

(async () => {
  fs.mkdirSync(ASSETS, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  await page.setContent(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ASSETS, 'og-image.png') });
  console.log('  assets/og-image.png  1200x630');

  await browser.close();
})();
