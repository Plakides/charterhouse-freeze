(() => {
  "use strict";

  const challengeId = 2;
  const routeStoragePrefix = "charterhouseFreeze.v2.almatyRoute.";

  const locations = Object.freeze([
    Object.freeze({
      id: "arbat",
      name: "Arbat / Panfilov St",
      short: "Arbat",
      image: "assets/challenge-2/arbat-panfilov-street.png",
      x: 12, y: 13
    }),
    Object.freeze({
      id: "astana",
      name: "Astana Square",
      short: "Astana Sq",
      image: "assets/challenge-2/astana-square.png",
      x: 34, y: 12
    }),
    Object.freeze({
      id: "panfilov",
      name: "Panfilov Park",
      short: "Panfilov",
      image: "assets/challenge-2/panfilov-park.png",
      x: 57, y: 12
    }),
    Object.freeze({
      id: "green",
      name: "Green Bazaar",
      short: "Green Bazaar",
      image: "assets/challenge-2/green-bazaar.png",
      x: 81, y: 18
    }),
    Object.freeze({
      id: "stadium",
      name: "Central Stadium",
      short: "Stadium",
      image: "assets/challenge-2/central-stadium.png",
      x: 10, y: 45
    }),
    Object.freeze({
      id: "republic",
      name: "Republic Square",
      short: "Republic Sq",
      image: "assets/challenge-2/republic-square.png",
      x: 31, y: 44
    }),
    Object.freeze({
      id: "abai",
      name: "Abai Square",
      short: "Abai Sq",
      image: "assets/challenge-2/abai-square.png",
      x: 56, y: 44
    }),
    Object.freeze({
      id: "hotel",
      name: "Hotel Kazakhstan",
      short: "Hotel Kazakhstan",
      image: "assets/challenge-2/hotel-kazakhstan.png",
      x: 82, y: 44
    }),
    Object.freeze({
      id: "botanical",
      name: "Botanical Gardens",
      short: "Botanical",
      image: "assets/challenge-2/botanical-gardens.png",
      x: 11, y: 73
    }),
    Object.freeze({
      id: "museum",
      name: "Central State Museum",
      short: "State Museum",
      image: "assets/challenge-2/central-state-museum.png",
      x: 35, y: 73
    }),
    Object.freeze({
      id: "koktobe",
      name: "Kok Tobe",
      short: "Kok Tobe",
      image: "assets/challenge-2/kok-tobe.png",
      x: 81, y: 72
    }),
    Object.freeze({
      id: "medeu",
      name: "Medeu",
      short: "Medeu",
      image: "assets/challenge-2/medeu.png",
      x: 81, y: 87
    })
  ]);

  const byId = new Map(locations.map(location => [location.id, location]));

  const roads = Object.freeze([
    ["arbat", "astana"],
    ["astana", "panfilov"],
    ["panfilov", "green"],
    ["arbat", "stadium"],
    ["astana", "republic"],
    ["panfilov", "abai"],
    ["green", "hotel"],
    ["stadium", "republic"],
    ["republic", "abai"],
    ["abai", "hotel"],
    ["stadium", "botanical"],
    ["republic", "museum"],
    ["abai", "museum"],
    ["botanical", "museum"],
    ["museum", "koktobe"],
    ["koktobe", "medeu"]
  ]);

  const blockedRoad = Object.freeze(["hotel", "koktobe"]);

  const correctRoute = Object.freeze([
    "abai",
    "republic",
    "astana",
    "panfilov",
    "green",
    "hotel",
    "abai",
    "museum",
    "koktobe",
    "medeu"
  ]);

  // Internal completion proof. Students never type this.
  // It is validated through the same hashed offline answer engine as Challenge 01.
  const completionProof =
    "almaty-route:abai>republic>astana>panfilov>green>hotel>abai>museum>koktobe>medeu";

  const directions = Object.freeze([
    "Start at Abai Square, facing SOUTH towards the mountains. Turn RIGHT and travel one road.",
    "Face NORTH. Travel one road. Turn RIGHT and travel one more road.",
    "Continue EAST to the next landmark.",
    "Turn RIGHT. Travel SOUTH one road to the tall city landmark.",
    "The road straight ahead is CLOSED BY ICE. Do not reverse. Turn RIGHT instead and travel one road.",
    "You have been here before. Do NOT use the road from Step 1. Take the diagonal road heading SOUTH-WEST.",
    "Leave the museum heading EAST towards the mountains. Continue to the next mountain landmark.",
    "Face SOUTH. Follow the mountain road to the final location."
  ]);

  function keyFor(teamId) {
    return `${routeStoragePrefix}${String(teamId || "unknown")}`;
  }

  function loadState(teamId) {
    const fallback = { route: ["abai"], verified: false };

    try {
      const raw = localStorage.getItem(keyFor(teamId));
      if (!raw) return fallback;

      const parsed = JSON.parse(raw);
      const route = Array.isArray(parsed?.route)
        ? parsed.route.filter(id => byId.has(id))
        : ["abai"];

      if (!route.length || route[0] !== "abai") {
        route.unshift("abai");
      }

      return {
        route: route.slice(0, 20),
        verified: Boolean(parsed?.verified)
      };
    } catch {
      return fallback;
    }
  }

  function saveState(teamId, state) {
    try {
      localStorage.setItem(
        keyFor(teamId),
        JSON.stringify({
          route: state.route,
          verified: Boolean(state.verified)
        })
      );
    } catch {
      // The puzzle still works in-memory if storage is unavailable.
    }
  }

  function routeMatches(route) {
    if (route.length !== correctRoute.length) return false;
    return correctRoute.every((id, index) => route[index] === id);
  }

  function lineFor(aId, bId, className = "almaty-road") {
    const a = byId.get(aId);
    const b = byId.get(bId);

    return `
      <line
        class="${className}"
        x1="${a.x}" y1="${a.y}"
        x2="${b.x}" y2="${b.y}"
      />
    `;
  }

  function render(container, context) {
    const team = context?.team || {};
    const teamId = team.teamId || "unknown";
    const cooldown = window.FREEZE_COOLDOWN;
    const state = loadState(teamId);
    const alreadyCompleted =
      Array.isArray(team.completed) &&
      team.completed.map(Number).includes(challengeId);

    // 9B-C allowed route verification before the seal was wired in.
    // Preserve the route, but require one fresh Check route click in 9B-D.
    if (state.verified && !alreadyCompleted) {
      state.verified = false;
      saveState(teamId, state);
    }

    let penaltyTimer = null;

    container.classList.add("almaty-challenge-content");

    container.innerHTML = `
      <div class="almaty-puzzle">
        <section class="almaty-map-panel" aria-label="Stylised Almaty mission map">
          <header class="almaty-map-heading">
            <div>
              <span>MISSION MAP · NOT TO SCALE</span>
              <h3>Navigate Almaty</h3>
            </div>
            <div class="almaty-facing-note">
              <span class="almaty-compass-mini" aria-hidden="true">N</span>
              <strong>SOUTH = MOUNTAINS</strong>
            </div>
          </header>

          <div class="almaty-map" data-almaty-map>
            <div class="almaty-mountains" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </div>

            <svg
              class="almaty-road-layer"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              ${roads.map(([a,b]) => lineFor(a,b)).join("")}
              ${lineFor(blockedRoad[0], blockedRoad[1], "almaty-road is-blocked")}
              <polyline
                class="almaty-route-line"
                data-route-line
                points=""
              />
            </svg>

            <div class="almaty-blocked-badge" aria-label="Road closed by ice">
              <span>✕</span>
              <strong>ICE</strong>
            </div>

            <div class="almaty-compass" aria-label="Compass">
              <span class="north">N</span>
              <span class="east">E</span>
              <span class="south">S</span>
              <span class="west">W</span>
              <i></i>
            </div>

            ${locations.map(location => `
              <button
                type="button"
                class="almaty-landmark"
                data-landmark="${location.id}"
                style="--x:${location.x};--y:${location.y}"
                aria-label="Add ${location.name} to route"
              >
                <img src="${location.image}" alt="">
                <span>${location.name}</span>
                <b data-visit-badge aria-hidden="true"></b>
              </button>
            `).join("")}
          </div>

          <div class="almaty-route-console">
            <div class="almaty-route-title">
              <span>YOUR ROUTE</span>
              <strong data-route-count>1 stop</strong>
            </div>
            <div class="almaty-route-strip" data-route-strip></div>
          </div>
        </section>

        <aside class="almaty-dispatch">
          <div class="almaty-dispatch-heading">
            <span>MISSION CONTROL · ROUTE SHEET</span>
            <h3>Follow every instruction</h3>
            <p>
              Read one step at a time. Click each landmark when you arrive.
              Some steps contain two moves. You may visit a place twice.
            </p>
          </div>

          <ol class="almaty-directions">
            ${directions.map((direction, index) => `
              <li>
                <span>${String(index + 1).padStart(2, "0")}</span>
                <p>${direction}</p>
              </li>
            `).join("")}
          </ol>

          <div class="almaty-route-actions">
            <button type="button" class="button button-secondary" data-route-undo>
              Undo last
            </button>
            <button type="button" class="button button-secondary" data-route-clear>
              Clear route
            </button>
            <button type="button" class="button button-primary almaty-check-route" data-route-check>
              Check route
            </button>
          </div>

          <p class="almaty-route-message" data-route-message role="status" aria-live="polite">
            Abai Square is already selected as your starting point.
          </p>

          <div class="almaty-build-note">
            <strong>MISSION REWARD</strong>
            <span>
              A fully correct route recovers the Mountain security seal.
              Wrong routes trigger the standard 30-second penalty.
            </span>
          </div>
        </aside>
      </div>
    `;

    const map = container.querySelector("[data-almaty-map]");
    const routeLine = container.querySelector("[data-route-line]");
    const routeStrip = container.querySelector("[data-route-strip]");
    const routeCount = container.querySelector("[data-route-count]");
    const message = container.querySelector("[data-route-message]");
    const undoButton = container.querySelector("[data-route-undo]");
    const clearButton = container.querySelector("[data-route-clear]");
    const checkButton = container.querySelector("[data-route-check]");
    const landmarkButtons = Array.from(
      container.querySelectorAll("[data-landmark]")
    );

    function routePoints() {
      return state.route
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(location => `${location.x},${location.y}`)
        .join(" ");
    }

    function visitNumbers(id) {
      const numbers = [];
      state.route.forEach((routeId, index) => {
        if (routeId === id) numbers.push(index + 1);
      });
      return numbers;
    }

    function renderRoute() {
      routeLine.setAttribute("points", routePoints());

      const routeRows = [];
      const stopsPerRow = 5;

      for (let start = 0; start < state.route.length; start += stopsPerRow) {
        routeRows.push(
          state.route.slice(start, start + stopsPerRow)
            .map((id, rowIndex) => {
              const index = start + rowIndex;
              const location = byId.get(id);

              return `
                <span class="almaty-route-chip">
                  <b>${index + 1}</b>
                  ${location.short}
                </span>
              `;
            })
            .join('<span class="almaty-route-arrow" aria-hidden="true">→</span>')
        );
      }

      routeStrip.innerHTML = routeRows
        .map((row, index) => `
          <div class="almaty-route-row" data-route-row="${index + 1}">
            ${row}
          </div>
        `)
        .join("");

      routeCount.textContent =
        `${state.route.length} ${state.route.length === 1 ? "stop" : "stops"}`;

      landmarkButtons.forEach(button => {
        const id = button.dataset.landmark;
        const visits = visitNumbers(id);
        const badge = button.querySelector("[data-visit-badge]");

        button.classList.toggle("is-visited", visits.length > 0);
        button.classList.toggle(
          "is-current",
          state.route[state.route.length - 1] === id
        );
        button.disabled = state.verified;

        badge.textContent = visits.length
          ? visits.join("·")
          : "";
      });

      undoButton.disabled = state.verified || state.route.length <= 1;
      clearButton.disabled = state.verified || state.route.length <= 1;

      saveState(teamId, state);
      renderPenalty();
    }

    function stopPenaltyTimer() {
      if (!penaltyTimer) return;
      clearInterval(penaltyTimer);
      penaltyTimer = null;
    }

    function renderPenalty() {
      stopPenaltyTimer();

      if (!cooldown || state.verified) {
        checkButton.disabled = state.verified;
        return;
      }

      const seconds = cooldown.remainingSeconds(teamId, challengeId);

      if (seconds <= 0) {
        checkButton.disabled = false;
        checkButton.textContent = "Check route";
        message.classList.remove("is-penalty");
        return;
      }

      checkButton.disabled = true;
      checkButton.textContent = `Try again in ${seconds}s`;
      message.classList.remove("is-success");
      message.classList.add("is-penalty");
      message.textContent =
        `Route rejected · ${seconds}-second penalty. You can edit the route while you wait.`;

      penaltyTimer = setInterval(() => {
        const next = cooldown.remainingSeconds(teamId, challengeId);

        if (next <= 0) {
          stopPenaltyTimer();
          checkButton.disabled = false;
          checkButton.textContent = "Check route";
          message.classList.remove("is-penalty");
          message.textContent =
            "Penalty complete. Review the route, then check again.";
          return;
        }

        checkButton.textContent = `Try again in ${next}s`;
        message.textContent =
          `Route rejected · ${next}-second penalty. You can edit the route while you wait.`;
      }, 250);
    }

    landmarkButtons.forEach(button => {
      button.addEventListener("click", () => {
        if (state.verified) return;

        const id = button.dataset.landmark;
        if (!byId.has(id)) return;

        if (state.route.length >= 20) {
          message.textContent =
            "Route limit reached. Undo or clear some stops before continuing.";
          return;
        }

        state.route.push(id);
        message.classList.remove("is-success", "is-penalty");
        message.textContent =
          `${byId.get(id).name} added. Continue following Mission Control.`;
        renderRoute();
      });
    });

    undoButton.addEventListener("click", () => {
      if (state.verified || state.route.length <= 1) return;

      const removed = state.route.pop();
      message.classList.remove("is-success", "is-penalty");
      message.textContent =
        `${byId.get(removed)?.name || "Last stop"} removed from the route.`;
      renderRoute();
    });

    clearButton.addEventListener("click", () => {
      if (state.verified) return;

      state.route = ["abai"];
      message.classList.remove("is-success", "is-penalty");
      message.textContent =
        "Route cleared. Abai Square remains as the starting point.";
      renderRoute();
    });

    checkButton.addEventListener("click", async () => {
      if (state.verified) return;

      if (cooldown?.isActive(teamId, challengeId)) {
        renderPenalty();
        return;
      }

      if (state.route.length < 2) {
        message.classList.remove("is-success", "is-penalty");
        message.textContent =
          "Build your route by clicking landmarks before checking it.";
        return;
      }

      if (routeMatches(state.route)) {
        checkButton.disabled = true;
        checkButton.textContent = "Verifying route…";
        message.classList.remove("is-penalty");
        message.classList.add("is-success");
        message.textContent =
          "ROUTE CORRECT · Recovering the Mountain security seal…";

        const result =
          typeof context?.complete === "function"
            ? await context.complete(completionProof)
            : {
                correct: false,
                error: "Completion bridge unavailable."
              };

        if (!result?.correct) {
          checkButton.disabled = false;
          checkButton.textContent = "Check route";
          message.classList.remove("is-success");
          message.textContent =
            result?.error ||
            "Route was correct, but the seal could not be recorded. Try again.";
          return;
        }

        state.verified = true;
        saveState(teamId, state);

        message.classList.remove("is-penalty");
        message.classList.add("is-success");
        message.textContent =
          "ROUTE VERIFIED · Mountain seal recovered · Code number 8.";

        checkButton.textContent = "Mountain seal recovered";
        renderRoute();
        return;
      }

      cooldown?.start(teamId, challengeId);

      message.classList.remove("is-success");
      message.classList.add("is-penalty");
      renderPenalty();
    });

    renderRoute();

    window.FREEZE_ALMATY = Object.freeze({
      correctRoute: [...correctRoute],
      getRoute: () => [...state.route],
      routeMatches: route => routeMatches(route),
      reset: () => {
        state.route = ["abai"];
        state.verified = false;
        cooldown?.clear(teamId, challengeId);
        saveState(teamId, state);
        renderRoute();
      }
    });
  }

  window.FREEZE_CHALLENGES.register({
    id: 2,
    shortTitle: "LOST IN ALMATY",
    title: "Lost in Almaty",
    eyebrow: "MAP & DIRECTIONS",
    duration: "7–9 min",
    intro:
      "Mission Control has one safe route through frozen Almaty. Follow every direction carefully — one wrong turn sends you back to the map.",
    brief:
      "Start at Abai Square, build the complete route by clicking landmarks, then ask Mission Control to check it.",
    submission: {
      kind: "custom",
      label: "Route check",
      placeholder: "",
      enabled: false
    },
    render
  });
})();
