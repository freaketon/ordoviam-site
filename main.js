/* Ordoviam — the scroll film. One gesture: the way reveals itself.
   Lenis smooth scroll + GSAP ScrollTrigger. Calm, ease-out, never bouncy. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

/* ---------- nav: solid after leaving the hero ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > innerHeight * 0.7), { passive: true });

if (!reduced && window.gsap) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* ---------- Lenis smooth scroll, driving ScrollTrigger ---------- */
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* QA hook: ?qa=SCROLLPX jumps there after layout settles (harmless in prod) */
  const qaY = new URLSearchParams(location.search).get('qa');
  if (qaY) setTimeout(() => {
    ScrollTrigger.refresh(true); lenis.scrollTo(+qaY, { immediate: true }); ScrollTrigger.update();
    setTimeout(() => {
      const r = document.getElementById('roadPin').getBoundingClientRect();
      document.title = `QA y=${scrollY}`;
    }, 600);
  }, 900);

  /* anchors travel the way too — through Lenis, not past it */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: 0, duration: 1.6 }); }
  }));

  /* ---------- lazy-load section videos when near ---------- */
  $$('[data-lazy-video]').forEach(v => {
    ScrollTrigger.create({
      trigger: v.closest('.scene'), start: 'top 140%',
      once: true,
      onEnter: () => {
        const src = v.querySelector('source');
        src.src = src.dataset.src; v.load(); v.play().catch(() => {});
      }
    });
  });

  /* ---------- parallax for background media ---------- */
  $$('.bg-media[data-parallax]').forEach(el => {
    const depth = parseFloat(el.dataset.parallax);
    gsap.fromTo(el, { yPercent: -depth * 50 }, {
      yPercent: depth * 50, ease: 'none',
      scrollTrigger: { trigger: el.closest('.scene'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ══════════ SCENE 0 · arrival ══════════ */
  /* entrance: two sides converge, light blooms, copy rises */
  const arrive = gsap.timeline({ defaults: { ease: 'power3.out' } });
  arrive
    .from('#hL', { x: -46, opacity: 0, duration: 1.2, delay: 0.25 })
    .from('#hR', { x: 46, opacity: 0, duration: 1.2 }, '<')
    .from('#hCore', { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: 0.7 }, '-=0.45')
    .from('[data-hero]', { y: 26, opacity: 0, duration: 0.9, stagger: 0.16 }, '-=0.3');
  /* departure: the world recedes as you scroll away */
  gsap.to('#arrival .copy', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#arrival', start: 'top top', end: 'bottom 35%', scrub: true }
  });
  gsap.to('#heroVideo', {
    scale: 1.12, filter: 'brightness(0.55)', ease: 'none',
    scrollTrigger: { trigger: '#arrival', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ══════════ SCENE 1 · the road — lines rise and fall in one pinned breath ══════════ */
  const roadLines = $$('.road-line');
  const roadTL = gsap.timeline({
    scrollTrigger: { trigger: '#roadPin', start: 'top top', end: `+=${roadLines.length * 90}%`, pin: true, scrub: 0.6 }
  });
  roadLines.forEach((line, i) => {
    roadTL.fromTo(line, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1 })
          .to(line, { opacity: 1, duration: 0.6 })
          .to(line, i < roadLines.length - 1 ? { opacity: 0, y: -44, duration: 1 } : { opacity: 1, duration: 0.4 });
  });

  /* ══════════ SCENE 2 · the stations — the route draws as panels pass ══════════ */
  const path = $('#routePath');
  const stops = [];
  {
    const total = path.getTotalLength();
    path.style.strokeDasharray = total;
    path.style.strokeDashoffset = total;
    const NS = 'http://www.w3.org/2000/svg';
    const names = ['intake', 'package', 'match', 'outreach', 'terms'];
    for (let i = 0; i < 5; i++) {
      const pt = path.getPointAtLength((i / 4) * total);
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y); ring.setAttribute('r', 7.5);
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#D8D2C3');
      ring.setAttribute('stroke-width', '1.5'); ring.setAttribute('opacity', '0.4');
      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', pt.x + 16); label.setAttribute('y', pt.y + 4);
      label.setAttribute('font-family', 'ui-monospace, Menlo, monospace');
      label.setAttribute('font-size', '11.5'); label.setAttribute('fill', '#8E9B90');
      label.textContent = names[i];
      $('#routeStops').appendChild(ring); $('#routeStops').appendChild(label);
      stops.push(ring);
    }
    const panels = $$('.st-panel');
    const stTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#stationsPin', start: 'top top', end: '+=420%', pin: true, scrub: 0.6,
        onUpdate: self => {
          const idx = Math.min(4, Math.floor(self.progress * 5));
          $('#stNum').textContent = String(idx + 1).padStart(2, '0');
        }
      }
    });
    /* station 1 greets you before the pin engages */
    gsap.set(panels[0], { opacity: 1 });
    gsap.set(stops[0], { attr: { fill: '#B48A3C', stroke: '#B48A3C' }, opacity: 1 });
    panels.forEach((panel, i) => {
      const frac = i / 4;
      stTL.to(path, { strokeDashoffset: total * (1 - frac), duration: i === 0 ? 0.15 : 1 }, i * 2);
      if (i > 0) {
        stTL.to(stops[i], { attr: { fill: '#B48A3C', stroke: '#B48A3C' }, opacity: 1, duration: 0.3 }, i * 2 + 0.7)
            .fromTo(panel, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.7 }, i * 2 + 0.5);
      }
      if (i < panels.length - 1) stTL.to(panel, { opacity: 0, y: -30, duration: 0.6 }, i * 2 + 1.6);
    });
  }

  /* ══════════ SCENE 3 · the pass — the film is scrubbed by your scroll ══════════ */
  {
    const video = $('#passVideo');
    const lines = $$('.pass-line');
    let target = 0, current = 0;
    const passTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#passPin', start: 'top top', end: '+=340%', pin: true, scrub: 0.5,
        onUpdate: self => { target = self.progress; }
      }
    });
    lines.forEach((line, i) => {
      passTL.fromTo(line, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, i * 2 + 0.4)
            .to(line, { opacity: 1, duration: 0.5 }, i * 2 + 1.4);
      if (i < lines.length - 1) passTL.to(line, { opacity: 0, y: -36, duration: 0.8 }, i * 2 + 1.9);
    });
    /* smooth the currentTime toward scroll progress — glacial dolly under your thumb */
    const scrub = () => {
      if (video.duration) {
        current += (target - current) * 0.12;
        const t = current * (video.duration - 0.05);
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
      }
      requestAnimationFrame(scrub);
    };
    video.addEventListener('loadedmetadata', () => { video.pause(); requestAnimationFrame(scrub); });
  }

  /* ══════════ relief · cards rise quietly ══════════ */
  gsap.from('[data-rise]', {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.12,
    scrollTrigger: { trigger: '#lenders .cards', start: 'top 82%' }
  });

  /* ══════════ SCENE 4 · the convergence — the mark assembles under your scroll ══════════ */
  const cvTL = gsap.timeline({
    scrollTrigger: { trigger: '#cvPin', start: 'top top', end: '+=220%', pin: true, scrub: 0.6 }
  });
  cvTL.fromTo('#cvL', { x: -150, opacity: 0.25 }, { x: 0, opacity: 1, duration: 2 })
      .fromTo('#cvR', { x: 150, opacity: 0.25 }, { x: 0, opacity: 1, duration: 2 }, '<')
      .fromTo('#cvCore', { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.8 })
      .fromTo('#cvHalo', { opacity: 0 }, { opacity: 0.28, duration: 0.8 }, '<')
      .to('#cvHalo', { opacity: 0.12, duration: 0.8 })
      .fromTo('#cvCopy', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2 }, '-=0.6');

} else {
  /* reduced motion or no GSAP: static, readable, everything visible */
  $$('.road-line, .st-panel, .pass-line, .cv-copy').forEach(el => { el.style.opacity = 1; });
  $('#cvCopy') && ($('#cvCopy').style.opacity = 1);
  const path = document.getElementById('routePath');
  if (path) {
    const NS = 'http://www.w3.org/2000/svg';
    ['intake','package','match','outreach','terms'].forEach((n, i) => {
      const pt = path.getPointAtLength((i / 4) * path.getTotalLength());
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', 7.5);
      dot.setAttribute('fill', '#B48A3C');
      document.getElementById('routeStops').appendChild(dot);
    });
  }
}
