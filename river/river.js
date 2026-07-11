/* Ordoviam — the river. Native 1:1 scroll; the page bends sideways at the reach.
   The rail draws the way live, its corner turning slightly ahead of the page. */

const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- worlds and modes (review chrome) ---------- */
const WORLDS = ['charcoal', 'slate', 'navy', 'oxblood', 'copper'];
function setWorld(w) {
  document.documentElement.dataset.world = w;
  localStorage.setItem('ordoviam-world', w);
  $$('.wdot').forEach(d => d.classList.toggle('active', d.dataset.worldPick === w));
}
function setMode(m) {
  document.documentElement.dataset.mode = m;
  localStorage.setItem('ordoviam-mode', m);
  $('#modeflip').textContent = m === 'day' ? 'Night' : 'Day';
}
$$('.wdot').forEach(d => d.addEventListener('click', () => setWorld(d.dataset.worldPick)));
$('#modeflip').addEventListener('click', () =>
  setMode(document.documentElement.dataset.mode === 'day' ? 'night' : 'day'));
addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  const i = +e.key - 1;
  if (i >= 0 && i < WORLDS.length) setWorld(WORLDS[i]);
  if (e.key === 'd') setMode(document.documentElement.dataset.mode === 'day' ? 'night' : 'day');
});
setWorld(localStorage.getItem('ordoviam-world') || 'navy');
setMode(localStorage.getItem('ordoviam-mode') || 'day');

if (!reduced && window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- the reach: vertical scroll becomes horizontal travel, 1:1 ---------- */
  const track = $('#reachTrack');
  const travel = () => track.scrollWidth - innerWidth;
  const hold = () => Math.round(innerHeight * 0.3);   /* a still beat before the river turns down */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#reachPin',
      start: 'top top',
      end: () => `+=${travel() + hold()}`,
      pin: true,
      scrub: true,                  /* direct link, no lerp: the page obeys the hand */
      invalidateOnRefresh: true
    }
  });
  tl.to(track, { x: () => -travel(), ease: 'none', duration: 1 })
    .to(track, { x: () => -travel(), ease: 'none', duration: 0.3 }); /* the hold */
}

/* ---------- the rail: the way, drawn live, bending with the river ---------- */
(function rail() {
  if (reduced) return;
  const svg = $('#railSvg'), bed = $('#railBed'), flow = $('#railFlow'), stops = $('#railStops');
  const NS = 'http://www.w3.org/2000/svg';
  let total = 0, stopMarks = [];

  function build() {
    const H = innerHeight, W = 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const doc = document.documentElement.scrollHeight - innerHeight;
    if (doc <= 0) return;

    /* where the reach lives, as fractions of total scroll */
    const pin = $('#reachPin');
    const st = ScrollTrigger.getAll()[0];
    const reachStart = st ? st.start / doc : 0.3;
    const reachEnd = st ? st.end / doc : 0.55;

    /* the rail path: down at x=10, bend right to x=24 for the reach, back to x=10 */
    const pad = 14;
    const usable = H - pad * 2;
    const y1 = pad + usable * reachStart;
    const y2 = pad + usable * reachEnd;
    const d = `M10 ${pad} L10 ${y1} L24 ${y1 + 8} L24 ${y2 - 8} L10 ${y2} L10 ${H - pad}`;
    bed.setAttribute('d', d);
    flow.setAttribute('d', d);
    total = flow.getTotalLength();
    flow.style.strokeDasharray = total;
    flow.style.strokeDashoffset = total;

    /* station dots along the bend */
    stops.innerHTML = ''; stopMarks = [];
    for (let i = 0; i < 5; i++) {
      const f = reachStart + (reachEnd - reachStart) * (i + 0.5) / 5;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', 24); c.setAttribute('cy', pad + usable * f);
      c.setAttribute('r', 2.6); c.setAttribute('class', 'stop');
      c.setAttribute('stroke-width', '1');
      stops.appendChild(c);
      stopMarks.push({ el: c, at: f });
    }
  }

  function draw() {
    const doc = document.documentElement.scrollHeight - innerHeight;
    if (doc <= 0 || !total) return;
    const p = Math.min(1, Math.max(0, scrollY / doc));
    /* the corner turns slightly ahead of the page: the way announces the bend */
    const lead = Math.min(1, p * 1.02 + 0.002);
    flow.style.strokeDashoffset = total * (1 - lead);
    stopMarks.forEach(s => s.el.classList.toggle('lit', p >= s.at));
  }

  addEventListener('scroll', draw, { passive: true });
  addEventListener('resize', () => { build(); draw(); });
  /* build after ScrollTrigger measures the pin spacer */
  setTimeout(() => { build(); draw(); }, 300);
  addEventListener('load', () => setTimeout(() => { build(); draw(); }, 400));
})();
