/* Shared bits for every page: hydrangeas, hearts, the starry sky with bursts, the tab bar, the lock, and small helpers. */
(() => {
  const K = (window.K = {});
  const reduce = (K.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches);
  const NS = 'http://www.w3.org/2000/svg';
  const HEART_D = (K.HEART_D = 'M50 86 C20 62 4 46 4 27 C4 13 15 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C85 4 96 13 96 27 C96 46 80 62 50 86Z');
  const palettes = (K.palettes = {
    pink:  ['#ffb3d4', '#ff9cc7', '#ffc8e0', '#f7a8d8', '#ffd6e8'],
    deep:  ['#ff7fb3', '#f56aa6', '#ff94c2', '#e8559a', '#ffa6cf'],
    light: ['#ffd6e8', '#ffe3ef', '#ffc8e0', '#fbd0e6', '#ffe9f3'],
  });
  palettes.mix = [...palettes.pink, ...palettes.deep, ...palettes.light];
  const rnd = (K.rnd = (a, b) => a + Math.random() * (b - a));
  const pick = (K.pick = arr => arr[Math.floor(Math.random() * arr.length)]);
  K.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const el = (K.el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; });
  K.$ = id => document.getElementById(id);

  // ---------- unlock key ----------
  const KEY = 'irena-kljuc', OK = '1711121935972527';
  K.isUnlocked = () => { try { return localStorage.getItem(KEY) === OK; } catch { return false; } };
  K.unlock = () => { try { localStorage.setItem(KEY, OK); } catch {} };
  K.lock = () => { try { localStorage.removeItem(KEY); sessionStorage.clear(); } catch {} location.href = 'index.html'; };

  // ---------- helpers ----------
  K.pl = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 15) return many; if (b === 1) return one; if (b >= 2 && b <= 4) return few; return many; };
  K.pad = n => String(n).padStart(2, '0');
  K.fmtN = n => { try { return n.toLocaleString('sr-Latn'); } catch { return String(n); } };
  K.DAY = 864e5;
  K.midnight = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  K.sleepsUntil = (t, now) => Math.round((K.midnight(t) - K.midnight(now)) / K.DAY);
  K.fmtDay = (t, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => { try { return new Intl.DateTimeFormat('sr-Latn', opts).format(new Date(t)); } catch { return new Date(t).toLocaleDateString(); } };
  K.fmtDate = t => { const d = new Date(t); return `${K.fmtDay(t, { weekday: 'long', day: 'numeric', month: 'long' })} u ${K.pad(d.getHours())}:${K.pad(d.getMinutes())}`; };
  K.cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };
  K.b64e = s => { let bin = ''; new TextEncoder().encode(s).forEach(b => bin += String.fromCharCode(b)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  K.b64d = s => { try { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); } catch { return ''; } };
  K.restart = (node, cls) => { if (reduce) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
  K.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.photos = () => (window.SLIKE && Array.isArray(window.SLIKE.photos) ? window.SLIKE.photos : []);

  // ---------- next meeting: link (#d=...) > this device > vidjanje.json ----------
  const MKEY = 'irena-odbrojavanje-v1';
  K.EMPTY_MEETING = { t: 0, s: 0, p: '', l: '' };
  K.meetingHash = st => {
    const q = new URLSearchParams();
    q.set('d', st.t); if (st.s) q.set('s', st.s); if (st.p) q.set('p', st.p); if (st.l) q.set('l', K.b64e(st.l));
    return '#' + q.toString();
  };
  K.saveMeeting = st => { try { if (st.t) localStorage.setItem(MKEY, JSON.stringify(st)); else localStorage.removeItem(MKEY); } catch {} };
  K.meeting = async () => {
    const h = new URLSearchParams(location.hash.slice(1));
    const d = Number(h.get('d'));
    if (d > 0) {
      const st = { t: d, s: Number(h.get('s')) || 0, p: h.get('p') || '', l: h.get('l') ? K.b64d(h.get('l')) : '' };
      K.saveMeeting(st);
      return st;
    }
    let local = null;
    try { const j = JSON.parse(localStorage.getItem(MKEY)); if (j && j.t > 0) local = { ...K.EMPTY_MEETING, ...j }; } catch {}
    if (local && local.t > Date.now() - K.DAY) return local;
    try {
      const r = await fetch('vidjanje.json', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        const t = j && j.datum ? new Date(j.datum).getTime() : 0;
        if (t > 0) return { t, s: j.postavljeno ? new Date(j.postavljeno).getTime() || 0 : 0, p: j.mjesto || '', l: j.pismo || '' };
      }
    } catch {}
    return local || { ...K.EMPTY_MEETING };
  };

  // ---------- hydrangeas + hearts ----------
  K.hydrangea = colors => {
    const svg = el('svg', { viewBox: '0 0 200 200' });
    [[-50, 60], [40, 70], [-10, 85]].forEach(([dx, rot]) => {
      svg.appendChild(el('path', {
        d: 'M0 0 C18 -22 52 -22 70 0 C52 22 18 22 0 0Z',
        fill: '#9fd6a8', stroke: '#7cc08a', 'stroke-width': 1.5,
        transform: `translate(${100 + dx * 0.4} 140) rotate(${dx < 0 ? 180 - rot / 2 : rot / 2})`,
      }));
    });
    const florets = [];
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 62;
      florets.push({ x: 100 + Math.cos(a) * r, y: 92 + Math.sin(a) * r * 0.85, s: rnd(9, 13), rot: rnd(0, 90) });
    }
    florets.sort((p, q) => p.y - q.y);
    florets.forEach(f => {
      const g = el('g', { transform: `translate(${f.x} ${f.y}) rotate(${f.rot})` });
      const c = pick(colors);
      for (let k = 0; k < 4; k++) g.appendChild(el('ellipse', { cx: 0, cy: -f.s * 0.55, rx: f.s * 0.42, ry: f.s * 0.6, fill: c, stroke: '#fff', 'stroke-width': .8, 'stroke-opacity': .7, transform: `rotate(${k * 90})` }));
      g.appendChild(el('circle', { r: f.s * 0.16, fill: '#fff7fb' }));
      svg.appendChild(g);
    });
    return svg;
  };
  let hg = 0;
  K.heartSvg = (from = '#ffa6cf', to = '#ff5c9e') => {
    const id = 'kh' + hg++;
    return `<svg class="heart-svg" viewBox="0 0 100 90" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><path d="${HEART_D}" fill="url(#${id})"/><ellipse cx="28" cy="22" rx="9" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 28 22)"/></svg>`;
  };
  document.querySelectorAll('[data-bloom]').forEach(n => n.appendChild(K.hydrangea(palettes[n.dataset.bloom] || palettes.mix)));
  document.querySelectorAll('[data-heart]').forEach(n => { n.innerHTML = K.heartSvg(); });

  // ---------- tab bar ----------
  const ICONS = {
    pocetna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M12 17.2c-2.2-1.5-3.3-2.5-3.3-3.8a1.5 1.5 0 0 1 3.3-.7 1.5 1.5 0 0 1 3.3.7c0 1.3-1.1 2.3-3.3 3.8Z" fill="currentColor" stroke-width="1.2"/></svg>',
    zatebe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5C6 16.3 3 13.2 3 9.2 3 6.4 5.1 4.5 7.6 4.5c1.9 0 3.4 1.1 4.4 2.7 1-1.6 2.5-2.7 4.4-2.7 2.5 0 4.6 1.9 4.6 4.7 0 4-3 7.1-9 11.3Z"/></svg>',
    odbrojavanje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3h11M6.5 21h11M7.5 3v3.2c0 1.5.8 2.4 2 3.4L12 12l2.5-2.4c1.2-1 2-1.9 2-3.4V3M7.5 21v-3.2c0-1.5.8-2.4 2-3.4L12 12l2.5 2.4c1.2 1 2 1.9 2 3.4V21"/></svg>',
    slike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3.5"/><path d="M8.5 6 10 3.8h4L15.5 6"/><path d="M12 16.6c-1.9-1.3-2.9-2.2-2.9-3.3a1.3 1.3 0 0 1 2.9-.6 1.3 1.3 0 0 1 2.9.6c0 1.1-1 2-2.9 3.3Z" fill="currentColor" stroke-width="1"/></svg>',
  };
  const TABS = [['pocetna', 'index.html', 'Pocetna'], ['zatebe', 'za-irenu.html', 'Za tebe'], ['odbrojavanje', 'odbrojavanje.html', 'Odbrojavanje'], ['slike', 'slike.html', 'Slike']];
  const nav = document.querySelector('nav.tabbar');
  if (nav) {
    const cur = nav.dataset.page;
    nav.setAttribute('aria-label', 'Meni');
    nav.innerHTML = TABS.map(([k, href, label]) => `<a href="${href}"${k === cur ? ' aria-current="page"' : ''}>${ICONS[k]}<span>${label}</span></a>`).join('');
  }
  document.querySelectorAll('[data-lock]').forEach(b => b.addEventListener('click', K.lock));

  // ---------- the sky ----------
  const cv = K.$('sky');
  let burst = () => {};
  if (cv) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener('resize', resize);
    K.size = () => ({ W, H });
    const colors = ['#ff8fbf', '#ffb3d4', '#e8559a', '#ff7fb3', '#ffd6e8', '#ffffff'];
    const small = innerWidth < 600;
    const stars = Array.from({ length: small ? 45 : 70 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(1, 2.6), p: rnd(0, 6.28), sp: rnd(.6, 2), c: pick(['#ffffff', '#ffe3ef', '#ffd6ea']) }));
    const newFloater = anywhere => ({ x: rnd(0, W), y: anywhere ? rnd(0, H) : H + 30, s: rnd(8, 18), vy: rnd(.25, .7), sw: rnd(0, 6.28), kind: Math.random() < .6 ? 'heart' : 'star', c: pick(colors), a: rnd(.5, .9) });
    const floaters = Array.from({ length: small ? 14 : 22 }, () => newFloater(true));
    let bits = [];
    let calm = document.body.hasAttribute('data-calm'), skyAlpha = calm ? 0 : 1;
    K.setCalm = v => { calm = v; };
    burst = (x, y, n = 18, kinds = ['heart', 'star', 'star', 'heart', 'dot']) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, Math.PI * 2), v = rnd(2, 7);
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, s: rnd(7, 15), life: 1, kind: pick(kinds), c: pick(colors), rot: rnd(0, 6.28) });
      }
      if (reduce) draw(0);
    };
    addEventListener('pointerdown', e => {
      if (e.target.closest('dialog, input, textarea, nav, [data-noburst]')) return;
      burst(e.clientX, e.clientY);
    });
    const heart = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y + s * .35);
      ctx.bezierCurveTo(x - s, y - s * .35, x - s * .45, y - s, x, y - s * .45);
      ctx.bezierCurveTo(x + s * .45, y - s, x + s, y - s * .35, x, y + s * .35);
      ctx.fill();
    };
    const star = (x, y, s, rot = 0) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .42 : s, a = rot + i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    };
    const shape = (kind, x, y, s, rot) => { if (kind === 'heart') heart(x, y, s); else if (kind === 'star') star(x, y, s * .8, rot); else { ctx.beginPath(); ctx.arc(x, y, s * .25, 0, 7); ctx.fill(); } };
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      skyAlpha = calm ? Math.max(0, skyAlpha - .05) : Math.min(1, skyAlpha + (reduce ? 1 : .02));
      if (skyAlpha > 0) {
        stars.forEach(s => {
          ctx.globalAlpha = skyAlpha * (.45 + .55 * Math.abs(Math.sin(s.p + t * .001 * s.sp)));
          ctx.fillStyle = s.c;
          star(s.x * W, s.y * H, s.r * 2.2);
        });
        floaters.forEach((f, i) => {
          if (!reduce) { f.y -= f.vy; f.sw += .02; }
          if (f.y < -30) floaters[i] = newFloater(false);
          ctx.globalAlpha = f.a * skyAlpha; ctx.fillStyle = f.c;
          shape(f.kind, f.x + Math.sin(f.sw) * 14, f.y, f.s, f.sw * .3);
        });
      }
      bits = bits.filter(b => b.life > 0);
      bits.forEach(b => {
        b.x += b.vx; b.y += b.vy; b.vy += .15; b.vx *= .98; b.life -= reduce ? 1 : .016; b.rot += .1;
        ctx.globalAlpha = Math.max(b.life, 0); ctx.fillStyle = b.c;
        shape(b.kind, b.x, b.y, b.s, b.rot);
      });
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
  K.burst = (...a) => burst(...a);
  K.burstAt = (node, n = 26) => { const r = node.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n); };
})();
