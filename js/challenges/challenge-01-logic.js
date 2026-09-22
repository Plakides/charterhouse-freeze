(() => {
  "use strict";

  const suspects = Object.freeze([
    Object.freeze({
      name: "Amina",
      scarf: "Blue",
      bag: "Backpack",
      item: "Book",
      locker: "3",
      avatar: "A"
    }),
    Object.freeze({
      name: "Timur",
      scarf: "Blue",
      bag: "Backpack",
      item: "Compass",
      locker: "2",
      avatar: "T"
    }),
    Object.freeze({
      name: "Sofia",
      scarf: "Red",
      bag: "Backpack",
      item: "Book",
      locker: "3",
      avatar: "S"
    }),
    Object.freeze({
      name: "Daniyar",
      scarf: "Blue",
      bag: "Satchel",
      item: "Compass",
      locker: "3",
      avatar: "D"
    })
  ]);

  const clues = Object.freeze([
    "The key holder is wearing a blue scarf.",
    "The emergency key is inside a backpack, not a satchel.",
    "The key holder’s locker number is odd.",
    "The key holder is not carrying the compass.",
    "Exactly one student matches every clue."
  ]);

  function suspectCard(person) {
    return `
      <article class="logic-suspect" data-suspect="${person.name}">
        <button class="logic-suspect-select" type="button" data-select-suspect="${person.name}" aria-label="Select ${person.name} as the key holder">
          <span class="logic-avatar" aria-hidden="true">
            <span class="logic-avatar-head"></span>
            <span class="logic-avatar-body"></span>
            <strong>${person.avatar}</strong>
          </span>
          <span class="logic-name">${person.name}</span>
          <span class="logic-select-copy">SELECT</span>
        </button>

        <dl class="logic-facts">
          <div>
            <dt>SCARF</dt>
            <dd><span class="logic-colour-dot is-${person.scarf.toLowerCase()}"></span>${person.scarf}</dd>
          </div>
          <div>
            <dt>BAG</dt>
            <dd>${person.bag}</dd>
          </div>
          <div>
            <dt>CARRYING</dt>
            <dd>${person.item}</dd>
          </div>
          <div>
            <dt>LOCKER</dt>
            <dd class="logic-locker">${person.locker}</dd>
          </div>
        </dl>

        <button class="logic-eliminate" type="button" data-eliminate="${person.name}">
          Mark eliminated
        </button>
      </article>
    `;
  }

  function render(container) {
    container.classList.add("logic-challenge-content");
    container.innerHTML = `
      <div class="logic-puzzle">
        <section class="logic-scene">
          <div class="logic-scene-heading">
            <div>
              <span>EMERGENCY LOCKER CCTV · 07:42</span>
              <h3>Who has the key?</h3>
            </div>
            <div class="logic-key-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <circle cx="22" cy="28" r="11"></circle>
                <path d="M31 35 51 55m-2-7 7-7m-14 0 6-6"></path>
              </svg>
            </div>
          </div>

          <p class="logic-brief">
            Four students were seen near the emergency locker just before the heating system froze.
            The key is with exactly one of them.
          </p>

          <div class="logic-suspects">
            ${suspects.map(suspectCard).join("")}
          </div>
        </section>

        <aside class="logic-clue-board">
          <div class="logic-clue-heading">
            <span>SECURITY NOTES</span>
            <strong>Use all the clues</strong>
          </div>

          <ol class="logic-clues">
            ${clues.map((clue, index) => `
              <li>
                <span>${String(index + 1).padStart(2, "0")}</span>
                <p>${clue}</p>
              </li>
            `).join("")}
          </ol>

          <div class="logic-tip">
            <strong>Team tactic</strong>
            <span>Cross out anyone who breaks a clue. When one person remains, select them and submit.</span>
          </div>
        </aside>
      </div>
    `;

    const answerInput = document.getElementById("challengeAnswerInput");

    function refreshSelectedState() {
      const chosen = String(answerInput?.value || "").trim().toLowerCase();

      container.querySelectorAll(".logic-suspect").forEach(card => {
        const isSelected = card.dataset.suspect.toLowerCase() === chosen;
        card.classList.toggle("is-selected", isSelected);
      });
    }

    container.querySelectorAll("[data-select-suspect]").forEach(button => {
      button.addEventListener("click", () => {
        const name = button.dataset.selectSuspect;

        if (answerInput) {
          answerInput.value = name;
          answerInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        refreshSelectedState();
      });
    });

    container.querySelectorAll("[data-eliminate]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();

        const card = button.closest(".logic-suspect");
        if (!card) return;

        const eliminated = card.classList.toggle("is-eliminated");
        button.textContent = eliminated ? "Undo elimination" : "Mark eliminated";

        if (
          eliminated &&
          answerInput &&
          answerInput.value.trim().toLowerCase() === card.dataset.suspect.toLowerCase()
        ) {
          answerInput.value = "";
          refreshSelectedState();
        }
      });
    });

    answerInput?.addEventListener("input", refreshSelectedState);
  }

  window.FREEZE_CHALLENGES.register({
    id: 1,
    shortTitle: "LOGIC",
    title: "House of Confusion",
    eyebrow: "VISUAL DEDUCTION",
    duration: "4 min",
    intro: "Four students. One emergency key. Several extremely inconvenient clues.",
    brief: "Use the student cards and security notes to work out who has the key.",
    submission: {
      kind: "text",
      label: "Who has the emergency key?",
      placeholder: "Select a student or type their first name",
      enabled: true
    },
    render
  });
})();
