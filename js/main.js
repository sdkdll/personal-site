// Rain background. Light particles falling at different speeds.

(() => {
  const canvas = document.getElementById('bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width;
  let height;
  const drops = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  const count = Math.floor((width * height) / 4500);

  for (let i = 0; i < count; i++) {
    drops.push({
      x: Math.random() * width,
      y: Math.random() * -height,
      z: Math.random() * 2 + 0.5,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 4 + 2,
      alpha: Math.random() * 0.4 + 0.1
    });
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);

    for (const drop of drops) {
      drop.y += drop.speed * drop.z;
      if (drop.y > height) {
        drop.y = Math.random() * -height;
        drop.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.2, drop.y + drop.length);
      ctx.strokeStyle = `rgba(168, 85, 247, ${drop.alpha * drop.z * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    requestAnimationFrame(frame);
  }

  frame();
})();
