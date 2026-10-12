// Scoring, style and graph position, per spec/scoring.md.
// Pure functions only: no DOM, no storage, so they run unchanged under node --test.

export const PAIRS_PER_AXIS = 17;
export const LEAN_MIN = 9;          // a side with 9+ points is the axis leaning
export const FLEX_MAX_LEAD = 10;    // a leading score of 9 or 10 means flexibility
export const RANGE_RATIO = 0.45;    // R = size * 0.45
export const FLEX_HALF_RATIO = 3 / PAIRS_PER_AXIS; // flex box half-width = 3/17 * R

// Rows: pace leaning, columns: focus leaning.
const STYLE_BY_LEANING = {
  active: { task: 'D', people: 'I' },
  thoughtful: { task: 'C', people: 'S' },
};

// Flattens questions.json into the 34 screens, in order (focus axis first).
export function listPairs(questions) {
  const pairs = [];
  for (const axis of questions.axes) {
    const a = axis.sides.a.id;
    const b = axis.sides.b.id;
    axis.pairs.forEach((pair, i) => {
      pairs.push({
        id: pair.id,
        axis: axis.id,
        part: questions.axes.indexOf(axis) + 1,
        indexInAxis: i + 1,
        sides: [a, b],
        text: { [a]: pair[a], [b]: pair[b] },
      });
    });
  }
  return pairs;
}

// answers: { [pairId]: sideId }. Unknown or invalid values are ignored.
export function tally(questions, answers) {
  const scores = {};
  for (const axis of questions.axes) {
    const a = axis.sides.a.id;
    const b = axis.sides.b.id;
    scores[a] = 0;
    scores[b] = 0;
    for (const pair of axis.pairs) {
      const choice = answers[pair.id];
      if (choice === a || choice === b) scores[choice] += 1;
    }
  }
  return scores;
}

export function isAnswered(pair, answers) {
  return pair.sides.includes(answers[pair.id]);
}

// 1-based number of the first unanswered pair, or null when all are answered.
export function firstUnanswered(pairs, answers) {
  const i = pairs.findIndex((p) => !isAnswered(p, answers));
  return i === -1 ? null : i + 1;
}

function assertAxis(x, y, name) {
  const ok = Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 &&
    x + y === PAIRS_PER_AXIS;
  if (!ok) {
    throw new RangeError(`${name}: expected two non-negative integers summing to ${PAIRS_PER_AXIS}, got ${x}/${y}`);
  }
}

export function validateScores(s) {
  assertAxis(s.task, s.people, 'focus');
  assertAxis(s.thoughtful, s.active, 'pace');
}

export function leaning(s) {
  validateScores(s);
  return {
    focus: s.people >= LEAN_MIN ? 'people' : 'task',
    pace: s.active >= LEAN_MIN ? 'active' : 'thoughtful',
  };
}

export function styleOf(s) {
  const { focus, pace } = leaning(s);
  return STYLE_BY_LEANING[pace][focus];
}

// True when the leading side of an axis scored 9 or 10.
export function isFlexible(x, y) {
  return Math.max(x, y) <= FLEX_MAX_LEAD;
}

// Normalised offsets in [-1, 1]: x > 0 means people, y > 0 means active.
export function offsets(s) {
  validateScores(s);
  return {
    x: (s.people - s.task) / PAIRS_PER_AXIS,
    y: (s.active - s.thoughtful) / PAIRS_PER_AXIS,
  };
}

// Dot centre in physical pixels from the graph's top-left corner.
// RTL graph: right = task, left = people, top = active, bottom = thoughtful.
export function dotPosition(s, size) {
  const c = size / 2;
  const R = size * RANGE_RATIO;
  const { x, y } = offsets(s);
  return { left: c - x * R, top: c - y * R };
}

// Same position as a fraction of the graph size (0..1), for fluid layouts.
export function dotFraction(s) {
  const p = dotPosition(s, 1);
  return { left: p.left, top: p.top };
}

export function flexBox(size) {
  const c = size / 2;
  const half = FLEX_HALF_RATIO * size * RANGE_RATIO;
  return { left: c - half, top: c - half, size: half * 2, half };
}

export function isInsideFlexBox(pos, size) {
  const box = flexBox(size);
  const eps = 1e-9;
  return Math.abs(pos.left - size / 2) <= box.half + eps &&
    Math.abs(pos.top - size / 2) <= box.half + eps;
}
