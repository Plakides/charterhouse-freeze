(() => {
  "use strict";

  // CONTENT FREEZE: Task 9A2
  // Solution: Amina · Seal: Snow Leopard · Code number: 4
  // Major visual/layout redesign is deliberately deferred to Phase 10.

  const suspects = Object.freeze([
    Object.freeze({
      name: "Amina",
      scarf: "Blue",
      bag: "Backpack",
      item: "Book",
      locker: "3",
      image: "assets/challenge-1/amina-card.png"
    }),
    Object.freeze({
      name: "Timur",
      scarf: "Blue",
      bag: "Backpack",
      item: "Compass",
      locker: "2",
      image: "assets/challenge-1/timur-card.png"
    }),
    Object.freeze({
      name: "Sofia",
      scarf: "Red",
      bag: "Backpack",
      item: "Book",
      locker: "3",
      image: "assets/challenge-1/sofia-card.png"
    }),
    Object.freeze({
      name: "Daniyar",
      scarf: "Blue",
      bag: "Satchel",
      item: "Compass",
      locker: "3",
      image: "assets/challenge-1/daniyar-card.png"
    })
  ]);

  const clues = Object.freeze([
    Object.freeze({ icon: "01", text: "The key holder is wearing a blue scarf." }),
    Object.freeze({ icon: "02", text: "The emergency key is inside a backpack, not a satchel." }),
    Object.freeze({ icon: "03", text: "The key holder’s locker number is odd." }),
    Object.freeze({ icon: "04", text: "The key holder is not carrying the compass." })
  ]);

  function suspectCard(person) {
    return `
      <article class="logic-suspect" data-suspect="${person.name}">
        <button class="logic-suspect-select" type="button" data-select-suspect="${person.name}" aria-label="Select ${person.name} as the key holder" aria-pressed="false">
          <img class="logic-student-card" src="${person.image}" alt="Evidence card for ${person.name}">
          <span class="logic-nameplate">${person.name}</span>
          <span class="logic-select-copy">Select this student</span>
        </button>

        <div class="logic-suspect-meta" aria-label="Quick summary for ${person.name}">
          <span><small>Scarf</small><strong>${person.scarf}</strong></span>
          <span><small>Bag</small><strong>${person.bag}</strong></span>
          <span><small>Carrying</small><strong>${person.item}</strong></span>
          <span><small>Locker</small><strong>${person.locker}</strong></span>
        </div>

        <div class="logic-suspect-actions">
          <button class="logic-view-card" type="button" data-view-suspect="${person.name}">Enlarge card</button>
          <button class="logic-eliminate" type="button" data-eliminate="${person.name}" aria-pressed="false">Mark eliminated</button>
        </div>
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
            <div class="logic-key-icon" aria-hidden="true">🔎</div>
          </div>

          <p class="logic-brief">
            Four students were seen near the emergency locker just before the heating system froze.
            Compare every evidence card with all four security notes. Eliminate anyone who fails even one clue,
            then select the only student left.
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
            ${clues.map(clue => `
              <li>
                <span class="logic-clue-icon">${clue.icon}</span>
                <p>${clue.text}</p>
              </li>
            `).join("")}
          </ol>

          <div class="logic-tip">
            <strong>Team strategy</strong>
            <span>Do not guess. Check one clue at a time and eliminate any student who fails it. Only one student should remain.</span>
          </div>
        </aside>
      </div>

      <div class="logic-lightbox" id="logicLightbox" hidden>
        <div class="logic-lightbox-backdrop" data-close-lightbox></div>
        <div class="logic-lightbox-panel" role="dialog" aria-modal="true" aria-label="Suspect evidence card enlarged view">
          <button class="logic-lightbox-close" type="button" data-close-lightbox aria-label="Close enlarged card">×</button>
          <img id="logicLightboxImage" src="" alt="">
          <div class="logic-lightbox-caption" id="logicLightboxCaption"></div>
        </div>
      </div>
    `;

    const answerInput = document.getElementById("challengeAnswerInput");
    const lightbox = document.getElementById("logicLightbox");
    const lightboxImage = document.getElementById("logicLightboxImage");
    const lightboxCaption = document.getElementById("logicLightboxCaption");

    function refreshSelectedState() {
      const chosen = String(answerInput?.value || "").trim().toLowerCase();
      container.querySelectorAll(".logic-suspect").forEach(card => {
        const selected = card.dataset.suspect.toLowerCase() === chosen;
        card.classList.toggle("is-selected", selected);

        const selectButton = card.querySelector("[data-select-suspect]");
        if (selectButton) {
          selectButton.setAttribute("aria-pressed", String(selected));
        }
      });
    }

    function openLightbox(person) {
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      lightboxImage.src = person.image;
      lightboxImage.alt = `Enlarged evidence card for ${person.name}`;
      lightboxCaption.textContent = `${person.name} · Scarf: ${person.scarf} · Bag: ${person.bag} · Carrying: ${person.item} · Locker: ${person.locker}`;
      lightbox.hidden = false;
      document.body.classList.add("modal-open");
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.hidden = true;
      document.body.classList.remove("modal-open");
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

    container.querySelectorAll("[data-view-suspect]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const person = suspects.find(suspect => suspect.name === button.dataset.viewSuspect);
        if (person) openLightbox(person);
      });
    });

    container.querySelectorAll("[data-close-lightbox]").forEach(button => {
      button.addEventListener("click", closeLightbox);
    });

    lightbox?.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !lightbox?.hidden) {
        closeLightbox();
      }
    });

    container.querySelectorAll("[data-eliminate]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const card = button.closest(".logic-suspect");
        if (!card) return;

        const eliminated = card.classList.toggle("is-eliminated");
        button.textContent = eliminated ? "Undo elimination" : "Mark eliminated";
        button.setAttribute("aria-pressed", String(eliminated));

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
    intro: "Four students. One emergency key. Four security clues.",
    brief: "Compare each evidence card with all four notes. Eliminate anyone who fails a clue, then select the only student left.",
    submission: {
      kind: "text",
      label: "Who has the emergency key?",
      placeholder: "Select a student or type their first name",
      enabled: true
    },
    render
  });
})();
