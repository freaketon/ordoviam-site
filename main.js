/* Ordoviam — motion. One gesture everywhere: the way reveals itself.
   Calm, ease-out, 400–600ms steps. Respects prefers-reduced-motion. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const outC = x => 1 - Math.pow(1 - x, 3);
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

/* ---------- hero: two sides converge, light blooms at φ ---------- */
(function heroReveal() {
  const L = $('#hL'), R = $('#hR'), solid = $('#hSolid'),
        beam = $('#hBeam'), halo = $('#hHalo'), core = $('#hCore');
  if (!L) return;
  const paths = [$('path', L), $('path', R)];
  const LEN = 320, APART = 46;
  paths.forEach(p => { p.style.strokeDasharray = LEN; p.style.strokeDashoffset = LEN; });

  if (reduced) {
    solid.setAttribute('opacity', 1); core.setAttribute('opacity', 1);
    paths.forEach(p => p.setAttribute('opacity', 0));
    return;
  }

  const DUR = 5.6;
  let start;
  function frame(now) {
    if (start === undefined) start = now;
    const t = (now - start) / 1000;

    const draw = outC(seg(t, 0.2, 1.5));
    paths.forEach(p => { p.style.strokeDashoffset = LEN * (1 - draw); });
    const conv = outC(seg(t, 1.5, 2.5));
    L.setAttribute('transform', `translate(${-APART * (1 - conv)},0)`);
    R.setAttribute('transform', `translate(${APART * (1 - conv)},0)`);

    const b = seg(t, 2.3, 3.0);
    beam.setAttribute('opacity', b === 0 ? 0 : 0.75 * (1 - seg(t, 3.0, 3.5)));
    beam.setAttribute('y2', -57 + 43 * outC(b));

    const bloom = outC(seg(t, 2.8, 3.6));
    core.setAttribute('opacity', bloom);
    core.setAttribute('r', 6.5 * (0.25 + 0.75 * bloom));
    halo.setAttribute('opacity', bloom * (0.32 - 0.2 * seg(t, 3.6, 4.6)));

    const res = outC(seg(t, 3.4, 4.3));
    solid.setAttribute('opacity', res);
    const fade = (1 - res);
    L.setAttribute('opacity', fade); R.setAttribute('opacity', fade);

    if (t < DUR) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- stations: route draws with scroll; waypoints light one at a time ---------- */
(function stationsRoute() {
  const path = $('#routePath'), stopsG = $('#routeStops');
  if (!path) return;
  const cards = $$('.station-card');
  const total = path.getTotalLength();
  path.style.strokeDasharray = total;
  path.style.strokeDashoffset = total;

  // place waypoints along the path at even fractions
  const NS = 'http://www.w3.org/2000/svg';
  const stops = cards.map((card, i) => {
    const pt = path.getPointAtLength((i / (cards.length - 1)) * total);
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y); ring.setAttribute('r', 7);
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#D8D2C3');
    ring.setAttribute('stroke-width', '1.5'); ring.setAttribute('opacity', '0.5');
    stopsG.appendChild(ring);
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', pt.x + 14); label.setAttribute('y', pt.y + 4);
    label.textContent = ['intake', 'package', 'match', 'outreach', 'terms'][i] || '';
    stopsG.appendChild(label);
    return ring;
  });

  let lit = -1;
  function light(i) {
    if (i === lit) return;
    lit = i;
    // route draws to the current station
    const frac = i < 0 ? 0 : i / (cards.length - 1);
    path.style.transition = reduced ? 'none' : 'stroke-dashoffset 900ms cubic-bezier(.22,.61,.21,1)';
    path.style.strokeDashoffset = total * (1 - frac);
    stops.forEach((ring, j) => {
      const on = j <= i;
      ring.setAttribute('fill', on ? '#B48A3C' : 'none');
      ring.setAttribute('stroke', on ? '#B48A3C' : '#D8D2C3');
      ring.setAttribute('opacity', on ? '1' : '0.5');
    });
    cards.forEach((c, j) => c.classList.toggle('lit', j <= i));
  }

  if (reduced) { light(cards.length - 1); return; }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const i = +e.target.dataset.station;
        if (i > lit) light(i);
      }
    });
  }, { rootMargin: '-35% 0px -45% 0px' });
  cards.forEach(c => io.observe(c));
})();

/* ---------- quiet reveals ---------- */
(function reveals() {
  if (reduced) { $$('.rv').forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18 });
  $$('.rv').forEach(el => io.observe(el));
})();
