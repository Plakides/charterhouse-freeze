(() => {
  "use strict";

  const suspects = Object.freeze([
    Object.freeze({
      name: "Amina",
      scarf: "Blue",
      scarfClass: "blue",
      bag: "Backpack",
      bagType: "backpack",
      item: "Book",
      itemType: "book",
      locker: "3",
      skin: "#d7aa89",
      hair: "#332521",
      coat: "#7d5a70"
    }),
    Object.freeze({
      name: "Timur",
      scarf: "Blue",
      scarfClass: "blue",
      bag: "Backpack",
      bagType: "backpack",
      item: "Compass",
      itemType: "compass",
      locker: "2",
      skin: "#c89570",
      hair: "#231d1a",
      coat: "#526d7d"
    }),
    Object.freeze({
      name: "Sofia",
      scarf: "Red",
      scarfClass: "red",
      bag: "Backpack",
      bagType: "backpack",
      item: "Book",
      itemType: "book",
      locker: "3",
      skin: "#e0b290",
      hair: "#6d4938",
      coat: "#63715b"
    }),
    Object.freeze({
      name: "Daniyar",
      scarf: "Blue",
      scarfClass: "blue",
      bag: "Satchel",
      bagType: "satchel",
      item: "Compass",
      itemType: "compass",
      locker: "3",
      skin: "#bd8968",
      hair: "#30231e",
      coat: "#705b4f"
    })
  ]);

  const clues = Object.freeze([
    Object.freeze({
      icon: "scarf",
      text: "The key holder is wearing a blue scarf."
    }),
    Object.freeze({
      icon: "bag",
      text: "The emergency key is inside a backpack, not a satchel."
    }),
    Object.freeze({
      icon: "locker",
      text: "The key holder’s locker number is odd."
    }),
    Object.freeze({
      icon: "compass-off",
      text: "The key holder is not carrying the compass."
    }),
    Object.freeze({
      icon: "one",
      text: "Exactly one student matches every clue."
    })
  ]);

  function evidenceIcon(type) {
    switch (type) {
      case "book":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M8 11c7-2 12-1 16 3 4-4 9-5 16-3v27c-7-2-12-1-16 3-4-4-9-5-16-3V11z"></path>
            <path d="M24 14v27M13 19h7m8 0h7M13 25h7m8 0h7"></path>
          </svg>`;
      case "compass":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="15"></circle>
            <path d="m19 30 4-13 7 10-11 3z"></path>
            <path d="M24 5v5M43 24h-5M24 43v-5M5 24h5"></path>
          </svg>`;
      case "backpack":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M15 17c0-6 3-9 9-9s9 3 9 9"></path>
            <path d="M12 18h24v24H12z"></path>
            <path d="M17 25h14v10H17zM12 22H8v12h4m24-12h4v12h-4"></path>
          </svg>`;
      case "satchel":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M9 18h30v22H9zM16 18v-5h16v5M9 25h30M21 22h6v6h-6z"></path>
            <path d="M13 18 34 8"></path>
          </svg>`;
      default:
        return "";
    }
  }

  function clueIcon(type) {
    switch (type) {
      case "scarf":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M13 10c7 5 15 5 22 0v10c-7 5-15 5-22 0V10z"></path>
            <path d="M17 23v15l6-5 4 7V23"></path>
          </svg>`;
      case "bag":
        return evidenceIcon("backpack");
      case "locker":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="10" y="6" width="28" height="36" rx="2"></rect>
            <path d="M24 6v36M16 15h3m10 0h3M16 32h3m10 0h3"></path>
          </svg>`;
      case "compass-off":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="14"></circle>
            <path d="m19 30 4-13 7 10-11 3zM8 8l32 32"></path>
          </svg>`;
      case "one":
        return `
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="17"></circle>
            <path d="M21 17h5v17m-7 0h12"></path>
          </svg>`;
      default:
        return "";
    }
  }

  function studentPortrait(person) {
    const scarf = person.scarfClass === "red" ? "#b7656b" : "#5f8cab";

    return `
      <svg class="logic-student-portrait" viewBox="0 0 180 150" role="img" aria-label="Illustration of ${person.name}">
        <rect x="1" y="1" width="178" height="148" rx="8" fill="#eaf1f3" stroke="rgba(9,33,64,.14)"></rect>
        <path d="M0 118 38 88l31 22 27-42 38 31 46-27v78H0z" fill="#c8dbe3" opacity=".7"></path>

        <g class="logic-person">
          <path d="M50 141c4-31 18-44 40-44s36 13 40 44" fill="${person.coat}"></path>
          <rect x="77" y="82" width="26" height="24" rx="9" fill="${person.skin}"></rect>
          <ellipse cx="90" cy="65" rx="27" ry="31" fill="${person.skin}"></ellipse>
          <path d="M64 64c0-28 13-38 29-38 17 0 29 10 29 34-7-8-14-12-26-13-12-1-21 4-32 17z" fill="${person.hair}"></path>
          <path d="M66 58c1-16 9-28 24-31-17 0-29 10-29 32 0 12 5 24 12 30-5-10-7-20-7-31z" fill="${person.hair}" opacity=".92"></path>
          <circle cx="80" cy="66" r="2" fill="#302b2a"></circle>
          <circle cx="101" cy="66" r="2" fill="#302b2a"></circle>
          <path d="M84 79c4 3 9 3 13 0" fill="none" stroke="#7d5548" stroke-width="2" stroke-linecap="round"></path>

          <path d="M63 98c17 7 36 7 54 0l-3 17c-16 7-32 7-48 0z" fill="${scarf}"></path>
          <path d="M70 112v26l10-8 7 12 4-27z" fill="${scarf}"></path>
        </g>

        <g class="logic-evidence-on-portrait">
          ${person.bagType === "backpack" ? `
            <path d="M121 99c15 1 23 8 24 22v18h-24z" fill="#475d6d" opacity=".95"></path>
            <path d="M125 103c2-8 7-12 13-12 7 0 11 4 13 12" fill="none" stroke="#475d6d" stroke-width="5"></path>
          ` : `
            <path d="M119 105h32v25h-32z" fill="#7c5f49"></path>
            <path d="M122 105 145 88" fill="none" stroke="#7c5f49" stroke-width="5"></path>
          `}

          ${person.itemType === "book" ? `
            <g transform="translate(25 99)">
              <path d="M0 0c10-3 17-1 22 4 5-5 12-7 22-4v35c-10-3-17-1-22 4-5-5-12-7-22-4z" fill="#f3e5b7" stroke="#6c563f" stroke-width="2"></path>
              <path d="M22 4v35" stroke="#6c563f" stroke-width="2"></path>
            </g>
          ` : `
            <g transform="translate(29 106)">
              <circle cx="18" cy="18" r="16" fill="#f7f4ee" stroke="#49677c" stroke-width="3"></circle>
              <path d="m13 24 4-14 8 11-12 3z" fill="#49677c"></path>
            </g>
          `}
        </g>
      </svg>
    `;
  }

  function suspectCard(person) {
    return `
      <article class="logic-suspect" data-suspect="${person.name}">
        <button class="logic-suspect-select" type="button" data-select-suspect="${person.name}" aria-label="Select ${person.name} as the key holder">
          ${studentPortrait(person)}
          <span class="logic-name">${person.name}</span>
          <span class="logic-select-copy">SELECT AS KEY HOLDER</span>
        </button>

        <div class="logic-evidence-strip">
          <div class="logic-evidence-item">
            <span class="logic-evidence-icon">${evidenceIcon(person.bagType)}</span>
            <span><small>BAG</small><strong>${person.bag}</strong></span>
          </div>
          <div class="logic-evidence-item">
            <span class="logic-evidence-icon">${evidenceIcon(person.itemType)}</span>
            <span><small>CARRYING</small><strong>${person.item}</strong></span>
          </div>
        </div>

        <div class="logic-fact-row">
          <span><small>SCARF</small><strong><i class="logic-colour-dot is-${person.scarfClass}"></i>${person.scarf}</strong></span>
          <span><small>LOCKER</small><strong class="logic-locker">${person.locker}</strong></span>
        </div>

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
                <span class="logic-clue-icon">${clueIcon(clue.icon)}</span>
                <div>
                  <small>${String(index + 1).padStart(2, "0")}</small>
                  <p>${clue.text}</p>
                </div>
              </li>
            `).join("")}
          </ol>

          <div class="logic-tip">
            <strong>Team tactic</strong>
            <span>Use “Mark eliminated” as you rule people out. Select the last person remaining, then submit.</span>
          </div>
        </aside>
      </div>
    `;

    const answerInput = document.getElementById("challengeAnswerInput");

    function refreshSelectedState() {
      const chosen = String(answerInput?.value || "").trim().toLowerCase();

      container.querySelectorAll(".logic-suspect").forEach(card => {
        const selected = card.dataset.suspect.toLowerCase() === chosen;
        card.classList.toggle("is-selected", selected);
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
          answerInput.dispatchEvent(new Event("input", { bubbles: true }));
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
    brief: "Use the illustrated CCTV cards and security notes to work out who has the key.",
    submission: {
      kind: "text",
      label: "Who has the emergency key?",
      placeholder: "Select a student or type their first name",
      enabled: true
    },
    render
  });
})();
