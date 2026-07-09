/* Ordoviam canonical page transition.
   THE way pages move in every Ordoviam surface: a horizontal slide, left to right,
   like turning a page. Reference this file everywhere; never reimplement transitions.

   Usage:
     import { Journey } from './transition.js'
     const journey = new Journey(document.querySelector('.journey'))   // pages = direct children
     journey.go('chat')      // slide to the page with data-page="chat"
     journey.back()          // slide to the previous page

   Contract:
     - Duration 650ms, easing cubic-bezier(0.22, 0.61, 0.21, 1). Calm, never bouncy.
     - Horizontal only. The journey moves sideways; content inside a page may scroll down.
     - Keyboard: ArrowRight / ArrowLeft. Touch: swipe left / right.
     - Respects prefers-reduced-motion (instant jump, no animation).
     - Keeps history state so the browser back button works.
*/

export const TRANSITION_MS = 650;
export const TRANSITION_EASE = 'cubic-bezier(0.22, 0.61, 0.21, 1)';

export class Journey {
  constructor(track, { onChange } = {}) {
    this.track = track;
    this.pages = [...track.children];
    this.names = this.pages.map(p => p.dataset.page);
    this.index = 0;
    this.onChange = onChange;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.style.display = 'flex';
    track.style.width = `${this.pages.length * 100}%`;
    this.pages.forEach(p => { p.style.width = `${100 / this.pages.length}%`; p.style.flexShrink = '0'; });
    track.style.transition = reduced ? 'none' : `transform ${TRANSITION_MS}ms ${TRANSITION_EASE}`;

    /* keyboard */
    addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') this.go(this.names[this.index + 1]);
      if (e.key === 'ArrowLeft') this.go(this.names[this.index - 1]);
    });

    /* touch: swipe like flipping a page */
    let x0 = null, y0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        this.go(this.names[this.index + (dx < 0 ? 1 : -1)]);
      }
      x0 = y0 = null;
    }, { passive: true });

    /* browser back/forward */
    addEventListener('popstate', e => {
      const name = (e.state && e.state.page) || this.names[0];
      this.go(name, { push: false });
    });
  }

  go(name, { push = true } = {}) {
    const i = this.names.indexOf(name);
    if (i === -1 || i === this.index) return;
    this.index = i;
    this.track.style.transform = `translateX(-${(100 / this.pages.length) * i}%)`;
    if (push) history.pushState({ page: name }, '', i === 0 ? location.pathname : `#${name}`);
    if (this.onChange) this.onChange(name, i);
  }

  back() { this.go(this.names[Math.max(0, this.index - 1)]); }
}
