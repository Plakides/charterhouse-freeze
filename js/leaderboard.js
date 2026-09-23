(() => {
  "use strict";

  const api = window.FREEZE_API;
  const REFRESH_MS = 0;

  const houseMeta = {
    "thackeray": {
      name: "Thackeray",
      shield: "assets/branding/thackeray.png"
    },
    "baden-powell": {
      name: "Baden-Powell",
      shield: "assets/branding/baden-powell.png"
    },
    "wesley": {
      name: "Wesley",
      shield: "assets/branding/wesley.png"
    },
    "portman": {
      name: "Portman",
      shield: "assets/branding/portman.png"
    }
  };

  let overlay = null;
  let lastFocused = null;
  let activeTab = "teams";
  let refreshTimer = null;
  let loading = false;
  let lastData = null;

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function progressBar(completed) {
    const safe = Math.max(0, Math.min(8, Number(completed) || 0));
    const percent = (safe / 8) * 100;

    return `
      <div class="leader-progress">
        <span style="width:${percent}%"></span>
      </div>
    `;
  }

  function teamStatus(team) {
    if (team.finished) {
      return `<span class="leader-finish-time">${escapeText(team.elapsedDisplay || "—")}</span>`;
    }

    return `
      <span class="leader-progress-label">${Number(team.completed) || 0}/8</span>
      ${progressBar(team.completed)}
    `;
  }

  function renderTeams(data, target) {
    const teams = Array.isArray(data.teams) ? data.teams : [];

    if (!teams.length) {
      target.innerHTML = `
        <div class="leader-empty">
          <strong>No teams have started yet.</strong>
          <span>The board will update automatically.</span>
        </div>
      `;
      return;
    }

    target.innerHTML = teams.map(team => {
      const house = houseMeta[team.house] || { name: team.houseName || team.house, shield: "" };
      const rank = team.finished && team.rank ? String(team.rank) : "—";
      const rowClass = team.finished ? "is-finished" : "is-playing";

      return `
        <article class="leader-team-row ${rowClass}">
          <div class="leader-rank">${rank}</div>
          <div class="leader-team-identity">
            ${house.shield ? `<img src="${house.shield}" alt="">` : ""}
            <div>
              <strong>${escapeText(team.teamName)}</strong>
              <span>${escapeText(house.name)}</span>
            </div>
          </div>
          <div class="leader-team-state">
            ${team.finished
              ? `<span class="leader-state-word">ESCAPED</span>`
              : `<span class="leader-state-word">${Number(team.completed) || 0}/8 SEALS</span>`
            }
          </div>
          <div class="leader-team-result">
            ${teamStatus(team)}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderHouses(data, target) {
    const houses = Array.isArray(data.houses) ? data.houses : [];

    if (!houses.length) {
      target.innerHTML = `
        <div class="leader-empty">
          <strong>House standings unavailable.</strong>
          <span>Try refreshing in a moment.</span>
        </div>
      `;
      return;
    }

    target.innerHTML = houses.map(house => {
      const meta = houseMeta[house.house] || {
        name: house.houseName || house.house,
        shield: ""
      };

      const progress = Math.max(0, Math.min(100, Number(house.averageProgress) || 0));

      return `
        <article class="leader-house-row" data-house="${escapeText(house.house)}">
          <div class="leader-house-rank">${house.rank || "—"}</div>
          <div class="leader-house-identity">
            ${meta.shield ? `<img src="${meta.shield}" alt="">` : ""}
            <strong>${escapeText(meta.name)}</strong>
          </div>
          <div class="leader-house-progress">
            <div class="leader-house-progress-copy">
              <strong>${progress.toFixed(1).replace(".0", "")}%</strong>
              <span>average progress</span>
            </div>
            <div class="leader-progress leader-progress-house">
              <span style="width:${progress}%"></span>
            </div>
          </div>
          <div class="leader-house-stats">
            <span><strong>${Number(house.teams) || 0}</strong> teams</span>
            <span><strong>${Number(house.escapedTeams) || 0}</strong> escaped</span>
            <span><strong>${escapeText(house.averageEscapeDisplay || "—")}</strong> avg escape</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateMeta(data, root) {
    const count = root.querySelector("[data-leader-team-count]");
    const escaped = root.querySelector("[data-leader-escaped-count]");
    const updated = root.querySelector("[data-leader-updated]");

    if (count) count.textContent = String(Number(data.teamCount) || 0);
    if (escaped) escaped.textContent = String(Number(data.escapedTeamCount) || 0);

    if (updated) {
      const date = data.generatedAt ? new Date(data.generatedAt) : new Date();
      updated.textContent = Number.isNaN(date.getTime())
        ? "Updated now"
        : `Updated ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    }
  }

  function setTab(tab, root = overlay || document) {
    activeTab = tab === "houses" ? "houses" : "teams";

    root.querySelectorAll("[data-leader-tab]").forEach(button => {
      const active = button.dataset.leaderTab === activeTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    root.querySelectorAll("[data-leader-panel]").forEach(panel => {
      panel.hidden = panel.dataset.leaderPanel !== activeTab;
    });
  }

  function render(data, root = overlay || document) {
    lastData = data;

    const teamsTarget = root.querySelector("[data-leader-teams]");
    const housesTarget = root.querySelector("[data-leader-houses]");

    if (teamsTarget) renderTeams(data, teamsTarget);
    if (housesTarget) renderHouses(data, housesTarget);

    updateMeta(data, root);
    setTab(activeTab, root);
  }

  function setLoading(root, isLoading) {
    root.querySelectorAll("[data-leader-refresh]").forEach(button => {
      button.disabled = isLoading;
      button.classList.toggle("is-loading", isLoading);
    });

    const status = root.querySelector("[data-leader-status]");
    if (status && isLoading && !lastData) {
      status.textContent = "Contacting scoreboard…";
    }
  }

  async function refresh(root = overlay || document) {
    if (loading) return;

    loading = true;
    setLoading(root, true);

    try {
      const data = await api.getLeaderboard({});
      render(data, root);

      const status = root.querySelector("[data-leader-status]");
      if (status) {
        status.textContent = "Local preview · shared leaderboard sync arrives in Task 8E";
      }
    } catch (error) {
      console.error("Leaderboard refresh failed:", error);

      const status = root.querySelector("[data-leader-status]");
      if (status) {
        const timedOut = error && error.code === "API_TIMEOUT";
        status.textContent = lastData
          ? "Live refresh delayed · showing last result"
          : timedOut
            ? "Scoreboard timed out · retry"
            : "Scoreboard unavailable · retry";
      }

      if (!lastData) {
        const teamsTarget = root.querySelector("[data-leader-teams]");
        const housesTarget = root.querySelector("[data-leader-houses]");
        const failure = `
          <div class="leader-empty">
            <strong>Could not reach the scoreboard.</strong>
            <span>The game backend is separate from this display. Use Refresh or test the public leaderboard endpoint directly.</span>
          </div>
        `;
        if (teamsTarget) teamsTarget.innerHTML = failure;
        if (housesTarget) housesTarget.innerHTML = failure;
      }
    } finally {
      loading = false;
      setLoading(root, false);
    }
  }

  function startRefresh(root = overlay || document) {
    stopRefresh();
    refresh(root);

    if (REFRESH_MS > 0) {
      refreshTimer = window.setInterval(() => refresh(root), REFRESH_MS);
    }
  }

  function stopRefresh() {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function open(tab = "teams") {
    if (!overlay) return;

    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    setTab(tab, overlay);

    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      overlay.querySelector(".modal-close")?.focus();
    });

    startRefresh(overlay);
  }

  function close() {
    if (!overlay || overlay.hidden) return;

    stopRefresh();
    overlay.classList.remove("is-open");

    window.setTimeout(() => {
      overlay.hidden = true;
      document.body.classList.remove("modal-open");

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }, 180);
  }

  function initialiseOverlay() {
    overlay = document.getElementById("leaderboardOverlay");
    if (!overlay) return;

    overlay.querySelectorAll("[data-leader-tab]").forEach(button => {
      button.addEventListener("click", () => setTab(button.dataset.leaderTab, overlay));
    });

    overlay.querySelectorAll("[data-leader-refresh]").forEach(button => {
      button.addEventListener("click", () => refresh(overlay));
    });

    overlay.querySelectorAll("[data-close-modal]").forEach(button => {
      button.addEventListener("click", close);
    });

    overlay.addEventListener("mousedown", event => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", event => {
      if (overlay.hidden || event.key !== "Escape") return;
      event.preventDefault();
      close();
    });
  }

  function initialiseProjector() {
    const root = document.getElementById("projectorLeaderboard");
    if (!root) return;

    root.querySelectorAll("[data-leader-tab]").forEach(button => {
      button.addEventListener("click", () => setTab(button.dataset.leaderTab, root));
    });

    root.querySelectorAll("[data-leader-refresh]").forEach(button => {
      button.addEventListener("click", () => refresh(root));
    });

    setTab("teams", root);
    startRefresh(root);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refresh(root);
      }
    });
  }

  window.FREEZE_LEADERBOARD = Object.freeze({
    initialiseOverlay,
    initialiseProjector,
    open,
    close,
    refresh,
    setTab
  });
})();
