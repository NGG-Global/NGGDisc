// Entry point: loads content, keeps state, routes by hash.
// Routes: #/intro, #/q/1..34, #/result, #/style/D|I|S|C

import { listPairs, tally, firstUnanswered, styleOf, PAIRS_PER_AXIS } from './scoring.js';
import * as store from './store.js';
import * as intro from './screens/intro.js';
import * as question from './screens/question.js';
import * as result from './screens/result.js';
import * as styles from './screens/styles.js';

// Which trait is shown on top is drawn once per pair and kept, so going back
// shows the same order.
const RANDOMIZE_SIDE_ORDER = true;
const SELECT_DELAY_MS = 250;

const root = document.getElementById('app');
const contentUrl = (name) => new URL(`../../content/${name}`, import.meta.url);

async function fetchJson(name) {
  const res = await fetch(contentUrl(name), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

function createContext(questions, stylesData) {
  const pairs = listPairs(questions);
  let state = store.sanitize(store.load(), pairs);
  let cleanups = [];

  const ctx = {
    questions,
    styles: stylesData,
    pairs,
    selectDelay: SELECT_DELAY_MS,
    get answers() { return state.answers; },

    answer(pairId, side) {
      state.answers[pairId] = side;
      store.save(state);
    },

    // Returns the two sides in display order (top first).
    sideOrder(pair) {
      if (RANDOMIZE_SIDE_ORDER && typeof state.order[pair.id] !== 'boolean') {
        state.order[pair.id] = Math.random() < 0.5;
        store.save(state);
      }
      const flipped = RANDOMIZE_SIDE_ORDER && state.order[pair.id];
      return flipped ? [pair.sides[1], pair.sides[0]] : [...pair.sides];
    },

    firstUnanswered() { return firstUnanswered(pairs, state.answers); },
    scores() { return tally(questions, state.answers); },
    myStyle() { return styleOf(tally(questions, state.answers)); },

    reset() { state = store.clear(); },

    go(hash) { window.location.hash = hash; },
    redirect(hash) { window.location.replace(hash); },

    // Timers and observers registered here are torn down on every route change.
    onLeave(fn) { cleanups.push(fn); },
    leave() {
      cleanups.forEach((fn) => fn());
      cleanups = [];
    },
  };
  return ctx;
}

function parseHash(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || '', arg: parts[1] };
}

function startRoute(ctx) {
  const first = ctx.firstUnanswered();
  if (first === null) return '#/result';
  return first > 1 ? `#/q/${first}` : '#/intro';
}

let firstRender = true;

function route(ctx) {
  ctx.leave();
  const { name, arg } = parseHash(window.location.hash);
  const first = ctx.firstUnanswered();
  const complete = first === null;
  let title;

  switch (name) {
    case 'intro':
      title = intro.render(root, ctx);
      break;

    case 'q': {
      const n = Number(arg);
      const last = complete ? ctx.pairs.length : first;
      if (!Number.isInteger(n) || n < 1 || n > ctx.pairs.length) return ctx.redirect(`#/q/${first ?? 1}`);
      // No skipping ahead past the first unanswered pair.
      if (n > last) return ctx.redirect(`#/q/${last}`);
      title = question.render(root, ctx, n);
      break;
    }

    case 'result':
      if (!complete) return ctx.redirect(`#/q/${first}`);
      title = result.render(root, ctx);
      break;

    case 'style': {
      if (!complete) return ctx.redirect(`#/q/${first}`);
      const letter = String(arg || '').toUpperCase();
      if (!ctx.styles.order.includes(letter)) return ctx.redirect(`#/style/${ctx.myStyle()}`);
      if (letter !== arg) return ctx.redirect(`#/style/${letter}`);
      title = styles.render(root, ctx, letter);
      break;
    }

    default:
      return ctx.redirect(startRoute(ctx));
  }

  document.title = title ? `${title} · שאלון סגנונות DISC` : 'שאלון סגנונות DISC';

  if (firstRender) {
    firstRender = false;
  } else {
    window.scrollTo(0, 0);
    // Move focus to the new screen's heading so screen readers announce it.
    const heading = root.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
  }
}

function showError() {
  root.innerHTML = `
    <div class="screen">
      <p class="load-error">לא ניתן לטעון את תוכן השאלון. יש לרענן את הדף. בהרצה מקומית יש להפעיל שרת (ראו README).</p>
    </div>`;
}

async function main() {
  let questions;
  let stylesData;
  try {
    [questions, stylesData] = await Promise.all([fetchJson('questions.json'), fetchJson('styles.json')]);
    if (questions.axes.length !== 2 || questions.axes.some((a) => a.pairs.length !== PAIRS_PER_AXIS)) {
      throw new Error(`questions.json must hold 2 axes of ${PAIRS_PER_AXIS} pairs`);
    }
  } catch (err) {
    console.error(err);
    showError();
    return;
  }
  const ctx = createContext(questions, stylesData);
  window.addEventListener('hashchange', () => route(ctx));
  route(ctx);
}

main();
