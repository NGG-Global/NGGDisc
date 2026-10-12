// Screens 2-35: one trait pair each (design/preview/QuestionA.html, QuestionB.html).

import { esc, icon } from '../dom.js';

// "בעבודה, אני יותר…" -> ["בעבודה,", "אני יותר…"]
function splitPrompt(prompt) {
  const i = prompt.indexOf(', ');
  return i === -1 ? ['', prompt] : [prompt.slice(0, i + 1), prompt.slice(i + 2)];
}

function optionHtml(side, text, pressed) {
  return `
    <button type="button" class="option" data-side="${esc(side)}" aria-pressed="${pressed}">
      <span class="option__radio" aria-hidden="true">${icon.check(16, 3)}</span>
      <span class="option__text">${esc(text)}</span>
    </button>`;
}

export function render(root, ctx, n) {
  const total = ctx.pairs.length;
  const pair = ctx.pairs[n - 1];
  const axes = ctx.questions.axes;
  const axis = axes[pair.part - 1];
  const axisName = axis.label.split('·').pop().trim();
  const [lead, prompt] = splitPrompt(ctx.questions.prompt);
  const [top, bottom] = ctx.sideOrder(pair);
  const chosen = ctx.answers[pair.id];

  const segments = axes.map((a, i) => {
    const part = i + 1;
    let fill = 0;
    if (part < pair.part) fill = 1;
    else if (part === pair.part) fill = pair.indexInAxis / a.pairs.length;
    return `<div class="progress__seg"><div class="progress__fill" data-fill="${fill}"></div></div>`;
  }).join('');

  root.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button type="button" class="icon-btn" data-action="back" aria-label="${n === 1 ? 'חזרה למסך הפתיחה' : 'לצמד הקודם'}">${icon.back(22)}</button>
        <div class="topbar__title">חלק ${pair.part} מתוך ${axes.length} · ${esc(axisName)}</div>
        <div class="counter"><span class="sr-only">צמד </span>${n}/${total}</div>
      </div>

      <div class="progress" aria-hidden="true">${segments}</div>

      <div class="q-head">
        <div class="q-head__lead">${esc(lead)}</div>
        <h1 tabindex="-1">${esc(prompt)}</h1>
      </div>

      <div class="options" role="group" aria-label="${esc(ctx.questions.prompt)}">
        ${optionHtml(top, pair.text[top], chosen === top)}
        <div class="or-chip" aria-hidden="true">או</div>
        ${optionHtml(bottom, pair.text[bottom], chosen === bottom)}
      </div>

      <p class="hint">גם אם שתי התכונות מתאימות לכם חלקית, בחרו את זו שמתארת אתכם טוב יותר.</p>

      <div class="spacer"></div>

      <div class="auto-note">${icon.forward(18)}<span>בחירה מעבירה אוטומטית לצמד הבא</span></div>
    </div>`;

  root.querySelectorAll('.progress__fill').forEach((el) => {
    el.style.width = `${Number(el.dataset.fill) * 100}%`;
  });

  root.querySelector('[data-action="back"]').addEventListener('click', () => {
    ctx.go(n === 1 ? '#/intro' : `#/q/${n - 1}`);
  });

  const options = [...root.querySelectorAll('.option')];
  let timer = null;
  ctx.onLeave(() => clearTimeout(timer));

  options.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (timer) return; // already moving on
      const side = btn.dataset.side;
      ctx.answer(pair.id, side);
      options.forEach((o) => o.setAttribute('aria-pressed', String(o === btn)));
      timer = setTimeout(() => {
        ctx.go(n < total ? `#/q/${n + 1}` : '#/result');
      }, ctx.selectDelay);
    });
  });

  return `צמד ${n} מתוך ${total}`;
}
