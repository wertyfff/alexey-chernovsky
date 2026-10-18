(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Обновление = всегда с начала ----------------
     Браузер не восстанавливает позицию, якорь из адреса убирается
     (в <head>), а при возврате из bfcache страница перезагружается. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  toTop();
  window.addEventListener('beforeunload', toTop);
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------------- Эмблема: глаз-«наблюдатель» ----------------
     Цвет линий — currentColor, заливка «фона» — var(--eye-bg),
     поэтому эмблема перекрашивается вместе с шапкой. */
  let uid = 0;
  function drawEye(target) {
    const id = 'eyeclip' + uid++;
    const FG = 'currentColor';
    const cx = 220, cy = 100;
    const almond = 'M40 100Q220 -38 400 100Q220 238 40 100Z';
    const lid = x => { const t = (x - 40) / 360; return t <= 0 || t >= 1 ? 0 : 276 * t * (1 - t); };

    const defs = el('defs', {}, target);
    const cp = el('clipPath', { id }, defs);
    el('path', { d: almond }, cp);

    // лучи
    const rays = el('g', { stroke: FG, 'stroke-linecap': 'round', fill: 'none' }, target);
    const N = 76;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.PI / N;
      const c = Math.cos(a), s = Math.sin(a);
      let r = 0;
      while (r < 260) {
        const x = cx + c * r, y = cy + s * r;
        if (x < 40 || x > 400 || Math.abs(y - cy) > lid(x)) break;
        r += 1;
      }
      const r0 = r + 9;
      const rEnd = 1 / Math.sqrt((c / 216) ** 2 + (s / 99) ** 2);
      if (rEnd - r0 < 10) continue;
      const kind = i % 4;
      const len = kind === 0 ? 1 : kind === 2 ? .82 : .64;
      const r1 = r0 + (rEnd - r0) * len;
      const w = kind === 0 ? 3 : 2;
      if (kind === 2 && rEnd - r0 > 36) {
        const mid = r0 + (r1 - r0) * .55;
        el('line', { x1: cx + c * r0, y1: cy + s * r0, x2: cx + c * mid, y2: cy + s * mid, 'stroke-width': w }, rays);
        el('line', { x1: cx + c * (mid + 6), y1: cy + s * (mid + 6), x2: cx + c * r1, y2: cy + s * r1, 'stroke-width': w }, rays);
      } else {
        el('line', { x1: cx + c * r0, y1: cy + s * r0, x2: cx + c * r1, y2: cy + s * r1, 'stroke-width': w }, rays);
      }
      if (kind === 3) el('circle', { cx: cx + c * (r1 + 7), cy: cy + s * (r1 + 7), r: 2.2, fill: FG, stroke: 'none' }, rays);
    }

    // звёзды-искры по углам
    const star = (x, y, r) => el('path', {
      d: `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`, fill: FG
    }, target);
    star(22, 22, 12); star(418, 178, 12); star(404, 30, 6); star(36, 172, 6);

    // веко
    el('path', { d: almond, class: 'e-bg', stroke: FG, 'stroke-width': 6, 'stroke-linejoin': 'round' }, target);

    // радужка (двигается за курсором)
    const clip = el('g', { 'clip-path': `url(#${id})` }, target);
    const iris = el('g', {}, clip);
    el('circle', { cx, cy, r: 62, fill: FG }, iris);
    const gl = el('g', { class: 'e-bgs', 'stroke-width': 1.7, 'stroke-linecap': 'round' }, iris);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r0 = i % 2 ? 30 : 26, r1 = i % 2 ? 54 : 58;
      el('line', { x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: cx + Math.cos(a) * r1, y2: cy + Math.sin(a) * r1 }, gl);
    }
    el('circle', { cx, cy, r: 22, class: 'e-bg' }, iris);
    el('circle', { cx: cx + 8, cy: cy - 8, r: 6, fill: FG }, iris);

    // внутренний контур века
    el('path', {
      d: almond, fill: 'none', stroke: FG, 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke',
      transform: `translate(${cx} ${cy}) scale(.93 .84) translate(${-cx} ${-cy})`
    }, target);

    return iris;
  }

  const heroIris = drawEye(document.querySelector('.hero-emblem svg'));
  drawEye(document.querySelector('.seal__eye'));

  /* ---------------- Элементы ---------------- */
  const name = document.querySelector('.hero-name');
  const line1 = name.querySelector('[data-line="1"]');
  const line2 = name.querySelector('[data-line="2"]');
  const emblem = document.querySelector('.hero-emblem');
  const heroNav = document.querySelector('.hero-nav');
  const heroLinks = [...heroNav.querySelectorAll('a')];
  const mini = document.querySelector('.mini-nav');
  const miniRows = [...mini.children];
  const fade = document.querySelector('.topfade');
  const cue = document.querySelector('.scrollcue');
  const stage = document.querySelector('.stage');
  const rises = [...document.querySelectorAll('[data-rise]')];
  const typeEl = document.querySelector('[data-type]');
  const typeText = typeEl.textContent.trim();
  const waves = document.querySelector('.waves');
  const quietWin = waves.closest('.case__vis');
  const district = document.querySelector('.art--district');
  const sealRing = document.querySelector('.seal__ring');
  const finalSec = document.querySelector('.final');
  const steps = document.querySelector('.steps');
  const stepItems = [...steps.querySelectorAll('.step')];
  const stepBg = steps.querySelector('.steps__bg');
  const stepFg = steps.querySelector('.steps__fg');

  // волны для кейса «Тише»
  const WAVES = 17;
  const wavePaths = Array.from({ length: WAVES }, () => el('path', {}, waves));

  // точки для кейса «18–24» (иллюстративно)
  const dotsBox = document.querySelector('.research__dots');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dotsFrag = document.createDocumentFragment();
  for (let i = 0; i < 160; i++) {
    const d = document.createElement('i');
    const col = i % 16, row = Math.floor(i / 16);
    if (rnd() < .18 + (col < 6 && row > 3 ? .45 : 0)) d.className = 'on';
    dotsFrag.appendChild(d);
  }
  dotsBox.appendChild(dotsFrag);

  // экспертиза: раскрытие по нажатию (на десктопе ещё и по наведению)
  document.querySelectorAll('.exp__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.parentElement;
      const open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // мобильное меню
  const menu = document.getElementById('menu');
  const menuBtn = document.querySelector('.menu-btn');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    root.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('.menu__nav a').focus({ preventScroll: true });
    else if (menu.contains(document.activeElement)) menuBtn.focus({ preventScroll: true });
  };
  menuBtn.addEventListener('click', () => setMenu(true));
  menu.querySelector('.menu__close').addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('.menu__nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  /* ---------------- Замер главного экрана (на resize) ---------------- */
  let L = {};

  function layout() {
    const W = root.clientWidth;
    const H = window.innerHeight;
    const mobile = W < 700;
    const g0 = mobile ? 10 : 16;
    const g1 = mobile ? 12 : 22;

    name.style.transform = emblem.style.transform = heroNav.style.transform = 'none';

    name.style.fontSize = '100px';
    const w1 = line1.getBoundingClientRect().width;
    const w2 = line2.getBoundingClientRect().width;
    const nameW = W - g0 * 2;
    const F = (100 * nameW) / w2;
    name.style.fontSize = F + 'px';
    const nameH = name.offsetHeight;
    const aW = (w1 * F) / 100;

    // эмблема стоит справа от первой строки
    const lineH = F * .78;
    const gap = F * (mobile ? .06 : .1);
    const avail = W - g0 - (g0 + aW + gap);
    const eW = Math.max(60, Math.min(avail, lineH * 2.3));
    emblem.style.width = eW + 'px';

    const nameEnd = mobile ? 124 : clamp(W * .118, 150, 190);
    const eEnd = Math.min(eW * .95, mobile ? 92 : clamp(W * .14, 150, 210));

    const D = H * (mobile ? .62 : 1.3);
    // на телефоне первый экран короче: манифест заглядывает снизу
    const stageH = mobile
      ? Math.max(D + H * .1, nameH + 380)
      : Math.max(D + H * .32, nameH + H * .75);
    stage.style.setProperty('--stage-h', stageH + 'px');
    root.style.setProperty('--name-h', nameH + 'px');

    // меню на главном экране
    heroNav.classList.toggle('hero-nav--row', mobile);
    heroNav.style.left = g0 + 'px';
    if (mobile) {
      heroNav.style.top = (g0 + nameH + 8) + 'px';
      heroNav.style.width = nameW + 'px';
    } else {
      heroNav.style.top = g0 + 'px';
      heroNav.style.width = '';
      heroLinks.forEach(a => {
        a.style.setProperty('--nx', parseFloat(a.style.getPropertyValue('--x')) * nameW);
        a.style.setProperty('--ny', parseFloat(a.style.getPropertyValue('--y')) * nameH);
      });
    }

    const miniTop = g1 + eEnd * (200 / 440) + (mobile ? 6 : 14);
    mini.style.top = miniTop + 'px';
    mini.style.right = g1 + 'px';

    L = {
      W, H, mobile, g0, g1, D,
      sEnd: nameEnd / nameW, eScale: eEnd / eW,
      nameBottom: g1 + nameEnd * (nameH / nameW),
      miniBottom: miniTop + mini.offsetHeight
    };

    measure();
  }

  /* ---------------- Позиции блоков (на resize и при изменении высоты страницы) ---------------- */
  function measure() {
    const y = window.scrollY;
    // вычитаем текущий сдвиг появления, чтобы не сбрасывать трансформации
    rises.forEach(r => { r._top = r.getBoundingClientRect().top + y - (r._ty || 0); r._v = -1; });
    const top = n => n.getBoundingClientRect().top + y;
    typeEl._top = top(typeEl);
    quietWin._top = top(quietWin); quietWin._h = quietWin.offsetHeight;
    district._top = top(district); district._h = district.offsetHeight;
    finalSec._top = top(finalSec);

    // линия процесса: ступеньки от точки к точке
    const sr = steps.getBoundingClientRect();
    steps._top = sr.top + y;
    const pts = stepItems.map(s => {
      const d = s.querySelector('.step__dot').getBoundingClientRect();
      return [d.left + d.width / 2 - sr.left, d.top + d.height / 2 - sr.top, d.top + y];
    });
    let d = `M${pts[0][0]} ${pts[0][1]}`, len = 0;
    steps._cum = [0];
    for (let i = 1; i < pts.length; i++) {
      d += `L${pts[i - 1][0]} ${pts[i][1]}L${pts[i][0]} ${pts[i][1]}`;
      len += Math.abs(pts[i][1] - pts[i - 1][1]) + Math.abs(pts[i][0] - pts[i - 1][0]);
      steps._cum.push(len);
    }
    steps._len = len;
    steps._from = pts[0][2];
    steps._to = pts[pts.length - 1][2];
    stepBg.setAttribute('d', d);
    stepFg.setAttribute('d', d);

    lastType = -1; lastStep = -1; lastP = -1;
    update();
  }

  /* ---------------- Кадр ---------------- */
  let lastType = -1, lastP = -1, lastStep = -1, miniOn = false, onRed = false, miniRed = false;

  function update() {
    const y = window.scrollY;
    const { H, D, g0, g1 } = L;

    // 1. Главный экран: линейная привязка к scroll progress, как в референсе
    let p = clamp(y / D);
    if (reduced) p = p > .5 ? 1 : 0;

    if (p !== lastP) {
      lastP = p;
      const s = lerp(1, L.sEnd, p);
      const t = lerp(g0, g1, p);
      name.style.transform = `translate3d(${t}px,${t}px,0) scale(${s})`;
      const es = lerp(1, L.eScale, p);
      emblem.style.transform = `translate3d(${-t}px,${t}px,0) scale(${es})`;

      // разбросанное меню уходит сразу вместе с именем
      const nv = 1 - clamp(p / .07);
      heroNav.style.opacity = nv;
      heroNav.style.visibility = nv <= 0 ? 'hidden' : 'visible';
      if (!L.mobile) {
        heroNav.style.transformOrigin = '0 0';
        heroNav.style.transform = `translate3d(${t - g0}px,${t - g0}px,0) scale(${s})`;
      } else {
        heroNav.style.transform = `translate3d(0,${-p * 40}px,0)`;
      }

      // индикатор прокрутки исчезает в начале движения
      cue.style.opacity = 1 - clamp(p / .12);

      // компактное меню появляется в конце
      const q = clamp((p - .8) / .2);
      mini.style.opacity = q > 0 ? 1 : 0;
      mini.style.visibility = q > 0 ? 'visible' : 'hidden';
      miniRows.forEach((r, i) => {
        const qi = easeOut(clamp((q - i * .18) / .64));
        r.style.opacity = qi;
        r.style.transform = `translate3d(0,${(1 - qi) * 10}px,0)`;
      });
      const on = q > .6;
      if (on !== miniOn) { miniOn = on; mini.classList.toggle('is-on', on); }

      fade.style.opacity = clamp((p - .75) / .25);
    }

    // 2. Шапка перекрашивается над красным финалом
    const r1 = y + L.nameBottom * .6 > finalSec._top;
    if (r1 !== onRed) { onRed = r1; root.classList.toggle('on-red', r1); }
    const r2 = y + L.miniBottom * .7 > finalSec._top;
    if (r2 !== miniRed) { miniRed = r2; root.classList.toggle('mini-red', r2); }

    // 3. Появление блоков — от позиции скролла, в обе стороны
    for (const r of rises) {
      let v = reduced ? 1 : easeOut(clamp((y + H - r._top) / (H * .32)));
      v = Math.round(v * 1000) / 1000;
      if (v === r._v) continue;
      r._v = v;
      r._ty = (1 - v) * 70;
      r.style.opacity = v;
      r.style.transform = v === 1 ? 'none' : `translate3d(0,${r._ty}px,0)`;
    }

    // 4. Процесс: линия рисуется по мере прокрутки
    const sp = reduced ? 1 : clamp((y + H * .62 - steps._from) / (steps._to - steps._from));
    const sk = Math.round(sp * 1000);
    if (sk !== lastStep) {
      lastStep = sk;
      stepFg.style.strokeDashoffset = 1 - sp;
      const drawn = sp * steps._len + .5;
      stepItems.forEach((s, i) => s.classList.toggle('is-on', drawn >= steps._cum[i] && (i > 0 || sp > 0)));
    }

    // 5. Терминал «печатает» по мере прокрутки
    const tp = reduced ? 1 : clamp((y + H - typeEl._top - H * .2) / (H * .55));
    const n = Math.round(tp * typeText.length);
    if (n !== lastType) {
      lastType = n;
      typeEl.textContent = typeText.slice(0, n);
      const c = document.createElement('span');
      c.className = 'caret';
      typeEl.appendChild(c);
    }

    // 6. «Тише»: шум выпрямляется по мере прокрутки
    const qa = (y + H - quietWin._top) / (H + quietWin._h);
    if (qa > -.05 && qa < 1.05) drawWaves(clamp(qa), y);

    // 7. «Район»: средний постер слегка смещается
    const da = (y + H - district._top) / (H + district._h);
    if (da > -.05 && da < 1.05) district.style.setProperty('--poster-shift', ((.5 - da) * 50).toFixed(1) + 'px');

    // 8. Печать в подвале
    if (!reduced) sealRing.style.transform = `rotate(${(y * .04) % 360}deg)`;
  }

  function drawWaves(k, y) {
    const calm = reduced ? .55 : clamp((k - .2) / .6);
    const amp = 1 - calm * .92;
    const ph = reduced ? 0 : y * .006;
    for (let i = 0; i < WAVES; i++) {
      const base = 34 + i * (250 / (WAVES - 1));
      const mid = 1 - Math.abs(i - (WAVES - 1) / 2) / ((WAVES - 1) / 2);
      const A = (5 + mid * 26) * amp;
      let d = '';
      for (let x = 0; x <= 800; x += 16) {
        const env = Math.sin((x / 800) * Math.PI);
        const yy = base + A * env * (Math.sin(x * .021 + i * .9 + ph) * .7 + Math.sin(x * .053 - i * 1.7 - ph * 1.6) * .3);
        d += (x ? 'L' : 'M') + x + ' ' + yy.toFixed(1);
      }
      wavePaths[i].setAttribute('d', d);
    }
  }

  /* ---------------- Цикл ---------------- */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });

  let lastW = 0, lastH = 0, rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const W = root.clientWidth, H = window.innerHeight;
      // на мобильных адресная строка меняет высоту — не перестраиваемся из-за этого
      if (W === lastW && Math.abs(H - lastH) < 160) return;
      lastW = W; lastH = H;
      if (W >= 700 && menu.classList.contains('is-open')) setMenu(false);
      layout();
    }, 120);
  });

  // высота страницы меняется (раскрытие экспертизы, догрузка шрифтов) — пересчитываем позиции
  let mt;
  const ro = new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => L.H && measure(), 80); });

  /* ---------------- Взгляд за курсором ---------------- */
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const svg = emblem.querySelector('svg');
    const step = () => {
      cx += (tx - cx) * .12; cy += (ty - cy) * .12;
      heroIris.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .05 ? requestAnimationFrame(step) : 0;
    };
    window.addEventListener('pointermove', e => {
      const b = svg.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2);
      const dy = e.clientY - (b.top + b.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 500);
      tx = (dx / d) * 26 * k;
      ty = (dy / d) * 10 * k;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ---------------- Часы ---------------- */
  const clocks = document.querySelectorAll('[data-clock]');
  const tick = () => {
    const t = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    clocks.forEach(c => (c.textContent = t));
  };
  tick();
  setInterval(tick, 1000);

  /* ---------------- Старт ---------------- */
  const start = () => {
    toTop();
    lastW = root.clientWidth; lastH = window.innerHeight;
    layout();
    root.classList.add('is-ready');
    ro.observe(document.querySelector('main'));
  };
  window.addEventListener('load', toTop);
  if (document.fonts && document.fonts.ready) {
    let done = false;
    const go = () => { if (!done) { done = true; start(); } };
    document.fonts.load('900 100px "Playfair Display"', 'АлексейЧерновский').then(go, go);
    setTimeout(go, 2500);
    document.fonts.ready.then(() => done && layout());
  } else {
    start();
  }
})();
