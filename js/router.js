/* ============================================================
   sdk.dll — Navegacion sin recargar
   Cambia de pagina sin recargar el documento. Asi el reproductor
   sigue sonando (el iframe de YouTube nunca se destruye) y la
   navegacion es instantanea.

   Reglas:
   - Solo intercepta enlaces internos a paginas .html
   - Si algo falla, cae a la navegacion normal
   - Precarga la pagina al pasar el raton por encima
   ============================================================ */

(() => {
  "use strict";

  const CACHE = new Map();
  const EXTERNAL = /^(?:[a-z]+:)?\/\//i;

  /** Devuelve la URL destino si el enlace es navegable dentro del sitio */
  function internalTarget(a) {
    const href = a.getAttribute('href');
    if (!href) return null;
    if (href.startsWith('#')) return null;
    if (EXTERNAL.test(href)) return null;
    if (a.target && a.target !== '_self') return null;
    if (a.hasAttribute('download')) return null;
    if (a.getAttribute('rel') === 'external') return null;

    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return null;
    }
    if (url.origin !== location.origin) return null;
    if (url.hash) return null;

    const isPage = /\.(?:html?)$/i.test(url.pathname) || url.pathname === '/';
    if (!isPage) return null;
    return url;
  }

  /** /bio en vez de /bio.html */
  function cleanPath(pathname) {
    if (pathname === '/' || pathname === '/index.html') return '/';
    return pathname.replace(/\.html?$/i, '');
  }

  async function fetchPage(url) {
    const key = cleanPath(url.pathname);
    if (CACHE.has(key)) return CACHE.get(key);
    const res = await fetch(url.href, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    CACHE.set(key, doc);
    return doc;
  }

  function copyMeta(doc, attr, value) {
    const next = doc.querySelector(`meta[${attr}="${value}"]`);
    const cur = document.querySelector(`meta[${attr}="${value}"]`);
    if (!next) return;
    if (!cur) {
      document.head.appendChild(document.importNode(next, true));
      return;
    }
    cur.setAttribute('content', next.getAttribute('content') || '');
  }

  function copyLink(doc, rel) {
    const next = doc.querySelector(`link[rel="${rel}"]`);
    const cur = document.querySelector(`link[rel="${rel}"]`);
    if (!next) return;
    if (!cur) {
      document.head.appendChild(document.importNode(next, true));
      return;
    }
    cur.setAttribute('href', next.getAttribute('href') || '');
  }

  /** Pega el contenido de la pagina nueva en el documento actual */
  function swap(doc, url) {
    const nextMain = doc.querySelector('main');
    const curMain = document.querySelector('main');
    if (!nextMain || !curMain) return false;

    document.title = doc.title;
    copyMeta(doc, 'name', 'description');
    copyMeta(doc, 'property', 'og:title');
    copyMeta(doc, 'property', 'og:description');
    copyMeta(doc, 'property', 'og:url');
    copyMeta(doc, 'property', 'og:image');
    copyLink(doc, 'canonical');
    copyLink(doc, 'icon');
    copyLink(doc, 'manifest');
    copyLink(doc, 'apple-touch-icon');

    if (doc.documentElement.lang) {
      document.documentElement.lang = doc.documentElement.lang;
    }

    curMain.replaceWith(document.importNode(nextMain, true));
    window.scrollTo(0, 0);
    return true;
  }

  async function go(url, push) {
    try {
      const doc = await fetchPage(url);
      if (!swap(doc, url)) {
        location.href = url.href;
        return;
      }
      if (push) history.pushState({ path: cleanPath(url.pathname) }, '', cleanPath(url.pathname));
      document.dispatchEvent(new CustomEvent('page:change', {
        detail: { path: cleanPath(url.pathname) }
      }));
    } catch {
      location.href = url.href;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;

    const url = internalTarget(a);
    if (!url) return;
    if (cleanPath(url.pathname) === cleanPath(location.pathname)) return;

    e.preventDefault();
    go(url, true);
  });

  /* Precarga: el raton pasa por encima y la pagina ya esta descargada */
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const url = internalTarget(a);
    if (!url) return;
    const key = cleanPath(url.pathname);
    if (CACHE.has(key)) return;
    fetchPage(url).catch(() => { /* si falla, se cargara al hacer clic */ });
  }, { passive: true });

  /* Atras / adelante */
  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    go(url, false);
  });

  /* Atajos: numeros para ir a las paginas */
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    const routes = { '1': '/', '2': '/bio', '3': '/music' };
    const path = routes[e.key];
    if (!path) return;
    if (cleanPath(location.pathname) === path) return;
    go(new URL(path, location.origin), true);
  });
})();
