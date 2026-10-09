(() => {
  "use strict";

  const challengeId = 5;
  const STORAGE_PREFIX = "charterhouseFreeze.v2.timetable.";

  const subjects = Object.freeze([
    Object.freeze({
      id: "art",
      name: "ART",
      fullName: "Art",
      code: "ART",
      icon: "palette",
      detail: "Studio"
    }),
    Object.freeze({
      id: "science",
      name: "SCIENCE",
      fullName: "Science",
      code: "SCI",
      icon: "flask",
      detail: "Laboratory"
    }),
    Object.freeze({
      id: "music",
      name: "MUSIC",
      fullName: "Music",
      code: "MUS",
      icon: "music",
      detail: "Music Room"
    }),
    Object.freeze({
      id: "maths",
      name: "MATHS",
      fullName: "Maths",
      code: "MAT",
      icon: "sigma",
      detail: "Mathematics"
    }),
    Object.freeze({
      id: "computing",
      name: "COMPUTING",
      fullName: "Computing",
      code: "COM",
      icon: "terminal",
      detail: "Computer Science"
    })
  ]);

  const byId = new Map(subjects.map(subject => [subject.id, subject]));

  const startingBankOrder = Object.freeze([
    "computing",
    "science",
    "art",
    "maths",
    "music"
  ]);

  const clues = Object.freeze([
    "Computing is immediately after Maths.",
    "Science is neither first nor last.",
    "Music is later than Science.",
    "Art is earlier than Maths.",
    "Music is earlier than Maths."
  ]);

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function cleanSlots(value) {
    const source = Array.isArray(value) ? value : [];
    const used = new Set();

    return [0, 1, 2, 3, 4].map(index => {
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
          slots: Array(5).fill(null),
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
        slots: Array(5).fill(null),
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
      // Puzzle remains usable in-memory if storage is unavailable.
    }
  }

  function iconMarkup(type) {
    if (type === "palette") {
      return `
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 6c-10 0-18 7.5-18 16.5S14.2 39 24.2 39h3.4c2.7 0 4.3-2.2 3.2-4.6l-.8-1.8c-.8-1.8.5-3.8 2.5-3.8h3.2c4.2 0 6.3-2.8 6.3-6.8C42 13 34.1 6 24 6Z"/>
          <circle cx="15" cy="19" r="2.5"/>
          <circle cx="22" cy="13.5" r="2.5"/>
          <circle cx="30.5" cy="15.5" r="2.5"/>
          <circle cx="35" cy="22" r="2.5"/>
        </svg>
      `;
    }

    if (type === "flask") {
      return `
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M18 6h12M21 6v12L10 37c-1.4 2.5.4 5 3.3 5h21.4c2.9 0 4.7-2.5 3.3-5L27 18V6"/>
          <path d="M15 31h18"/>
          <circle cx="22" cy="26" r="1.5"/>
          <circle cx="29" cy="34.5" r="1.5"/>
        </svg>
      `;
    }

    if (type === "music") {
      return `
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M18 36V14l20-4v21"/>
          <path d="M18 19l20-4"/>
          <ellipse cx="13.5" cy="36.5" rx="6.5" ry="4.5"/>
          <ellipse cx="33.5" cy="31.5" rx="6.5" ry="4.5"/>
        </svg>
      `;
    }

    if (type === "sigma") {
      return `
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M36 8H13l12 16-12 16h23"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 12h34v24H7z"/>
        <path d="M12 18l6 6-6 6M22 30h10"/>
      </svg>
    `;
  }

  function subjectMarkup(subject, options = {}) {
    const compact = options.compact ? " is-compact" : "";
    const selected = options.selected ? " is-selected" : "";

    return `
      <div
        class="timetable-subject-card${compact}${selected}"
        data-timetable-subject="${subject.id}"
        draggable="true"
      >
        <div class="timetable-subject-icon">
          ${iconMarkup(subject.icon)}
        </div>

        <div class="timetable-subject-copy">
          <strong>${subject.name}</strong>
          <span>${subject.detail}</span>
          <code>${subject.code}</code>
        </div>
      </div>
    `;
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    const state = loadState(teamId);

    let dragId = null;

    container.classList.add("timetable-challenge-content");

    container.innerHTML = `
      <div class="timetable-puzzle">
        <section class="timetable-console">
          <div class="timetable-console-header">
            <div>
              <span>SCHEDULING SYSTEM · MONDAY RECOVERY</span>
              <h3>The Impossible Timetable</h3>
              <p>
                Five lessons have fallen out of Monday's timetable. Use the
                scheduling rules to rebuild Periods 1–5.
              </p>
            </div>

            <div class="timetable-status-badge">
              <span>SYSTEM</span>
              <strong>UNSORTED</strong>
            </div>
          </div>

          <div class="timetable-board">
            <div class="timetable-bank-panel">
              <div class="timetable-section-heading">
                <span>DISPLACED LESSONS</span>
                <strong>Select a subject, then choose a period.</strong>
              </div>

              <div
                class="timetable-subject-bank"
                data-timetable-bank
                aria-label="Displaced lesson cards"
              ></div>

              <p class="timetable-bank-help">
                You can also drag cards. Click a filled period to pick that lesson up again.
              </p>
            </div>

            <div class="timetable-grid-panel">
              <div class="timetable-grid-heading">
                <span>MONDAY · PERIODS 1–5</span>
                <strong>Rebuild the schedule</strong>
              </div>

              <div class="timetable-slots">
                ${[1,2,3,4,5].map(period => `
                  <button
                    type="button"
                    class="timetable-slot"
                    data-timetable-slot="${period - 1}"
                    aria-label="Period ${period}"
                  >
                    <span class="timetable-period-label">
                      <b>P${period}</b>
                      <small>PERIOD ${period}</small>
                    </span>

                    <div class="timetable-slot-card" data-timetable-slot-card>
                      <span>PLACE LESSON</span>
                    </div>
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="timetable-actions">
            <button
              type="button"
              class="button button-secondary"
              data-timetable-clear
            >
              Clear timetable
            </button>

            <button
              type="button"
              class="button button-secondary"
              data-timetable-reset
            >
              Restore scramble
            </button>
          </div>

          <p
            class="timetable-status-message"
            data-timetable-status
            role="status"
            aria-live="polite"
          >
            Start with the five scheduling rules.
          </p>
        </section>

        <aside class="timetable-clue-panel">
          <section class="timetable-rules-card">
            <div class="timetable-rules-heading">
              <span>SCHEDULING RULES</span>
              <h3>All five must be true</h3>
            </div>

            <ol class="timetable-clues">
              ${clues.map((clue, index) => `
                <li>
                  <b>${index + 1}</b>
                  <span>${clue}</span>
                </li>
              `).join("")}
            </ol>
          </section>

          <section class="timetable-final-question">
            <span>FINAL QUESTION</span>
            <h3>Which subject is in Period 3?</h3>
            <p>
              When your timetable satisfies every rule, type only the subject
              name in the answer box below.
            </p>
          </section>

          <section class="timetable-team-tip">
            <span>TEAM TIP</span>
            <p>
              One person can move lesson cards while someone else checks every
              rule after each change.
            </p>
          </section>
        </aside>
      </div>
    `;

    const bank = container.querySelector("[data-timetable-bank]");
    const slots = Array.from(
      container.querySelectorAll("[data-timetable-slot]")
    );
    const status = container.querySelector("[data-timetable-status]");
    const clearButton = container.querySelector("[data-timetable-clear]");
    const resetButton = container.querySelector("[data-timetable-reset]");

    function setStatus(message, mode = "") {
      status.classList.remove("is-active", "is-complete");

      if (mode) {
        status.classList.add(`is-${mode}`);
      }

      status.textContent = message;
    }

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

    function selectSubject(id) {
      if (!byId.has(id)) return;

      state.selectedId = id;
      saveState(teamId, state);
      renderWorkbench();

      setStatus(
        `${byId.get(id).fullName} selected. Choose Period 1–5.`,
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
            `${byId.get(existing).fullName} picked up. Choose a new period.`,
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

      const filledCount = state.slots.filter(Boolean).length;

      setStatus(
        filledCount === 5
          ? "All five periods are filled. Check every rule, then answer the Period 3 question."
          : `${byId.get(selectedId).fullName} placed in Period ${slotIndex + 1}.`,
        filledCount === 5 ? "complete" : ""
      );
    }

    function renderWorkbench() {
      const available = bankIds();

      bank.innerHTML = available.length
        ? available.map(id => {
            const subject = byId.get(id);

            return `
              <button
                type="button"
                class="timetable-bank-card"
                data-timetable-bank-card="${id}"
                aria-pressed="${state.selectedId === id}"
              >
                ${subjectMarkup(subject, {
                  selected: state.selectedId === id
                })}
              </button>
            `;
          }).join("")
        : `
          <div class="timetable-bank-empty">
            All five lessons are currently on the timetable.
          </div>
        `;

      bank.querySelectorAll("[data-timetable-bank-card]").forEach(button => {
        const id = button.dataset.timetableBankCard;

        button.addEventListener("click", () => selectSubject(id));

        const visual = button.querySelector("[data-timetable-subject]");
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

      slots.forEach((slot, index) => {
        const subjectId = state.slots[index];
        const cardTarget = slot.querySelector("[data-timetable-slot-card]");

        slot.classList.toggle("is-filled", Boolean(subjectId));
        slot.classList.toggle(
          "is-selected-source",
          Boolean(subjectId && state.selectedId === subjectId)
        );

        if (subjectId) {
          cardTarget.innerHTML = subjectMarkup(
            byId.get(subjectId),
            {
              compact: true,
              selected: state.selectedId === subjectId
            }
          );
        } else {
          cardTarget.innerHTML = `<span>PLACE LESSON</span>`;
        }

        slot.onclick = event => {
          const sourceCard =
            event.target.closest("[data-timetable-subject]");

          if (
            sourceCard &&
            subjectId &&
            !state.selectedId
          ) {
            selectSubject(subjectId);
            return;
          }

          placeSelected(index);
        };

        slot.ondragover = event => {
          event.preventDefault();
          slot.classList.add("is-drop-target");

          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
        };

        slot.ondragleave = () => {
          slot.classList.remove("is-drop-target");
        };

        slot.ondrop = event => {
          event.preventDefault();
          slot.classList.remove("is-drop-target");

          const id =
            event.dataTransfer?.getData("text/plain") ||
            dragId;

          if (!byId.has(id)) return;

          state.selectedId = id;
          placeSelected(index);
          dragId = null;
        };
      });

      clearButton.disabled =
        !state.slots.some(Boolean) &&
        !state.selectedId;

      saveState(teamId, state);
    }

    clearButton.addEventListener("click", () => {
      state.slots = Array(5).fill(null);
      state.selectedId = null;
      saveState(teamId, state);
      renderWorkbench();
      setStatus("Timetable cleared. All lessons are back in the displaced tray.");
    });

    resetButton.addEventListener("click", () => {
      state.slots = Array(5).fill(null);
      state.selectedId = null;
      saveState(teamId, state);
      renderWorkbench();
      setStatus("Original scramble restored.");
    });

    renderWorkbench();

    window.FREEZE_TIMETABLE = Object.freeze({
      getSlots: () => [...state.slots],
      reset: () => {
        state.slots = Array(5).fill(null);
        state.selectedId = null;
        saveState(teamId, state);
        renderWorkbench();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: challengeId,
    shortTitle: "TIMETABLE",
    title: "The Impossible Timetable",
    eyebrow: "LOGIC · SCHEDULING",
    duration: "5–7 min",
    intro:
      "Monday's timetable database has frozen. Five lessons are out of place and every scheduling rule must still be satisfied.",
    brief:
      "Rebuild Periods 1–5 using the five rules, then answer the final Period 3 question.",
    submission: {
      kind: "text",
      label: "Period 3 subject",
      placeholder: "Enter the subject in Period 3",
      inputEnabled: true,
      enabled: true
    },
    render
  });
})();
