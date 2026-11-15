// Language switcher. Saves the choice in localStorage.

(() => {
  const { TRANSLATIONS, LANGUAGES, DEFAULT_LANG } = window.I18N || {};
  if (!TRANSLATIONS) return;

  const key = 'lang';
  const toggle = document.querySelector('.lang button');
  const menu = document.querySelector('.lang ul');
  const current = document.getElementById('lang-current');

  function stored() {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function active() {
    const saved = stored();
    if (saved && TRANSLATIONS[saved]) return saved;

    const nav = (navigator.language || 'en').toLowerCase().split('-')[0];
    return TRANSLATIONS[nav] ? nav : DEFAULT_LANG;
  }

  function apply(code) {
    const dict = TRANSLATIONS[code] || TRANSLATIONS[DEFAULT_LANG];

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const name = el.dataset.i18n;
      if (dict[name]) el.textContent = dict[name];
    });

    document.documentElement.lang = code;

    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === code ? 'true' : 'false');
    });

    if (current) {
      const lang = LANGUAGES.find((l) => l.code === code);
      current.textContent = lang ? lang.label : code.toUpperCase();
    }
  }

  function set(code) {
    if (!TRANSLATIONS[code]) return;
    try {
      localStorage.setItem(key, code);
    } catch {
      // private mode, ignore
    }
    apply(code);
  }

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => set(btn.dataset.lang));
  });

  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.parentElement.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!menu.parentElement.contains(e.target)) {
        menu.parentElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  apply(active());
  window.setLang = set;
})();
