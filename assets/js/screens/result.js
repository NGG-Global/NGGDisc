// Result screen (design/preview/Result.html): style, axis graph, scores.

import { esc, icon, badge } from '../dom.js';
import { styleOf, dotFraction, flexBox } from '../scoring.js';

// Mockup offsets for the "המיקום שלך" label, relative to the dot centre (px).
const LABEL_ABOVE = -51;
const LABEL_BELOW = 29;
const LABEL_EDGE = 6;

// Quadrant cells in DOM order. RTL grid: first cell is top-right.
const QUADRANTS = ['D', 'I', 'C', 'S'];

function sideNames(questions) {
  const names = {};
  for (const axis of questions.axes) {
    names[axis.sides.a.id] = axis.sides.a.he;
    names[axis.sides.b.id] = axis.sides.b.he;
  }
  return names;
}

function scoreRow(axis, scores) {
  const a = axis.sides.a;
  const b = axis.sides.b;
  const sa = scores[a.id];
  const sb = scores[b.id];
  const lead = sa > sb ? 'a' : 'b';
  const bar = (score, strong) => (score > 0
    ? `<div class="bar__part ${strong ? 'bar__part--strong' : ''}" data-flex="${score}"></div>`
    : '');
  return `
    <div class="score">
      <div class="score__axis">${esc(axis.label)}</div>
      <div class="score__row">
        <span class="${lead === 'a' ? 'is-lead' : ''}">${esc(a.he)} <b data-count="${sa}" aria-hidden="true">${sa}</b><span class="sr-only">${sa}</span></span>
        <span class="${lead === 'b' ? 'is-lead' : ''}">${esc(b.he)} <b data-count="${sb}" aria-hidden="true">${sb}</b><span class="sr-only">${sb}</span></span>
      </div>
      <div class="bar" aria-hidden="true">${bar(sa, lead === 'a')}${bar(sb, lead === 'b')}</div>
    </div>`;
}

const COUNT_DELAY_MS = 750;
const COUNT_MS = 650;

function countUp(nodes, ctx) {
  const els = [...nodes];
  els.forEach((el) => { el.textContent = '0'; });
  let raf = 0;
  const timer = setTimeout(() => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - (1 - t) ** 3;
      els.forEach((el) => { el.textContent = String(Math.round(Number(el.dataset.count) * eased)); });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }, COUNT_DELAY_MS);
  // Leaving early always shows the real values.
  ctx.onLeave(() => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    els.forEach((el) => { el.textContent = el.dataset.count; });
  });
}

export function render(root, ctx) {
  const scores = ctx.scores();
  const mine = styleOf(scores);
  const all = ctx.styles.styles;
  const style = all[mine];
  const names = sideNames(ctx.questions);
  const notes = ctx.styles.notes;
  const { focus, pace } = style.quadrant;
  // The full reveal plays when arriving straight from the last pair.
  const reveal = ctx.nav.from === 'q' && !ctx.reducedMotion();
  const graphLabel = `מפת הסגנונות: המיקום שלך ברביע ה${style.name}, בצד ה${names[focus]} ובצד ה${names[pace]}`;

  const quads = QUADRANTS.map((k) => `
    <div class="quad quad--${k}${k === mine ? ' is-active' : ''}" data-disc="${k}">
      <div class="quad__label">${badge(k, 'xs')}<span class="quad__name">${esc(all[k].name)}</span></div>
    </div>`).join('');

  root.innerHTML = `
    <div class="screen screen--result${reveal ? ' is-reveal' : ''}">
      <div class="topbar" data-enter>
        <div class="topbar__title">התוצאה שלך</div>
        <button type="button" class="pill-btn" data-action="restart">${icon.restart(18)}<span>מילוי מחדש</span></button>
      </div>

      <div class="result-head" data-enter>
        <div class="result-head__eyebrow">הסגנון הבולט שלך</div>
        <div class="result-head__row">
          ${badge(mine, 'lg')}
          <div class="result-head__titles">
            <h1 tabindex="-1">${esc(style.name)}</h1>
            <div class="result-head__sub"><span lang="en">${esc(style.en)}</span> · ${esc(style.tagline)}</div>
          </div>
        </div>
      </div>

      <div class="card card--graph" data-enter>
        <div class="graph" role="img" aria-label="${esc(graphLabel)}">
          ${quads}
          <div class="graph__flex" aria-hidden="true"></div>
          <div class="axis-pill axis-pill--top" aria-hidden="true">${esc(names.active)}</div>
          <div class="axis-pill axis-pill--bottom" aria-hidden="true">${esc(names.thoughtful)}</div>
          <div class="axis-pill axis-pill--right" aria-hidden="true">${esc(names.task)}</div>
          <div class="axis-pill axis-pill--left" aria-hidden="true">${esc(names.people)}</div>
          <div class="graph__halo" aria-hidden="true"></div>
          <div class="graph__dot" aria-hidden="true"></div>
          <div class="graph__you" aria-hidden="true">המיקום שלך</div>
        </div>
        <div class="legend">
          <span class="legend__swatch" aria-hidden="true"></span>
          <span>המרכז המקווקו הוא אזור הגמישות: ניקוד 9–10 בציר.</span>
        </div>
      </div>

      <div class="card card--scores" data-enter>
        <h2>הניקוד שלך</h2>
        ${ctx.questions.axes.map((axis) => scoreRow(axis, scores)).join('')}
      </div>

      <div class="card card--soft" data-enter>
        <h2>איך לקרוא את התוצאה</h2>
        <p>${esc(notes[0])}</p>
        <p>${esc(notes[1])}</p>
      </div>

      <div class="actions" data-enter>
        <a class="btn-primary" href="#/style/${mine}"><span>לקרוא על הסגנון שלי</span>${icon.forward(20)}</a>
        <a class="btn-secondary" href="#/style/${mine}">לכל ארבעת הסגנונות</a>
      </div>

      <p class="fineprint" data-enter>${esc(notes[2])}</p>
    </div>`;

  root.querySelectorAll('[data-flex]').forEach((el) => { el.style.flex = el.dataset.flex; });

  // Graph geometry in percentages, so it follows the card width.
  const graph = root.querySelector('.graph');
  const pct = (v) => `${v * 100}%`;
  const box = flexBox(1);
  const flex = graph.querySelector('.graph__flex');
  Object.assign(flex.style, { left: pct(box.left), top: pct(box.top), width: pct(box.size), height: pct(box.size) });

  const dot = dotFraction(scores);
  for (const el of graph.querySelectorAll('.graph__halo, .graph__dot')) {
    el.style.left = pct(dot.left);
    el.style.top = pct(dot.top);
  }

  // Reveal: the dot travels from the centre to its place, numbers count up.
  if (reveal) {
    const size = graph.clientWidth;
    for (const el of graph.querySelectorAll('.graph__halo, .graph__dot')) {
      el.style.setProperty('--dx', `${(0.5 - dot.left) * size}px`);
      el.style.setProperty('--dy', `${(0.5 - dot.top) * size}px`);
    }
    countUp(root.querySelectorAll('[data-count]'), ctx);
  }

  // The label sits above the dot as in the mockup; near the top edge it moves
  // below, and it is clamped horizontally so it never leaves the graph.
  const label = graph.querySelector('.graph__you');
  const placeLabel = () => {
    const size = graph.clientWidth;
    const x = dot.left * size;
    const y = dot.top * size;
    const w = label.offsetWidth;
    let top = y + LABEL_ABOVE;
    if (top < LABEL_EDGE) top = y + LABEL_BELOW;
    const left = Math.min(Math.max(x, w / 2 + LABEL_EDGE), size - w / 2 - LABEL_EDGE);
    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
  };
  placeLabel();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeLabel);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(placeLabel);
    ro.observe(graph);
    ctx.onLeave(() => ro.disconnect());
  }

  root.querySelector('[data-action="restart"]').addEventListener('click', () => {
    if (window.confirm('למחוק את כל התשובות ולהתחיל את השאלון מחדש?')) {
      ctx.reset();
      ctx.go('#/intro');
    }
  });

  return 'התוצאה שלך';
}
