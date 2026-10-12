// Progress persistence. Data stays in this browser only; every access is
// wrapped in try/catch so private modes or blocked storage fall back to memory.

const KEY = 'disc-quiz:v1';

const empty = () => ({ answers: {}, order: {} });

export function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return {
      answers: data && typeof data.answers === 'object' && data.answers ? data.answers : {},
      order: data && typeof data.order === 'object' && data.order ? data.order : {},
    };
  } catch {
    return empty();
  }
}

export function save(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ answers: state.answers, order: state.order }));
  } catch {
    // Storage unavailable: progress lives in memory for this visit only.
  }
}

export function clear() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
  return empty();
}

// Drops entries that no longer match the content (e.g. after a content update).
export function sanitize(state, pairs) {
  const answers = {};
  const order = {};
  for (const pair of pairs) {
    if (pair.sides.includes(state.answers[pair.id])) answers[pair.id] = state.answers[pair.id];
    if (typeof state.order[pair.id] === 'boolean') order[pair.id] = state.order[pair.id];
  }
  return { answers, order };
}
