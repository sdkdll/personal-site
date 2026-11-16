// Track list. Edit js/tracks-data.js to add your own.
// The HTML already ships the rows (scripts/build.js generates them) so the
// view source is not empty. Here we only make them interactive.

(() => {
  const tracks = window.TRACKS || [];
  let list = null;

  function render() {
    list.textContent = '';

    tracks.forEach((track, i) => {
      const row = document.createElement('a');
      row.className = 'track';
      row.href = track.url || '#';
      row.target = '_blank';
      row.rel = 'noopener noreferrer';

      const cover = track.cover
        ? `<span class="cover sk"><img src="${track.cover}" alt="" width="42" height="42" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
        : '<span class="cover"></span>';

      row.innerHTML = `
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        ${cover}
        <div class="meta">
          <div class="name"></div>
          <div class="artist"></div>
        </div>
        <span class="len"></span>
      `;

      row.querySelector('.name').textContent = track.title || '';
      row.querySelector('.artist').textContent = track.artist || '';
      row.querySelector('.len').textContent = track.length || '';

      list.appendChild(row);
    });
  }

  function bindRows() {
    list.querySelectorAll('.track').forEach((row) => {
      const cover = row.querySelector('.cover');
      const img = cover && cover.querySelector('img');
      if (!img) return;
      const reveal = () => cover.classList.remove('sk');
      if (img.complete && img.naturalWidth > 0) reveal();
      else {
        img.addEventListener('load', reveal, { once: true });
        img.addEventListener('error', reveal, { once: true });
      }
    });
  }

  function init() {
    list = document.getElementById('tracks');
    if (!list) return;
    if (!list.querySelector('.track')) render();
    bindRows();
  }

  init();
  document.addEventListener('page:change', init);
})();
