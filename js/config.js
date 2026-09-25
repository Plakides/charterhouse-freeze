(() => {
  "use strict";

  window.FREEZE_CONFIG = Object.freeze({
    GAME_TITLE: "The Great Charterhouse Freeze",
    MIN_TEAM_SIZE: 2,
    MAX_TEAM_SIZE: 4,

    // V2 foundation: gameplay state is authoritative on this device.
    MODE: "offline-first",
    SCHEMA_VERSION: 2,

    // Task 8F: gameplay stays local; only the tiny leaderboard queue syncs.
    SYNC_ENABLED: true,
    SYNC_URL: "https://charterhouse-freeze-leaderboard.p-plakides.workers.dev",
    SYNC_TIMEOUT_MS: 2500,
    SYNC_INTERVAL_MS: 45000,

    // Task 8C uses the generic normalized/hashed local answer engine.
    // Challenge 01 is currently the only authored/active puzzle.
    OFFLINE_ANSWER_ENGINE_READY: true,
    LOCAL_PROGRESS_ENGINE_READY: true
  });
})();
