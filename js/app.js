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
    mission: document.getElementById("screenMission")
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

  const bootMessage = document.getElementById("bootMessage");
  const retryConnectionButton = document.getElementById("retryConnectionButton");
  const statusCopy = document.getElementById("statusCopy");

  const houseNames = {
    "thackeray": "Thackeray",
    "baden-powell": "Baden-Powell",
    "wesley": "Wesley",
    "portman": "Portman"
  };

  let shownMembers = 2;
  let currentSession = null;
  let currentTeam = null;
  let timerInterval = null;
  let restoring = false;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, section]) => {
      if (!section) return;
      const active = key === name;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });

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

    const count = Array.isArray(team.students) ? team.students.length : 0;
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
      missionTimer.textContent = formatElapsed(Number(team.elapsedSeconds));
      return;
    }

    const startMs = team.startTime ? new Date(team.startTime).getTime() : NaN;

    if (!Number.isFinite(startMs)) {
      missionTimer.textContent = "--:--";
      return;
    }

    const update = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      missionTimer.textContent = formatElapsed(elapsed);
    };

    update();
    timerInterval = window.setInterval(update, 1000);
  }

  function showMission(team) {
    currentTeam = team;

    missionTeamName.textContent = team.teamName;
    missionHouse.textContent = `${team.houseName || houseNames[team.house] || team.house} House`;

    const completed = Number(team.completedCount) || 0;
    missionProgress.textContent = `${completed}/8 security seals recovered`;

    if (team.finished) {
      missionState.textContent = "MISSION COMPLETE";
      missionProgress.textContent = "All systems restored";
      setStatus(`${team.teamName} completed the mission.`);
    } else {
      missionState.textContent = "MISSION ACTIVE";
      setStatus(`${team.teamName} mission timer is running.`);
    }

    startClientTimer(team);
    showScreen("mission");
  }

  function clearSessionAndReturnHome(message) {
    stopTimer();
    stateStore.clearSession();
    currentSession = null;
    currentTeam = null;
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
    bootMessage.textContent = "Checking this device for an existing emergency team…";
    showScreen("boot");
    setStatus("Checking for an existing mission session…");

    try {
      currentSession = stateStore.loadSession();

      if (!currentSession) {
        showScreen("start");
        setStatus("Emergency system awaiting response.");
        return;
      }

      bootMessage.textContent = "Existing team found. Reconnecting to Charterhouse emergency control…";

      const team = await api.getTeamState(currentSession);
      currentTeam = team;

      if (team.started) {
        showMission(team);
      } else {
        revealTeam(team);
        setStatus(`${team.teamName} session restored. Timer has not started.`);
      }
    } catch (error) {
      console.error("Session restore failed:", error);

      if (isDeadSessionError(error)) {
        clearSessionAndReturnHome("Saved session was no longer valid. Start a new team.");
        return;
      }

      bootMessage.textContent =
        "The saved team is still on this device, but the emergency network could not be reached.";
      retryConnectionButton.hidden = false;
      setStatus("Could not reconnect. Saved team has not been erased.");
    } finally {
      restoring = false;
    }
  }

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
      showMission(currentTeam);
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
    setStatus("Contacting Charterhouse emergency network…");

    try {
      const team = await api.registerTeam({
        house,
        students
      });

      currentSession = stateStore.saveSession(team.teamId, team.token);

      // Do not keep the bearer token in the normal team object used by the UI.
      currentTeam = {
        ...team
      };
      delete currentTeam.token;

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
    setStatus("Starting mission timer…");

    try {
      const team = await api.startMission(currentSession);
      currentTeam = team;
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

  applyResetQueryParameter();
  updateMemberControls();
  restoreSavedSession();
})();
