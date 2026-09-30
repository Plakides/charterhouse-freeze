(() => {
  "use strict";

  const challengeId = 3;
  const STORAGE_PREFIX = "charterhouseFreeze.v2.secretMessage.";
  const TAKE_PATTERN = Object.freeze([2, 4, 1, 3, 5, 2]);

  const cards = Object.freeze([
    Object.freeze({
      id: "book",
      name: "BOOK",
      code: "ATQMX",
      motif: "B",
      detail: "Archive seal"
    }),
    Object.freeze({
      id: "mountain",
      name: "MOUNTAIN",
      code: "BZKUH",
      motif: "M",
      detail: "Expedition seal"
    }),
    Object.freeze({
      id: "snow-leopard",
      name: "SNOW LEOPARD",
      code: "LPRVN",
      motif: "SL",
      detail: "Wildlife seal"
    }),
    Object.freeze({
      id: "key",
      name: "KEY",
      code: "GXPDM",
      motif: "K",
      detail: "Vault seal"
    }),
    Object.freeze({
      id: "eagle",
      name: "EAGLE",
      code: "QTRZA",
      motif: "E",
      detail: "Sky seal"
    }),
    Object.freeze({
      id: "teapot",
      name: "TEAPOT",
      code: "FRNKS",
      motif: "T",
      detail: "House seal"
    })
  ]);

  const byId = new Map(cards.map(card => [card.id, card]));

  const startingBankOrder = Object.freeze([
    "eagle",
    "teapot",
    "mountain",
    "key",
    "book",
    "snow-leopard"
  ]);

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function cleanSlots(value) {
    const source = Array.isArray(value) ? value : [];
    const used = new Set();

    return TAKE_PATTERN.map((_, index) => {
      const id = String(source[index] || "");
      if (!byId.has(id) || used.has(id)) return null;
      used.add(id);
      return id;
    });
  }

  function loadState(teamId) {
    try {
      const raw = localStorage.getItem(storageKey(teamId));
      if (!raw) {
        return {
          slots: Array(6).fill(null),
          selectedId: null
        };
      }

      const parsed = JSON.parse(raw);

      return {
        slots: cleanSlots(parsed?.slots),
        selectedId: byId.has(parsed?.selectedId)
          ? parsed.selectedId
          : null
      };
    } catch {
      return {
        slots: Array(6).fill(null),
        selectedId: null
      };
    }
  }

  function saveState(teamId, state) {
    try {
      localStorage.setItem(
        storageKey(teamId),
        JSON.stringify({
          slots: state.slots,
          selectedId: state.selectedId
        })
      );
    } catch {
      // UI remains usable in-memory if storage is unavailable.
    }
  }

  function cardMarkup(card, options = {}) {
    const selected = options.selected ? " is-selected" : "";
    const compact = options.compact ? " is-compact" : "";
    const draggable = options.draggable !== false ? ' draggable="true"' : "";

    return `
      <div
        class="secret-card${selected}${compact}"
        data-secret-card="${card.id}"
        ${draggable}
      >
        <div class="secret-card-seal" aria-hidden="true">${card.motif}</div>
        <div class="secret-card-copy">
          <strong>${card.name}</strong>
          <span>${card.detail}</span>
          <code aria-label="${card.name} code ${card.code}">
            ${card.code.split("").map(letter => `<b>${letter}</b>`).join("")}
          </code>
        </div>
      </div>
    `;
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    const state = loadState(teamId);

    let dragId = null;

    container.classList.add("secret-message-content");

    container.innerHTML = `
      <div class="secret-message-puzzle">
        <section class="secret-briefing">
          <div class="secret-briefing-heading">
            <span>TRANSLATION RELAY · SIGNAL 03</span>
            <h3>Three transmissions. One hidden word.</h3>
            <p>
              You do not need to speak Kazakh or Russian. Use the emergency
              glossaries, solve the card order, then extract one letter from
              each position.
            </p>
          </div>

          <div class="secret-workflow" aria-label="Puzzle steps">
            <span><b>1</b> Decode the notes</span>
            <span><b>2</b> Arrange six cards</span>
            <span><b>3</b> Use the decoder rail</span>
            <span><b>4</b> Read the hidden word</span>
          </div>
        </section>

        <section class="secret-transmissions" aria-label="Intercepted transmissions">
          <article class="secret-note is-kazakh">
            <header>
              <span>KZ · INTERCEPT 14</span>
              <strong>ҚАЗАҚША</strong>
            </header>

            <blockquote lang="kk">
              Тау қар барысынан бұрын.<br>
              Шәйнек соңғы.
            </blockquote>

            <div class="secret-glossary">
              <span><b>тау</b> mountain</span>
              <span><b>қар барысы</b> snow leopard</span>
              <span><b>бұрын</b> before</span>
              <span><b>шәйнек</b> teapot</span>
              <span><b>соңғы</b> last</span>
            </div>

            <i class="secret-stamp">KZ</i>
          </article>

          <article class="secret-note is-russian">
            <header>
              <span>RU · INTERCEPT 22</span>
              <strong>РУССКИЙ</strong>
            </header>

            <blockquote lang="ru">
              Книга сразу перед горой.<br>
              Орёл сразу после ключа.
            </blockquote>

            <div class="secret-glossary">
              <span><b>книга</b> book</span>
              <span><b>сразу</b> immediately</span>
              <span><b>перед</b> before</span>
              <span><b>гора / горой</b> mountain</span>
              <span><b>орёл</b> eagle</span>
              <span><b>после</b> after</span>
              <span><b>ключ / ключа</b> key</span>
            </div>

            <i class="secret-stamp">RU</i>
          </article>

          <article class="secret-note is-english">
            <header>
              <span>EN · INTERCEPT 31</span>
              <strong>ENGLISH</strong>
            </header>

            <blockquote>
              Exactly <em>two cards</em> come before the
              <strong>Snow Leopard</strong>.
            </blockquote>

            <div class="secret-operator-note">
              <b>OPERATOR NOTE</b>
              <span>
                “Immediately” means the two cards must touch — no card can sit
                between them.
              </span>
            </div>

            <i class="secret-stamp">EN</i>
          </article>
        </section>

        <section class="secret-card-workbench">
          <div class="secret-section-heading">
            <div>
              <span>SCRAMBLED SECURITY CARDS</span>
              <h3>Select a card, then choose a position</h3>
            </div>
            <p>
              You can also drag cards. Click a filled position to pick that card
              up again.
            </p>
          </div>

          <div
            class="secret-card-bank"
            data-card-bank
            aria-label="Unplaced security cards"
          ></div>

          <div class="secret-slots-heading">
            <span>DECODER RAIL</span>
            <strong>Position determines which letter to take</strong>
          </div>

          <div class="secret-slots" data-secret-slots>
            ${TAKE_PATTERN.map((take, index) => `
              <button
                type="button"
                class="secret-slot"
                data-secret-slot="${index}"
                aria-label="Position ${index + 1}, take letter ${take}"
              >
                <span class="secret-slot-position">
                  <b>${index + 1}</b>
                  POSITION
                </span>

                <div class="secret-slot-card" data-slot-card>
                  <span>PLACE CARD</span>
                </div>

                <span class="secret-take">
                  TAKE LETTER <b>${take}</b>
                </span>

              </button>
            `).join("")}
          </div>

          <div class="secret-extraction-console is-manual">
            <div>
              <span>FINAL DECODER INSTRUCTION</span>
              <strong>
                Once all six cards are in the correct order, extract the letters
                yourself. The website will NOT reveal them for you.
              </strong>
            </div>

            <div class="secret-manual-pattern" aria-label="Manual extraction pattern">
              <span><b>1</b> 2nd letter</span>
              <span><b>2</b> 4th letter</span>
              <span><b>3</b> 1st letter</span>
              <span><b>4</b> 3rd letter</span>
              <span><b>5</b> 5th letter</span>
              <span><b>6</b> 2nd letter</span>
            </div>

            <p class="secret-manual-instruction">
              Write the six letters together, then type the six-letter message
              in the <strong>Decoded message</strong> box below.
            </p>
          </div>

          <div class="secret-workbench-actions">
            <button
              type="button"
              class="button button-secondary"
              data-secret-clear
            >
              Clear arrangement
            </button>

            <button
              type="button"
              class="button button-secondary"
              data-secret-reset
            >
              Restore scramble
            </button>
          </div>

          <p class="secret-message-status" data-secret-status role="status" aria-live="polite">
            Start by decoding the three intercepted notes.
          </p>
        </section>
      </div>
    `;

    const bank = container.querySelector("[data-card-bank]");
    const slotButtons = Array.from(
      container.querySelectorAll("[data-secret-slot]")
    );
    const status = container.querySelector("[data-secret-status]");
    const clearButton = container.querySelector("[data-secret-clear]");
    const resetButton = container.querySelector("[data-secret-reset]");

    function occupiedSet() {
      return new Set(state.slots.filter(Boolean));
    }

    function bankIds() {
      const occupied = occupiedSet();

      return startingBankOrder.filter(id => !occupied.has(id));
    }

    function sourceSlotFor(id) {
      return state.slots.findIndex(slotId => slotId === id);
    }

    function setStatus(message, mode = "") {
      status.classList.remove("is-active", "is-complete");

      if (mode) {
        status.classList.add(`is-${mode}`);
      }

      status.textContent = message;
    }

    function selectCard(id) {
      if (!byId.has(id)) return;

      state.selectedId = id;
      saveState(teamId, state);
      renderWorkbench();

      const card = byId.get(id);
      setStatus(
        `${card.name} selected. Choose one of the six decoder positions.`,
        "active"
      );
    }

    function placeSelected(slotIndex) {
      const selectedId = state.selectedId;
      if (!selectedId || !byId.has(selectedId)) {
        const existing = state.slots[slotIndex];

        if (existing) {
          state.slots[slotIndex] = null;
          state.selectedId = existing;
          saveState(teamId, state);
          renderWorkbench();

          setStatus(
            `${byId.get(existing).name} picked up. Choose a new position.`,
            "active"
          );
        }

        return;
      }

      const previousSlot = sourceSlotFor(selectedId);
      const displaced = state.slots[slotIndex];

      if (previousSlot >= 0) {
        state.slots[previousSlot] = null;
      }

      if (
        displaced &&
        displaced !== selectedId &&
        previousSlot >= 0
      ) {
        state.slots[previousSlot] = displaced;
      }

      state.slots[slotIndex] = selectedId;
      state.selectedId = null;

      saveState(teamId, state);
      renderWorkbench();

      setStatus(
        `${byId.get(selectedId).name} placed in position ${slotIndex + 1}.`
      );
    }

    function renderWorkbench() {
      const available = bankIds();

      bank.innerHTML = available.length
        ? available.map(id => {
            const card = byId.get(id);
            return `
              <button
                type="button"
                class="secret-bank-card"
                data-bank-card="${id}"
                aria-pressed="${state.selectedId === id}"
              >
                ${cardMarkup(card, {
                  selected: state.selectedId === id
                })}
              </button>
            `;
          }).join("")
        : `
          <div class="secret-bank-empty">
            All cards are on the decoder rail.
          </div>
        `;

      bank.querySelectorAll("[data-bank-card]").forEach(button => {
        const id = button.dataset.bankCard;

        button.addEventListener("click", () => selectCard(id));

        const visual = button.querySelector("[data-secret-card]");
        visual?.addEventListener("dragstart", event => {
          dragId = id;
          event.dataTransfer?.setData("text/plain", id);
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
          }
        });

        visual?.addEventListener("dragend", () => {
          dragId = null;
        });
      });

      slotButtons.forEach((slotButton, index) => {
        const cardId = state.slots[index];
        const cardTarget = slotButton.querySelector("[data-slot-card]");
        slotButton.classList.toggle("is-filled", Boolean(cardId));
        slotButton.classList.toggle(
          "is-selected-source",
          Boolean(cardId && state.selectedId === cardId)
        );

        if (cardId) {
          cardTarget.innerHTML = cardMarkup(
            byId.get(cardId),
            {
              selected: state.selectedId === cardId,
              compact: true
            }
          );

        } else {
          cardTarget.innerHTML = `<span>PLACE CARD</span>`;
        }

        slotButton.onclick = event => {
          const sourceCard =
            event.target.closest("[data-secret-card]");

          if (
            sourceCard &&
            cardId &&
            !state.selectedId
          ) {
            selectCard(cardId);
            return;
          }

          placeSelected(index);
        };

        slotButton.ondragover = event => {
          event.preventDefault();
          slotButton.classList.add("is-drop-target");

          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
        };

        slotButton.ondragleave = () => {
          slotButton.classList.remove("is-drop-target");
        };

        slotButton.ondrop = event => {
          event.preventDefault();
          slotButton.classList.remove("is-drop-target");

          const id =
            event.dataTransfer?.getData("text/plain") ||
            dragId;

          if (!byId.has(id)) return;

          state.selectedId = id;
          placeSelected(index);
          dragId = null;
        };
      });

      const filledCount = state.slots.filter(Boolean).length;

      if (filledCount === 6) {
        setStatus(
          "All six positions are filled. Now apply the decoder pattern yourself and type the six-letter message below.",
          "complete"
        );
      }

      clearButton.disabled =
        !state.slots.some(Boolean) && !state.selectedId;

      saveState(teamId, state);
    }

    clearButton.addEventListener("click", () => {
      state.slots = Array(6).fill(null);
      state.selectedId = null;
      saveState(teamId, state);
      renderWorkbench();
      setStatus("Arrangement cleared. The cards are back in the bank.");
    });

    resetButton.addEventListener("click", () => {
      state.slots = Array(6).fill(null);
      state.selectedId = null;
      saveState(teamId, state);
      renderWorkbench();
      setStatus("Original scramble restored.");
    });

    renderWorkbench();

    window.FREEZE_SECRET_MESSAGE = Object.freeze({
      getSlots: () => [...state.slots],
      reset: () => {
        state.slots = Array(6).fill(null);
        state.selectedId = null;
        saveState(teamId, state);
        renderWorkbench();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: challengeId,
    shortTitle: "SECRET MESSAGE",
    title: "Құпия хабар / Secret Message",
    eyebrow: "LANGUAGE · LOGIC · EXTRACTION",
    duration: "6–8 min",
    intro:
      "The translation relay froze mid-transmission. Six security cards have been scrambled across three intercepted messages.",
    brief:
      "Decode only the words you need, reconstruct the card order, then manually take the specified letter from each card and type the hidden six-letter message.",
    submission: {
      kind: "text",
      label: "Decoded message",
      placeholder: "Enter the six-letter message",
      inputEnabled: true,
      enabled: true
    },
    render
  });
})();
