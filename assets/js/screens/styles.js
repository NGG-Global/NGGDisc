// Styles screen (design/preview/Style.html, StyleBrowse.html).
// Always reachable on the participant's own style; others are browsed in a loop.

import { esc, icon, badge } from '../dom.js';

const withPeriod = (text) => (/[.!?״"]$/.test(text) ? text : `${text}.`);

export function render(root, ctx, letter) {
  const { order, styles } = ctx.styles;
  const mine = ctx.myStyle();
  const style = styles[letter];
  const isMine = letter === mine;
  const i = order.indexOf(letter);
  const prev = order[(i + order.length - 1) % order.length];
  const next = order[(i + 1) % order.length];

  const sideHe = {};
  for (const axis of ctx.questions.axes) {
    sideHe[axis.sides.a.id] = axis.sides.a.he;
    sideHe[axis.sides.b.id] = axis.sides.b.he;
  }
  const eyebrow = isMine
    ? 'הסגנון הבולט שלך'
    : `${sideHe[style.quadrant.focus]} · ${sideHe[style.quadrant.pace]}`;

  const mineBar = isMine ? '' : `
    <a class="mine-bar" href="#/style/${mine}">
      ${badge(mine, 'md')}
      <span class="mine-bar__text">הסגנון שלך: <b>${esc(styles[mine].title)}</b></span>
      <span class="mine-bar__back">חזרה${icon.forward(16)}</span>
    </a>`;

  const chips = order.map((k) => `
    <button type="button" class="chip" data-style="${k}" aria-pressed="${k === letter}">
      ${k === mine ? '<span class="chip__mine">שלך</span>' : ''}
      ${badge(k, 'sm')}<span>${esc(styles[k].name)}</span>
    </button>`).join('');

  root.innerHTML = `
    <div class="screen" data-disc="${letter}">
      <div class="topbar">
        <a class="pill-btn" href="#/result">${icon.back(18)}<span>לגרף</span></a>
        <div class="topbar__title">ארבעת הסגנונות</div>
      </div>
      ${mineBar}
      <div class="chips" role="group" aria-label="בחירת סגנון">${chips}</div>

      <div class="hero">
        <div class="hero__row">
          ${badge(letter, 'xl')}
          <div class="hero__titles">
            <div class="hero__eyebrow">${esc(eyebrow)}</div>
            <h1 tabindex="-1">${esc(style.title)}</h1>
            <div class="hero__en" lang="en">${esc(style.en)}</div>
          </div>
        </div>
        <div class="hero__quote">${esc(style.quote)}</div>
        <p class="hero__body">${esc(withPeriod(style.communication))}</p>
      </div>

      <div class="card card--list">
        <h2>מאפיינים</h2>
        <ul class="list">
          ${style.traits.map((t) => `<li class="list__item"><span class="list__dot" aria-hidden="true"></span><span>${esc(t)}</span></li>`).join('')}
        </ul>
      </div>

      <div class="card card--list">
        <h2>איך נתנהל מולו?</h2>
        <ul class="list">
          ${style.howTo.map((t) => `<li class="list__item"><span class="list__check" aria-hidden="true">${icon.check(14, 3, '#18202B')}</span><span>${esc(t)}</span></li>`).join('')}
        </ul>
      </div>

      <nav class="pager" aria-label="מעבר בין הסגנונות">
        <a class="pager__prev" href="#/style/${prev}" aria-label="הסגנון הקודם: ${esc(styles[prev].title)}">${icon.back(18)}<span>${esc(styles[prev].title)}</span></a>
        <a class="pager__next" href="#/style/${next}" aria-label="הסגנון הבא: ${esc(styles[next].title)}"><span>${esc(styles[next].title)}</span>${icon.forward(18)}</a>
      </nav>
    </div>`;

  root.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (chip.dataset.style !== letter) ctx.go(`#/style/${chip.dataset.style}`);
    });
  });

  return style.title;
}
