import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  PAIRS_PER_AXIS, listPairs, tally, firstUnanswered, validateScores,
  leaning, styleOf, isFlexible, offsets, dotPosition, flexBox, isInsideFlexBox,
} from '../assets/js/scoring.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const questions = load('../content/questions.json');
const styles = load('../content/styles.json');

const SIZE = 310;
const C = SIZE / 2;

// Builds scores from the leading side of each axis.
function scores(focusSide, focusPts, paceSide, pacePts) {
  const other = (n) => PAIRS_PER_AXIS - n;
  return {
    task: focusSide === 'task' ? focusPts : other(focusPts),
    people: focusSide === 'people' ? focusPts : other(focusPts),
    thoughtful: paceSide === 'thoughtful' ? pacePts : other(pacePts),
    active: paceSide === 'active' ? pacePts : other(pacePts),
  };
}

// Screen quadrant of a point: right/left and top/bottom of the centre.
function quadrantOf(pos) {
  return `${pos.left > C ? 'right' : 'left'}-${pos.top < C ? 'top' : 'bottom'}`;
}

const QUADRANTS = [
  { style: 'D', focus: 'task', pace: 'active', screen: 'right-top' },
  { style: 'I', focus: 'people', pace: 'active', screen: 'left-top' },
  { style: 'C', focus: 'task', pace: 'thoughtful', screen: 'right-bottom' },
  { style: 'S', focus: 'people', pace: 'thoughtful', screen: 'left-bottom' },
];

test('content: 17 pairs per axis, 34 in total, focus first', () => {
  const pairs = listPairs(questions);
  assert.equal(pairs.length, 34);
  assert.deepEqual(questions.axes.map((a) => a.pairs.length), [17, 17]);
  assert.ok(pairs.slice(0, 17).every((p) => p.axis === 'focus' && p.part === 1));
  assert.ok(pairs.slice(17).every((p) => p.axis === 'pace' && p.part === 2));
  assert.equal(new Set(pairs.map((p) => p.id)).size, 34);
  for (const p of pairs) {
    for (const side of p.sides) assert.ok(p.text[side], `${p.id} missing ${side}`);
  }
});

test('content: styles.json quadrants agree with the scoring table', () => {
  for (const q of QUADRANTS) {
    assert.deepEqual(styles.styles[q.style].quadrant, { focus: q.focus, pace: q.pace });
  }
  assert.deepEqual(styles.order, ['D', 'I', 'S', 'C']);
});

test('tally: one point per answer, ignores unknown values', () => {
  const pairs = listPairs(questions);
  const answers = {};
  pairs.forEach((p, i) => { answers[p.id] = p.sides[i % 2]; });
  answers.F01 = 'nonsense';
  const s = tally(questions, answers);
  // focus: indices 0..16, F01 dropped -> task 8 (2,4..16), people 8 (1,3..15)
  // pace: indices 17..33 -> thoughtful 8 (18,20..32), active 9 (17,19..33)
  assert.deepEqual(s, { task: 8, people: 8, thoughtful: 8, active: 9 });
});

test('firstUnanswered: 1-based, null when complete', () => {
  const pairs = listPairs(questions);
  const answers = {};
  assert.equal(firstUnanswered(pairs, answers), 1);
  pairs.slice(0, 12).forEach((p) => { answers[p.id] = p.sides[0]; });
  assert.equal(firstUnanswered(pairs, answers), 13);
  pairs.forEach((p) => { answers[p.id] = p.sides[1]; });
  assert.equal(firstUnanswered(pairs, answers), null);
});

test('validation: each axis must sum to 17', () => {
  assert.throws(() => validateScores({ task: 9, people: 9, thoughtful: 9, active: 8 }), RangeError);
  assert.throws(() => validateScores({ task: 9, people: 8, thoughtful: 9.5, active: 7.5 }), RangeError);
  assert.throws(() => styleOf({ task: 18, people: -1, thoughtful: 9, active: 8 }), RangeError);
});

test('leaning: the side with 9 or more points', () => {
  assert.deepEqual(leaning(scores('task', 9, 'active', 9)), { focus: 'task', pace: 'active' });
  assert.deepEqual(leaning(scores('people', 9, 'thoughtful', 9)), { focus: 'people', pace: 'thoughtful' });
});

for (const q of QUADRANTS) {
  test(`${q.style}: 17/0 on both axes puts the dot in the ${q.screen} corner`, () => {
    const s = scores(q.focus, 17, q.pace, 17);
    assert.equal(styleOf(s), q.style);
    const pos = dotPosition(s, SIZE);
    const R = SIZE * 0.45;
    assert.equal(quadrantOf(pos), q.screen);
    assert.ok(Math.abs(Math.abs(pos.left - C) - R) < 1e-9);
    assert.ok(Math.abs(Math.abs(pos.top - C) - R) < 1e-9);
    assert.equal(isInsideFlexBox(pos, SIZE), false);
  });

  test(`${q.style}: 9/8 on both axes is inside the flex box, in the right quadrant`, () => {
    const s = scores(q.focus, 9, q.pace, 9);
    assert.equal(styleOf(s), q.style);
    const pos = dotPosition(s, SIZE);
    assert.equal(quadrantOf(pos), q.screen);
    assert.equal(isInsideFlexBox(pos, SIZE), true);
    assert.equal(isFlexible(s.task, s.people), true);
  });

  test(`${q.style}: 10/7 is still inside the flex box (boundary)`, () => {
    const s = scores(q.focus, 10, q.pace, 10);
    assert.equal(styleOf(s), q.style);
    const pos = dotPosition(s, SIZE);
    assert.equal(quadrantOf(pos), q.screen);
    assert.equal(isInsideFlexBox(pos, SIZE), true);
    // On the boundary itself: |offset| equals the box half-width.
    assert.ok(Math.abs(Math.abs(pos.left - C) - flexBox(SIZE).half) < 1e-9);
  });

  test(`${q.style}: 11/6 falls outside the flex box`, () => {
    const pos = dotPosition(scores(q.focus, 11, q.pace, 11), SIZE);
    assert.equal(isInsideFlexBox(pos, SIZE), false);
    assert.equal(quadrantOf(pos), q.screen);
  });
}

test('flexibility: lead of 9 or 10 is flexible, 11+ is not', () => {
  assert.equal(isFlexible(9, 8), true);
  assert.equal(isFlexible(7, 10), true);
  assert.equal(isFlexible(11, 6), false);
  assert.equal(isFlexible(0, 17), false);
});

test('mockup example: task 6, people 11, thoughtful 5, active 12 -> I at ~(114, 97)', () => {
  const s = { task: 6, people: 11, thoughtful: 5, active: 12 };
  assert.equal(styleOf(s), 'I');
  const pos = dotPosition(s, SIZE);
  assert.ok(Math.abs(pos.left - 114) <= 1, `dotX ${pos.left}`);
  assert.ok(Math.abs(pos.top - 97) <= 1, `dotY ${pos.top}`);
});

test('geometry: R = 0.45 * size, flex half-width = 3/17 * R, scales with size', () => {
  const box = flexBox(SIZE);
  assert.ok(Math.abs(box.half - (3 / 17) * SIZE * 0.45) < 1e-9);
  assert.ok(Math.abs(box.left + box.half - C) < 1e-9);
  const s = { task: 6, people: 11, thoughtful: 5, active: 12 };
  const a = dotPosition(s, 310);
  const b = dotPosition(s, 400);
  assert.ok(Math.abs(a.left / 310 - b.left / 400) < 1e-12);
  assert.deepEqual(offsets({ task: 17, people: 0, thoughtful: 0, active: 17 }), { x: -1, y: 1 });
});

test('style table covers every possible result', () => {
  const seen = new Set();
  for (let people = 0; people <= 17; people++) {
    for (let active = 0; active <= 17; active++) {
      const s = { task: 17 - people, people, thoughtful: 17 - active, active };
      const style = styleOf(s);
      seen.add(style);
      const pos = dotPosition(s, SIZE);
      const expected = QUADRANTS.find((q) => q.style === style).screen;
      assert.equal(quadrantOf(pos), expected, `people ${people} active ${active}`);
    }
  }
  assert.deepEqual([...seen].sort(), ['C', 'D', 'I', 'S']);
});
