(() => {
  "use strict";

  const challengeId = 8;
  const STORAGE_PREFIX = "charterhouseFreeze.v2.memoryTest.";
  const FIRST_LOOK_MS = 30_000;
  const REVIEW_MS = 10_000;

  const questions = Object.freeze(
    [
  {
    "number": 1,
    "prompt": "What colour was the scarf?",
    "options": [
      {
        "id": "blue",
        "label": "Blue",
        "digit": "6"
      },
      {
        "id": "red",
        "label": "Red",
        "digit": "1"
      },
      {
        "id": "green",
        "label": "Green",
        "digit": "8"
      },
      {
        "id": "white",
        "label": "White",
        "digit": "4"
      }
    ]
  },
  {
    "number": 2,
    "prompt": "What time was printed on the Medeu ticket?",
    "options": [
      {
        "id": "1830",
        "label": "18:30",
        "digit": "7"
      },
      {
        "id": "1945",
        "label": "19:45",
        "digit": "4"
      },
      {
        "id": "2015",
        "label": "20:15",
        "digit": "2"
      },
      {
        "id": "2100",
        "label": "21:00",
        "digit": "9"
      }
    ]
  },
  {
    "number": 3,
    "prompt": "Which direction was the compass pointing?",
    "options": [
      {
        "id": "north",
        "label": "North",
        "digit": "5"
      },
      {
        "id": "south",
        "label": "South",
        "digit": "1"
      },
      {
        "id": "east",
        "label": "East",
        "digit": "8"
      },
      {
        "id": "west",
        "label": "West",
        "digit": "6"
      }
    ]
  },
  {
    "number": 4,
    "prompt": "How much was on the Green Bazaar receipt?",
    "options": [
      {
        "id": "1800",
        "label": "1,800 ₸",
        "digit": "9"
      },
      {
        "id": "2400",
        "label": "2,400 ₸",
        "digit": "6"
      },
      {
        "id": "2800",
        "label": "2,800 ₸",
        "digit": "2"
      },
      {
        "id": "3200",
        "label": "3,200 ₸",
        "digit": "4"
      }
    ]
  },
  {
    "number": 5,
    "prompt": "What was written on the key tag?",
    "options": [
      {
        "id": "a215",
        "label": "A215",
        "digit": "8"
      },
      {
        "id": "a315",
        "label": "A315",
        "digit": "3"
      },
      {
        "id": "b315",
        "label": "B315",
        "digit": "5"
      },
      {
        "id": "a351",
        "label": "A351",
        "digit": "1"
      }
    ]
  },
  {
    "number": 6,
    "prompt": "Which object was in the lower-right corner?",
    "options": [
      {
        "id": "book",
        "label": "Book",
        "digit": "4"
      },
      {
        "id": "mug",
        "label": "Mug",
        "digit": "1"
      },
      {
        "id": "postcard",
        "label": "Kok Tobe postcard",
        "digit": "7"
      },
      {
        "id": "mitten",
        "label": "Mitten",
        "digit": "9"
      }
    ]
  }
].map(question =>
      Object.freeze({
        ...question,
        options: Object.freeze(
          question.options.map(option => Object.freeze(option))
        )
      })
    )
  );

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function blankState() {
    return {
      phase: "intro",
      firstLookStartedAt: null,
      firstLookEndsAt: null,
      secondLookUsed: false,
      reviewEndsAt: null,
      reviewKind: null,
      recoveryReviewCredits: 0,
      recoveryAvailableAt: null,
      selections: {}
    };
  }

  function normaliseState(raw) {
    const state = blankState();

    if (!raw || typeof raw !== "object") return state;

    const validPhases = new Set(["intro", "observe", "questions", "review"]);
    state.phase = validPhases.has(raw.phase) ? raw.phase : "intro";

    state.firstLookStartedAt =
      Number.isFinite(Number(raw.firstLookStartedAt))
        ? Number(raw.firstLookStartedAt)
        : null;

    state.firstLookEndsAt =
      Number.isFinite(Number(raw.firstLookEndsAt))
        ? Number(raw.firstLookEndsAt)
        : null;

    state.secondLookUsed = Boolean(raw.secondLookUsed);

    state.reviewEndsAt =
      Number.isFinite(Number(raw.reviewEndsAt))
        ? Number(raw.reviewEndsAt)
        : null;

    state.reviewKind =
      raw.reviewKind === "optional" || raw.reviewKind === "recovery"
        ? raw.reviewKind
        : null;

    state.recoveryReviewCredits = Math.max(
      0,
      Math.min(20, Math.floor(Number(raw.recoveryReviewCredits) || 0))
    );

    state.recoveryAvailableAt =
      Number.isFinite(Number(raw.recoveryAvailableAt))
        ? Number(raw.recoveryAvailableAt)
        : null;

    const selections = {};

    if (raw.selections && typeof raw.selections === "object") {
      questions.forEach(question => {
        const candidate = String(raw.selections[question.number] || "");
        if (question.options.some(option => option.id === candidate)) {
          selections[question.number] = candidate;
        }
      });
    }

    state.selections = selections;
    return state;
  }

  function loadState(teamId) {
    try {
      const raw = localStorage.getItem(storageKey(teamId));
      return raw ? normaliseState(JSON.parse(raw)) : blankState();
    } catch {
      return blankState();
    }
  }

  function saveState(teamId, state) {
    try {
      localStorage.setItem(storageKey(teamId), JSON.stringify(state));
    } catch {
      // Puzzle remains usable in memory if storage is unavailable.
    }
  }

  function clampExpiredState(state, now = Date.now()) {
    let changed = false;

    if (state.phase === "observe") {
      if (!state.firstLookEndsAt || now >= state.firstLookEndsAt) {
        state.phase = "questions";
        state.firstLookEndsAt = null;
        changed = true;
      }
    }

    if (state.phase === "review") {
      if (!state.reviewEndsAt || now >= state.reviewEndsAt) {
        state.phase = "questions";
        state.reviewEndsAt = null;
        state.reviewKind = null;
        changed = true;
      }
    }

    if (
      state.recoveryAvailableAt &&
      now >= state.recoveryAvailableAt
    ) {
      state.recoveryReviewCredits = Math.min(
        20,
        state.recoveryReviewCredits + 1
      );
      state.recoveryAvailableAt = null;
      changed = true;
    }

    return changed;
  }

  function evidenceDeskMarkup() {
    return `
      <div class="memory-desk" aria-label="Snow Leopard Security Desk">
        <article class="memory-evidence memory-evidence-scarf">
          <span class="memory-evidence-pin">01</span>
          <div class="memory-scarf" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <strong>BLUE SCARF</strong>
          <small>upper-left</small>
        </article>

        <article class="memory-evidence memory-evidence-ticket">
          <span class="memory-evidence-pin">02</span>
          <div class="memory-ticket-stub">
            <b>MEDEU</b>
            <span>ICE SESSION</span>
            <strong>19:45</strong>
          </div>
        </article>

        <article class="memory-evidence memory-evidence-book">
          <span class="memory-evidence-pin">03</span>
          <div class="memory-book">
            <span>CHARTERHOUSE</span>
            <strong>FLOREAT</strong>
          </div>
        </article>

        <article class="memory-evidence memory-evidence-receipt">
          <span class="memory-evidence-pin">04</span>
          <div class="memory-receipt-paper">
            <b>КӨК БАЗАР</b>
            <span>GREEN BAZAAR</span>
            <i></i>
            <strong>2,800 ₸</strong>
          </div>
        </article>

        <article class="memory-evidence memory-evidence-compass">
          <span class="memory-evidence-pin">05</span>
          <div class="memory-compass" aria-label="Compass pointing East">
            <span class="memory-n">N</span>
            <span class="memory-e">E</span>
            <span class="memory-s">S</span>
            <span class="memory-w">W</span>
            <i class="memory-needle"></i>
            <b></b>
          </div>
          <strong>COMPASS</strong>
        </article>

        <article class="memory-evidence memory-evidence-mitten">
          <span class="memory-evidence-pin">06</span>
          <div class="memory-mitten" aria-hidden="true"><span></span></div>
          <strong>RED MITTEN</strong>
          <small>beside compass</small>
        </article>

        <article class="memory-evidence memory-evidence-key">
          <span class="memory-evidence-pin">07</span>
          <div class="memory-key-wrap" aria-hidden="true">
            <div class="memory-key"><span></span><i></i></div>
            <b>A315</b>
          </div>
          <strong>BRASS KEY</strong>
        </article>

        <article class="memory-evidence memory-evidence-mug">
          <span class="memory-evidence-pin">08</span>
          <div class="memory-mug" aria-hidden="true">
            <span class="memory-paw">✣</span>
          </div>
          <strong>WHITE MUG</strong>
          <small>snow leopard paw</small>
        </article>

        <article class="memory-evidence memory-evidence-postcard">
          <span class="memory-evidence-pin">09</span>
          <div class="memory-postcard">
            <div class="memory-postcard-sky"></div>
            <div class="memory-postcard-hill"></div>
            <div class="memory-postcard-tower"></div>
            <strong>KOK TOBE</strong>
          </div>
          <small>lower-right</small>
        </article>
      </div>
    `;
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    const state = loadState(teamId);

    clampExpiredState(state);
    saveState(teamId, state);

    container.classList.add("memory-challenge-content");

    let timerId = null;

    function clearTimer() {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    }

    function setState(mutator) {
      mutator(state);
      saveState(teamId, state);
      renderStage();
    }

    function startFirstLook() {
      const now = Date.now();
      if (state.phase !== "intro") return;

      setState(current => {
        current.phase = "observe";
        current.firstLookStartedAt = now;
        current.firstLookEndsAt = now + FIRST_LOOK_MS;
      });
    }

    function startReview(kind) {
      const now = Date.now();

      if (state.phase !== "questions") return false;

      if (kind === "optional") {
        if (state.secondLookUsed) return false;
        state.secondLookUsed = true;
      } else if (kind === "recovery") {
        if (state.recoveryReviewCredits <= 0) return false;
        state.recoveryReviewCredits -= 1;
      } else {
        return false;
      }

      state.phase = "review";
      state.reviewKind = kind;
      state.reviewEndsAt = now + REVIEW_MS;
      saveState(teamId, state);
      renderStage();
      return true;
    }

    function grantRecoveryReview() {
      clampExpiredState(state);
      state.recoveryReviewCredits = Math.min(20, state.recoveryReviewCredits + 1);
      state.recoveryAvailableAt = null;
      saveState(teamId, state);

      if (state.phase === "questions") {
        renderStage();
      }

      return state.recoveryReviewCredits;
    }

    function scheduleRecoveryReview(availableAt) {
      const timestamp = Number(availableAt);

      if (!Number.isFinite(timestamp)) return false;

      state.recoveryAvailableAt = Math.max(Date.now(), timestamp);
      saveState(teamId, state);

      if (clampExpiredState(state)) {
        saveState(teamId, state);
      }

      if (state.phase === "questions") {
        renderStage();
      }

      return true;
    }

    function unlockPendingRecoveryReview() {
      const changed = clampExpiredState(state);
      if (changed) {
        saveState(teamId, state);
      }

      if (state.phase === "questions") {
        renderStage();
      }

      return state.recoveryReviewCredits;
    }

    function selectOption(questionNumber, optionId) {
      state.selections[questionNumber] = optionId;
      saveState(teamId, state);

      const questionCard = container.querySelector(
        `[data-memory-question="${questionNumber}"]`
      );

      questionCard?.querySelectorAll("[data-memory-option]")
        .forEach(button => {
          const selected = button.dataset.memoryOption === optionId;
          button.classList.toggle("is-selected", selected);
          button.setAttribute("aria-pressed", String(selected));
        });

      updateQuestionProgress();
    }

    function selectedCount() {
      return questions.reduce(
        (count, question) => count + (state.selections[question.number] ? 1 : 0),
        0
      );
    }

    function updateQuestionProgress() {
      const progress = container.querySelector("[data-memory-question-progress]");
      if (progress) {
        progress.textContent = `${selectedCount()} / 6 answered`;
      }
    }

    function countdownSeconds(endAt) {
      return Math.max(0, Math.ceil((Number(endAt) - Date.now()) / 1000));
    }

    function updateCountdown() {
      if (!container.isConnected) {
        clearTimer();
        return;
      }

      const now = Date.now();

      if (clampExpiredState(state, now)) {
        saveState(teamId, state);
        renderStage();
        return;
      }

      const timer = container.querySelector("[data-memory-countdown]");
      if (!timer) return;

      const endAt =
        state.phase === "observe"
          ? state.firstLookEndsAt
          : state.phase === "review"
            ? state.reviewEndsAt
            : null;

      if (!endAt) return;

      const seconds = countdownSeconds(endAt);
      timer.textContent = String(seconds).padStart(2, "0");

      const shell = container.querySelector(".memory-observation-shell");
      shell?.classList.toggle("is-urgent", seconds <= 5);
    }

    function observationMarkup(isReview) {
      const seconds =
        state.phase === "observe"
          ? countdownSeconds(state.firstLookEndsAt)
          : countdownSeconds(state.reviewEndsAt);

      const label = isReview
        ? state.reviewKind === "recovery"
          ? "RECOVERY REVIEW"
          : "SECOND LOOK"
        : "FIRST LOOK";

      const copy = isReview
        ? "Check only the details your team was unsure about. The desk will freeze again automatically."
        : "Memorise colours, words, numbers, positions and directions. You will not keep the desk open.";

      return `
        <section class="memory-observation-shell">
          <header class="memory-observation-header">
            <div>
              <span class="memory-kicker">${label} · SECURITY DESK</span>
              <h3>Observe carefully.</h3>
              <p>${copy}</p>
            </div>

            <div class="memory-countdown-card" aria-live="polite">
              <span>TIME LEFT</span>
              <strong data-memory-countdown>${String(seconds).padStart(2, "0")}</strong>
              <small>seconds</small>
            </div>
          </header>

          ${evidenceDeskMarkup()}

          <div class="memory-observation-footer">
            <span>NUMBERS</span>
            <span>OBJECTS</span>
            <span>WORDS</span>
            <span>POSITIONS</span>
          </div>
        </section>
      `;
    }

    function questionCardMarkup(question) {
      const selected = state.selections[question.number] || "";

      return `
        <article class="memory-question-card" data-memory-question="${question.number}">
          <header>
            <span>Q${question.number}</span>
            <strong>${question.prompt}</strong>
          </header>

          <div class="memory-option-grid">
            ${question.options.map(option => `
              <button
                type="button"
                class="memory-option${selected === option.id ? " is-selected" : ""}"
                data-memory-option="${option.id}"
                data-memory-question-number="${question.number}"
                aria-pressed="${selected === option.id ? "true" : "false"}"
              >
                <span>${option.label}</span>
                <b aria-label="Vault digit ${option.digit}">${option.digit}</b>
              </button>
            `).join("")}
          </div>
        </article>
      `;
    }

    function questionsMarkup() {
      clampExpiredState(state);
      const optionalReviewAvailable = !state.secondLookUsed;
      const recoveryAvailable = state.recoveryReviewCredits > 0;
      const recoveryPending =
        Boolean(state.recoveryAvailableAt) &&
        Date.now() < Number(state.recoveryAvailableAt);

      let reviewButton = `
        <button
          type="button"
          class="button button-secondary memory-review-button"
          disabled
        >
          SECOND LOOK USED
        </button>
      `;

      if (recoveryAvailable) {
        reviewButton = `
          <button
            type="button"
            class="button button-secondary memory-review-button"
            data-memory-review="recovery"
          >
            RECOVERY REVIEW · 10 SECONDS
          </button>
        `;
      } else if (optionalReviewAvailable) {
        reviewButton = `
          <button
            type="button"
            class="button button-secondary memory-review-button"
            data-memory-review="optional"
          >
            SECOND LOOK · 10 SECONDS
          </button>
        `;
      }

      const reviewHeading = recoveryAvailable
        ? "A recovery review is available."
        : recoveryPending
          ? "Recovery review unlocks when the penalty ends."
          : optionalReviewAvailable
            ? "Your team has one optional second look."
            : "No optional second look remains.";

      const reviewCopy = recoveryAvailable
        ? "Use the 10-second review, then try the final code again."
        : recoveryPending
          ? "You can change your answers while the 30-second penalty counts down."
          : "A wrong final code will never lock you out: after the normal penalty, another 10-second recovery review becomes available.";

      return `
        <section class="memory-questions-shell">
          <header class="memory-questions-header">
            <div>
              <span class="memory-kicker">MEMORY CHECK · NO INDIVIDUAL MARKING</span>
              <h3>What did the snow leopard leave on the desk?</h3>
              <p>
                Choose one answer for each question. Every option carries a vault digit.
                The system will not tell you which choices are right.
              </p>
            </div>

            <div class="memory-question-progress" data-memory-question-progress>
              ${selectedCount()} / 6 answered
            </div>
          </header>

          <div class="memory-question-grid">
            ${questions.map(questionCardMarkup).join("")}
          </div>

          <section class="memory-final-strip">
            <div>
              <span>FINAL STEP</span>
              <strong>Read the vault digit on your answer to Q1 → Q6.</strong>
              <p>
                Enter those six digits in order in the security-code box below.
                Your selected answers are not checked individually.
              </p>
            </div>

            <div class="memory-code-slots" aria-label="Six final code positions">
              ${[1,2,3,4,5,6].map(number => `
                <span>
                  <b>Q${number}</b>
                  <i>?</i>
                </span>
              `).join("")}
            </div>
          </section>

          <div class="memory-review-row">
            <div>
              <strong>${reviewHeading}</strong>
              <span>${reviewCopy}</span>
            </div>
            ${reviewButton}
          </div>

        </section>
      `;
    }

    function introMarkup() {
      return `
        <section class="memory-intro-shell">
          <div class="memory-intro-copy">
            <span class="memory-kicker">SNOW LEOPARD SECURITY PROTOCOL</span>
            <h3>Thirty seconds. Nine pieces of evidence.</h3>
            <p>
              When you begin, the security desk appears for exactly 30 seconds.
              Memorise as much as your team can before it freezes over.
            </p>

            <div class="memory-role-grid">
              <span><b>1</b> Numbers</span>
              <span><b>2</b> Objects</span>
              <span><b>3</b> Words</span>
              <span><b>4</b> Positions</span>
            </div>

            <button
              type="button"
              class="button button-primary memory-begin-button"
              data-memory-begin
            >
              BEGIN MEMORY TEST
            </button>
          </div>

          <aside class="memory-intro-rules">
            <span>HOW IT WORKS</span>
            <ol>
              <li>Study the desk for <strong>30 seconds</strong>.</li>
              <li>Answer six memory questions.</li>
              <li>Every answer option has a small vault digit.</li>
              <li>Read the six chosen digits in Q1 → Q6 order.</li>
            </ol>

            <div class="memory-safety-rule">
              <strong>You cannot get permanently stuck.</strong>
              <span>
                You get one optional 10-second second look. Each wrong final code
                unlocks another 10-second recovery review after the normal
                30-second penalty.
              </span>
            </div>
          </aside>
        </section>
      `;
    }

    function renderStage() {
      clearTimer();
      clampExpiredState(state);
      saveState(teamId, state);

      container.classList.remove(
        "is-memory-intro",
        "is-memory-observe",
        "is-memory-questions",
        "is-memory-review"
      );
      container.classList.add(`is-memory-${state.phase}`);

      if (state.phase === "intro") {
        container.innerHTML = introMarkup();
        container.querySelector("[data-memory-begin]")
          ?.addEventListener("click", startFirstLook);
        return;
      }

      if (state.phase === "observe" || state.phase === "review") {
        container.innerHTML = observationMarkup(state.phase === "review");
        updateCountdown();
        timerId = window.setInterval(updateCountdown, 200);
        return;
      }

      container.innerHTML = questionsMarkup();

      container.querySelectorAll("[data-memory-option]")
        .forEach(button => {
          button.addEventListener("click", () => {
            selectOption(
              Number(button.dataset.memoryQuestionNumber),
              button.dataset.memoryOption
            );
          });
        });

      container.querySelector("[data-memory-review]")
        ?.addEventListener("click", event => {
          startReview(event.currentTarget.dataset.memoryReview);
        });

      updateQuestionProgress();
    }

    renderStage();

    window.FREEZE_MEMORY_TEST = Object.freeze({
      getState: () => JSON.parse(JSON.stringify(state)),
      grantRecoveryReview,
      scheduleRecoveryReview,
      unlockPendingRecoveryReview,
      startRecoveryReview: () => startReview("recovery"),
      resetForTesting: () => {
        Object.assign(state, blankState());
        saveState(teamId, state);
        renderStage();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: challengeId,
    shortTitle: "MEMORY",
    title: "The Snow Leopard’s Memory Test",
    eyebrow: "OBSERVATION · TEAM MEMORY",
    duration: "6–8 min",
    intro:
      "The snow leopard has left nine pieces of evidence on a security desk. Study them before the desk freezes over.",
    brief:
      "Divide the observation work across your team: numbers, objects, words and positions. Memory affects your time, never whether you can finish the game.",
    submission: {
      kind: "text",
      label: "Six-digit vault code",
      placeholder: "Enter the six vault digits",
      inputEnabled: true,
      enabled: true,
      onWrongAnswer: ({ cooldownUntil }) => {
        window.FREEZE_MEMORY_TEST?.scheduleRecoveryReview?.(cooldownUntil);
      },
      onCooldownExpired: () => {
        window.FREEZE_MEMORY_TEST?.unlockPendingRecoveryReview?.();
      }
    },
    render
  });
})();
