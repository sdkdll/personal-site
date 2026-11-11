// Track list. Edit js/canciones.js to add your own.

(() => {
  const list = document.getElementById('tracks');
  if (!list) return;

  const tracks = window.TRACKS || [];

  tracks.forEach((track, i) => {
    const row = document.createElement('a');
    row.className = 'track';
    row.href = track.url || '#';
    row.target = '_blank';
    row.rel = 'noopener noreferrer';

    row.innerHTML = `
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      ${track.cover ? `<img class="cover" src="${track.cover}" alt="" loading="lazy" />` : '<div class="cover"></div>'}
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
})();
