import "./style.css";
import { openings } from "./openings.js";
import { Trainer } from "./trainer.js";
const trainer = new Trainer(openings[0]);
let selected = null,
  hint = false,
  feedback = "",
  feedbackType = "",
  filter = "all",
  query = "";
const glyphs = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const names = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
const app = document.querySelector("#app");
app.innerHTML = `
<header class="header"><a class="brand" href="./"><span class="brand-mark">♞</span><span>Chess Opening Trainer<small>A better beginning to your game.</small></span></a><span class="header-note"><span class="live-dot"></span>10 classic openings. Endless confidence.</span></header>
<main><div class="intro"><div><p class="eyebrow">THE FIRST MOVES MATTER</p><h1>Great games start here.</h1><p>Learn the ideas. Practice the moves. Make your next opening count.</p></div><span class="intro-decoration" aria-hidden="true">♘</span></div>
<div class="workspace">
<aside class="library card" aria-label="Opening library"><div class="section-heading"><h2>Your openings</h2><span class="count">10</span></div><p class="muted">Pick a line. Build your repertoire.</p><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Find an opening…" aria-label="Find an opening"></label><div class="filters" aria-label="Filter by player color"><button data-filter="all" class="active">All</button><button data-filter="white">White</button><button data-filter="black">Black</button></div><div id="opening-list"></div><div class="library-foot">A little practice. A stronger first move.</div></aside>
<section class="play-area" aria-label="Chessboard and controls"><div class="player-label"><span class="avatar opponent">♟</span><div><strong>Scripted opponent</strong><small id="opponent-color"></small></div><span class="player-tag">OPENING LINE</span></div><div class="board-frame"><div id="board" class="board" role="group" aria-label="Interactive chessboard"></div></div><div class="player-label"><span class="avatar you">♙</span><div><strong>You <span class="you-tag">YOUR TURN</span></strong><small id="your-color"></small></div><span id="last-move" class="last-move"></span></div><div id="learn-navigation" class="learn-navigation" aria-label="Lesson navigation"><div class="step-buttons"><button id="previous-step">← Previous step</button><button id="next-step">Next step →</button></div><p>Use Next step to play the recommended move and see your opponent’s reply. Go back anytime.</p></div><div class="board-controls"><button id="undo">↶ <span>Undo</span></button><button id="hint">☀ <span>Hint</span></button><button id="restart">↻ <span>Restart opening</span></button></div><p class="board-tip">Click a piece, then a highlighted square to move.</p></section>
<aside class="lesson card" aria-label="Opening lesson"><div class="mode-toggle" aria-label="Training mode"><button data-mode="learn" class="active">Learn</button><button data-mode="practice">Practice</button></div><div class="lesson-content"><p id="category" class="eyebrow"></p><h2 id="opening-title"></h2><div id="opening-meta" class="opening-meta"></div><p id="description" class="description"></p><div class="progress-heading"><span>Opening progress</span><strong id="progress-label"></strong></div><progress id="progress" value="0" max="100"></progress><div id="instruction" class="instruction"></div><div id="feedback" role="status" aria-live="polite"></div><div id="stats" class="stats"></div><div class="history-heading"><h3>Move history</h3><span>WHITE <span>BLACK</span></span></div><div id="history" class="history"></div><button id="change" class="change">Change opening <span>↗</span></button></div></aside>
</div><footer><span>One move at a time.</span><span>Built for learning. Powered by practice.</span></footer></main>
<dialog id="promotion"><h2>Promote your pawn</h2><p>Choose a piece to complete your move.</p><div class="promotion-options"></div><button id="cancel-promotion">Cancel</button></dialog>`;
function renderLibrary() {
  const visible = openings.filter(
    (o) =>
      (filter === "all" || o.playerColor === filter) &&
      o.name.toLowerCase().includes(query),
  );
  document.querySelector("#opening-list").innerHTML =
    visible
      .map(
        (o) =>
          `<button class="opening ${o.id === trainer.opening.id ? "selected" : ""}" data-opening="${o.id}" aria-pressed="${o.id === trainer.opening.id}"><span class="opening-icon ${o.playerColor}">${o.playerColor === "white" ? "♙" : "♟"}</span><span><strong>${o.name}</strong><small>Play as ${o.playerColor} · ${o.variations[0].moves.length / 2} moves</small></span><span class="opening-arrow">${o.id === trainer.opening.id ? "●" : "›"}</span></button>`,
      )
      .join("") || '<p class="empty">No openings found.</p>';
}
function renderBoard() {
  const files = [..."abcdefgh"],
    ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  if (trainer.color === "b") {
    files.reverse();
    ranks.reverse();
  }
  const legal = selected
    ? trainer.chess.moves({ square: selected, verbose: true })
    : [];
  const recommended = hint ? trainer.recommended() : null;
  const last = trainer.chess.history({ verbose: true }).at(-1);
  document.querySelector("#board").innerHTML = ranks
    .map((r, ri) =>
      files
        .map((f, fi) => {
          const square = f + r,
            piece = trainer.chess.get(square),
            destination = legal.some((m) => m.to === square);
          const classes = [
            "square",
            (f.charCodeAt(0) + r) % 2 ? "light" : "dark",
            selected === square ? "selected-square" : "",
            last && [last.from, last.to].includes(square) ? "last" : "",
            recommended && [recommended.from, recommended.to].includes(square)
              ? "hint-square"
              : "",
            destination ? (piece ? "capture" : "destination") : "",
          ];
          return `<button class="${classes.join(" ")}" data-square="${square}" aria-label="${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${names[piece.type]}` : ""}" aria-pressed="${selected === square}">${fi === 0 ? `<span class="rank coord">${r}</span>` : ""}${piece ? `<span aria-hidden="true" class="piece ${piece.color}">${glyphs[piece.type]}</span>` : ""}${ri === 7 ? `<span class="file coord">${f}</span>` : ""}</button>`;
        })
        .join(""),
    )
    .join("");
}
function render() {
  const o = trainer.opening,
    done = trainer.complete;
  renderLibrary();
  renderBoard();
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === trainer.mode);
    b.setAttribute("aria-pressed", b.dataset.mode === trainer.mode);
  });
  document.querySelector("#opening-title").textContent = o.name;
  document.querySelector("#category").textContent = o.category;
  document.querySelector("#opening-meta").textContent =
    `○ Play as ${o.playerColor}   ·   ${trainer.variation.moves.length / 2} move main line`;
  document.querySelector("#description").textContent = o.description;
  document.querySelector("#opponent-color").textContent =
    trainer.color === "w" ? "Black pieces" : "White pieces";
  document.querySelector("#your-color").textContent =
    `${o.playerColor[0].toUpperCase() + o.playerColor.slice(1)} pieces · ${trainer.mode === "learn" ? "Learn mode" : "Practice mode"}`;
  document.querySelector(".you-tag").textContent = done
    ? "COMPLETE"
    : "YOUR TURN";
  const last = trainer.chess.history().at(-1);
  document.querySelector("#last-move").textContent = last
    ? `Last move: ${last}`
    : "Ready when you are";
  document.querySelector("#progress-label").textContent =
    `${trainer.index} / ${trainer.variation.moves.length} plies`;
  document.querySelector("#progress").value =
    (trainer.index / trainer.variation.moves.length) * 100;
  document.querySelector("#instruction").innerHTML = done
    ? `<span class="lesson-kicker">LINE COMPLETED</span><h3>Beautifully played.</h3><p>You’ve completed the ${o.name}. ${trainer.mode === "practice" ? `Your score: <strong>${trainer.score}%</strong>.` : "Try Practice mode to make it stick."}</p>`
    : `<span class="lesson-kicker">${trainer.mode === "learn" || hint ? `YOUR NEXT MOVE · ${Math.floor(trainer.index / 2) + 1}${trainer.color === "b" ? "…" : "."}` : "YOUR MOVE"}</span><h3>${trainer.mode === "learn" || hint ? trainer.expected : "What comes next?"}</h3><p>${trainer.mode === "learn" || hint ? trainer.explanation : "Find the next move from memory. You can ask for a hint along the way."}</p>`;
  const status = document.querySelector("#feedback");
  status.textContent = feedback;
  status.className = feedbackType;
  document.querySelector("#stats").innerHTML =
    trainer.mode === "practice"
      ? `<span><strong>${trainer.correct}</strong> correct</span><span><strong>${trainer.mistakes}</strong> mistakes</span><span><strong>${trainer.hints}</strong> hints</span>`
      : "";
  const history = trainer.chess.history();
  document.querySelector("#history").innerHTML = history.length
    ? history.reduce(
        (html, m, i) =>
          html +
          (i % 2 === 0
            ? `<div class="history-row"><span>${i / 2 + 1}.</span><strong>${m}</strong>`
            : `<strong>${m}</strong></div>`),
        "",
      ) + (history.length % 2 ? "<span>—</span></div>" : "")
    : '<p class="empty">Your first move starts the story.</p>';
  document.querySelector("#history").scrollTop =
    document.querySelector("#history").scrollHeight;
  const learning = trainer.mode === "learn";
  document.querySelector("#learn-navigation").hidden = !learning;
  document.querySelector("#previous-step").disabled =
    !trainer.checkpoints.length;
  document.querySelector("#next-step").disabled = done;
  document.querySelector("#next-step").textContent = done
    ? "Line complete ✓"
    : `Next step: ${trainer.expected} →`;
  document.querySelector(".board-tip").textContent = learning
    ? "Use Next step above, or play the recommended move on the board."
    : "Click a piece, then a highlighted square to move.";
  document.querySelector("#undo").hidden = learning;
  document.querySelector("#undo").disabled = !trainer.checkpoints.length;
  document.querySelector("#hint").disabled = done;
}
function resetUI() {
  selected = null;
  hint = false;
  feedback = "";
  feedbackType = "";
}
function attempt(move) {
  const result = trainer.attempt(move);
  selected = null;
  hint = false;
  feedback = result.ok
    ? trainer.complete
      ? "Well done! You completed the opening."
      : `${result.san} — correct. Your opponent has replied.`
    : result.reason === "different"
      ? `${result.san} is legal, but isn’t part of this opening line. Try again.`
      : "That move isn’t legal in this position. Try a highlighted square.";
  feedbackType = result.ok ? "success" : "error";
  render();
}
document.querySelector("#board").addEventListener("click", (e) => {
  const button = e.target.closest("[data-square]");
  if (!button || trainer.complete) return;
  const square = button.dataset.square,
    piece = trainer.chess.get(square);
  if (selected && selected !== square) {
    const options = trainer.chess
      .moves({ square: selected, verbose: true })
      .filter((m) => m.to === square);
    if (options.some((m) => m.promotion)) {
      const from = selected,
        dialog = document.querySelector("#promotion");
      dialog.querySelector(".promotion-options").replaceChildren(
        ...options.map((m) => {
          const b = document.createElement("button");
          b.textContent = names[m.promotion];
          b.onclick = () => {
            dialog.close();
            attempt({ from, to: square, promotion: m.promotion });
          };
          return b;
        }),
      );
      dialog.showModal();
      return;
    }
    if (options.length) {
      attempt({ from: selected, to: square });
      return;
    }
  }
  selected =
    piece?.color === trainer.color
      ? selected === square
        ? null
        : square
      : null;
  renderBoard();
});
document.querySelector("#opening-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-opening]");
  if (b) {
    trainer.select(openings.find((o) => o.id === b.dataset.opening));
    resetUI();
    render();
  }
});
document.querySelectorAll("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      if (trainer.mode === b.dataset.mode) return;
      trainer.mode = b.dataset.mode;
      trainer.restart();
      resetUI();
      render();
    }),
);
document.querySelectorAll("[data-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((x) => x.classList.toggle("active", x === b));
      renderLibrary();
    }),
);
document.querySelector("#search").oninput = (e) => {
  query = e.target.value.toLowerCase();
  renderLibrary();
};
document.querySelector("#hint").onclick = () => {
  if (!hint) trainer.hints++;
  hint = true;
  feedback = "The recommended move is highlighted on the board.";
  feedbackType = "";
  render();
};
document.querySelector("#undo").onclick = () => {
  trainer.undo();
  resetUI();
  render();
};
document.querySelector("#next-step").onclick = () => {
  if (trainer.mode !== "learn" || trainer.complete) return;
  const move = trainer.expected;
  trainer.nextStep();
  resetUI();
  feedback = trainer.complete
    ? "Well done! You completed the opening. Use Previous step to review."
    : `${move} played. Your opponent has replied. Review the next move below.`;
  feedbackType = "success";
  render();
};
document.querySelector("#previous-step").onclick = () => {
  trainer.previousStep();
  resetUI();
  render();
};
document.querySelector("#restart").onclick = () => {
  trainer.restart();
  resetUI();
  render();
};
document.querySelector("#change").onclick = () => {
  filter = "all";
  query = "";
  document.querySelector("#search").value = "";
  document
    .querySelectorAll("[data-filter]")
    .forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));
  renderLibrary();
  document
    .querySelector(".library")
    .scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector("#search").focus({ preventScroll: true });
};
document.querySelector("#cancel-promotion").onclick = () =>
  document.querySelector("#promotion").close();
render();
