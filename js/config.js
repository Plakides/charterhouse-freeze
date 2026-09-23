(() => {
  "use strict";

  window.FREEZE_CONFIG = Object.freeze({
    GAME_TITLE: "The Great Charterhouse Freeze",
    MIN_TEAM_SIZE: 2,
    MAX_TEAM_SIZE: 4,

    // V2 foundation: gameplay state is authoritative on this device.
    MODE: "offline-first",
    SCHEMA_VERSION: 2,

    // Cloud sync is deliberately OFF in Task 8A.
    // It will be introduced later as optional leaderboard-only sync.
    SYNC_ENABLED: false,
    SYNC_URL: null,

    // Task 8A proves registration/start/restore without network.
    // Local challenge validation arrives in Tasks 8B/8C.
    OFFLINE_ANSWER_ENGINE_READY: false
  });
})();
