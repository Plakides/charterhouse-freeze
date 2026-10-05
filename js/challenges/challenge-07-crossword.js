(() => {
  "use strict";

  const challengeId = 7;
  const ROWS = 14;
  const COLS = 9;
  const STORAGE_PREFIX = "charterhouseFreeze.v2.crossword.";

  const entries = Object.freeze([
  {
    "id": "1D",
    "number": 1,
    "direction": "down",
    "row": 0,
    "col": 6,
    "length": 5,
    "clue": "A number with exactly two factors: 1 and itself."
  },
  {
    "id": "2A",
    "number": 2,
    "direction": "across",
    "row": 1,
    "col": 0,
    "length": 7,
    "clue": "The imaginary line around the middle of Earth at 0° latitude."
  },
  {
    "id": "3D",
    "number": 3,
    "direction": "down",
    "row": 3,
    "col": 4,
    "length": 6,
    "clue": "The computer number system that uses only 0 and 1."
  },
  {
    "id": "4D",
    "number": 4,
    "direction": "down",
    "row": 4,
    "col": 0,
    "length": 7,
    "clue": "The Charterhouse enrichment programme where you choose activities beyond normal lessons."
  },
  {
    "id": "5A",
    "number": 5,
    "direction": "across",
    "row": 4,
    "col": 3,
    "length": 5,
    "clue": "The tiny individual unit that makes up a digital image."
  },
  {
    "id": "6A",
    "number": 6,
    "direction": "across",
    "row": 6,
    "col": 3,
    "length": 5,
    "clue": "Our Charterhouse word for homework."
  },
  {
    "id": "7D",
    "number": 7,
    "direction": "down",
    "row": 7,
    "col": 2,
    "length": 7,
    "clue": "The Almaty hill reached by cable car, known for city views and its TV tower."
  },
  {
    "id": "8A",
    "number": 8,
    "direction": "across",
    "row": 8,
    "col": 0,
    "length": 9,
    "clue": "A community of living things interacting with each other and their environment."
  },
  {
    "id": "9D",
    "number": 9,
    "direction": "down",
    "row": 8,
    "col": 8,
    "length": 5,
    "clue": "Almaty's famous high-altitude skating rink in the mountains above the city."
  },
  {
    "id": "10A",
    "number": 10,
    "direction": "across",
    "row": 13,
    "col": 0,
    "length": 7,
    "clue": "A pure substance made from only one type of atom."
  }
].map(entry => Object.freeze(entry)));

  const extractionCells = Object.freeze(
    [
  {
    "row": 8,
    "col": 3,
    "label": "A"
  },
  {
    "row": 1,
    "col": 2,
    "label": "B"
  },
  {
    "row": 3,
    "col": 6,
    "label": "C"
  },
  {
    "row": 13,
    "col": 3,
    "label": "D"
  },
  {
    "row": 4,
    "col": 4,
    "label": "E"
  },
  {
    "row": 10,
    "col": 2,
    "label": "F"
  }
].map(item => Object.freeze(item))
  );

  function keyFor(row, col) {
    return `${row},${col}`;
  }

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function cellsForEntry(entry) {
    const dr = entry.direction === "down" ? 1 : 0;
    const dc = entry.direction === "across" ? 1 : 0;

    return Array.from({ length: entry.length }, (_, index) => ({
      row: entry.row + dr * index,
      col: entry.col + dc * index
    }));
  }

  const entryCells = new Map(
    entries.map(entry => [
      entry.id,
      Object.freeze(cellsForEntry(entry))
    ])
  );

  const openCellKeys = new Set();
  const cellEntries = new Map();
  const startNumbers = new Map();

  entries.forEach(entry => {
    startNumbers.set(keyFor(entry.row, entry.col), entry.number);

    entryCells.get(entry.id).forEach(cell => {
      const key = keyFor(cell.row, cell.col);
      openCellKeys.add(key);

      const current = cellEntries.get(key) || [];
      current.push(entry.id);
      cellEntries.set(key, current);
    });
  });

  const extractionLabelByKey = new Map(
    extractionCells.map(item => [
      keyFor(item.row, item.col),
      item.label
    ])
  );

  function cleanLetters(value) {
    const result = {};

    if (!value || typeof value !== "object") return result;

    Object.entries(value).forEach(([key, raw]) => {
      if (!openCellKeys.has(key)) return;

      const letter = String(raw || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 1);

      if (letter) result[key] = letter;
    });

    return result;
  }

  function loadState(teamId) {
    try {
      const raw = localStorage.getItem(storageKey(teamId));
      if (!raw) return { letters: {}, activeEntryId: null };

      const parsed = JSON.parse(raw);

      return {
        letters: cleanLetters(parsed?.letters),
        activeEntryId: entries.some(entry => entry.id === parsed?.activeEntryId)
          ? parsed.activeEntryId
          : null
      };
    } catch {
      return { letters: {}, activeEntryId: null };
    }
  }

  function saveState(teamId, state) {
    try {
      localStorage.setItem(
        storageKey(teamId),
        JSON.stringify({
          letters: state.letters,
          activeEntryId: state.activeEntryId
        })
      );
    } catch {
      // Crossword remains usable in-memory if storage is unavailable.
    }
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    const state = loadState(teamId);

    container.classList.add("crossword-challenge-content");

    const acrossEntries = entries
      .filter(entry => entry.direction === "across")
      .sort((a, b) => a.number - b.number);

    const downEntries = entries
      .filter(entry => entry.direction === "down")
      .sort((a, b) => a.number - b.number);

    const gridMarkup = [];

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const key = keyFor(row, col);

        if (!openCellKeys.has(key)) {
          gridMarkup.push(`
            <div class="crossword-block" aria-hidden="true"></div>
          `);
          continue;
        }

        const clueNumber = startNumbers.get(key);
        const extractionLabel = extractionLabelByKey.get(key);

        gridMarkup.push(`
          <div
            class="crossword-cell${extractionLabel ? " is-extraction" : ""}"
            data-crossword-cell="${key}"
          >
            ${clueNumber ? `
              <span class="crossword-clue-number">${clueNumber}</span>
            ` : ""}

            ${extractionLabel ? `
              <span
                class="crossword-extraction-number"
                title="Frozen extraction cell ${extractionLabel}"
              >${extractionLabel}</span>
            ` : ""}

            <input
              type="text"
              inputmode="text"
              maxlength="1"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              aria-label="Crossword row ${row + 1}, column ${col + 1}"
              data-crossword-input="${key}"
            >
          </div>
        `);
      }
    }

    function clueMarkup(entry) {
      return `
        <button
          type="button"
          class="crossword-clue"
          data-crossword-clue="${entry.id}"
        >
          <b>${entry.number}</b>
          <span>${entry.clue}</span>
          <small>${entry.length} letters</small>
        </button>
      `;
    }

    container.innerHTML = `
      <div class="crossword-puzzle">
        <section class="crossword-console">
          <div class="crossword-console-header">
            <div>
              <span class="crossword-kicker">ARCHIVE LOCK · LANGUAGE GRID 07</span>
              <h3>The Frozen Crossword</h3>
              <p>
                Use Charterhouse, Almaty and school knowledge to complete the
                connected grid. Crossing letters should help when a clue is harder.
              </p>
            </div>

            <div class="crossword-progress-badge">
              <span>LETTERS</span>
              <strong data-crossword-progress>0 / ${openCellKeys.size}</strong>
            </div>
          </div>

          <div class="crossword-workspace">
            <section class="crossword-grid-panel">
              <div class="crossword-grid-topline">
                <span>SECURITY CROSSWORD</span>
                <strong>Click a clue, then type in the grid.</strong>
              </div>

              <div
                class="crossword-grid"
                role="group"
                aria-label="Frozen crossword grid"
                style="--crossword-cols:${COLS};--crossword-rows:${ROWS}"
              >
                ${gridMarkup.join("")}
              </div>

              <div class="crossword-grid-help">
                <span><kbd>← ↑ ↓ →</kbd> move</span>
                <span><kbd>Backspace</kbd> clear/back</span>
                <span><kbd>Space</kbd> switch direction at a crossing</span>
              </div>

              <button
                type="button"
                class="crossword-clear-button"
                data-crossword-clear
              >
                Clear crossword
              </button>
            </section>

            <section class="crossword-clues-panel">
              <div class="crossword-clue-column">
                <div class="crossword-clue-heading">
                  <span>ACROSS</span>
                  <strong>5 clues</strong>
                </div>
                <div class="crossword-clue-list">
                  ${acrossEntries.map(clueMarkup).join("")}
                </div>
              </div>

              <div class="crossword-clue-column">
                <div class="crossword-clue-heading">
                  <span>DOWN</span>
                  <strong>5 clues</strong>
                </div>
                <div class="crossword-clue-list">
                  ${downEntries.map(clueMarkup).join("")}
                </div>
              </div>
            </section>
          </div>

          <div class="crossword-extraction-strip">
            <div class="crossword-extraction-copy">
              <span>FINAL STEP</span>
              <strong>Read the six lettered frozen cells from A → F.</strong>
              <p>
                Do the extraction yourself. The system will not collect or check
                individual crossword letters for you.
              </p>
            </div>

            <div class="crossword-extraction-boxes" aria-label="Extraction order A to F">
              ${["A","B","C","D","E","F"].map(label => `
                <span>
                  <b>${label}</b>
                  <i>?</i>
                </span>
              `).join("")}
            </div>
          </div>

          <p
            class="crossword-status"
            data-crossword-status
            role="status"
            aria-live="polite"
          >
            Start with whichever clues your team recognises first.
          </p>
        </section>

        <aside class="crossword-side">
          <section class="crossword-side-card">
            <span>TEAM STRATEGY</span>
            <h3>Use the crossings</h3>
            <p>
              Do not wait for one difficult clue. Solve the familiar school or
              Almaty clues first, then use their letters to unlock the others.
            </p>
          </section>

          <section class="crossword-side-card is-ice">
            <span>FROZEN CELLS</span>
            <h3>Look for 1–6</h3>
            <p>
              Six cells have icy lettered badges. Their letters form the final
              six-letter security word when read in numerical order.
            </p>
          </section>

          <section class="crossword-side-card">
            <span>CHECKING</span>
            <h3>No clue-by-clue answers</h3>
            <p>
              The crossword never turns letters red or green. Your team must
              decide when the grid makes sense.
            </p>
          </section>

          <div class="crossword-b-stage-note">
            <strong>9G-B interface build</strong>
            <span>
              The final word field below is typeable for testing. Submit activates in 9G-C.
            </span>
          </div>
        </aside>
      </div>
    `;

    const inputs = new Map(
      Array.from(container.querySelectorAll("[data-crossword-input]"))
        .map(input => [input.dataset.crosswordInput, input])
    );

    const cells = new Map(
      Array.from(container.querySelectorAll("[data-crossword-cell]"))
        .map(cell => [cell.dataset.crosswordCell, cell])
    );

    const clueButtons = new Map(
      Array.from(container.querySelectorAll("[data-crossword-clue]"))
        .map(button => [button.dataset.crosswordClue, button])
    );

    const progress = container.querySelector("[data-crossword-progress]");
    const status = container.querySelector("[data-crossword-status]");
    const clearButton = container.querySelector("[data-crossword-clear]");

    function entryById(id) {
      return entries.find(entry => entry.id === id) || null;
    }

    function entryIdsAt(key) {
      return cellEntries.get(key) || [];
    }

    function setStatus(message) {
      status.textContent = message;
    }

    function filledCount() {
      return Object.values(state.letters)
        .filter(letter => /^[A-Z]$/.test(letter))
        .length;
    }

    function updateProgress() {
      progress.textContent = `${filledCount()} / ${openCellKeys.size}`;
    }

    function paintLetters() {
      inputs.forEach((input, key) => {
        input.value = state.letters[key] || "";
      });

      updateProgress();
    }

    function paintHighlight(currentKey = null) {
      cells.forEach(cell => {
        cell.classList.remove("is-active-word", "is-current");
      });

      clueButtons.forEach(button => {
        button.classList.remove("is-active");
      });

      const activeEntry = entryById(state.activeEntryId);

      if (activeEntry) {
        entryCells.get(activeEntry.id).forEach(cell => {
          cells.get(keyFor(cell.row, cell.col))?.classList.add("is-active-word");
        });

        clueButtons.get(activeEntry.id)?.classList.add("is-active");
      }

      if (currentKey) {
        cells.get(currentKey)?.classList.add("is-current");
      }
    }

    function activateEntry(entryId, focusKey = null) {
      if (!entryById(entryId)) return;

      state.activeEntryId = entryId;
      saveState(teamId, state);
      paintHighlight(focusKey);

      if (focusKey) {
        inputs.get(focusKey)?.focus();
      }
    }

    function chooseEntryForCell(key, preferredDirection = null) {
      const ids = entryIdsAt(key);
      if (!ids.length) return null;

      if (preferredDirection) {
        const preferred = ids.find(id => entryById(id)?.direction === preferredDirection);
        if (preferred) return preferred;
      }

      if (ids.includes(state.activeEntryId)) {
        return state.activeEntryId;
      }

      return ids[0];
    }

    function focusCell(key, preferredDirection = null) {
      const input = inputs.get(key);
      if (!input) return false;

      const entryId = chooseEntryForCell(key, preferredDirection);
      if (entryId) state.activeEntryId = entryId;

      saveState(teamId, state);
      paintHighlight(key);
      input.focus();
      input.select();
      return true;
    }

    function moveWithinActiveEntry(key, delta) {
      const activeEntry = entryById(state.activeEntryId);
      if (!activeEntry) return false;

      const coords = entryCells.get(activeEntry.id);
      const index = coords.findIndex(cell => keyFor(cell.row, cell.col) === key);
      if (index < 0) return false;

      const target = coords[index + delta];
      if (!target) return false;

      return focusCell(keyFor(target.row, target.col), activeEntry.direction);
    }

    function moveGeometric(row, col, dr, dc, preferredDirection) {
      let r = row + dr;
      let c = col + dc;

      while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        const key = keyFor(r, c);
        if (openCellKeys.has(key)) {
          return focusCell(key, preferredDirection);
        }
        r += dr;
        c += dc;
      }

      return false;
    }

    clueButtons.forEach((button, entryId) => {
      button.addEventListener("click", () => {
        const coords = entryCells.get(entryId);
        const firstEmpty =
          coords.find(cell => !state.letters[keyFor(cell.row, cell.col)]) ||
          coords[0];

        const key = keyFor(firstEmpty.row, firstEmpty.col);
        activateEntry(entryId, key);

        setStatus(
          `${button.querySelector("b").textContent} ${entryById(entryId).direction.toUpperCase()} selected.`
        );
      });
    });

    inputs.forEach((input, key) => {
      const [rowText, colText] = key.split(",");
      const row = Number(rowText);
      const col = Number(colText);

      input.addEventListener("focus", () => {
        const entryId = chooseEntryForCell(key);
        if (entryId) state.activeEntryId = entryId;
        saveState(teamId, state);
        paintHighlight(key);
      });

      input.addEventListener("click", () => {
        paintHighlight(key);
      });

      input.addEventListener("input", () => {
        const letter = input.value
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(-1);

        input.value = letter;

        if (letter) {
          state.letters[key] = letter;
        } else {
          delete state.letters[key];
        }

        saveState(teamId, state);
        updateProgress();

        if (letter) {
          moveWithinActiveEntry(key, 1);
        }
      });

      input.addEventListener("keydown", event => {
        if (event.key === "Backspace") {
          event.preventDefault();

          if (input.value) {
            input.value = "";
            delete state.letters[key];
            saveState(teamId, state);
            updateProgress();
            paintHighlight(key);
            return;
          }

          const activeEntry = entryById(state.activeEntryId);
          if (!activeEntry) return;

          const coords = entryCells.get(activeEntry.id);
          const index = coords.findIndex(cell => keyFor(cell.row, cell.col) === key);
          const previous = coords[index - 1];

          if (previous) {
            const previousKey = keyFor(previous.row, previous.col);
            delete state.letters[previousKey];
            saveState(teamId, state);
            paintLetters();
            focusCell(previousKey, activeEntry.direction);
          }
          return;
        }

        if (event.key === " ") {
          const ids = entryIdsAt(key);
          if (ids.length === 2) {
            event.preventDefault();
            const other = ids.find(id => id !== state.activeEntryId) || ids[0];
            activateEntry(other, key);
            setStatus(`Direction switched to ${entryById(other).direction.toUpperCase()}.`);
          }
          return;
        }

        const arrows = {
          ArrowLeft: [0, -1, "across"],
          ArrowRight: [0, 1, "across"],
          ArrowUp: [-1, 0, "down"],
          ArrowDown: [1, 0, "down"]
        };

        const movement = arrows[event.key];
        if (movement) {
          event.preventDefault();
          moveGeometric(row, col, movement[0], movement[1], movement[2]);
        }
      });
    });

    clearButton.addEventListener("click", () => {
      const hasLetters = filledCount() > 0;

      if (
        hasLetters &&
        !window.confirm("Clear every letter from this crossword?")
      ) {
        return;
      }

      state.letters = {};
      state.activeEntryId = null;
      saveState(teamId, state);
      paintLetters();
      paintHighlight();
      setStatus("Crossword cleared.");
    });

    paintLetters();

    if (state.activeEntryId) {
      paintHighlight();
    }

    window.FREEZE_CROSSWORD = Object.freeze({
      getLetters: () => ({ ...state.letters }),
      clear: () => {
        state.letters = {};
        state.activeEntryId = null;
        saveState(teamId, state);
        paintLetters();
        paintHighlight();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: challengeId,
    shortTitle: "CROSSWORD",
    title: "The Frozen Crossword",
    eyebrow: "CHARTERHOUSE · ALMATY · SCHOOL KNOWLEDGE",
    duration: "7–9 min",
    intro:
      "A frozen archive lock has turned school knowledge into a crossword. Complete the connected grid, then extract the six numbered letters.",
    brief:
      "Solve familiar clues first and use crossing letters for the harder ones. The grid gives no automatic right-or-wrong feedback.",
    submission: {
      kind: "text",
      label: "Six-letter security word",
      placeholder: "Enter the six-letter extraction",
      inputEnabled: true,
      enabled: true
    },
    render
  });
})();
