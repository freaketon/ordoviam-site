/* Ordoviam — hero constitution + The Study.
   All page movement goes through the canonical transition (transition.js). */

import { Journey } from './transition.js';

const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the journey ---------- */
let intent = null;
const journey = new Journey($('#journey'), {
  onChange: name => { if (name === 'chat') enterStudy(); }
});
$$('[data-go-chat]').forEach(b => b.addEventListener('click', () => {
  intent = b.dataset.intent || intent;
  journey.go('chat');
}));
$$('[data-go-hero]').forEach(b => b.addEventListener('click', () => journey.go('hero')));

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

/* ---------- the artifact arrives once ---------- */
addEventListener('load', () => requestAnimationFrame(() =>
  $$('.hero-art img').forEach(el => el.classList.add('in'))));
setTimeout(() => $$('.hero-art img').forEach(el => el.classList.add('in')), 900);

/* ---------- the artifact answers the hand: quiet tilt, centering preserved ---------- */
(function parallax() {
  if (reduced || matchMedia('(pointer: coarse)').matches) return;
  const art = $('.hero-art');
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
    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;
    art.style.transform = `rotateY(${cx * 5}deg) rotateX(${-cy * 3}deg)`;
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(step);
    else raf = null;
  }
})();

/* ---------- The Study: an interview entering the record ---------- */
let studyOpen = false;

const OPENERS = {
  capital: "Good to meet you. Tell me about the company: what it does, roughly what revenue looks like, and what the capital is for.",
  lender: "Welcome. Tell me about your desk: the deal sizes you look for, which sectors, and where you lend.",
  none: "I'm Billie. I help both sides of a deal find each other. Are you raising capital, or are you a lender?"
};
const FOLLOWUP = "Noted, and added to the record. In the product, this becomes a structured intake and a documented search. For this preview my script ends here, but every word you wrote reaches the team.";

const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function addEntry(text, who, wordByWord) {
  const el = document.createElement('div');
  el.className = `entry ${who}`;
  const line = wordByWord && !reduced
    ? text.split(' ').map((w, i) =>
        `<span class="w" style="animation-delay:${i * 45}ms">${w}</span>`).join(' ')
    : text;
  el.innerHTML = `
    <div class="meta">
      <span class="speaker">${who === 'billie' ? 'Billie' : 'You'}</span>
      <span class="time">${stamp()}</span>
    </div>
    <div class="line">${line}</div>`;
  $('#transcript').appendChild(el);
  $('#transcript').scrollTop = $('#transcript').scrollHeight;
}

function billieSays(text, wordByWord = false) {
  const orb = $('#orb');
  orb.classList.add('thinking');
  setTimeout(() => {
    orb.classList.remove('thinking');
    addEntry(text, 'billie', wordByWord);
  }, reduced ? 0 : 900);
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

function enterStudy() {
  if (studyOpen) { if (intent) branch(intent); return; }
  studyOpen = true;
  if (intent) { branch(intent); return; }
  billieSays(OPENERS.none, true);
  setChips([
    ['We need financing', () => branch('capital')],
    ['We are a lender', () => branch('lender')]
  ]);
}

function branch(which) {
  intent = null;
  setChips([]);
  addEntry(which === 'capital' ? 'We need financing.' : 'We are a lender.', 'me');
  billieSays(OPENERS[which], true);
}

$('#composer').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addEntry(text, 'me');
  billieSays(FOLLOWUP);
});
