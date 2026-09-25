
(() => {
  "use strict";

  const root = document.getElementById("app");
  if (!root || root.dataset.initialised === "true") return;
  root.dataset.initialised = "true";

  const api = window.FREEZE_API;
  const stateStore = window.FREEZE_STATE;

  const screens = {
    boot: document.getElementById("screenBoot"),
    start: document.getElementById("screenStart"),
    register: document.getElementById("screenRegister"),
    reveal: document.getElementById("screenReveal"),
    mission: document.getElementById("screenMission"),
    vault: document.getElementById("screenVault"),
    victory: document.getElementById("screenVictory"),
    challenge: document.getElementById("screenChallenge")
  };

  const beginButton = document.getElementById("beginButton");
  const brandHome = document.getElementById("brandHome");
  const registrationForm = document.getElementById("registrationForm");
  const addMemberButton = document.getElementById("addMemberButton");
  const memberCount = document.getElementById("memberCount");
  const formMessage = document.getElementById("formMessage");
  const registrationSubmit = registrationForm.querySelector('button[type="submit"]');

  const teamName = document.getElementById("teamName");
  const summaryHouse = document.getElementById("summaryHouse");
  const summaryMembers = document.getElementById("summaryMembers");
  const startMissionButton = document.getElementById("startMissionButton");
  const startMissionLabel = startMissionButton.querySelector(".button-label");

  const missionTeamName = document.getElementById("missionTeamName");
  const missionHouse = document.getElementById("missionHouse");
  const missionTimer = document.getElementById("missionTimer");
  const missionState = document.getElementById("missionState");
  const missionProgress = document.getElementById("missionProgress");
  const sidebarProgress = document.getElementById("sidebarProgress");
  const statusMeterFill = document.getElementById("statusMeterFill");
  const dashboardHouseShield = document.getElementById("dashboardHouseShield");
  const dashboardHouseMark = document.getElementById("dashboardHouseMark");
  const freezeBoard = document.getElementById("freezeBoard");
  const sealGrid = document.getElementById("sealGrid");
  const fieldKitButton = document.getElementById("fieldKitButton");
  const leaderboardButton = document.getElementById("leaderboardButton");
  const dashboardToast = document.getElementById("dashboardToast");
  const dashboardToastTitle = document.getElementById("dashboardToastTitle");
  const dashboardToastText = document.getElementById("dashboardToastText");
  const emergencyBulletin = document.getElementById("emergencyBulletin");

  const bootMessage = document.getElementById("bootMessage");
  const retryConnectionButton = document.getElementById("retryConnectionButton");
  const statusCopy = document.getElementById("statusCopy");

  const finalRouteCard = document.getElementById("finalRouteCard");
  const proceedToVaultButton = document.getElementById("proceedToVaultButton");
  const vaultRouteOverlay = document.getElementById("vaultRouteOverlay");

  const vaultBackButton = document.getElementById("vaultBackButton");
  const vaultTeamName = document.getElementById("vaultTeamName");
  const vaultHouse = document.getElementById("vaultHouse");
  const vaultTimer = document.getElementById("vaultTimer");
  const vaultFieldKitButton = document.getElementById("vaultFieldKitButton");

  const victoryTeamName = document.getElementById("victoryTeamName");
  const victoryHouse = document.getElementById("victoryHouse");
  const victoryTime = document.getElementById("victoryTime");
  const victoryLeaderboardButton = document.getElementById("victoryLeaderboardButton");

  const challengeBackButton = document.getElementById("challengeBackButton");
  const challengeTeamName = document.getElementById("challengeTeamName");
  const challengeHouse = document.getElementById("challengeHouse");
  const challengeTimer = document.getElementById("challengeTimer");
  const challengeNumberLabel = document.getElementById("challengeNumberLabel");
  const challengeEyebrow = document.getElementById("challengeEyebrow");
  const challengeTitle = document.getElementById("challengeTitle");
  const challengeIntro = document.getElementById("challengeIntro");
  const challengeDuration = document.getElementById("challengeDuration");
  const challengeContent = document.getElementById("challengeContent");
  const challengeAnswerForm = document.getElementById("challengeAnswerForm");
  const challengeAnswerLabel = document.getElementById("challengeAnswerLabel");
  const challengeAnswerHelp = document.getElementById("challengeAnswerHelp");
  const challengeAnswerInput = document.getElementById("challengeAnswerInput");
  const challengeSubmitButton = document.getElementById("challengeSubmitButton");
  const challengeSubmitLabel = document.getElementById("challengeSubmitLabel");
  const challengeMessage = document.getElementById("challengeMessage");
  const challengeProgress = document.getElementById("challengeProgress");
  const challengeStatus = document.getElementById("challengeStatus");
  const challengeStatusText = document.getElementById("challengeStatusText");
  const challengeFieldKitButton = document.getElementById("challengeFieldKitButton");
  const challengeStatusCard = challengeStatus.closest(".challenge-status-card");

  const challengeRegistry = window.FREEZE_CHALLENGES;

  const houseNames = {
    "thackeray": "Thackeray",
    "baden-powell": "Baden-Powell",
    "wesley": "Wesley",
    "portman": "Portman"
  };

  const houseAssets = {
    "thackeray": "assets/branding/thackeray.png",
    "baden-powell": "assets/branding/baden-powell.png",
    "wesley": "assets/branding/wesley.png",
    "portman": "assets/branding/portman.png"
  };

  const bulletinLines = [
    "Indoor temperature: increasingly character-building.",
    "Science Department requests that nobody lick the windows.",
    "Heating status: emotionally unavailable.",
    "Emergency blankets remain disappointingly theoretical.",
    "The snow leopard continues to deny involvement."
  ];

  const sealDefinitions = Object.freeze({
    1: Object.freeze({ symbol: "snow-leopard", number: 4, label: "Snow Leopard" }),
    2: Object.freeze({ symbol: "mountain", number: 8, label: "Mountain" }),
    3: Object.freeze({ symbol: "book", number: 2, label: "Book" }),
    4: Object.freeze({ symbol: "teapot", number: 7, label: "Teapot" }),
    5: Object.freeze({ symbol: "eagle", number: 5, label: "Eagle" }),
    6: Object.freeze({ symbol: "snowflake", number: 1, label: "Snowflake" }),
    7: Object.freeze({ symbol: "key", number: 9, label: "Key" }),
    8: Object.freeze({ symbol: "compass", number: 3, label: "Compass" })
  });

  let shownMembers = 2;
  let currentSession = null;
  let currentTeam = null;
  let timerInterval = null;
  let restoring = false;
  let syncInterval = null;
  let syncInFlight = false;
  let dashboardVisible = false;
  let currentChallengeId = null;
  let challengeSubmitInFlight = false;
  let challengeHistoryPushed = false;

  const urlParams = new URL(window.location.href).searchParams;
  const iceDemoMode = urlParams.get("iceDemo") === "1";
  const thawDemoMode = urlParams.get("thawDemo") === "1";
  const progressDemoRaw = String(urlParams.get("progressDemo") || "").trim();

  function showScreen(name) {
    Object.entries(screens).forEach(([key, section]) => {
      if (!section) return;
      const active = key === name;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });

    dashboardVisible = name === "mission" || name === "challenge";

    if (dashboardVisible) {
      startBackgroundSync();
    } else {
      stopBackgroundSync();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setStatus(message) {
    statusCopy.textContent = message;
  }

  function setRegistrationBusy(isBusy) {
    registrationSubmit.disabled = isBusy;
    registrationSubmit.classList.toggle("is-loading", isBusy);
    registrationSubmit.setAttribute("aria-busy", String(isBusy));

    const label = registrationSubmit.querySelector(".button-label");
    if (label) {
      label.textContent = isBusy
        ? "Contacting emergency network…"
        : "Assign team codename";
    }

    registrationForm.querySelectorAll("input, button").forEach(control => {
      if (control === registrationSubmit) return;
      control.disabled = isBusy;
    });
  }

  function setStartBusy(isBusy) {
    startMissionButton.disabled = isBusy;
    startMissionButton.classList.toggle("is-loading", isBusy);
    startMissionButton.setAttribute("aria-busy", String(isBusy));

    if (startMissionLabel) {
      startMissionLabel.textContent = isBusy
        ? "Starting mission…"
        : "Start mission";
    }
  }

  function addMemberField() {
    if (shownMembers >= 4) return;

    shownMembers += 1;
    const field = document.querySelector(`[data-member="${shownMembers}"]`);

    if (field) {
      field.classList.remove("is-hidden");
      const input = field.querySelector("input");
      if (input) input.focus();
    }

    updateMemberControls();
  }

  function updateMemberControls() {
    memberCount.textContent = `${shownMembers} of 4 spaces shown`;
    addMemberButton.hidden = shownMembers >= 4;
  }

  function cleanName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function collectStudents() {
    return ["student1", "student2", "student3", "student4"]
      .map(name => cleanName(registrationForm.elements[name]?.value))
      .filter(Boolean);
  }

  function validateRegistration() {
    formMessage.textContent = "";

    const house = registrationForm.elements.house.value;

    if (!house) {
      return "Choose your House first.";
    }

    const students = collectStudents();

    if (students.length < 2 || students.length > 4) {
      return "Enter between two and four team members.";
    }

    const normalised = students.map(name => name.toLocaleLowerCase());

    if (new Set(normalised).size !== normalised.length) {
      return "Each team member should only be entered once.";
    }

    return "";
  }

  function mapApiError(error) {
    switch (error && error.code) {
      case "GAME_INACTIVE":
        return "Registration is currently closed. Ask your tutor before trying again.";
      case "INVALID_TEAM_SIZE":
        return "Teams must contain between two and four students.";
      case "INVALID_HOUSE":
        return "Choose one of the four Houses.";
      case "DUPLICATE_STUDENT":
        return "Each team member should only be entered once.";
      case "STUDENT_NAME_TOO_LONG":
        return "One of those names is too long. First names only, please.";
      case "TEAM_NAMES_EXHAUSTED":
        return "The codename generator has run out of ideas. Please tell your tutor.";
      case "MISSION_ALREADY_FINISHED":
        return "This team has already completed the mission.";
      case "CHALLENGE_NOT_READY":
        return "That challenge has not been built yet.";
      case "MISSION_NOT_STARTED":
        return "Start the mission before submitting answers.";
      case "NETWORK_ERROR":
        return "The emergency network could not be reached. Check Wi-Fi and try again.";
      default:
        return error && error.message
          ? error.message
          : "Something went wrong. Please try again.";
    }
  }

  function revealTeam(team) {
    currentTeam = team;

    teamName.textContent = team.teamName;
    teamName.classList.remove("is-revealing");
    void teamName.offsetWidth;
    teamName.classList.add("is-revealing");

    summaryHouse.textContent = team.houseName || houseNames[team.house] || team.house;

    const count = Array.isArray(team.students)
      ? team.students.length
      : Math.max(0, Number(team.studentCount) || 0);

    summaryMembers.textContent = `${count} ${count === 1 ? "student" : "students"}`;

    showScreen("reveal");
    setStatus(`${team.teamName} is registered and ready to begin.`);
  }

  function formatElapsed(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function stopTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startClientTimer(team) {
    stopTimer();

    if (team.finished && Number.isFinite(Number(team.elapsedSeconds))) {
      const display = formatElapsed(Number(team.elapsedSeconds));
      missionTimer.textContent = display;
      challengeTimer.textContent = display;
      vaultTimer.textContent = display;
      vaultTimer.textContent = display;
      return;
    }

    const startMs = team.startTime ? new Date(team.startTime).getTime() : NaN;

    if (!Number.isFinite(startMs)) {
      missionTimer.textContent = "--:--";
      challengeTimer.textContent = "--:--";
      vaultTimer.textContent = "--:--";
      return;
    }

    const update = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const display = formatElapsed(elapsed);
      missionTimer.textContent = display;
      challengeTimer.textContent = display;
    };

    update();
    timerInterval = window.setInterval(update, 1000);
  }

  function parseCompletedList(team) {
    const completed = Array.isArray(team && team.completed) ? team.completed : [];
    return completed
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value >= 1 && value <= 8)
      .sort((a, b) => a - b);
  }

  function getCompletedSet(team) {
    return new Set(parseCompletedList(team));
  }

  function parseProgressDemoList() {
    if (!progressDemoRaw) return null;

    if (progressDemoRaw.toLowerCase() === "all") {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }

    const ids = progressDemoRaw
      .split(",")
      .map(part => Number(String(part).trim()))
      .filter(value => Number.isInteger(value) && value >= 1 && value <= 8);

    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }

  function cloneSeal(seal) {
    if (!seal) return null;
    return {
      challengeId: Number(seal.challengeId),
      symbol: String(seal.symbol || ""),
      number: Number(seal.number),
      label: String(seal.label || "")
    };
  }

  function applyDemoOverrides(team) {
    let next = {
      ...team,
      completed: parseCompletedList(team),
      seals: Array.isArray(team.seals) ? team.seals.map(cloneSeal).filter(Boolean) : []
    };

    const demoCompleted = parseProgressDemoList();

    if (demoCompleted) {
      next.completed = demoCompleted.slice();
      next.seals = demoCompleted.map(id => {
        const def = sealDefinitions[id];
        return {
          challengeId: id,
          symbol: def.symbol,
          number: def.number,
          label: def.label
        };
      });
      next.completedCount = next.completed.length;
      next.finished = false;
    }

    if (thawDemoMode) {
      next.completed = [1, 2, 3, 4, 5, 6, 7, 8];
      next.seals = next.completed.map(id => {
        const def = sealDefinitions[id];
        return {
          challengeId: id,
          symbol: def.symbol,
          number: def.number,
          label: def.label
        };
      });
      next.completedCount = 8;
      next.finished = true;
    }

    if (!Number.isInteger(Number(next.completedCount))) {
      next.completedCount = next.completed.length;
    }

    return next;
  }


  function buildOptimisticSolvedTeam(team, challengeId) {
    if (!team) return team;

    const id = Number(challengeId);
    const completed = Array.isArray(team.completed) ? team.completed.map(Number).filter(Number.isInteger) : [];
    const completedSet = new Set(completed);
    completedSet.add(id);

    const seals = Array.isArray(team.seals) ? team.seals.map(cloneSeal).filter(Boolean) : [];
    const hasSeal = seals.some(seal => Number(seal.challengeId) === id);

    if (!hasSeal && sealDefinitions[id]) {
      seals.push({
        challengeId: id,
        symbol: sealDefinitions[id].symbol,
        number: sealDefinitions[id].number,
        label: sealDefinitions[id].label
      });
    }

    return {
      ...team,
      completed: Array.from(completedSet).sort((a, b) => a - b),
      completedCount: completedSet.size,
      seals
    };
  }

  function createSvgPath(svg, d, filled) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    if (filled) {
      path.setAttribute("fill", "currentColor");
    }
    svg.appendChild(path);
  }

  function createSvgCircle(svg, cx, cy, r, filled) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(cx));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(r));
    if (filled) {
      circle.setAttribute("fill", "currentColor");
    }
    svg.appendChild(circle);
  }

  function createSealIcon(symbol) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("aria-hidden", "true");

    switch (symbol) {
      case "snow-leopard":
        createSvgPath(svg, "M24 9c6 0 11 3 13 9 1 5-1 11-5 15-3 2-5 4-8 5-3-1-5-3-8-5-4-4-6-10-5-15 2-6 7-9 13-9z", false);
        createSvgCircle(svg, 19, 23, 1.3, true);
        createSvgCircle(svg, 29, 23, 1.3, true);
        createSvgPath(svg, "M20 29c2 2 6 2 8 0M17 16l-4-5M31 16l4-5", false);
        break;
      case "mountain":
        createSvgPath(svg, "M7 35 18 15l8 10 5-8 10 18H7zm11 0 8-12m5 12 4-8", false);
        break;
      case "book":
        createSvgPath(svg, "M9 13c7-2 12-1 15 2 3-3 8-4 15-2v22c-7-2-12-1-15 2-3-3-8-4-15-2V13z", false);
        createSvgPath(svg, "M24 15v22M14 20h6m10 0h4M14 26h6m10 0h4", false);
        break;
      case "teapot":
        createSvgPath(svg, "M11 18h20v11c0 6-4 10-10 10s-10-4-10-10V18zm4-7h12m-8 0-3-4m8 4 3-4M31 22h7c3 0 5 3 3 6-2 3-5 4-10 4", false);
        break;
      case "eagle":
        createSvgPath(svg, "M24 33c-5-9-10-14-17-17 8-1 14 1 18 4 4-5 10-8 18-8-6 4-11 11-12 21-2-3-4-5-7-7-3 2-5 4-7 7z", false);
        createSvgPath(svg, "M22 22l4-2", false);
        break;
      case "snowflake":
        createSvgPath(svg, "M24 8v32M10 16l28 16M10 32l28-16M24 8l-4 4m4-4 4 4M24 40l-4-4m4 4 4-4", false);
        break;
      case "key":
        createSvgCircle(svg, 18, 20, 7, false);
        createSvgPath(svg, "M24 24l14 14m-1-6 4-4m-10 1 3-3", false);
        break;
      case "compass":
        createSvgCircle(svg, 24, 24, 13, false);
        createSvgPath(svg, "M21 30l3-12 6 9-9 3z", true);
        createSvgPath(svg, "M24 8v4M40 24h-4M24 40v-4M8 24h4", false);
        break;
      default:
        createSvgPath(svg, "M12 24h24", false);
        break;
    }

    return svg;
  }

  function setFinalSceneThawed(thawed) {
    freezeBoard.classList.toggle("is-thawed", Boolean(thawed));

    const labelSpan = freezeBoard.querySelector(".centre-window-label span");
    const labelStrong = freezeBoard.querySelector(".centre-window-label strong");

    if (labelSpan && labelStrong) {
      if (thawed) {
        labelSpan.textContent = "SCHOOL STATUS";
        labelStrong.textContent = "UNFROZEN";
      } else {
        labelSpan.textContent = "CONTROL CORE";
        labelStrong.textContent = "VISIBLE";
      }
    }
  }

  function setFinalRouteVisible(visible) {
    const show = Boolean(visible);

    freezeBoard.classList.toggle("has-final-route", show);
    finalRouteCard.hidden = !show;

    const labelSpan = freezeBoard.querySelector(".centre-window-label span");
    const labelStrong = freezeBoard.querySelector(".centre-window-label strong");

    if (show && labelSpan && labelStrong) {
      labelSpan.textContent = "FINAL ROUTE";
      labelStrong.textContent = "UNLOCKED";
    }
  }

  function setTileRevealed(tile, revealed, animate = false) {
    if (!tile) return;

    const status = tile.querySelector(".tile-status");

    if (!revealed) {
      tile.classList.remove("is-revealed", "is-revealing");
      tile.disabled = false;
      tile.setAttribute("aria-disabled", "false");
      if (status) status.textContent = "FROZEN";
      return;
    }

    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tile.classList.add("is-revealing");
      window.setTimeout(() => {
        tile.classList.remove("is-revealing");
        tile.classList.add("is-revealed");
      }, 650);
    } else {
      tile.classList.remove("is-revealing");
      tile.classList.add("is-revealed");
    }

    tile.disabled = true;
    tile.setAttribute("aria-disabled", "true");
    if (status) status.textContent = "SEAL RECOVERED";
  }

  function resetIceBoard() {
    freezeBoard.querySelectorAll(".challenge-tile").forEach(tile => {
      setTileRevealed(tile, false, false);
    });
    setFinalSceneThawed(false);
    setFinalRouteVisible(false);
  }

  function renderSealGrid(team) {
    if (!sealGrid) return;

    const seals = Array.isArray(team.seals) ? team.seals.map(cloneSeal).filter(Boolean) : [];
    const sealsByChallenge = new Map(
      seals
        .filter(seal => Number.isInteger(seal.challengeId))
        .map(seal => [seal.challengeId, seal])
    );

    sealGrid.innerHTML = "";

    for (let challengeId = 1; challengeId <= 8; challengeId += 1) {
      const slot = document.createElement("div");
      const seal = sealsByChallenge.get(challengeId);

      if (seal) {
        slot.className = "seal-slot is-recovered";
        slot.setAttribute("aria-label", `Recovered seal ${challengeId}: ${seal.label}, code number ${seal.number}`);

        const content = document.createElement("div");
        content.className = "seal-slot-content";

        const iconWrap = document.createElement("div");
        iconWrap.className = "seal-slot-icon";
        iconWrap.appendChild(createSealIcon(seal.symbol));

        const number = document.createElement("div");
        number.className = "seal-slot-number";
        number.textContent = String(seal.number);

        const label = document.createElement("div");
        label.className = "seal-slot-label";
        label.textContent = seal.label;

        const index = document.createElement("small");
        index.textContent = String(challengeId).padStart(2, "0");

        content.append(iconWrap, number, label, index);
        slot.appendChild(content);
      } else {
        slot.className = "seal-slot is-pending";
        slot.setAttribute("aria-label", `Seal ${challengeId} not yet recovered`);

        const content = document.createElement("div");
        content.className = "seal-slot-content";

        const marker = document.createElement("div");
        marker.className = "seal-slot-number";
        marker.textContent = "?";

        const label = document.createElement("div");
        label.className = "seal-slot-label";
        label.textContent = "LOCKED";

        const index = document.createElement("small");
        index.textContent = String(challengeId).padStart(2, "0");

        content.append(marker, label, index);
        slot.appendChild(content);
      }

      sealGrid.appendChild(slot);
    }

    sealGrid.setAttribute("aria-label", `${seals.length} recovered security seals`);
  }

  function applyRealProgress(team, previousTeam, animateNew) {
    const previousCompleted = previousTeam ? getCompletedSet(previousTeam) : new Set();
    const currentCompleted = getCompletedSet(team);

    resetIceBoard();

    freezeBoard.querySelectorAll(".challenge-tile").forEach(tile => {
      const challengeId = Number(tile.dataset.challenge);
      if (!currentCompleted.has(challengeId)) return;

      const shouldAnimate = Boolean(animateNew && !previousCompleted.has(challengeId));
      setTileRevealed(tile, true, shouldAnimate);
    });

    renderSealGrid(team);

    const allSealsRecovered = Number(team.completedCount) >= 8;

    if (team.finished) {
      setFinalSceneThawed(true);
      setFinalRouteVisible(false);
    } else if (allSealsRecovered) {
      setFinalSceneThawed(false);
      setFinalRouteVisible(true);
    }
  }

  function buildBulletinMessage(team) {
    if (iceDemoMode) {
      return "ICE DEMO: click frozen tiles to preview reveal. Backend progress is untouched.";
    }

    if (thawDemoMode) {
      return "THAW DEMO: the school is fully unfrozen and the non-snowy campus image is showing.";
    }

    if (progressDemoRaw) {
      return `PROGRESS DEMO: dashboard is simulating ${team.completedCount}/8 completed challenges.`;
    }

    if (team.finished) {
      return "SYSTEM RESTORED. The school is fully unfrozen.";
    }

    if (Number(team.completedCount) >= 8) {
      return "All eight seals are secure. Final route unlocked. The vault remains sealed.";
    }

    return bulletinLines[Math.floor(Math.random() * bulletinLines.length)];
  }

  function showVault(team, options = {}) {
    if (!team || Number(team.completedCount) < 8 || team.finished) {
      showMission(team);
      return;
    }

    currentChallengeId = null;

    const house = team.house || "";
    const houseLabel = team.houseName || houseNames[house] || house;

    vaultTeamName.textContent = team.teamName || "Emergency Team";
    vaultHouse.textContent = `${houseLabel} House`;

    startClientTimer(team);
    showScreen("vault");
    setStatus(`${team.teamName} has reached the emergency control vault.`);

    if (options.pushHistory !== false && window.location.hash !== "#vault") {
      window.history.pushState({ screen: "vault" }, "", "#vault");
    }
  }

  function showVictory(team) {
    currentChallengeId = null;
    stopBackgroundSync();

    const house = team.house || "";
    const houseLabel = team.houseName || houseNames[house] || house;

    victoryTeamName.textContent = team.teamName || "Emergency Team";
    victoryHouse.textContent = `${houseLabel} House`;
    victoryTime.textContent = formatElapsed(Number(team.elapsedSeconds) || 0);

    showScreen("victory");
    setStatus(`${team.teamName} restored the school systems.`);
  }

  function showMission(rawTeam, options = {}) {
    const team = applyDemoOverrides(rawTeam);
    const previousTeam = options.previousTeam ? applyDemoOverrides(options.previousTeam) : null;

    currentTeam = team;

    if (team.finished && options.forceBoard !== true) {
      showVictory(team);
      return;
    }

    const house = team.house || "";
    const houseLabel = team.houseName || houseNames[house] || house;
    const completed = Number(team.completedCount) || 0;
    const percent = Math.max(0, Math.min(100, (completed / 8) * 100));

    missionTeamName.textContent = team.teamName;
    missionHouse.textContent = `${houseLabel} House`;
    missionProgress.textContent = `${completed}/8`;
    sidebarProgress.textContent = `${completed} / 8`;
    statusMeterFill.style.width = `${percent}%`;

    if (houseAssets[house]) {
      dashboardHouseShield.src = houseAssets[house];
      dashboardHouseShield.alt = `${houseLabel} House shield`;
    }
    dashboardHouseMark.dataset.house = house;

    applyRealProgress(team, previousTeam, options.animateNew === true);

    if (completed >= 8) {
      missionState.innerHTML = '<i aria-hidden="true"></i> VAULT READY';
      setStatus(`${team.teamName} recovered all eight seals. Final vault unlocked.`);
    } else {
      missionState.innerHTML = '<i aria-hidden="true"></i> ACTIVE';
      setStatus(`${team.teamName} mission timer is running.`);
    }

    emergencyBulletin.textContent = buildBulletinMessage(team);

    startClientTimer(team);

    if (currentChallengeId) {
      updateChallengeChrome(team);
    }

    if (!options.skipScreen) {
      showScreen("mission");
      window.setTimeout(() => {
        routeFromCurrentHash();
      }, 0);
    }
  }

  function getChallengeDefinition(challengeId) {
    return challengeRegistry ? challengeRegistry.get(Number(challengeId)) : null;
  }

  function isChallengeComplete(team, challengeId) {
    const id = Number(challengeId);

    if (thawDemoMode) {
      return true;
    }

    const demoCompleted = parseProgressDemoList();

    if (demoCompleted) {
      return demoCompleted.includes(id);
    }

    return getCompletedSet(team).has(id);
  }

  function updateChallengeChrome(team) {
    if (!team || !currentChallengeId) return;

    const house = team.house || "";
    const houseLabel = team.houseName || houseNames[house] || house;
    const completed = Number(team.completedCount) || 0;
    const solved = isChallengeComplete(team, currentChallengeId);

    challengeTeamName.textContent = team.teamName || "Team";
    challengeHouse.textContent = `${houseLabel} House`;
    challengeProgress.textContent = `${completed} / 8`;

    challengeStatus.textContent = solved ? "COMPLETED" : "UNSOLVED";
    challengeStatusText.textContent = solved
      ? "This security seal has already been recovered."
      : "Recover its seal to clear this section of ice.";
    challengeStatusCard.classList.toggle("is-complete", solved);

    if (solved) {
      challengeAnswerInput.disabled = true;
      challengeSubmitButton.disabled = true;
    }
  }

  function configureChallengeSubmission(definition, team) {
    const solved = isChallengeComplete(team, definition.id);
    const submission = definition.submission || {};

    challengeAnswerLabel.textContent = submission.label || "Security answer";
    challengeAnswerInput.placeholder = submission.placeholder || "Challenge answer";
    challengeAnswerInput.value = "";
    challengeMessage.textContent = "";
    challengeMessage.classList.remove("is-success");

    const enabled = Boolean(submission.enabled) && !solved;
    challengeAnswerInput.disabled = !enabled;
    challengeSubmitButton.disabled = !enabled;

    challengeAnswerHelp.textContent = solved
      ? "This challenge is already complete."
      : enabled
        ? "Submit one team answer when you are confident."
        : "Answer submission will activate when this puzzle is installed.";

    challengeSubmitLabel.textContent = solved ? "Completed" : "Submit answer";
  }

  function renderChallenge(definition, team) {
    currentChallengeId = definition.id;

    challengeNumberLabel.textContent = String(definition.id).padStart(2, "0");
    challengeEyebrow.textContent = definition.eyebrow;
    challengeTitle.textContent = definition.title;
    challengeIntro.textContent = definition.intro;
    challengeDuration.textContent = definition.duration;

    challengeContent.innerHTML = "";

    if (typeof definition.render === "function") {
      definition.render(challengeContent, {
        team,
        challengeId: definition.id
      });
    }

    configureChallengeSubmission(definition, team);
    updateChallengeChrome(team);
  }

  function challengeHash(challengeId) {
    return `#challenge-${Number(challengeId)}`;
  }

  function readChallengeFromHash() {
    const match = String(window.location.hash || "").match(/^#challenge-(\d+)$/i);
    if (!match) return null;

    const id = Number(match[1]);
    return id >= 1 && id <= 8 ? id : null;
  }

  function openChallenge(challengeId, options = {}) {
    if (!currentTeam || !currentTeam.started) return;

    const id = Number(challengeId);
    const definition = getChallengeDefinition(id);

    if (!definition) {
      showDashboardToast("Challenge unavailable", "This challenge is not registered correctly.");
      return;
    }

    if (isChallengeComplete(currentTeam, id)) {
      const seal = sealDefinitions[id];
      showDashboardToast(
        `Challenge ${String(id).padStart(2, "0")} already solved`,
        seal ? `${seal.label} seal recovered. Code number ${seal.number}.` : "This seal has already been recovered."
      );
      return;
    }

    renderChallenge(definition, currentTeam);
    startClientTimer(currentTeam);
    showScreen("challenge");
    setStatus(`Challenge ${String(id).padStart(2, "0")}: ${definition.title}`);

    if (options.pushHistory !== false) {
      const desired = challengeHash(id);

      if (window.location.hash !== desired) {
        window.history.pushState(
          { screen: "challenge", challengeId: id },
          "",
          desired
        );
        challengeHistoryPushed = true;
      }
    }
  }

  function returnToMissionBoard(options = {}) {
    currentChallengeId = null;
    showMission(currentTeam);

    if (options.updateHistory === false) {
      return;
    }

    const cleanUrl = window.location.pathname + window.location.search;

    if (challengeHistoryPushed) {
      challengeHistoryPushed = false;
      window.history.back();
    } else {
      window.history.replaceState({ screen: "mission" }, "", cleanUrl);
    }
  }

  function routeFromCurrentHash() {
    if (!currentTeam || !currentTeam.started) {
      return false;
    }

    if (window.location.hash === "#vault") {
      if (Number(currentTeam.completedCount) >= 8 && !currentTeam.finished) {
        showVault(currentTeam, { pushHistory: false });
        return true;
      }

      window.history.replaceState(
        { screen: "mission" },
        "",
        window.location.pathname + window.location.search
      );
      showMission(currentTeam);
      return false;
    }

    const challengeId = readChallengeFromHash();

    if (!challengeId) {
      return false;
    }

    if (isChallengeComplete(currentTeam, challengeId)) {
      window.history.replaceState(
        { screen: "mission" },
        "",
        window.location.pathname + window.location.search
      );
      showMission(currentTeam);
      return false;
    }

    openChallenge(challengeId, { pushHistory: false });
    return true;
  }

  async function submitCurrentChallengeAnswer() {
    if (
      !currentSession ||
      !currentTeam ||
      !currentChallengeId ||
      challengeSubmitInFlight
    ) {
      return;
    }

    const definition = getChallengeDefinition(currentChallengeId);

    if (!definition || !definition.submission?.enabled) {
      return;
    }

    if (window.FREEZE_CONFIG?.OFFLINE_ANSWER_ENGINE_READY !== true) {
      challengeMessage.textContent =
        "Local challenge engine is not ready in this build.";
      challengeMessage.classList.remove("is-success");
      return;
    }

    const answer = challengeAnswerInput.value.trim();

    if (!answer) {
      challengeMessage.textContent = "Enter an answer before submitting.";
      challengeMessage.classList.remove("is-success");
      challengeAnswerInput.focus();
      return;
    }

    challengeSubmitInFlight = true;
    challengeSubmitButton.disabled = true;
    challengeAnswerInput.disabled = true;
    challengeSubmitLabel.textContent = "Checking…";
    challengeMessage.textContent = "";

    try {
      const result = await api.submitAnswer({
        ...currentSession,
        challengeId: currentChallengeId,
        answer
      });

      if (!result.correct) {
        challengeMessage.textContent = "Not quite. Check the evidence and try again.";
        challengeMessage.classList.remove("is-success");
        challengeAnswerInput.disabled = false;
        challengeSubmitButton.disabled = false;
        challengeSubmitLabel.textContent = "Submit answer";
        challengeAnswerInput.select();
        return;
      }

      challengeMessage.textContent = "ACCESS GRANTED · Security seal recovered.";
      challengeMessage.classList.add("is-success");
      challengeSubmitLabel.textContent = "Access granted";

      const previousTeam = currentTeam;
      const updatedTeam = result.team || await api.getTeamState(currentSession);

      currentTeam = updatedTeam;
      persistTeamSnapshot(updatedTeam);

      window.setTimeout(() => {
        currentChallengeId = null;
        window.history.replaceState(
          { screen: "mission" },
          "",
          window.location.pathname + window.location.search
        );
        showMission(updatedTeam, {
          previousTeam,
          animateNew: true
        });
      }, 300);
    } catch (error) {
      console.error("Challenge submission failed:", error);
      challengeMessage.textContent = mapApiError(error);
      challengeMessage.classList.remove("is-success");
      challengeAnswerInput.disabled = false;
      challengeSubmitButton.disabled = false;
      challengeSubmitLabel.textContent = "Submit answer";
    } finally {
      challengeSubmitInFlight = false;
    }
  }

  function persistTeamSnapshot(team) {
    if (!team || !team.teamId) return;
    stateStore.saveSnapshot(team);
  }

  function clearSessionAndReturnHome(message) {
    stopTimer();
    stopBackgroundSync();
    stateStore.clearSession();
    currentSession = null;
    currentTeam = null;
    currentChallengeId = null;
    challengeHistoryPushed = false;
    window.history.replaceState(
      { screen: "start" },
      "",
      window.location.pathname + window.location.search
    );
    registrationForm.reset();
    shownMembers = 2;

    document.querySelectorAll(".optional-member").forEach(field => {
      field.classList.add("is-hidden");
      const input = field.querySelector("input");
      if (input) input.value = "";
    });

    updateMemberControls();
    formMessage.textContent = "";
    showScreen("start");
    setStatus(message || "Emergency system awaiting response.");
  }

  function isDeadSessionError(error) {
    return Boolean(
      error &&
      ["INVALID_SESSION", "TEAM_NOT_FOUND", "MISSING_CREDENTIALS"].includes(error.code)
    );
  }

  async function restoreSavedSession() {
    if (restoring) return;
    restoring = true;

    retryConnectionButton.hidden = true;
    currentSession = stateStore.loadSession();

    if (!currentSession) {
      showScreen("start");
      setStatus("Emergency system awaiting response.");
      restoring = false;
      return;
    }

    try {
      const team = await api.getTeamState(currentSession);
      currentTeam = team;
      persistTeamSnapshot(team);

      if (team.started) {
        showMission(team, { animateNew: false });
        setStatus(`${team.teamName} restored instantly from this device.`);
      } else {
        revealTeam(team);
        setStatus(`${team.teamName} restored from this device. Timer has not started.`);
      }
    } catch (error) {
      console.error("Local session restore failed:", error);
      clearSessionAndReturnHome("The saved local team could not be restored. Start a new team.");
    } finally {
      restoring = false;
    }
  }

  function showDashboardToast(title, message) {
    dashboardToastTitle.textContent = title;
    dashboardToastText.textContent = message;
    dashboardToast.hidden = false;
    dashboardToast.classList.remove("is-visible");
    void dashboardToast.offsetWidth;
    dashboardToast.classList.add("is-visible");
    window.clearTimeout(showDashboardToast.timeoutId);
    showDashboardToast.timeoutId = window.setTimeout(() => {
      dashboardToast.classList.remove("is-visible");
      window.setTimeout(() => { dashboardToast.hidden = true; }, 220);
    }, 2200);
  }

  async function syncTeamStateSilently() {
    // Task 8A: canonical gameplay state already lives on this device.
    // No polling and no network request is required.
    if (!currentSession || !dashboardVisible) return;

    try {
      const team = await api.getTeamState(currentSession);
      currentTeam = team;
      persistTeamSnapshot(team);
    } catch (error) {
      console.warn("Local state refresh failed:", error);
    }
  }

  function startBackgroundSync() {
    // Intentionally empty in the offline-first foundation.
    stopBackgroundSync();
  }

  function stopBackgroundSync() {
    if (syncInterval) {
      window.clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  freezeBoard.addEventListener("click", event => {
    const tile = event.target.closest(".challenge-tile");
    if (!tile) return;

    const challengeNumber = Number(tile.dataset.challenge || 0);
    const title = tile.querySelector(".tile-title")?.textContent || "Challenge";

    if (iceDemoMode) {
      const alreadyRevealed = tile.classList.contains("is-revealed");
      if (!alreadyRevealed) {
        setTileRevealed(tile, true, true);
      }

      const remainingFrozen = freezeBoard.querySelectorAll(".challenge-tile:not(.is-revealed):not(.is-revealing)").length;

      if (remainingFrozen === 0) {
        window.setTimeout(() => {
          setFinalSceneThawed(false);
          setFinalRouteVisible(true);
          showDashboardToast(
            "Final route unlocked",
            "All eight ice sections are clear. Follow the pink route to the emergency vault."
          );
        }, 700);
      } else {
        showDashboardToast(
          `Ice section ${String(challengeNumber).padStart(2, "0")} released`,
          "6C visual demo only. No backend progress was changed."
        );
      }
      return;
    }

    const demoCompleted = parseProgressDemoList();

    if (demoCompleted) {
      if (demoCompleted.includes(challengeNumber)) {
        const seal = sealDefinitions[challengeNumber];
        showDashboardToast(
          `Challenge ${String(challengeNumber).padStart(2, "0")} already solved`,
          seal ? `${seal.label} seal recovered. Code number ${seal.number}.` : "This seal has already been recovered."
        );
        return;
      }

      openChallenge(challengeNumber);
      return;
    }

    if (tile.classList.contains("is-revealed")) {
      const seal = sealDefinitions[challengeNumber];
      showDashboardToast(
        `Challenge ${String(challengeNumber).padStart(2, "0")} already solved`,
        seal ? `${seal.label} seal recovered. Code number ${seal.number}.` : "This seal has already been recovered."
      );
      return;
    }

    openChallenge(challengeNumber);
  });

  challengeBackButton.addEventListener("click", () => {
    returnToMissionBoard();
  });

  challengeFieldKitButton.addEventListener("click", () => {
    window.FREEZE_FIELD_KIT?.open();
  });

  challengeAnswerForm.addEventListener("submit", event => {
    event.preventDefault();
    submitCurrentChallengeAnswer();
  });

  window.addEventListener("popstate", () => {
    if (!currentTeam || !currentTeam.started) return;

    if (window.location.hash === "#vault") {
      challengeHistoryPushed = false;
      showVault(currentTeam, { pushHistory: false });
      return;
    }

    const challengeId = readChallengeFromHash();

    if (challengeId) {
      challengeHistoryPushed = false;
      openChallenge(challengeId, { pushHistory: false });
      return;
    }

    currentChallengeId = null;
    showMission(currentTeam);
  });

  proceedToVaultButton.addEventListener("click", () => {
    if (!currentTeam || Number(currentTeam.completedCount) < 8 || currentTeam.finished) return;
    showVault(currentTeam);
  });

  vaultBackButton.addEventListener("click", () => {
    window.history.replaceState(
      { screen: "mission" },
      "",
      window.location.pathname + window.location.search
    );
    showMission(currentTeam, { forceBoard: true });
  });

  vaultFieldKitButton.addEventListener("click", () => {
    window.FREEZE_FIELD_KIT?.open();
  });

  victoryLeaderboardButton.addEventListener("click", () => {
    window.FREEZE_LEADERBOARD?.open("teams");
  });

  fieldKitButton.addEventListener("click", () => {
    window.FREEZE_FIELD_KIT?.open();
  });

  leaderboardButton.addEventListener("click", () => {
    window.FREEZE_LEADERBOARD?.open("teams");
  });

  function applyResetQueryParameter() {
    const url = new URL(window.location.href);

    if (url.searchParams.get("reset") !== "1") {
      return;
    }

    stateStore.clearSession();
    url.searchParams.delete("reset");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  beginButton.addEventListener("click", () => {
    showScreen("register");
    setStatus("Emergency response team registration in progress.");
  });

  brandHome.addEventListener("click", () => {
    if (currentTeam && currentTeam.started) {
      currentChallengeId = null;
      window.history.replaceState(
        { screen: currentTeam.finished ? "victory" : "mission" },
        "",
        window.location.pathname + window.location.search
      );

      if (currentTeam.finished) {
        showVictory(currentTeam);
      } else {
        showMission(currentTeam, { forceBoard: true });
      }
      return;
    }

    if (currentTeam && currentSession) {
      revealTeam(currentTeam);
      return;
    }

    showScreen("start");
    setStatus("Emergency system awaiting response.");
  });

  addMemberButton.addEventListener("click", addMemberField);

  registrationForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (registrationSubmit.disabled) return;

    const error = validateRegistration();

    if (error) {
      formMessage.textContent = error;
      return;
    }

    const house = registrationForm.elements.house.value;
    const students = collectStudents();

    formMessage.textContent = "";
    setRegistrationBusy(true);
    setStatus("Creating this team on this device…");

    try {
      const team = await api.registerTeam({
        house,
        students
      });

      currentSession = stateStore.saveSession(team.teamId, team.token);

      currentTeam = {
        ...team
      };
      delete currentTeam.token;

      persistTeamSnapshot(currentTeam);
      revealTeam(currentTeam);
    } catch (error) {
      console.error("Registration failed:", error);
      formMessage.textContent = mapApiError(error);
      setStatus("Registration could not be completed.");
    } finally {
      setRegistrationBusy(false);
    }
  });

  startMissionButton.addEventListener("click", async () => {
    if (!currentSession || startMissionButton.disabled) return;

    setStartBusy(true);
    setStatus("Starting mission timer on this device…");

    try {
      const team = await api.startMission(currentSession);
      currentTeam = team;
      persistTeamSnapshot(team);
      showMission(team);
    } catch (error) {
      console.error("Could not start mission:", error);

      if (isDeadSessionError(error)) {
        clearSessionAndReturnHome("Team session expired. Please register again.");
        return;
      }

      const warning = document.getElementById("startMissionError");
      warning.textContent = mapApiError(error);
      warning.hidden = false;
      setStatus("Mission could not be started.");
    } finally {
      setStartBusy(false);
    }
  });

  retryConnectionButton.addEventListener("click", restoreSavedSession);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && dashboardVisible) {
      syncTeamStateSilently();
    }
  });

  window.addEventListener("beforeunload", () => {
    stopBackgroundSync();
    window.FREEZE_SYNC_TRANSPORT?.stop();
  });

  window.FREEZE_SYNC_TRANSPORT?.start();
  window.FREEZE_FIELD_KIT?.initialise();
  window.FREEZE_LEADERBOARD?.initialiseOverlay();

  applyResetQueryParameter();
  updateMemberControls();
  restoreSavedSession();
})();
