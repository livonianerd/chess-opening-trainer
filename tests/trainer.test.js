import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { openings } from "../src/openings.js";
import { Trainer } from "../src/trainer.js";
const white = ["italian", "ruy-lopez", "queens-gambit", "london", "english"];
test("ten unique openings with the required sides", () => {
  assert.equal(openings.length, 10);
  assert.equal(new Set(openings.map((o) => o.id)).size, 10);
  openings.forEach((o) =>
    assert.equal(o.playerColor, white.includes(o.id) ? "white" : "black"),
  );
});
for (const opening of openings) {
  test(`${opening.name}: legal, explained line of 6–10 full moves`, () => {
    const v = opening.variations[0],
      chess = new Chess();
    assert.ok(v.moves.length >= 12 && v.moves.length <= 20);
    assert.equal(v.explanations.length, v.moves.length);
    v.moves.forEach((m, i) => {
      assert.equal(chess.move(m).san, m);
      assert.ok(v.explanations[i].length > 10);
    });
  });
  test(`${opening.name}: initial side and deterministic completion`, () => {
    const t = new Trainer(opening, "practice");
    assert.equal(t.index, t.color === "w" ? 0 : 1);
    assert.equal(t.chess.turn(), t.color);
    if (t.color === "b")
      assert.deepEqual(t.chess.history(), [t.variation.moves[0]]);
    while (!t.complete) {
      assert.equal(t.chess.turn(), t.color);
      assert.ok(t.attempt(t.expected).ok);
      assert.deepEqual(t.chess.history(), t.variation.moves.slice(0, t.index));
    }
    assert.equal(t.score, 100);
    assert.equal(t.correct, t.variation.moves.length / 2);
  });
  test(`${opening.name}: wrong move, undo and restart`, () => {
    const t = new Trainer(opening),
      initial = t.chess.fen(),
      index = t.index;
    const wrong = t.chess.moves().find((m) => m !== t.expected);
    assert.equal(t.attempt(wrong).ok, false);
    assert.equal(t.index, index);
    assert.equal(t.chess.fen(), initial);
    assert.equal(t.mistakes, 1);
    assert.equal(t.attempt({ from: "a1", to: "a8" }).reason, "illegal");
    assert.equal(t.mistakes, 1);
    t.attempt(t.expected);
    assert.equal(t.correct, 1);
    assert.ok(t.undo());
    assert.equal(t.chess.fen(), initial);
    assert.equal(t.index, index);
    assert.equal(t.correct, 0);
    assert.equal(t.mistakes, 1);
    assert.equal(t.undo(), false);
    t.attempt(t.expected);
    t.restart();
    assert.equal(t.chess.fen(), initial);
    assert.equal(t.index, index);
    assert.equal(t.mistakes, 0);
    assert.equal(t.correct, 0);
  });
}
test("undo from completion returns to the last user decision", () => {
  const t = new Trainer(openings[0]);
  while (!t.complete) t.attempt(t.expected);
  t.undo();
  assert.equal(t.complete, false);
  assert.equal(t.chess.turn(), t.color);
  assert.equal(t.index, 14);
});
test("recommended move does not mutate position; switching clears state", () => {
  const t = new Trainer(openings[0]);
  const fen = t.chess.fen();
  assert.equal(t.recommended().san, "e4");
  assert.equal(t.chess.fen(), fen);
  t.attempt("e4");
  t.select(openings[5]);
  assert.equal(t.index, 1);
  assert.equal(t.correct, 0);
  assert.deepEqual(t.chess.history(), ["e4"]);
});
test("chess rules handle castling, en passant and all promotion choices", () => {
  const c = new Chess();
  for (const m of ["e4", "a6", "e5", "d5"]) c.move(m);
  assert.ok(c.move("exd6").isEnPassant());
  const p = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
  assert.deepEqual(
    p
      .moves({ square: "a7", verbose: true })
      .map((m) => m.promotion)
      .sort(),
    ["b", "n", "q", "r"],
  );
  const t = new Trainer(openings[0]);
  while (!t.complete) t.attempt(t.expected);
  assert.ok(
    t.chess.history({ verbose: true }).filter((m) => m.isKingsideCastle())
      .length === 2,
  );
});

test("Learn navigation walks every opening forward and backward", () => {
  for (const opening of openings) {
    const t = new Trainer(opening);
    const positions = [t.chess.fen()];
    assert.equal(t.previousStep(), false);
    while (!t.complete) {
      assert.equal(t.nextStep(), true);
      positions.push(t.chess.fen());
    }
    assert.equal(t.nextStep(), false);
    for (let i = positions.length - 2; i >= 0; i--) {
      assert.equal(t.previousStep(), true);
      assert.equal(t.chess.fen(), positions[i]);
      assert.equal(t.chess.turn(), t.color);
    }
    assert.equal(t.previousStep(), false);
    assert.equal(t.nextStep(), true);
    assert.equal(t.chess.fen(), positions[1]);
  }
});
test("Learn navigation cannot reveal Practice moves", () => {
  const t = new Trainer(openings[0], "practice");
  assert.equal(t.nextStep(), false);
  t.attempt(t.expected);
  assert.equal(t.previousStep(), false);
  assert.equal(t.index, 2);
});
