(() => {
  "use strict";

  const STORAGE_PREFIX = "charterhouseFreeze.v2.finalVault.";
  const ROUTE_LENGTH = 5;

  const clues = Object.freeze([
    Object.freeze({
      step: 1,
      text: "Begin at the highest place."
    }),
    Object.freeze({
      step: 2,
      text: "Next, choose something that can be opened without a key."
    }),
    Object.freeze({
      step: 3,
      text: "Then find the creature that leaves tracks in the snow."
    }),
    Object.freeze({
      step: 4,
      text: "Choose the object that pours but never drinks."
    }),
    Object.freeze({
      step: 5,
      text: "Finish beneath the wings of Kazakhstan."
    })
  ]);

  let mountedRoot = null;
  let previewTimers = [];

  function storageKey(teamId) {
    return `${STORAGE_PREFIX}${String(teamId || "unknown")}`;
  }

  function blankState() {
    return {
      route: Array(ROUTE_LENGTH).fill(null),
      code: "",
      selectedSealId: null
    };
  }

  function normaliseState(raw, validSealIds) {
    const state = blankState();

    if (!raw || typeof raw !== "object") return state;

    const route = Array.isArray(raw.route)
      ? raw.route.slice(0, ROUTE_LENGTH)
      : [];

    state.route = Array.from({ length: ROUTE_LENGTH }, (_, index) => {
      const value = Number(route[index]);
      return validSealIds.has(value) ? value : null;
    });

    // A recovered seal may only occupy one route step.
    const seen = new Set();
    state.route = state.route.map(value => {
      if (!value || seen.has(value)) return null;
      seen.add(value);
      return value;
    });

    state.code = String(raw.code || "")
      .replace(/\D/g, "")
      .slice(0, 5);

    const selected = Number(raw.selectedSealId);
    state.selectedSealId = validSealIds.has(selected) ? selected : null;

    return state;
  }

  function loadState(teamId, validSealIds) {
    try {
      const raw = localStorage.getItem(storageKey(teamId));
      return raw
        ? normaliseState(JSON.parse(raw), validSealIds)
        : blankState();
    } catch {
      return blankState();
    }
  }

  function saveState(teamId, state) {
    try {
      localStorage.setItem(storageKey(teamId), JSON.stringify(state));
    } catch {
      // The final vault remains usable in-memory if storage is unavailable.
    }
  }

  function sealIcon(symbol) {
    const common = 'viewBox="0 0 48 48" aria-hidden="true" focusable="false"';

    switch (symbol) {
      case "mountain":
        return `<svg ${common}><path d="M7 38 19 12l7 13 5-8 10 21H7Zm8-7 4-9 4 8m5 1 3-7"/></svg>`;
      case "book":
        return `<svg ${common}><path d="M8 11h14c4 0 6 2 6 6v21c-1-3-4-5-8-5H8V11Zm32 0H26c-4 0-6 2-6 6v21c1-3 4-5 8-5h12V11Z"/></svg>`;
      case "snow-leopard":
        return `<svg ${common}><path d="M13 31c-3-5-2-11 2-15 4-4 11-5 16-2 5 3 7 9 5 14-2 6-8 10-14 9-4 0-7-2-9-6Zm5-12 3 3m9-3-3 3M19 28c3 3 7 3 10 0M14 15l-3-5m23 5 3-5"/><circle cx="21" cy="25" r="1.2"/><circle cx="29" cy="25" r="1.2"/></svg>`;
      case "teapot":
        return `<svg ${common}><path d="M13 19h21v15c0 5-4 8-10 8s-11-3-11-8V19Zm4-5h13M20 10h8M34 23c7 0 9 3 9 7 0 3-2 6-7 6M13 24c-5-1-8-4-8-8 4 0 7 1 10 4"/></svg>`;
      case "eagle":
        return `<svg ${common}><path d="M24 19c-5-7-10-8-17-7 4 3 6 7 7 11-4-2-8-2-12-1 6 6 12 9 19 9l3 8 3-8c7 0 13-3 19-9-4-1-8-1-12 1 1-4 3-8 7-11-7-1-12 0-17 7Z"/></svg>`;
      case "snowflake":
        return `<svg ${common}><path d="M24 5v38M8 14l32 20M40 14 8 34M18 9l6 6 6-6M18 39l6-6 6 6M7 22l8 2-2 8M41 22l-8 2 2 8"/></svg>`;
      case "key":
        return `<svg ${common}><circle cx="16" cy="18" r="8"/><path d="m22 24 18 18m-7-9 5-5m-11 1 4-4"/></svg>`;
      case "compass":
        return `<svg ${common}><circle cx="24" cy="24" r="16"/><path d="m19 31 5-17 7 13-12 4Z"/><path d="M24 4v5M44 24h-5M24 44v-5M4 24h5"/></svg>`;
      default:
        return `<svg ${common}><circle cx="24" cy="24" r="15"/><path d="M15 24h18"/></svg>`;
    }
  }

  function sealById(seals, id) {
    return seals.find(seal => Number(seal.challengeId) === Number(id)) || null;
  }

  function displayCode(code) {
    const digits = String(code || "").split("");
    return Array.from({ length: 5 }, (_, index) => digits[index] || "•").join(" ");
  }

  function mount({ team } = {}) {
    const root = document.getElementById("finalVaultMount");
    if (!root || !team) return;

    unmount();
    mountedRoot = root;

    const seals = Array.isArray(team.seals)
      ? team.seals
          .map(seal => ({
            challengeId: Number(seal.challengeId),
            symbol: String(seal.symbol || ""),
            number: Number(seal.number),
            label: String(seal.label || "Seal")
          }))
          .filter(seal => Number.isInteger(seal.challengeId))
          .sort((a, b) => a.challengeId - b.challengeId)
      : [];

    const validSealIds = new Set(seals.map(seal => seal.challengeId));
    const teamId = team.teamId || "unknown";
    const state = loadState(teamId, validSealIds);

    function routeFilled() {
      return state.route.every(Boolean);
    }

    function usedSealIds() {
      return new Set(state.route.filter(Boolean));
    }

    function persist() {
      saveState(teamId, state);
    }

    function statusText() {
      const filled = state.route.filter(Boolean).length;

      if (routeFilled()) {
        return "Route complete. Read the five seal numbers in step order, then enter the restoration code.";
      }

      if (state.selectedSealId) {
        const seal = sealById(seals, state.selectedSealId);
        return `${seal?.label || "Seal"} selected. Choose a route slot.`;
      }

      return `${filled} / 5 route steps filled. Select a seal, then choose the matching clue slot.`;
    }

    function routeSlotMarkup(index) {
      const clue = clues[index];
      const seal = sealById(seals, state.route[index]);

      return `
        <article class="final-route-step${seal ? " is-filled" : ""}" data-route-step="${index}">
          <span class="final-route-step-number">${clue.step}</span>
          <div class="final-route-clue">
            <span>ROUTE CLUE ${clue.step}</span>
            <strong>${clue.text}</strong>
          </div>
          <button
            type="button"
            class="final-route-slot"
            data-route-slot="${index}"
            aria-label="${seal ? `Route step ${clue.step}: ${seal.label}, seal number ${seal.number}` : `Empty route step ${clue.step}`}"
          >
            ${seal ? `
              <span class="final-route-slot-icon">${sealIcon(seal.symbol)}</span>
              <span>
                <strong>${seal.label}</strong>
                <small>SEAL ${seal.number}</small>
              </span>
            ` : `
              <span class="final-route-slot-empty">PLACE SEAL</span>
            `}
          </button>
        </article>
      `;
    }

    function orbitSealMarkup(seal, index) {
      const used = usedSealIds().has(seal.challengeId);
      const selected = Number(state.selectedSealId) === seal.challengeId;

      return `
        <button
          type="button"
          class="vault-orbit-seal vault-orbit-pos-${index + 1}${used ? " is-docked" : ""}${selected ? " is-selected" : ""}"
          data-vault-seal="${seal.challengeId}"
          draggable="true"
          aria-pressed="${selected ? "true" : "false"}"
          aria-label="${seal.label} seal, number ${seal.number}${used ? ", already placed in the route" : ""}"
        >
          <span class="vault-orbit-icon">${sealIcon(seal.symbol)}</span>
          <strong>${seal.label}</strong>
          <b>${seal.number}</b>
        </button>
      `;
    }

    function keypadMarkup() {
      const keys = ["1","2","3","4","5","6","7","8","9","back","0","enter"];

      return keys.map(key => {
        if (key === "back") {
          return `
            <button type="button" class="final-keypad-key is-command" data-vault-key="back" ${routeFilled() ? "" : "disabled"} aria-label="Delete last digit">⌫</button>
          `;
        }

        if (key === "enter") {
          return `
            <button type="button" class="final-keypad-key is-enter" data-vault-key="enter" disabled aria-label="Verify code disabled until 9I-C">
              VERIFY
            </button>
          `;
        }

        return `
          <button type="button" class="final-keypad-key" data-vault-key="${key}" ${routeFilled() ? "" : "disabled"}>
            ${key}
          </button>
        `;
      }).join("");
    }

    function render() {
      if (!mountedRoot) return;

      const filled = routeFilled();

      root.innerHTML = `
        <section class="final-vault-experience${filled ? " is-route-filled" : ""}">
          <section class="final-route-builder">
            <header class="final-route-builder-header">
              <div>
                <span>EMERGENCY ROUTE · FIVE STEPS</span>
                <h3>Reconstruct the route.</h3>
                <p>
                  Select a recovered seal, then place it beside the clue it matches.
                  Seals can be moved at any time. The route itself is not checked.
                </p>
              </div>
              <button type="button" class="final-route-clear" data-vault-clear-route>
                Clear route
              </button>
            </header>

            <div class="final-route-sequence">
              <span class="final-route-trace" aria-hidden="true"></span>
              ${clues.map((_, index) => routeSlotMarkup(index)).join("")}
            </div>

            <div class="final-route-status" data-final-route-status role="status" aria-live="polite">
              ${statusText()}
            </div>

            <div class="final-vault-b-note">
              <strong>9I-B interface build</strong>
              <span>The route builder and keypad are live. Final code verification activates in 9I-C.</span>
            </div>
          </section>

          <section class="final-vault-machine" tabindex="0" aria-label="Emergency control vault and recovered seals">
            <div class="vault-machine-frost" aria-hidden="true"></div>
            <div class="vault-machine-cracks" aria-hidden="true"></div>
            <div class="vault-machine-warmth" aria-hidden="true"></div>

            <div class="vault-orbit" aria-label="Eight recovered seals">
              ${seals.map(orbitSealMarkup).join("")}
            </div>

            <div class="vault-door">
              <div class="vault-door-ring">
                <span class="vault-ring-marker marker-1"></span>
                <span class="vault-ring-marker marker-2"></span>
                <span class="vault-ring-marker marker-3"></span>
                <span class="vault-ring-marker marker-4"></span>

                <div class="vault-wheel">
                  <i class="vault-wheel-spoke spoke-1"></i>
                  <i class="vault-wheel-spoke spoke-2"></i>
                  <i class="vault-wheel-spoke spoke-3"></i>
                  <i class="vault-wheel-spoke spoke-4"></i>
                  <strong>V-01</strong>
                  <small>RESTORATION CONTROL</small>
                </div>
              </div>

              <div class="final-vault-code-display" tabindex="0" aria-label="Five digit restoration code">
                <span>${filled ? "ENTER RESTORATION CODE" : "COMPLETE ROUTE TO UNLOCK KEYPAD"}</span>
                <strong data-vault-code-display>${displayCode(state.code)}</strong>
              </div>

              <div class="final-vault-keypad" aria-label="Vault keypad">
                ${keypadMarkup()}
              </div>
            </div>

            <div class="vault-machine-status">
              <span>SECURITY VAULT · V-01</span>
              <strong>${filled ? "KEYPAD ACTIVE" : "ROUTE REQUIRED"}</strong>
            </div>

            <div class="vault-preview-overlay" data-vault-preview hidden>
              <div class="vault-preview-scene" aria-hidden="true"></div>
              <div class="vault-preview-paw" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
              <div class="vault-preview-copy">
                <span>EMERGENCY CONTROL</span>
                <h3>HEATING RESTORED</h3>
                <p>
                  Heating restored to an extravagant <strong>19°C</strong>.<br>
                  The snow leopard continues to deny involvement.
                </p>
                <button type="button" class="button button-secondary" data-vault-preview-reset>
                  Return to vault
                </button>
              </div>
            </div>
          </section>
        </section>
      `;

      bindInteractions();
    }

    function updateWithoutFullRender(message = null) {
      persist();
      render();

      if (message) {
        const status = root.querySelector("[data-final-route-status]");
        if (status) status.textContent = message;
      }
    }

    function selectSeal(id) {
      const sealId = Number(id);
      if (!validSealIds.has(sealId)) return;

      const existingIndex = state.route.findIndex(value => Number(value) === sealId);

      if (existingIndex >= 0) {
        state.route[existingIndex] = null;
        state.selectedSealId = sealId;
        state.code = "";
        updateWithoutFullRender(`${sealById(seals, sealId)?.label || "Seal"} lifted from step ${existingIndex + 1}. Choose a new slot.`);
        return;
      }

      state.selectedSealId =
        Number(state.selectedSealId) === sealId
          ? null
          : sealId;

      updateWithoutFullRender();
    }

    function placeSeal(slotIndex, sealId = state.selectedSealId) {
      const index = Number(slotIndex);
      const id = Number(sealId);

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= ROUTE_LENGTH ||
        !validSealIds.has(id)
      ) {
        return;
      }

      state.route = state.route.map(value => Number(value) === id ? null : value);
      state.route[index] = id;
      state.selectedSealId = null;
      state.code = "";

      updateWithoutFullRender(
        `${sealById(seals, id)?.label || "Seal"} placed at route step ${index + 1}.`
      );

      const slot = root.querySelector(`[data-route-step="${index}"]`);
      slot?.classList.add("is-just-docked");
      window.setTimeout(() => slot?.classList.remove("is-just-docked"), 450);
    }

    function liftSlot(slotIndex) {
      const index = Number(slotIndex);
      const currentId = Number(state.route[index]);

      if (!currentId) return;

      state.route[index] = null;
      state.selectedSealId = currentId;
      state.code = "";

      updateWithoutFullRender(
        `${sealById(seals, currentId)?.label || "Seal"} lifted from route step ${index + 1}.`
      );
    }

    function handleKeypad(key) {
      if (!routeFilled()) return;

      if (key === "back") {
        state.code = state.code.slice(0, -1);
        persist();
        const display = root.querySelector("[data-vault-code-display]");
        if (display) display.textContent = displayCode(state.code);
        return;
      }

      if (key === "enter") {
        return;
      }

      if (/^\d$/.test(key) && state.code.length < 5) {
        state.code += key;
        persist();

        const display = root.querySelector("[data-vault-code-display]");
        if (display) display.textContent = displayCode(state.code);
      }
    }

    function bindInteractions() {
      root.querySelectorAll("[data-vault-seal]")
        .forEach(button => {
          button.addEventListener("click", () => {
            selectSeal(button.dataset.vaultSeal);
          });

          button.addEventListener("dragstart", event => {
            event.dataTransfer?.setData("text/plain", button.dataset.vaultSeal);
            event.dataTransfer?.setData("application/x-freeze-seal", button.dataset.vaultSeal);
          });
        });

      root.querySelectorAll("[data-route-slot]")
        .forEach(button => {
          const slotIndex = Number(button.dataset.routeSlot);

          button.addEventListener("click", () => {
            if (state.selectedSealId) {
              placeSeal(slotIndex);
              return;
            }

            if (state.route[slotIndex]) {
              liftSlot(slotIndex);
            }
          });

          button.addEventListener("dragover", event => {
            event.preventDefault();
            button.classList.add("is-drag-target");
          });

          button.addEventListener("dragleave", () => {
            button.classList.remove("is-drag-target");
          });

          button.addEventListener("drop", event => {
            event.preventDefault();
            button.classList.remove("is-drag-target");
            const id =
              event.dataTransfer?.getData("application/x-freeze-seal") ||
              event.dataTransfer?.getData("text/plain");
            placeSeal(slotIndex, id);
          });
        });

      root.querySelector("[data-vault-clear-route]")
        ?.addEventListener("click", () => {
          const hasProgress = state.route.some(Boolean) || state.code;

          if (
            hasProgress &&
            !window.confirm("Clear the five-step route and keypad entry?")
          ) {
            return;
          }

          state.route = Array(ROUTE_LENGTH).fill(null);
          state.code = "";
          state.selectedSealId = null;
          updateWithoutFullRender("Route cleared.");
        });

      root.querySelectorAll("[data-vault-key]")
        .forEach(button => {
          button.addEventListener("click", () => {
            const key = button.dataset.vaultKey;
            button.classList.add("is-pressed");
            window.setTimeout(() => button.classList.remove("is-pressed"), 120);
            handleKeypad(key);
          });
        });

      const machine = root.querySelector(".final-vault-machine");
      machine?.addEventListener("keydown", event => {
        if (!routeFilled()) return;

        if (/^\d$/.test(event.key)) {
          event.preventDefault();
          handleKeypad(event.key);
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          handleKeypad("back");
        }
      });

      root.querySelector("[data-vault-preview-reset]")
        ?.addEventListener("click", resetPreview);
    }

    function clearPreviewTimers() {
      previewTimers.forEach(timer => window.clearTimeout(timer));
      previewTimers = [];
    }

    function resetPreview() {
      clearPreviewTimers();
      if (!mountedRoot) return;

      mountedRoot.querySelector(".final-vault-experience")
        ?.classList.remove("is-previewing");

      mountedRoot.querySelector(".final-vault-machine")
        ?.classList.remove("is-unlocking", "is-open");

      mountedRoot.querySelectorAll(".final-route-step, .vault-orbit-seal")
        .forEach(node => node.classList.remove("is-sequence-lit"));

      const overlay = mountedRoot.querySelector("[data-vault-preview]");
      if (overlay) overlay.hidden = true;
    }

    function previewVictory() {
      if (!mountedRoot || !state.route.every(Boolean)) {
        return {
          ok: false,
          message: "Fill all five route slots before previewing the victory animation."
        };
      }

      resetPreview();

      const experience = mountedRoot.querySelector(".final-vault-experience");
      const machine = mountedRoot.querySelector(".final-vault-machine");
      const overlay = mountedRoot.querySelector("[data-vault-preview]");
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

      experience?.classList.add("is-previewing");

      if (reduced) {
        machine?.classList.add("is-unlocking", "is-open");
        if (overlay) overlay.hidden = false;
        return { ok: true, reducedMotion: true };
      }

      state.route.forEach((sealId, index) => {
        previewTimers.push(window.setTimeout(() => {
          mountedRoot
            ?.querySelector(`[data-route-step="${index}"]`)
            ?.classList.add("is-sequence-lit");

          mountedRoot
            ?.querySelector(`[data-vault-seal="${sealId}"]`)
            ?.classList.add("is-sequence-lit");
        }, 280 + (index * 330)));
      });

      previewTimers.push(window.setTimeout(() => {
        machine?.classList.add("is-unlocking");
      }, 2050));

      previewTimers.push(window.setTimeout(() => {
        machine?.classList.add("is-open");
      }, 2900));

      previewTimers.push(window.setTimeout(() => {
        if (overlay) overlay.hidden = false;
      }, 3500));

      return { ok: true, reducedMotion: false };
    }

    render();

    window.FREEZE_FINAL_VAULT = Object.freeze({
      mount,
      unmount,
      getState: () => JSON.parse(JSON.stringify(state)),
      previewVictory,
      resetPreview
    });
  }

  function unmount() {
    previewTimers.forEach(timer => window.clearTimeout(timer));
    previewTimers = [];

    if (mountedRoot) {
      mountedRoot.classList.remove("is-previewing");
    }

    mountedRoot = null;
  }

  window.FREEZE_FINAL_VAULT = Object.freeze({
    mount,
    unmount,
    previewVictory: () => ({
      ok: false,
      message: "Open the Final Vault first."
    })
  });
})();
