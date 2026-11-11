// Express API. Serves the static files and expose the presence endpoint.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const ROOT = path.join(__dirname, '..');
const LANYARD_URL = 'https://api.lanyard.rest/v1/users';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://cdn.discordapp.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'"],
        upgradeInsecureRequests: IS_PROD ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
);

app.use(compression());
app.use(express.json({ limit: '8kb' }));

// Only the methods the site actually uses.
app.use((req, res, next) => {
  const allowed = ['GET', 'HEAD', 'OPTIONS'];
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Keep internal paths out of the static handler.
const PRIVATE = ['/server', '/node_modules', '/scripts', '/.git'];

app.use((req, res, next) => {
  const url = req.path.toLowerCase();

  if (PRIVATE.some((p) => url === p || url.startsWith(p + '/'))) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Only the presence endpoint is public.
  if (url.startsWith('/api') && url !== '/api/profile') {
    return res.status(404).json({ error: 'Not found' });
  }

  next();
});

// Only these directories are served as static files. Everything else in
// the project root (LICENSE, package.json, .env, server/) stays private.
const staticOptions = {
  dotfiles: 'ignore',
  index: false,
  maxAge: IS_PROD ? '1h' : 0,
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
};

for (const dir of ['css', 'js', 'assets']) {
  app.use(`/${dir}`, express.static(path.join(ROOT, dir), staticOptions));
}

// HTML pages live in the project root.
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', IS_PROD ? 'public, max-age=0, must-revalidate' : 'no-store');
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('/:page', (req, res, next) => {
  const name = req.params.page;
  if (!name.endsWith('.html')) return next();

  const file = path.join(ROOT, name);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) return next();

  res.setHeader('Cache-Control', IS_PROD ? 'public, max-age=0, must-revalidate' : 'no-store');
  res.sendFile(file);
});

let cache = { data: null, at: 0 };

app.get('/api/profile', async (req, res) => {
  const now = Date.now();

  if (now - cache.at > 5000) {
    try {
      const userId = process.env.LANYARD_USER_ID;
      if (!userId) throw new Error('LANYARD_USER_ID is not set');

      const res2 = await fetch(`${LANYARD_URL}/${encodeURIComponent(userId)}`, {
        headers: { Accept: 'application/json' }
      });
      const payload = await res2.json();
      cache = { data: normalise(payload), at: now };
    } catch (err) {
      console.error('presence:', err.message);
      cache = { data: null, at: now };
    }
  }

  res.set('Cache-Control', 'no-store');
  res.json(cache.data || { user: null, status: 'offline', activity: null });
});

// Turns the Lanyard payload into the shape the front end expects.
function normalise(payload) {
  const data = payload && payload.data;
  if (!data) return null;

  const user = data.discord_user || {};
  const activities = data.activities || [];
  const main = activities.find((a) => a.type !== 4 && a.id !== 'custom');
  const custom = activities.find((a) => a.type === 4 || a.id === 'custom');

  let activity = null;
  if (main) {
    activity = main.name;
    if (main.state) activity += ` ${main.state}`;
  }
  if (!activity && custom) activity = custom.state;

  return {
    user: {
      id: user.id,
      username: user.username,
      display_name: user.global_name || user.display_name || user.username,
      avatar: user.avatar
    },
    status: data.discord_status || 'offline',
    activity
  };
}

app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
