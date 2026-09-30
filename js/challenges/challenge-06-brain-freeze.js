(() => {
  "use strict";

  const challengeId = 6;
  const HINT_PREFIX = "charterhouseFreeze.v2.brainFreezeHint.";

  function hintKey(teamId) {
    return `${HINT_PREFIX}${String(teamId || "unknown")}`;
  }

  function loadHint(teamId) {
    try {
      return localStorage.getItem(hintKey(teamId)) === "open";
    } catch {
      return false;
    }
  }

  function saveHint(teamId, open) {
    try {
      localStorage.setItem(hintKey(teamId), open ? "open" : "closed");
    } catch {
      // Hint remains usable in-session if storage is unavailable.
    }
  }

  function mittenSvg() {
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M25 50c-8-4-12-10-12-18V18c0-3 2-5 5-5s5 2 5 5v9-14c0-3 2-5 5-5s5 2 5 5v14-11c0-3 2-5 5-5s5 2 5 5v13-7c0-3 2-5 5-5s5 2 5 5v14c0 10-7 18-17 18H25Z"/>
        <path d="M13 27c-4-5-9-4-10 0-1 5 4 10 10 14"/>
      </svg>
    `;
  }

  function mugSvg() {
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 20h35v24c0 7-5 12-12 12H24c-7 0-12-5-12-12V20Z"/>
        <path d="M47 25h5c6 0 9 4 9 9s-3 9-9 9h-5"/>
        <path d="M23 12c0 4-3 5-3 8M33 10c0 4-3 5-3 8M43 12c0 4-3 5-3 8"/>
      </svg>
    `;
  }

  function snowflakeSvg() {
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 6v52M10 19l44 26M10 45l44-26"/>
        <path d="M25 12l7 7 7-7M25 52l7-7 7 7"/>
        <path d="M13 27l10-2-3-9M51 37l-10 2 3 9"/>
        <path d="M13 37l10 2-3 9M51 27l-10-2 3-9"/>
      </svg>
    `;
  }

  function symbolMarkup(kind, label) {
    const icon = kind === "mitten"
      ? mittenSvg()
      : kind === "mug"
        ? mugSvg()
        : snowflakeSvg();

    return `
      <span class="brain-symbol brain-symbol-${kind}" aria-label="${label}">
        ${icon}
      </span>
    `;
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    let hintOpen = loadHint(teamId);

    container.classList.add("brain-freeze-challenge-content");

    container.innerHTML = `
      <div class="brain-freeze-puzzle">
        <section class="brain-freeze-console">
          <div class="brain-freeze-header">
            <div>
              <span class="brain-freeze-kicker">COGNITIVE DEFROST PROTOCOL · TEST 06</span>
              <h3>Brain Freeze</h3>
              <p>
                Four frozen logic panels are blocking the system. Solve each
                panel, then enter the four answers in order: A → B → C → D.
              </p>
            </div>

            <div class="brain-freeze-status">
              <span>CORE TEMP</span>
              <strong>−18°C</strong>
            </div>
          </div>

          <div class="brain-freeze-grid">
            <article class="brain-panel brain-panel-a">
              <div class="brain-panel-heading">
                <span class="brain-panel-letter">A</span>
                <div>
                  <small>FROZEN SEQUENCE</small>
                  <h4>What comes next?</h4>
                </div>
              </div>

              <div class="brain-sequence" aria-label="1, 1, 2, 3, 5, question mark">
                <b>1</b>
                <i>·</i>
                <b>1</b>
                <i>·</i>
                <b>2</b>
                <i>·</i>
                <b>3</b>
                <i>·</i>
                <b>5</b>
                <i>·</i>
                <b class="is-question">?</b>
              </div>

              <p class="brain-panel-instruction">
                Record the missing number as digit A.
              </p>
            </article>

            <article class="brain-panel brain-panel-b">
              <div class="brain-panel-heading">
                <span class="brain-panel-letter">B</span>
                <div>
                  <small>WINTER SUPPLIES</small>
                  <h4>Find the snowflake</h4>
                </div>
              </div>

              <div class="brain-equations">
                <div class="brain-equation-row">
                  ${symbolMarkup("mitten", "Mitten")}
                  <span>+</span>
                  ${symbolMarkup("mitten", "Mitten")}
                  <span>+</span>
                  ${symbolMarkup("mitten", "Mitten")}
                  <strong>= 18</strong>
                </div>

                <div class="brain-equation-row">
                  ${symbolMarkup("mitten", "Mitten")}
                  <span>+</span>
                  ${symbolMarkup("mug", "Mug")}
                  <span>+</span>
                  ${symbolMarkup("mug", "Mug")}
                  <strong>= 14</strong>
                </div>

                <div class="brain-equation-row">
                  ${symbolMarkup("mug", "Mug")}
                  <span>+</span>
                  ${symbolMarkup("snowflake", "Snowflake")}
                  <strong>= 7</strong>
                </div>

                <div class="brain-equation-row is-question">
                  ${symbolMarkup("snowflake", "Snowflake")}
                  <strong>= ?</strong>
                </div>
              </div>

              <p class="brain-panel-instruction">
                All matching symbols have the same value.
              </p>
            </article>

            <article class="brain-panel brain-panel-c">
              <div class="brain-panel-heading">
                <span class="brain-panel-letter">C</span>
                <div>
                  <small>NUMBER GRID</small>
                  <h4>Use the same rule</h4>
                </div>
              </div>

              <div class="brain-number-grid" aria-label="Number pattern grid">
                <div><span>1</span><span>4</span><b>4</b></div>
                <div><span>2</span><span>3</span><b>6</b></div>
                <div><span>3</span><span>2</span><b class="is-question">?</b></div>
              </div>

              <p class="brain-panel-instruction">
                The same rule is used on every row. What replaces ?
              </p>
            </article>

            <article class="brain-panel brain-panel-d">
              <div class="brain-panel-heading">
                <span class="brain-panel-letter">D</span>
                <div>
                  <small>BRAIN FREEZE RIDDLE</small>
                  <h4>Name the number</h4>
                </div>
              </div>

              <blockquote class="brain-riddle">
                <p>I am an odd number.</p>
                <p>Remove one letter and I become even.</p>
                <p>What number am I?</p>
              </blockquote>

              <button
                type="button"
                class="button button-secondary brain-hint-button"
                data-brain-hint-button
                aria-expanded="${hintOpen}"
              >
                ${hintOpen ? "Hide riddle hint" : "Show riddle hint"}
              </button>

              <div
                class="brain-riddle-hint"
                data-brain-riddle-hint
                ${hintOpen ? "" : "hidden"}
              >
                <strong>Hint:</strong>
                Think about how number names are spelled in English.
              </div>
            </article>
          </div>

          <div class="brain-code-strip">
            <div>
              <span>DEFROST CODE</span>
              <strong>A → B → C → D</strong>
            </div>

            <p>
              Solve all four panels. Enter the four answers in that order
              using digits only.
            </p>

            <div class="brain-code-slots" aria-hidden="true">
              <span>A</span>
              <span>B</span>
              <span>C</span>
              <span>D</span>
            </div>
          </div>
        </section>

        <aside class="brain-freeze-side">
          <section class="brain-freeze-brief">
            <span>MISSION BRIEF</span>
            <h3>Split the work</h3>
            <p>
              Each panel can be solved independently. Give one panel to each
              teammate, then combine your four answers.
            </p>

            <ol>
              <li><b>A</b><span>Sequence</span></li>
              <li><b>B</b><span>Symbols</span></li>
              <li><b>C</b><span>Number grid</span></li>
              <li><b>D</b><span>Riddle</span></li>
            </ol>
          </section>

          <section class="brain-freeze-rules">
            <span>IMPORTANT</span>
            <h3>No panel checks</h3>
            <p>
              The system will not tell you whether A, B, C or D is correct.
              Check your team’s reasoning before submitting the final code.
            </p>
          </section>

          <section class="brain-freeze-final">
            <span>FINAL SUBMISSION</span>
            <h3>Four digits only</h3>
            <p>
              Enter A, then B, then C, then D in the answer box below.
            </p>
          </section>

          <div class="brain-freeze-b-stage-note">
            <strong>9F-B interface build</strong>
            <span>
              The code field below is typeable for testing. Submit activates in 9F-C.
            </span>
          </div>
        </aside>
      </div>
    `;

    const hintButton = container.querySelector("[data-brain-hint-button]");
    const hint = container.querySelector("[data-brain-riddle-hint]");

    function renderHint() {
      hint.hidden = !hintOpen;
      hintButton.setAttribute("aria-expanded", String(hintOpen));
      hintButton.textContent = hintOpen
        ? "Hide riddle hint"
        : "Show riddle hint";
      saveHint(teamId, hintOpen);
    }

    hintButton.addEventListener("click", () => {
      hintOpen = !hintOpen;
      renderHint();
    });

    renderHint();

    window.FREEZE_BRAIN_FREEZE = Object.freeze({
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
    shortTitle: "BRAIN FREEZE",
    title: "Brain Freeze",
    eyebrow: "FOUR-PART LOGIC TEST",
    duration: "5–7 min",
    intro:
      "Four frozen logic panels are blocking the control system. Solve each one, then combine the answers into a four-digit defrost code.",
    brief:
      "Solve A, B, C and D independently. The system gives no panel-by-panel correctness feedback.",
    submission: {
      kind: "text",
      label: "Four-digit defrost code",
      placeholder: "Enter A B C D as four digits",
      inputEnabled: true,
      enabled: false
    },
    render
  });
})();
