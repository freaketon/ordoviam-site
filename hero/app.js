/* Ordoviam hero exploration: palette review, logo reveal, Billie preview.
   All page movement goes through the canonical transition (transition.js). */

import { Journey } from './transition.js';

const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the journey ---------- */
const journey = new Journey($('#journey'), {
  onChange: name => { if (name === 'chat') startChat(); }
});
$$('[data-go-chat]').forEach(b => b.addEventListener('click', () => {
  intent = b.dataset.intent || null;
  journey.go('chat');
}));
$$('[data-go-hero]').forEach(b => b.addEventListener('click', () => journey.go('hero')));

/* ---------- palette review ---------- */
const KEYS = ['oxford', 'slate', 'ledger', 'meridian', 'verde', 'stone',
              'claret', 'ember', 'cobalt', 'plum', 'petrol', 'orchid',
              'carbon', 'claretnoir', 'forest', 'petrolnoir'];
const KEYMAP = '1234567890-=qwer';
function setPalette(name) {
  document.documentElement.dataset.palette = name;
  $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.palettePick === name));
}
$$('.swatch').forEach(s => s.addEventListener('click', () => setPalette(s.dataset.palettePick)));
addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;
  const i = KEYMAP.indexOf(e.key);
  if (i >= 0 && i < KEYS.length) setPalette(KEYS[i]);
});
setPalette('oxford');

/* ---------- logo reveal: planes converge, the light drops in and blooms ---------- */
(function reveal() {
  const L = $('#mL'), R = $('#mR'), light = $('#mLight');
  if (reduced) return;
  const outC = x => 1 - Math.pow(1 - x, 3);
  const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const DUR = 2600;
  let start;
  function frame(now) {
    if (start === undefined) start = now;
    const t = (now - start) / 1000;
    const conv = outC(seg(t, 0.15, 1.05));
    L.setAttribute('transform', `translate(${-42 * (1 - conv)},0)`);
    R.setAttribute('transform', `translate(${42 * (1 - conv)},0)`);
    L.style.opacity = R.style.opacity = 0.25 + 0.75 * conv;
    const drop = outC(seg(t, 0.95, 1.55));
    const bloom = outC(seg(t, 1.5, 2.1));
    light.setAttribute('cy', -60 + 46 * drop);
    light.setAttribute('r', 6.5 * (0.35 + 0.35 * drop + 0.3 * bloom));
    light.style.opacity = drop === 0 ? 0 : (0.6 + 0.4 * bloom);
    if (t * 1000 < DUR) requestAnimationFrame(frame);
    else finalize();
  }
  function finalize() {
    L.setAttribute('transform', 'translate(0,0)');
    R.setAttribute('transform', 'translate(0,0)');
    L.style.opacity = R.style.opacity = 1;
    light.setAttribute('cy', -14); light.setAttribute('r', 6.5); light.style.opacity = 1;
    document.getElementById('heroMark').classList.add('settled');
  }
  requestAnimationFrame(frame);
  setTimeout(finalize, DUR + 400); /* guarantees the resolved mark even in throttled tabs */
})();

/* ---------- the mark answers the hand: quiet pointer parallax ---------- */
(function parallax() {
  if (reduced || matchMedia('(pointer: coarse)').matches) return;
  const svg = $('#heroMark');
  const zone = $('.page-hero');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
  zone.addEventListener('pointermove', e => {
    const r = zone.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(step);
  });
  zone.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  function step() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    svg.style.transform = `rotateY(${cx * 6}deg) rotateX(${-cy * 4}deg) translateX(${cx * 8}px)`;
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(step);
    else raf = null;
  }
})();

/* ---------- Billie: scripted design preview ---------- */
let intent = null;
let chatStarted = false;

const OPENERS = {
  capital: "Good to meet you. Tell me a bit about the company: what it does, roughly what revenue looks like, and what the capital is for.",
  lender: "Welcome. Tell me about your desk: what size deals you look for, which sectors, and where you lend.",
  none: "I'm Billie. I help both sides of a deal find each other. Are you raising capital, or are you a lender?"
};
const FOLLOWUP = "Noted. In the real product I turn this into a structured intake and a documented search. For this preview, that's my whole script, but the team reads every word of the transcript.";

function addMsg(text, who) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  el.textContent = text;
  $('#thread').appendChild(el);
  $('#thread').scrollTop = $('#thread').scrollHeight;
}

function setChips(items) {
  const box = $('#chips');
  box.innerHTML = '';
  items.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = label;
    b.addEventListener('click', fn);
    box.appendChild(b);
  });
}

function startChat() {
  if (chatStarted) { if (intent) branch(intent); return; }
  chatStarted = true;
  if (intent) { branch(intent); return; }
  addMsg(OPENERS.none, 'billie');
  setChips([
    ['We need financing', () => branch('capital')],
    ['We are a lender', () => branch('lender')]
  ]);
}

function branch(which) {
  intent = null;
  setChips([]);
  addMsg(which === 'capital' ? 'We need financing.' : 'We are a lender.', 'me');
  setTimeout(() => addMsg(OPENERS[which], 'billie'), reduced ? 0 : 550);
}

$('#composer').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg(text, 'me');
  setTimeout(() => addMsg(FOLLOWUP, 'billie'), reduced ? 0 : 650);
});
