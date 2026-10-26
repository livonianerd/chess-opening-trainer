import { Chess } from "chess.js";
export class Trainer {
  constructor(opening, mode = "learn") {
    this.mode = mode;
    this.select(opening);
  }
  select(opening) {
    this.opening = opening;
    this.variation = opening.variations[0];
    this.restart();
  }
  get color() {
    return this.opening.playerColor === "white" ? "w" : "b";
  }
  get complete() {
    return this.index === this.variation.moves.length;
  }
  get expected() {
    return this.variation.moves[this.index];
  }
  get explanation() {
    return this.variation.explanations[this.index];
  }
  get score() {
    return this.correct + this.mistakes
      ? Math.round((100 * this.correct) / (this.correct + this.mistakes))
      : 0;
  }
  restart() {
    this.chess = new Chess();
    this.index = 0;
    this.correct = 0;
    this.mistakes = 0;
    this.hints = 0;
    this.checkpoints = [];
    this.playOpponent();
  }
  playOpponent() {
    if (!this.complete && this.chess.turn() !== this.color) {
      this.chess.move(this.expected);
      this.index++;
    }
  }
  recommended() {
    if (this.complete) return null;
    const copy = new Chess(this.chess.fen());
    return copy.move(this.expected);
  }
  attempt(move) {
    if (this.complete) return { ok: false, reason: "complete" };
    let result;
    try {
      result = this.chess.move(move);
    } catch {
      return { ok: false, reason: "illegal" };
    }
    if (result.san !== this.expected) {
      this.chess.undo();
      this.mistakes++;
      return { ok: false, reason: "different", san: result.san };
    }
    this.checkpoints.push({ index: this.index, correct: this.correct });
    this.index++;
    this.correct++;
    this.playOpponent();
    return { ok: true, san: result.san };
  }
  nextStep() {
    if (this.mode !== "learn" || this.complete) return false;
    return this.attempt(this.expected).ok;
  }
  previousStep() {
    if (this.mode !== "learn") return false;
    return this.undo();
  }
  undo() {
    const checkpoint = this.checkpoints.pop();
    if (!checkpoint) return false;
    while (this.index > checkpoint.index) {
      this.chess.undo();
      this.index--;
    }
    this.correct = checkpoint.correct;
    return true;
  }
}
