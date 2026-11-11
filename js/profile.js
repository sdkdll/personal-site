// Live Discord presence, read from Lanyard.
// Lanyard mirrors whatever your Discord client is showing.

(() => {
  const el = {
    card: document.getElementById('presence'),
    avatar: document.getElementById('avatar'),
    name: document.getElementById('presence-name'),
    handle: document.getElementById('presence-handle'),
    status: document.getElementById('presence-status'),
    dot: document.getElementById('status-dot'),
    activity: document.getElementById('activity')
  };

  if (!el.card) return;

  const LABELS = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
    offline: 'Offline'
  };

  const COLORS = {
    online: '#22c55e',
    idle: '#f59e0b',
    dnd: '#ef4444',
    offline: '#71717a'
  };

  function render(data) {
    if (!data || !data.user) {
      el.card.classList.add('hidden');
      return;
    }

    el.card.classList.remove('hidden');

    const { user, status, activity } = data;

    el.name.textContent = user.display_name || user.username;
    el.handle.textContent = `@${user.username}`;

    const color = COLORS[status] || COLORS.offline;
    el.status.textContent = LABELS[status] || 'Offline';
    el.dot.style.background = color;
    el.dot.style.boxShadow = `0 0 8px ${color}`;

    if (user.avatar) {
      el.avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
      el.avatar.alt = user.username;
    }

    if (activity) {
      el.activity.classList.remove('hidden');
      el.activity.textContent = activity;
    } else {
      el.activity.classList.add('hidden');
    }
  }

  async function poll() {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) return;
      render(await res.json());
    } catch {
      // offline, keep the last state
    }
  }

  poll();
  setInterval(poll, 10000);
})();
