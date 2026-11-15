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
      ${track.cover ? `<span class="cover sk"><img src="${track.cover}" alt="" loading="lazy" /></span>` : '<span class="cover"></span>'}
      <div class="meta">
        <div class="name"></div>
        <div class="artist"></div>
      </div>
      <span class="len"></span>
    `;

    // La portada sale del placeholder cuando la imagen entra
    const cover = row.querySelector('.cover');
    const coverImg = cover && cover.querySelector('img');
    if (coverImg) {
      const reveal = () => cover.classList.remove('sk');
      if (coverImg.complete && coverImg.naturalWidth > 0) reveal();
      else {
        coverImg.addEventListener('load', reveal, { once: true });
        coverImg.addEventListener('error', reveal, { once: true });
      }
    }

    row.querySelector('.name').textContent = track.title || '';
    row.querySelector('.artist').textContent = track.artist || '';
    row.querySelector('.len').textContent = track.length || '';

    list.appendChild(row);
  });
})();
