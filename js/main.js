/* Afaf Elnaggar — portfolio interactions */
(() => {
  const html = document.documentElement;
  html.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  if (!hasGSAP) { // graceful fallback: show everything
    document.body.classList.remove('is-loading');
    $('.loader')?.remove();
    $$('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = target => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (!lenis) return el.scrollIntoView({ behavior: 'smooth' });
    // lazy images above the target can grow the page mid-flight, so re-aim on arrival
    let tries = 0;
    const go = d => lenis.scrollTo(el, { offset: 0, duration: d, onComplete: () => {
      if (Math.abs(el.getBoundingClientRect().top) > 4 && tries++ < 3) go(.5);
    } });
    go(1.6);
  };
  $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id.startsWith('#')) { e.preventDefault(); scrollTo(id === '#top' ? document.body : id); }
  }));

  /* ---------- text splitting ---------- */
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const o = document.createElement('span'); o.className = 'split-w';
            const i = document.createElement('span'); i.textContent = w;
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.split-w > span', el);
  };

  /* ---------- loader + intro ---------- */
  const intro = () => {
    const tl = gsap.timeline();
    tl.from('.hero__title .js-wide', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
      .from('.hero__objectInner', { y: 120, rotate: -14, scale: .85, opacity: 0, duration: 1.6, ease: 'expo.out' }, '<0.1')
      .from('.hero__ring', { scale: 0, opacity: 0, duration: 1.2, ease: 'expo.out' }, '<0.3')
      .from('.hero__top > *, .hero__bottom > *, .hero__callout', { y: 20, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out' }, '<0.1')
      .from('.nav, .progress', { opacity: 0, duration: .6 }, '<');
  };
  const loader = $('.loader');
  const finishLoad = () => {
    document.body.classList.remove('is-loading');
    lenis?.start();
    intro();
    ScrollTrigger.refresh();
  };
  if (reduce || !loader) { loader?.remove(); document.body.classList.remove('is-loading'); lenis?.start(); }
  else {
    const counter = { v: 0 };
    const imgs = $$('img').slice(0, 12);
    let loaded = 0;
    const target = () => Math.min(100, 30 + (loaded / imgs.length) * 70);
    imgs.forEach(i => (i.complete ? loaded++ : i.addEventListener('load', () => loaded++, { once: true })));
    const cnt = $('.js-count'), bar = $('.loader__bar i');
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const goal = elapsed > 3500 ? 100 : Math.min(target(), elapsed / 14);
      counter.v += (goal - counter.v) * 0.12;
      if (goal - counter.v < 0.4) counter.v = goal;
      cnt.textContent = String(Math.round(counter.v)).padStart(3, '0');
      bar.style.transform = `scaleX(${counter.v / 100})`;
      if (counter.v >= 100) {
        gsap.timeline({ onComplete: () => loader.remove() })
          .to('.loader__count, .loader__meta, .loader__bar', { y: -30, opacity: 0, duration: .5, ease: 'power2.in' })
          .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' })
          .add(finishLoad, '-=0.55');
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- clock ---------- */
  const clock = $('.js-clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { clock.textContent = fmt.format(new Date()); };
  tickClock(); setInterval(tickClock, 1000);

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    html.classList.add('has-cursor');
    const cur = $('.cursor'), ring = $('.cursor__ring'), dot = $('.cursor__dot'), label = $('.cursor__label');
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', e => {
      rx(e.clientX); ry(e.clientY);
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    document.addEventListener('pointerover', e => {
      const l = e.target.closest('[data-cursor]');
      const a = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!l);
      cur.classList.toggle('is-link', !l && !!a);
      if (l) label.textContent = l.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => cur.style.opacity = 0);
    document.addEventListener('pointerenter', () => cur.style.opacity = 1);
  }

  /* ---------- hero: CAD crosshair + 3D tilt ---------- */
  const hero = $('.hero');
  const obj = $('.hero__objectInner');
  if (fine && !reduce) {
    const h = $('.hero__cross .h'), v = $('.hero__cross .v'), coord = $('.hero__coord');
    const tx = gsap.quickTo(obj, 'rotateY', { duration: 1, ease: 'power3' });
    const ty = gsap.quickTo(obj, 'rotateX', { duration: 1, ease: 'power3' });
    const mx = gsap.quickTo(obj, 'x', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      h.style.transform = `translateY(${y}px)`; v.style.transform = `translateX(${x}px)`;
      coord.style.transform = `translate(${x + 10}px, ${y + 10}px)`;
      coord.textContent = `X ${String(Math.round(x)).padStart(4, '0')} · Y ${String(Math.round(y)).padStart(4, '0')}`;
      const nx = x / r.width - .5, ny = y / r.height - .5;
      tx(nx * 26); ty(-ny * 18); mx(nx * 30);
    });
  }
  if (!reduce) {
    // idle float
    gsap.to('.hero__object', { yPercent: -3, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    // scroll: title squeezes in width, object drifts & scales
    const wides = $$('.hero .js-wide');
    const st = { w: 125 };
    gsap.to(st, {
      w: 62, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      onUpdate: () => wides.forEach(w => (w.style.fontVariationSettings = `"wdth" ${st.w}`))
    });
    gsap.to('.hero__object', { yPercent: 30, scale: 1.18, rotate: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- marquee ---------- */
  if (!reduce) {
    const track = $('.marquee__track');
    const mq = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: self => { gsap.to(mq, { timeScale: self.direction * (1 + Math.min(Math.abs(self.getVelocity()) / 400, 5)), duration: .3, overwrite: true }); }
    });
  }

  /* ---------- storyboard (pinned horizontal) ---------- */
  const track = $('.story__track');
  for (let i = 1; i <= 16; i++) {
    const f = document.createElement('div'); f.className = 'frame';
    f.innerHTML = `<span class="mono">FR.${String(i).padStart(2, '0')}</span><img src="assets/img/story-${String(i).padStart(2, '0')}.webp" alt="Storyboard frame ${i}" loading="lazy">`;
    track.appendChild(f);
  }
  const pin = $('.story__pin');
  const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
  gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: s => gsap.set('.story__bar i', { scaleX: s.progress })
    }
  });

  /* ---------- Concetto strip (pinned horizontal, like the storyboard) ---------- */
  const rt = $('.rail__track'), pct = $('.js-railpct');
  const railDist = () => Math.max(0, rt.scrollWidth - innerWidth);
  gsap.to(rt, {
    x: () => -railDist(), ease: 'none',
    scrollTrigger: {
      trigger: '.rail__pin', start: 'top top', end: () => '+=' + railDist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: s => {
        gsap.set('.rail__bar i', { scaleX: s.progress });
        pct.textContent = String(Math.round(s.progress * 100)).padStart(3, '0') + '%';
      }
    }
  });

  /* ---------- progress lines + accent colour per section ---------- */
  const sections = $$('main > section');
  const lines = $('.progress__lines');
  const LABELS = { index: 'Index', p01: '01 Dasox', p02: '02 Buffet counter', p03: '03 Masar', p04: '04 Concetto', about: 'About', contact: 'Contact' };
  sections.forEach(sec => {
    const b = document.createElement('button');
    const label = LABELS[sec.id] || 'Intro';
    b.type = 'button'; b.dataset.label = label; b.setAttribute('aria-label', 'Go to ' + label);
    b.addEventListener('click', () => scrollTo(sec));
    lines.appendChild(b);
  });
  const lineEls = $$('button', lines);
  const secnum = $('.js-secnum');
  sections.forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: self => {
        if (!self.isActive) return;
        html.dataset.acc = sec.dataset.acc || 'lime';
        lineEls.forEach((l, k) => { l.classList.toggle('on', k <= i); l.classList.toggle('cur', k === i); });
        secnum.textContent = sec.dataset.num || String(i).padStart(2, '0');
      }
    });
  });

  /* ---------- split headings ---------- */
  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    if (reduce) return;
    gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, overwrite: true })
  });

  /* ---------- parallax ---------- */
  if (!reduce) $$('[data-speed]').forEach(el => {
    const s = parseFloat(el.dataset.speed);
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- counters ---------- */
  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = o.v.toFixed(dec)) })
    });
  });

  /* ---------- SVG sketches that draw themselves ---------- */
  $$('.svgdraw[data-svg]').forEach(async box => {
    let txt;
    try { txt = await (await fetch(box.dataset.svg)).text(); }
    catch { box.innerHTML = `<img src="${box.dataset.svg}" alt="">`; return; }
    box.innerHTML = txt;
    const svg = $('svg', box);
    svg.setAttribute('role', 'img');
    const paths = $$('path', svg);
    paths.forEach(p => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      const isFill = p.classList.contains('f');
      if (isFill) {
        p.style.stroke = p.getAttribute('fill');
        p.style.strokeWidth = .35;
        p.style.fillOpacity = 0;
      }
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduce ? 0 : len;
      if (reduce && isFill) p.style.fillOpacity = 1;
    });
    if (reduce) return;
    // sort roughly left→right so the drawing sweeps like a pen
    const sorted = paths.map(p => ({ p, b: p.getBBox() })).sort((a, b) => (a.b.x + a.b.y * .3) - (b.b.x + b.b.y * .3)).map(o => o.p);
    const fills = sorted.filter(p => p.classList.contains('f'));
    const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 80%', end: 'bottom 45%', scrub: 1 } });
    tl.to(sorted, { strokeDashoffset: 0, ease: 'none', duration: 1, stagger: { amount: box.classList.contains('svgdraw--stagger') ? 2 : 1.2 } });
    if (fills.length) tl.to(fills, { fillOpacity: 1, strokeWidth: 0, duration: .6, stagger: { amount: .6 } }, '-=0.8');
    ScrollTrigger.refresh();
  });

  /* ---------- Dasox handle modes ---------- */
  const stage = $('.modes__stage'), toggle = $('.toggle'), angle = $('.js-angle'), arc = $('.modes__dial .arc');
  const setMode = m => {
    stage.dataset.mode = m;
    toggle.classList.toggle('is-pistol', m === 'pistol');
    $$('.toggle__btn', toggle).forEach(b => b.classList.toggle('is-on', b.dataset.mode === m));
    const o = { a: parseInt(angle.textContent) || 0 };
    gsap.to(o, { a: m === 'pistol' ? 80 : 0, duration: 1, ease: 'expo.out', onUpdate: () => {
      angle.textContent = Math.round(o.a) + '°';
      arc.style.opacity = o.a / 80 * .9 + .1;
      arc.style.transform = `rotate(${o.a - 90}deg)`; arc.style.transformOrigin = '50px 50px';
    } });
  };
  $$('.toggle__btn', toggle).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); auto = false; setMode(b.dataset.mode); }));
  let auto = true;
  setMode('straight');
  ScrollTrigger.create({ trigger: stage, start: 'top 55%', once: true, onEnter: () => setTimeout(() => auto && setMode('pistol'), 700) });
  stage.addEventListener('click', () => { auto = false; setMode(stage.dataset.mode === 'pistol' ? 'straight' : 'pistol'); });

  /* ---------- Dasox multi-function switch ---------- */
  const sw = $('.switch');
  if (sw) {
    const frames = $$('.switch__view img', sw), range = $('.switch__range', sw), idx = $('.js-swidx', sw), view = $('.switch__view', sw);
    let swTouched = false;
    const setPos = n => {
      n = Math.max(1, Math.min(4, n));
      frames.forEach((f, i) => f.classList.toggle('is-on', i === n - 1));
      range.value = n; idx.textContent = String(n).padStart(2, '0');
    };
    range.addEventListener('input', () => { swTouched = true; setPos(+range.value); });
    view.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !e.buttons) return;
      const r = view.getBoundingClientRect(); swTouched = true;
      setPos(Math.floor((e.clientX - r.left) / r.width * 4) + 1);
    });
    // demo once when it scrolls into view
    ScrollTrigger.create({ trigger: sw, start: 'top 65%', once: true, onEnter: () => {
      [2, 3, 4, 1].forEach((n, i) => setTimeout(() => !swTouched && setPos(n), 600 * (i + 1)));
    } });
  }

  /* ---------- loupe magnifier ---------- */
  $$('.loupe').forEach(box => {
    const img = $('img', box);
    const lens = document.createElement('div'); lens.className = 'loupe__lens'; box.appendChild(lens);
    const Z = 2.4;
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    box.addEventListener('pointerenter', () => box.classList.add('is-on'));
    box.addEventListener('pointerleave', () => box.classList.remove('is-on'));
    box.addEventListener('pointermove', e => {
      const br = box.getBoundingClientRect(), ir = img.getBoundingClientRect();
      const x = e.clientX - br.left, y = e.clientY - br.top;
      const ix = e.clientX - ir.left, iy = e.clientY - ir.top;
      lens.style.left = x + 'px'; lens.style.top = y + 'px';
      lens.style.backgroundSize = `${ir.width * Z}px ${ir.height * Z}px`;
      lens.style.backgroundPosition = `${-(ix * Z - 110)}px ${-(iy * Z - 110)}px`;
    });
  });

  /* ---------- buffet feature explorer ---------- */
  const xImg = $('.explorer__img'), xIdx = $('.js-xidx');
  const xfs = $$('.xf');
  xfs.forEach(b => b.dataset.img && (new Image().src = `assets/img/${b.dataset.img}.webp`));
  const pick = b => {
    if (b.classList.contains('is-on')) return;
    xfs.forEach(x => x.classList.toggle('is-on', x === b));
    xIdx.textContent = b.querySelector('b').textContent;
    gsap.timeline()
      .to(xImg, { clipPath: 'inset(0 0 0 100%)', duration: .35, ease: 'power2.in' })
      .add(() => { xImg.src = `assets/img/${b.dataset.img}.webp`; })
      .fromTo(xImg, { clipPath: 'inset(0 100% 0 0)', scale: 1.08 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: .7, ease: 'expo.out' });
  };
  xfs.forEach(b => { b.addEventListener('click', () => pick(b)); if (fine) b.addEventListener('mouseenter', () => pick(b)); });

  /* ---------- hotspots ---------- */
  $$('.dot').forEach(d => {
    if (parseFloat(d.style.getPropertyValue('--x')) > 55) d.classList.add('flip');
    d.addEventListener('click', e => { e.stopPropagation(); const was = d.classList.contains('is-open'); $$('.dot.is-open').forEach(x => x.classList.remove('is-open')); d.classList.toggle('is-open', !was); });
  });
  document.addEventListener('click', () => $$('.dot.is-open').forEach(x => x.classList.remove('is-open')));

  /* ---------- languages bars ---------- */
  $$('.langs i').forEach(i => ScrollTrigger.create({ trigger: i, start: 'top 90%', once: true, onEnter: () => i.style.setProperty('--p', i.style.getPropertyValue('--v')) }));

  /* ---------- contact: per-letter width on hover ---------- */
  const big = $('.js-flex');
  if (big) {
    big.innerHTML = big.innerHTML.split(/(<br>)/).map(part => part === '<br>' ? part : [...part].map(c => `<span class="ch">${c}</span>`).join('')).join('');
    if (!reduce) gsap.from($$('.ch', big), { yPercent: 100, opacity: 0, stagger: .03, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: big, start: 'top 80%' } });
  }
  const mail = $('.contact__mail');
  mail.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(mail.dataset.copy); } catch { location.href = 'mailto:' + mail.dataset.copy; return; }
    mail.classList.add('copied'); setTimeout(() => mail.classList.remove('copied'), 1800);
  });
  if (fine && !reduce) $$('.magnetic').forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * .15, y: (e.clientY - r.top - r.height / 2) * .25, duration: .6, ease: 'power3' });
    });
    m.addEventListener('pointerleave', () => gsap.to(m, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }));
  });

  // lazy images shift layout — keep trigger positions honest
  let rT;
  document.addEventListener('load', e => {
    if (e.target.tagName !== 'IMG') return;
    clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 250);
  }, true);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
