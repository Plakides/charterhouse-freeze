(() => {
  "use strict";

  const config = window.FREEZE_CONFIG || {};
  const stateStore = window.FREEZE_STATE;
  const answerEngine = window.FREEZE_ANSWER_ENGINE;
  const syncQueue = window.FREEZE_SYNC_QUEUE;

  if (!stateStore) {
    throw new Error("FREEZE_STATE must load before FREEZE_API.");
  }

  if (!answerEngine) {
    throw new Error("FREEZE_ANSWER_ENGINE must load before FREEZE_API.");
  }

  if (!syncQueue) {
    throw new Error("FREEZE_SYNC_QUEUE must load before FREEZE_API.");
  }

  class FreezeApiError extends Error {
    constructor(code, message, details = null) {
      super(message || "The local game engine returned an error.");
      this.name = "FreezeApiError";
      this.code = code || "LOCAL_ERROR";
      this.details = details;
    }
  }

  const houseNames = Object.freeze({
    "thackeray": "Thackeray",
    "baden-powell": "Baden-Powell",
    "wesley": "Wesley",
    "portman": "Portman"
  });


  const sealDefinitions = Object.freeze({
    1: Object.freeze({ challengeId: 1, symbol: "snow-leopard", number: 4, label: "Snow Leopard" }),
    2: Object.freeze({ challengeId: 2, symbol: "mountain", number: 8, label: "Mountain" }),
    3: Object.freeze({ challengeId: 3, symbol: "book", number: 2, label: "Book" }),
    4: Object.freeze({ challengeId: 4, symbol: "teapot", number: 7, label: "Teapot" }),
    5: Object.freeze({ challengeId: 5, symbol: "eagle", number: 5, label: "Eagle" }),
    6: Object.freeze({ challengeId: 6, symbol: "snowflake", number: 1, label: "Snowflake" }),
    7: Object.freeze({ challengeId: 7, symbol: "key", number: 9, label: "Key" }),
    8: Object.freeze({ challengeId: 8, symbol: "compass", number: 3, label: "Compass" })
  });

  const adjectives = Object.freeze([
    "Suspicious", "Frozen", "Brave", "Mysterious", "Clever", "Slightly-Lost",
    "Rapid", "Secret", "Icy", "Unreasonably-Calm", "Heroic", "Sneaky",
    "Curious", "Electric", "Legendary", "Emergency", "Mountain", "Midnight",
    "Unstoppable", "Shivering", "Bold", "Chaotic", "Stealthy", "Glorious",
    "Turbo", "Frosty", "Fearless", "Puzzled", "Resourceful", "Unfrozen",
    "Daring", "Hidden", "Arctic", "Noble", "Restless", "Brilliant",
    "Swift", "Wandering", "Crackling", "Reluctant", "Victorious", "Watchful",
    "Snowy", "Cryptic", "Tactical", "Unimpressed", "Accidental", "Magnificent"
  ]);

  const nouns = Object.freeze([
    "Baursaks", "Snow Leopards", "Eagles", "Explorers", "Teapots", "Compass Crew",
    "Mountaineers", "Detectives", "Penguins", "Alchemists", "Yurts", "Ravens",
    "Nomads", "Codebreakers", "Lanterns", "Yetis", "Foxes", "Marmots",
    "Icicles", "Sherlocks", "Trailblazers", "Khans", "Falcons", "Mittens",
    "Glaciers", "Riddlers", "Wolves", "Pioneers", "Snowballs", "Archivists",
    "Scouts", "Keymasters", "Mapmakers", "Voyagers", "Inventors", "Guardians",
    "Clue Hunters", "Icebreakers", "Owls", "Pathfinders", "Samovars", "Alpinists",
    "Puzzle Guild", "Emergency Biscuits", "Frost Patrol", "Vault Hunters",
    "Mountain Goats", "Secret Society"
  ]);

  function randomBytes(length) {
    const bytes = new Uint8Array(length);

    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
      return bytes;
    }

    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }

    return bytes;
  }

  function randomString(length = 12) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = randomBytes(length);
    return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
  }

  function choose(values) {
    const bytes = randomBytes(2);
    const value = (bytes[0] << 8) + bytes[1];
    return values[value % values.length];
  }

  function generateTeamName() {
    return `${choose(adjectives)} ${choose(nouns)}`;
  }

  function normaliseStudents(values) {
    return Array.isArray(values)
      ? values.map(value => String(value || "").trim()).filter(Boolean)
      : [];
  }

  function validateRegistration(house, students) {
    if (!houseNames[house]) {
      throw new FreezeApiError("INVALID_HOUSE", "Choose one of the four Houses.");
    }

    if (
      students.length < Number(config.MIN_TEAM_SIZE || 2) ||
      students.length > Number(config.MAX_TEAM_SIZE || 4)
    ) {
      throw new FreezeApiError(
        "INVALID_TEAM_SIZE",
        "Teams must contain between two and four students."
      );
    }

    const lowered = students.map(name => name.toLocaleLowerCase());
    if (new Set(lowered).size !== lowered.length) {
      throw new FreezeApiError(
        "DUPLICATE_STUDENT",
        "Each team member should only be entered once."
      );
    }

    if (students.some(name => name.length > 50)) {
      throw new FreezeApiError(
        "STUDENT_NAME_TOO_LONG",
        "One of those names is too long. First names only, please."
      );
    }
  }

  function assertSession(payload) {
    const teamId = String(payload && (payload.teamId || payload.TeamID) || "").trim();
    const token = String(payload && (payload.token || payload.SessionToken) || "").trim();
    const game = stateStore.loadGame();

    if (!teamId || !token) {
      throw new FreezeApiError(
        "MISSING_CREDENTIALS",
        "This device does not have a complete local team session."
      );
    }

    if (!game || game.team.teamId !== teamId || game.team.token !== token) {
      throw new FreezeApiError(
        "INVALID_SESSION",
        "This local team session could not be restored."
      );
    }

    return game;
  }

  function publicTeam(game) {
    return stateStore.toPublicTeam(game.team);
  }

  function formatElapsed(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  async function registerTeam(payload = {}) {
    const house = String(payload.house || "").trim();
    const students = normaliseStudents(payload.students);

    validateRegistration(house, students);

    const now = new Date().toISOString();
    const team = {
      teamId: `CF-${randomString(8)}`,
      token: randomString(32),
      teamName: generateTeamName(),
      house,
      houseName: houseNames[house],
      students,
      studentCount: students.length,
      registeredTime: now,
      startTime: null,
      completed: [],
      seals: [],
      finishTime: null,
      elapsedSeconds: null,
      status: "REGISTERED",
      started: false,
      finished: false
    };

    const game = stateStore.createGame(team);
    syncQueue.enqueue("REGISTER");
    const saved = stateStore.loadGame();

    return {
      ...publicTeam(saved),
      token: saved.team.token
    };
  }

  async function startMission(payload = {}) {
    assertSession(payload);

    const wasStarted = Boolean(stateStore.loadGame()?.team?.started);

    const saved = stateStore.updateGame(draft => {
      if (!draft.team.startTime) {
        draft.team.startTime = new Date().toISOString();
      }

      draft.team.started = true;
      draft.team.status = "ACTIVE";
      return draft;
    });

    if (!wasStarted) {
      syncQueue.enqueue("START");
    }

    return publicTeam(stateStore.loadGame() || saved);
  }

  async function getTeamState(payload = {}) {
    const game = assertSession(payload);
    return publicTeam(game);
  }

  async function submitAnswer(payload = {}) {
    const game = assertSession(payload);

    if (!game.team.started) {
      throw new FreezeApiError(
        "MISSION_NOT_STARTED",
        "Start the mission before submitting challenge answers."
      );
    }

    const challengeId = Number(payload.challengeId);
    const answer = String(payload.answer || "");

    if (!Number.isInteger(challengeId) || challengeId < 1 || challengeId > 8) {
      throw new FreezeApiError(
        "INVALID_CHALLENGE",
        "That challenge number is not valid."
      );
    }

    const alreadySolved = Array.isArray(game.team.completed) &&
      game.team.completed.map(Number).includes(challengeId);

    if (alreadySolved) {
      return {
        correct: true,
        alreadySolved: true,
        seal: sealDefinitions[challengeId],
        team: publicTeam(game)
      };
    }

    const verdict = await answerEngine.validate(challengeId, answer);

    if (!verdict.known) {
      throw new FreezeApiError(
        "CHALLENGE_NOT_READY",
        "This challenge does not have a local answer definition yet."
      );
    }

    if (!verdict.correct) {
      return {
        correct: false,
        alreadySolved: false,
        seal: null,
        team: publicTeam(game)
      };
    }

    const seal = sealDefinitions[challengeId];
    const saved = stateStore.completeChallenge(challengeId, seal);
    syncQueue.enqueue("PROGRESS");
    const queuedState = stateStore.loadGame() || saved;

    return {
      correct: true,
      alreadySolved: false,
      seal,
      team: publicTeam(queuedState)
    };
  }

  async function submitFinalCode(payload = {}) {
    assertSession(payload);

    throw new FreezeApiError(
      "OFFLINE_VALIDATION_PENDING",
      "The local final-vault engine is not enabled in Task 8A."
    );
  }

  async function getLeaderboard() {
    const game = stateStore.loadGame();
    const team = game ? publicTeam(game) : null;

    if (!team || !team.started) {
      return {
        generatedAt: new Date().toISOString(),
        teamCount: 0,
        escapedTeamCount: 0,
        teams: [],
        houses: []
      };
    }

    const completed = Number(team.completedCount) || 0;
    const elapsed = Number(team.elapsedSeconds) || 0;
    const progress = (completed / 8) * 100;

    return {
      generatedAt: new Date().toISOString(),
      teamCount: 1,
      escapedTeamCount: team.finished ? 1 : 0,
      teams: [{
        teamName: team.teamName,
        house: team.house,
        houseName: team.houseName,
        completed,
        finished: team.finished,
        elapsedSeconds: elapsed,
        elapsedDisplay: team.finished ? formatElapsed(elapsed) : null,
        rank: team.finished ? 1 : null
      }],
      houses: [{
        house: team.house,
        houseName: team.houseName,
        rank: 1,
        teams: 1,
        escapedTeams: team.finished ? 1 : 0,
        averageProgress: progress,
        averageEscapeDisplay: team.finished ? formatElapsed(elapsed) : "—"
      }]
    };
  }

  window.FREEZE_API = Object.freeze({
    mode: "local",
    registerTeam,
    startMission,
    getTeamState,
    submitAnswer,
    getLeaderboard,
    submitFinalCode
  });

  window.FreezeApiError = FreezeApiError;
})();
