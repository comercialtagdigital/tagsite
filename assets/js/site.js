/* TAG Digital — interações. Vanilla JS, sem dependências. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const WHATSAPP = '5531993151956';

  /* ── navegação ─────────────────────────────── */
  const nav = $('[data-nav]');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('[data-menu-toggle]');
  const sheet = $('#menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
    sheet.hidden = !open;
    nav.classList.toggle('is-scrolled', open || scrollY > 24);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); toggle.focus(); } });

  // link ativo conforme a seção visível
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', a.hash === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });

  /* ── campo de sinal do hero ─────────────────
     Anéis do banner + trilhas de circuito da vinheta. Os pulsos saem das bordas e
     convergem para o centro: marketing, vendas e gestão chegando ao mesmo lugar. */
  const canvas = $('[data-field]');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas');
    const lctx = layer.getContext('2d');
    let W = 0, H = 0, dpr = 1, C = { x: 0, y: 0 }, base = 0, r0 = 0;
    let rings = [], paths = [], waves = [], hub = 0, raf = 0, last = 0, running = false, nextWave = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const rand = (a, b) => a + Math.random() * (b - a);
    const TILT = -0.16, SQUASH = 0.6;

    const ellipse = (c, cx, cy, rx, a0 = 0, a1 = Math.PI * 2) => {
      c.beginPath();
      c.ellipse(cx, cy, rx, rx * SQUASH, TILT, a0, a1);
    };

    function route(sx, sy, horizontal) {
      // horizontal → 45° → horizontal (ou vertical → 45° → vertical), parando no anel interno
      const dx = C.x - sx, dy = C.y - sy;
      const pts = [[sx, sy]];
      if (horizontal) {
        const run = Math.abs(dx) - Math.abs(dy);
        const x1 = sx + Math.sign(dx) * Math.max(0, run) * rand(0.2, 0.75);
        pts.push([x1, sy]);
        pts.push([x1 + Math.sign(dx) * Math.abs(dy), C.y]);
      } else {
        const run = Math.abs(dy) - Math.abs(dx);
        const y1 = sy + Math.sign(dy) * Math.max(0, run) * rand(0.2, 0.75);
        pts.push([sx, y1]);
        pts.push([C.x, y1 + Math.sign(dy) * Math.abs(dx)]);
      }
      pts.push([C.x, C.y]);
      // corta no raio r0 e mede
      const out = [pts[0]], lens = [0];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = out[out.length - 1], [bx, by] = pts[i];
        const seg = Math.hypot(bx - ax, by - ay);
        if (seg < 0.5) continue;
        const remain = Math.hypot(bx - C.x, by - C.y);
        if (remain < r0) {
          // último trecho até a borda do núcleo
          const dA = Math.hypot(ax - C.x, ay - C.y);
          if (dA <= r0) break;
          const t = Math.max(0, (dA - r0) / (dA - remain || 1));
          const ex = ax + (bx - ax) * Math.min(1, t), ey = ay + (by - ay) * Math.min(1, t);
          total += Math.hypot(ex - ax, ey - ay); out.push([ex, ey]); lens.push(total);
          break;
        }
        total += seg; out.push([bx, by]); lens.push(total);
      }
      return { pts: out, lens, total, t: -rand(0, 3.5), speed: rand(90, 190), tail: rand(50, 110) };
    }

    function at(p, d) {
      const { pts, lens } = p;
      let i = 1;
      while (i < lens.length - 1 && lens[i] < d) i++;
      const a = pts[i - 1], b = pts[i], seg = lens[i] - lens[i - 1] || 1;
      const t = Math.min(1, Math.max(0, (d - lens[i - 1]) / seg));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      for (const c of [canvas, layer]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      const mobile = W < 760;
      C = { x: W * (mobile ? 0.72 : 0.74), y: H * (mobile ? 0.26 : 0.44) };
      base = Math.max(W, H) * (mobile ? 0.62 : 0.5);
      r0 = base * 0.13;
      rings = [0.2, 0.34, 0.52, 0.76, 1.05, 1.42].map((k, i) => ({
        rx: base * k, a: rand(0, 6.28), w: (i % 2 ? -1 : 1) * rand(0.05, 0.12), span: rand(0.35, 0.8)
      }));

      paths = [];
      const n = mobile ? 9 : 16;
      for (let i = 0; i < n; i++) {
        const side = i % 4; // 0 esquerda, 1 topo, 2 base, 3 direita
        if (side === 0) paths.push(route(-10, rand(H * 0.08, H * 0.95), true));
        else if (side === 1) paths.push(route(rand(W * 0.35, W * 0.98), -10, false));
        else if (side === 2) paths.push(route(rand(W * 0.3, W), H + 10, false));
        else paths.push(route(W + 10, rand(0, H), true));
      }

      // camada estática
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, W, H);
      rings.forEach((r, i) => {
        ellipse(lctx, C.x, C.y, r.rx);
        lctx.strokeStyle = `rgba(26,157,255,${0.22 - i * 0.025})`;
        lctx.lineWidth = 1;
        lctx.stroke();
      });
      lctx.lineWidth = 1;
      lctx.strokeStyle = 'rgba(140,180,255,0.07)';
      paths.forEach((p) => {
        lctx.beginPath();
        p.pts.forEach(([x, y], k) => (k ? lctx.lineTo(x, y) : lctx.moveTo(x, y)));
        lctx.stroke();
        const [ex, ey] = p.pts[0];
        lctx.fillStyle = 'rgba(140,180,255,0.18)';
        lctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      });
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const ox = pointer.x * 18, oy = pointer.y * 12;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, ox, oy, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const cx = C.x + ox, cy = C.y + oy;

      // brilho que corre nos anéis
      rings.forEach((r, i) => {
        r.a += r.w * dt;
        for (const [lw, al] of [[7, 0.07], [1.6, 0.75 - i * 0.08]]) {
          ellipse(ctx, cx, cy, r.rx, r.a, r.a + r.span);
          ctx.strokeStyle = `rgba(80,180,255,${al})`;
          ctx.lineWidth = lw; ctx.lineCap = 'round';
          ctx.stroke();
        }
      });

      // emissão periódica do núcleo (os arcos do logo)
      if (now > nextWave) { waves.push(0); nextWave = now + 3800; }
      waves = waves.filter((w) => w < 1);
      waves.forEach((w, i) => {
        waves[i] = w + dt / 3.2;
        const k = 0.12 + waves[i] * 1.1;
        ellipse(ctx, cx, cy, base * k);
        ctx.strokeStyle = `rgba(26,157,255,${0.45 * (1 - waves[i]) ** 2})`;
        ctx.lineWidth = 1.5; ctx.stroke();
      });

      // pulsos nas trilhas
      paths.forEach((p) => {
        p.t += dt;
        if (p.t < 0) return;
        const d = p.t * p.speed;
        if (d - p.tail > p.total) { hub = Math.min(1.4, hub + 0.35); p.t = -rand(0.6, 3.2); p.speed = rand(90, 190); return; }
        const head = Math.min(d, p.total), tail = Math.max(0, d - p.tail);
        const [hx, hy] = at(p, head), [tx, ty] = at(p, tail);
        const g = ctx.createLinearGradient(tx + ox, ty + oy, hx + ox, hy + oy);
        g.addColorStop(0, 'rgba(26,157,255,0)');
        g.addColorStop(1, 'rgba(150,215,255,0.95)');
        ctx.beginPath();
        let started = false;
        for (let s = tail; s <= head; s += 6) { const [x, y] = at(p, s); started ? ctx.lineTo(x + ox, y + oy) : (ctx.moveTo(x + ox, y + oy), started = true); }
        ctx.lineTo(hx + ox, hy + oy);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.stroke();
        if (d <= p.total) { ctx.fillStyle = 'rgba(210,240,255,0.95)'; ctx.fillRect(hx + ox - 1.5, hy + oy - 1.5, 3, 3); }
      });

      // núcleo
      hub *= 0.965;
      const R = r0 * (1.6 + hub * 0.8);
      const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      hg.addColorStop(0, `rgba(120,200,255,${0.28 + hub * 0.25})`);
      hg.addColorStop(0.4, `rgba(0,75,247,${0.16 + hub * 0.12})`);
      hg.addColorStop(1, 'rgba(0,75,247,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      if (running) raf = requestAnimationFrame(frame);
    }

    const start = () => { if (running || reduced.matches || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const still = () => { stop(); last = 0; frame(performance.now()); };

    build();
    still();
    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && start()));
    reduced.addEventListener('change', () => (reduced.matches ? still() : start()));
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); running ? 0 : still(); }, 150); });
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }

  /* ── vinheta ───────────────────────────────── */
  const stage = $('[data-vt]');
  if (stage) {
    const video = $('video', stage);
    const playBtn = $('[data-vt-play]', stage);
    const soundBtn = $('[data-vt-sound]', stage);
    let userPaused = false;
    const sync = () => {
      const playing = !video.paused;
      playBtn.setAttribute('aria-pressed', playing);
      $('[data-label]', playBtn).textContent = playing ? 'Pausar' : 'Reproduzir';
      soundBtn.setAttribute('aria-pressed', !video.muted);
      $('[data-label]', soundBtn).textContent = video.muted ? 'Ativar som' : 'Desativar som';
    };
    const play = () => { video.preload = 'auto'; video.play().catch(() => {}); };
    video.addEventListener('play', sync); video.addEventListener('pause', sync); video.addEventListener('volumechange', sync);
    playBtn.addEventListener('click', () => { if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); } });
    soundBtn.addEventListener('click', () => { video.muted = !video.muted; if (!video.muted && video.paused) { userPaused = false; play(); } });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!userPaused && !reduced.matches) play(); }
      else if (!video.paused) video.pause();
    }, { threshold: 0.45 }).observe(stage);
    sync();
  }

  /* ── abas acessíveis (padrão WAI-ARIA) ─────── */
  function tabs(list, onSelect) {
    const btns = $$('[role="tab"]', list);
    const select = (i, focus) => {
      btns.forEach((b, k) => {
        const on = k === i;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel && !list.hasAttribute('data-ptabs')) panel.hidden = !on;
      });
      if (focus) btns[i].focus();
      onSelect && onSelect(i);
    };
    btns.forEach((b, i) => b.addEventListener('click', () => select(i)));
    list.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in map) { e.preventDefault(); select((i + map[e.key] + btns.length) % btns.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(btns.length - 1, true); }
    });
    return { select, get index() { return btns.findIndex((b) => b.getAttribute('aria-selected') === 'true'); }, size: btns.length };
  }

  const stabs = $('[data-stabs]');
  if (stabs) tabs(stabs);

  /* ── plataformas: pilha que gira ───────────── */
  const plist = $('[data-ptabs]');
  const stack = $('[data-stack]');
  if (plist && stack) {
    const cards = $$('.stack__card', stack);
    const ROT = 6000;
    plist.style.setProperty('--rot', ROT + 'ms');
    const place = (i) => cards.forEach((c, k) => {
      const pos = (k - i + cards.length) % cards.length;
      c.dataset.pos = pos;
      c.setAttribute('aria-hidden', pos !== 0);
      c.inert = pos !== 0;
    });
    let timer, hover = false, userPaused = reduced.matches;
    const t = tabs(plist, (i) => { place(i); schedule(); });
    const pauseBtn = $('[data-ptabs-pause]');
    const setPausedUI = () => {
      const paused = userPaused || hover;
      plist.toggleAttribute('data-paused', paused);
      pauseBtn.setAttribute('aria-pressed', userPaused);
      $('[data-label]', pauseBtn).textContent = userPaused ? 'Retomar rotação' : 'Pausar rotação';
    };
    function schedule() {
      clearTimeout(timer);
      setPausedUI();
      if (userPaused || hover) return;
      // reinicia a barra de progresso
      const bar = $$('.ptabs__bar i', plist)[t.index];
      if (bar) { bar.style.transition = 'none'; bar.style.scale = '0 1'; bar.offsetWidth; bar.style.transition = ''; bar.style.scale = ''; }
      timer = setTimeout(() => t.select((t.index + 1) % t.size), ROT);
    }
    pauseBtn.addEventListener('click', () => { userPaused = !userPaused; schedule(); });
    const section = stack.closest('section');
    section.addEventListener('pointerenter', () => { hover = true; schedule(); });
    section.addEventListener('pointerleave', () => { hover = false; schedule(); });
    section.addEventListener('focusin', () => { hover = true; schedule(); });
    section.addEventListener('focusout', (e) => { if (!section.contains(e.relatedTarget)) { hover = false; schedule(); } });
    new IntersectionObserver(([en]) => { if (!en.isIntersecting) clearTimeout(timer); else schedule(); }).observe(stack);
    place(0);
    stack.setAttribute('data-ready', '');
  }

  /* ── marquee de clientes ───────────────────── */
  const mq = $('[data-marquee]');
  if (mq) {
    const track = $('.marquee__track', mq);
    $$('li', track).forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); $('img', c).alt = ''; track.appendChild(c); });
    mq.setAttribute('data-ready', '');
  }

  /* ── formulário → WhatsApp ─────────────────── */
  const form = $('[data-form]');
  if (form) {
    const interest = $('#f-interesse', form);
    $$('[data-interest]').forEach((a) => a.addEventListener('click', () => { interest.value = a.dataset.interest; }));
    const check = (el) => {
      const field = el.closest('.field');
      const ok = el.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', !ok);
      const err = $('.field__err', field);
      if (err) el.setAttribute('aria-describedby', err.id);
      return ok;
    };
    const required = $$('[required]', form);
    required.forEach((el) => {
      el.addEventListener('blur', () => { if (el.closest('.field').classList.contains('is-invalid') || el.value) check(el); });
      el.addEventListener('input', () => { if (el.closest('.field').classList.contains('is-invalid')) check(el); });
      el.addEventListener('change', () => check(el));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = required.filter((el) => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const lines = [
        `Olá, TAG! Sou ${d.nome.trim()}${d.empresa && d.empresa.trim() ? ', da ' + d.empresa.trim() : ''}.`,
        `Interesse: ${d.interesse}`,
        `Desafio: ${d.desafio.trim()}`,
      ];
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    });
  }

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
