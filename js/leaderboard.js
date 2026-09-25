(() => {
  "use strict";

  const config = window.FREEZE_CONFIG || {};
  const REFRESH_MS = Math.max(
    10000,
    Number(config.LEADERBOARD_REFRESH_MS) || 15000
  );
  const TIMEOUT_MS = Math.max(
    1500,
    Number(config.LEADERBOARD_TIMEOUT_MS) || 4000
  );
  const CACHE_KEY = "charterhouseFreeze.v2.leaderboardCache";

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
  let lastSuccessfulRefresh = null;

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatElapsed(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function average(values) {
    const numbers = values
      .map(Number)
      .filter(value => Number.isFinite(value));

    if (!numbers.length) return null;

    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  function leaderboardEndpoint() {
    const configured = String(config.LEADERBOARD_URL || "").trim();
    if (configured) return configured;

    const base = String(config.SYNC_URL || "").trim().replace(/\/+$/, "");
    return base ? `${base}/leaderboard` : "";
  }

  function saveCache(data) {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          cachedAt: new Date().toISOString(),
          data
        })
      );
    } catch (error) {
      console.warn("Could not cache leaderboard:", error);
    }
  }

  function loadCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return null;

      return {
        cachedAt: parsed.cachedAt || null,
        data: parsed.data
      };
    } catch (error) {
      console.warn("Could not restore cached leaderboard:", error);
      return null;
    }
  }

  function transformRemote(raw) {
    const rawTeams = Array.isArray(raw?.teams) ? raw.teams : [];

    const teams = rawTeams
      .map(team => ({
        teamId: String(team.teamId || ""),
        teamName: String(team.teamName || "Emergency Team"),
        house: String(team.house || ""),
        houseName:
          houseMeta[team.house]?.name ||
          String(team.house || ""),
        completed: Math.max(
          0,
          Math.min(8, Number(team.completedCount) || 0)
        ),
        finished: Boolean(team.finished),
        elapsedSeconds: Math.max(0, Number(team.elapsedSeconds) || 0),
        finishTime: team.finishTime || null,
        updatedAt: team.updatedAt || null,
        seq: Math.max(0, Number(team.seq) || 0)
      }))
      .sort((left, right) => {
        if (left.finished !== right.finished) {
          return left.finished ? -1 : 1;
        }

        if (left.finished && right.finished) {
          return (
            left.elapsedSeconds - right.elapsedSeconds ||
            left.teamName.localeCompare(right.teamName)
          );
        }

        return (
          right.completed - left.completed ||
          left.teamName.localeCompare(right.teamName)
        );
      });

    let finishedRank = 0;

    teams.forEach(team => {
      if (team.finished) {
        finishedRank += 1;
        team.rank = finishedRank;
        team.elapsedDisplay = formatElapsed(team.elapsedSeconds);
      } else {
        team.rank = null;
        team.elapsedDisplay = null;
      }
    });

    const rawHouseMap = new Map(
      (Array.isArray(raw?.houses) ? raw.houses : [])
        .map(house => [String(house.house || ""), house])
    );

    const houses = Object.keys(houseMeta).map(houseId => {
      const serverHouse = rawHouseMap.get(houseId) || {};
      const houseTeams = teams.filter(team => team.house === houseId);
      const finishedTeams = houseTeams.filter(team => team.finished);

      const averageProgress = Number.isFinite(
        Number(serverHouse.averageProgress)
      )
        ? Math.max(
            0,
            Math.min(100, Number(serverHouse.averageProgress))
          )
        : average(
            houseTeams.map(team => (team.completed / 8) * 100)
          ) ?? 0;

      const averageEscape = average(
        finishedTeams.map(team => team.elapsedSeconds)
      );

      return {
        house: houseId,
        houseName: houseMeta[houseId].name,
        teams: Number(serverHouse.teamCount) || houseTeams.length,
        escapedTeams:
          Number(serverHouse.finishedCount) || finishedTeams.length,
        averageProgress,
        averageEscapeSeconds: averageEscape,
        averageEscapeDisplay:
          averageEscape === null ? "—" : formatElapsed(averageEscape)
      };
    });

    houses.sort((left, right) => {
      return (
        right.averageProgress - left.averageProgress ||
        right.escapedTeams - left.escapedTeams ||
        (
          (left.averageEscapeSeconds ?? Number.POSITIVE_INFINITY) -
          (right.averageEscapeSeconds ?? Number.POSITIVE_INFINITY)
        ) ||
        left.houseName.localeCompare(right.houseName)
      );
    });

    houses.forEach((house, index) => {
      house.rank = index + 1;
    });

    const generatedAt = raw?.generatedAt || new Date().toISOString();

    return {
      generatedAt,
      teamCount: Number(raw?.teamCount) || teams.length,
      escapedTeamCount: teams.filter(team => team.finished).length,
      teams,
      houses
    };
  }

  async function fetchSharedLeaderboard() {
    const url = leaderboardEndpoint();

    if (!url) {
      throw new Error("Shared leaderboard URL is not configured.");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal
      });

      const text = await response.text();
      let body = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          `Leaderboard returned unreadable data (${response.status}).`
        );
      }

      if (!response.ok || !body?.ok) {
        const message =
          body?.error?.message ||
          `Leaderboard request failed (${response.status}).`;

        throw new Error(message);
      }

      return transformRemote(body);
    } finally {
      window.clearTimeout(timeoutId);
    }
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
      return `
        <span class="leader-finish-time">
          ${escapeText(team.elapsedDisplay || "—")}
        </span>
      `;
    }

    return `
      <span class="leader-progress-label">
        ${Number(team.completed) || 0}/8
      </span>
      ${progressBar(team.completed)}
    `;
  }

  function renderTeams(data, target) {
    const teams = Array.isArray(data.teams) ? data.teams : [];

    if (!teams.length) {
      target.innerHTML = `
        <div class="leader-empty">
          <strong>No teams have started yet.</strong>
          <span>The shared board will update automatically.</span>
        </div>
      `;
      return;
    }

    target.innerHTML = teams.map(team => {
      const house = houseMeta[team.house] || {
        name: team.houseName || team.house,
        shield: ""
      };
      const rank = team.finished && team.rank
        ? String(team.rank)
        : "—";
      const rowClass = team.finished
        ? "is-finished"
        : "is-playing";

      return `
        <article class="leader-team-row ${rowClass}">
          <div class="leader-rank">${rank}</div>
          <div class="leader-team-identity">
            ${house.shield
              ? `<img src="${house.shield}" alt="">`
              : ""}
            <div>
              <strong>${escapeText(team.teamName)}</strong>
              <span>${escapeText(house.name)}</span>
            </div>
          </div>
          <div class="leader-team-state">
            ${team.finished
              ? `<span class="leader-state-word">ESCAPED</span>`
              : `<span class="leader-state-word">
                   ${Number(team.completed) || 0}/8 SEALS
                 </span>`
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

      const progress = Math.max(
        0,
        Math.min(100, Number(house.averageProgress) || 0)
      );

      return `
        <article
          class="leader-house-row"
          data-house="${escapeText(house.house)}"
        >
          <div class="leader-house-rank">${house.rank || "—"}</div>
          <div class="leader-house-identity">
            ${meta.shield
              ? `<img src="${meta.shield}" alt="">`
              : ""}
            <strong>${escapeText(meta.name)}</strong>
          </div>
          <div class="leader-house-progress">
            <div class="leader-house-progress-copy">
              <strong>
                ${progress.toFixed(1).replace(".0", "")}%
              </strong>
              <span>average progress</span>
            </div>
            <div class="leader-progress leader-progress-house">
              <span style="width:${progress}%"></span>
            </div>
          </div>
          <div class="leader-house-stats">
            <span>
              <strong>${Number(house.teams) || 0}</strong> teams
            </span>
            <span>
              <strong>${Number(house.escapedTeams) || 0}</strong> escaped
            </span>
            <span>
              <strong>
                ${escapeText(house.averageEscapeDisplay || "—")}
              </strong> avg escape
            </span>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateMeta(data, root) {
    const count = root.querySelector("[data-leader-team-count]");
    const escaped = root.querySelector("[data-leader-escaped-count]");
    const updated = root.querySelector("[data-leader-updated]");

    if (count) {
      count.textContent = String(Number(data.teamCount) || 0);
    }

    if (escaped) {
      escaped.textContent = String(
        Number(data.escapedTeamCount) || 0
      );
    }

    if (updated) {
      const date = data.generatedAt
        ? new Date(data.generatedAt)
        : new Date();

      updated.textContent = Number.isNaN(date.getTime())
        ? "Updated now"
        : `Updated ${date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })}`;
    }
  }

  function setStatus(root, message, state = "normal") {
    const status = root.querySelector("[data-leader-status]");
    if (!status) return;

    status.textContent = message;
    status.dataset.state = state;
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

  function renderCachedIfAvailable(root) {
    if (lastData) {
      render(lastData, root);
      return true;
    }

    const cached = loadCache();
    if (!cached?.data) return false;

    lastData = cached.data;
    render(lastData, root);

    const cachedAt = cached.cachedAt
      ? new Date(cached.cachedAt)
      : null;

    const cachedTime =
      cachedAt && !Number.isNaN(cachedAt.getTime())
        ? cachedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "earlier";

    setStatus(
      root,
      `Cached board from ${cachedTime} · refreshing…`,
      "cached"
    );

    return true;
  }

  function setLoading(root, isLoading) {
    root.querySelectorAll("[data-leader-refresh]").forEach(button => {
      button.disabled = isLoading;
      button.classList.toggle("is-loading", isLoading);
    });

    if (isLoading && !lastData) {
      setStatus(root, "Contacting shared scoreboard…", "loading");
    }
  }

  async function refresh(root = overlay || document) {
    if (loading) return;

    loading = true;
    setLoading(root, true);

    try {
      const data = await fetchSharedLeaderboard();

      lastSuccessfulRefresh = new Date();
      render(data, root);
      saveCache(data);

      setStatus(
        root,
        `Cloudflare live · auto-refresh ${Math.round(
          REFRESH_MS / 1000
        )}s`,
        "live"
      );
    } catch (error) {
      console.error("Shared leaderboard refresh failed:", error);

      const message = error?.name === "AbortError"
        ? `Connection delayed · showing last board`
        : `Connection unavailable · showing last board`;

      if (lastData) {
        render(lastData, root);
        setStatus(root, message, "cached");
      } else if (renderCachedIfAvailable(root)) {
        setStatus(root, message, "cached");
      } else {
        setStatus(root, "Shared scoreboard unavailable · retry", "error");

        const teamsTarget = root.querySelector("[data-leader-teams]");
        const housesTarget = root.querySelector("[data-leader-houses]");
        const failure = `
          <div class="leader-empty">
            <strong>Could not reach the shared scoreboard.</strong>
            <span>
              Student gameplay is unaffected. Use Refresh when the
              connection returns.
            </span>
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

    renderCachedIfAvailable(root);
    refresh(root);

    refreshTimer = window.setInterval(() => {
      // Avoid pointless requests while this page/tab is hidden.
      if (!document.hidden) {
        refresh(root);
      }
    }, REFRESH_MS);
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

      if (
        lastFocused &&
        typeof lastFocused.focus === "function"
      ) {
        lastFocused.focus();
      }
    }, 180);
  }

  function initialiseOverlay() {
    overlay = document.getElementById("leaderboardOverlay");
    if (!overlay) return;

    overlay.querySelectorAll("[data-leader-tab]").forEach(button => {
      button.addEventListener("click", () => {
        setTab(button.dataset.leaderTab, overlay);
      });
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
      button.addEventListener("click", () => {
        setTab(button.dataset.leaderTab, root);
      });
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

  function status() {
    return {
      endpoint: leaderboardEndpoint() || null,
      refreshMs: REFRESH_MS,
      timeoutMs: TIMEOUT_MS,
      loading,
      lastSuccessfulRefresh:
        lastSuccessfulRefresh?.toISOString() || null,
      hasData: Boolean(lastData)
    };
  }

  window.FREEZE_LEADERBOARD = Object.freeze({
    initialiseOverlay,
    initialiseProjector,
    open,
    close,
    refresh,
    setTab,
    status
  });
})();
