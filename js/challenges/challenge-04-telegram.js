(() => {
  "use strict";

  const challengeId = 4;
  const STORAGE_PREFIX = "charterhouseFreeze.v2.telegramHint.";

  const ciphertextLines = Object.freeze([
    "BPM PMIBQVO KWVBZWT ZWWU QA TWKSML.",
    "BPM XIAAEWZL QA EQVBMZ."
  ]);

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function loadHintState(teamId) {
    try {
      return localStorage.getItem(storageKey(teamId)) === "open";
    } catch {
      return false;
    }
  }

  function saveHintState(teamId, open) {
    try {
      localStorage.setItem(storageKey(teamId), open ? "open" : "closed");
    } catch {
      // Hint remains usable for this session.
    }
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    let hintOpen = loadHintState(teamId);

    container.classList.add("telegram-challenge-content");

    container.innerHTML = `
      <div class="telegram-puzzle">
        <section class="telegram-desk">
          <div class="telegram-desk-top">
            <div>
              <span class="telegram-kicker">CHARTERHOUSE SIGNAL OFFICE · INTERCEPT 04</span>
              <h3>Emergency Telegram</h3>
              <p>
                An encrypted message has arrived from the heating control room.
                Decode the entire telegram, then enter the password it contains.
              </p>
            </div>

            <div class="telegram-signal-badge" aria-label="Signal status">
              <span>RECEIVED</span>
              <strong>03:17</strong>
            </div>
          </div>

          <article class="telegram-sheet" aria-label="Encrypted telegram">
            <div class="telegram-sheet-header">
              <div>
                <span>TO</span>
                <strong>CHARTERHOUSE ALMATY · EMERGENCY CONTROL</strong>
              </div>
              <div>
                <span>PRIORITY</span>
                <strong>URGENT</strong>
              </div>
              <div>
                <span>CHANNEL</span>
                <strong>NORTH RELAY</strong>
              </div>
            </div>

            <div class="telegram-rule" aria-hidden="true"></div>

            <div class="telegram-cipher-block">
              <span>ENCRYPTED TRANSMISSION</span>

              <div class="telegram-ciphertext" aria-label="Ciphertext to decode">
                ${ciphertextLines.map(line => `<p>${line}</p>`).join("")}
              </div>
            </div>

            <div class="telegram-sheet-footer">
              <span>TRANSMISSION ENDS</span>
              <span>AUTHENTICATION: C4-TELEX</span>
            </div>

            <i class="telegram-stamp" aria-hidden="true">CIPHERED</i>
          </article>

          <div class="telegram-task-strip">
            <div>
              <span>YOUR TASK</span>
              <strong>Decode the whole message.</strong>
            </div>
            <p>
              The decoded telegram tells you exactly what word to submit.
              Spaces and punctuation have not been encrypted.
            </p>
          </div>
        </section>

        <aside class="telegram-side-panel">
          <section class="telegram-help-card">
            <span class="telegram-panel-kicker">STUCK?</span>
            <h3>Use a hint</h3>
            <p>
              There is one tool elsewhere in the game designed for this type
              of message.
            </p>

            <button
              type="button"
              class="button button-secondary telegram-hint-button"
              data-telegram-hint-button
              aria-expanded="${hintOpen}"
            >
              ${hintOpen ? "Hide hint" : "Show hint"}
            </button>

            <div
              class="telegram-hint"
              data-telegram-hint
              ${hintOpen ? "" : "hidden"}
            >
              <span>HINT</span>
              <strong>Open Field Kit → Caesar Shift.</strong>
              <p>
                Try different shift values until the message becomes readable.
              </p>

              <button
                type="button"
                class="telegram-open-tool"
                data-open-caesar
              >
                Open Caesar Shift tool
              </button>
            </div>
          </section>

          <section class="telegram-checklist">
            <span class="telegram-panel-kicker">MISSION CHECK</span>
            <h3>Before you submit</h3>

            <ol>
              <li><b>1</b><span>Decode both lines, not just the first word.</span></li>
              <li><b>2</b><span>Find the password named in the decoded message.</span></li>
              <li><b>3</b><span>Type only that password in the answer box below.</span></li>
            </ol>
          </section>
        </aside>
      </div>
    `;

    const hintButton = container.querySelector("[data-telegram-hint-button]");
    const hint = container.querySelector("[data-telegram-hint]");
    const openCaesar = container.querySelector("[data-open-caesar]");

    function renderHint() {
      hint.hidden = !hintOpen;
      hintButton.setAttribute("aria-expanded", String(hintOpen));
      hintButton.textContent = hintOpen ? "Hide hint" : "Show hint";
      saveHintState(teamId, hintOpen);
    }

    hintButton.addEventListener("click", () => {
      hintOpen = !hintOpen;
      renderHint();
    });

    openCaesar.addEventListener("click", () => {
      if (
        window.FREEZE_FIELD_KIT &&
        typeof window.FREEZE_FIELD_KIT.open === "function"
      ) {
        window.FREEZE_FIELD_KIT.open({ tool: "caesar" });
      }
    });

    renderHint();

    window.FREEZE_TELEGRAM = Object.freeze({
      ciphertext: [...ciphertextLines],
      showHint: () => {
        hintOpen = true;
        renderHint();
      },
      hideHint: () => {
        hintOpen = false;
        renderHint();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: challengeId,
    shortTitle: "TELEGRAM",
    title: "The Charterhouse Telegram",
    eyebrow: "CAESAR CIPHER",
    duration: "4–6 min",
    intro:
      "An emergency telegram has arrived from the heating control room — but every letter has been shifted.",
    brief:
      "Decode the whole telegram. If you get stuck, the hint will point you towards the right Field Kit tool.",
    submission: {
      kind: "text",
      label: "Telegram password",
      placeholder: "Enter the password from the decoded message",
      inputEnabled: true,
      enabled: true
    },
    render
  });
})();
