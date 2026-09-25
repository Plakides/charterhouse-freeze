(() => {
  "use strict";

  const HOUSE_CODES = Object.freeze({
    "thackeray": "TH",
    "baden-powell": "BP",
    "wesley": "WE",
    "portman": "PO"
  });

  const CODE_HOUSES = Object.freeze({
    TH: "thackeray",
    BP: "baden-powell",
    WE: "wesley",
    PO: "portman"
  });

  function elapsedSeconds(team) {
    if (!team) return 0;

    if (Number.isFinite(Number(team.elapsedSeconds))) {
      return Math.max(0, Math.floor(Number(team.elapsedSeconds)));
    }

    if (!team.startTime) return 0;

    const start = new Date(team.startTime).getTime();
    if (!Number.isFinite(start)) return 0;

    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  }

  function teamFragment(team) {
    const clean = String(team?.teamId || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    return clean.slice(-4).padStart(4, "X");
  }

  function checksum(payload) {
    let hash = 2166136261;

    for (let index = 0; index < payload.length; index += 1) {
      hash ^= payload.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return (hash % 1296)
      .toString(36)
      .toUpperCase()
      .padStart(2, "0");
  }

  function createResultCode(team) {
    if (!team || !team.teamId) return "NO-RESULT";

    const houseCode = HOUSE_CODES[team.house] || "XX";
    const progress = Math.max(
      0,
      Math.min(8, Number(team.completedCount ?? team.completed?.length) || 0)
    );
    const fragment = teamFragment(team);
    const elapsed = elapsedSeconds(team);
    const timeCode = Math.min(elapsed, 1679615)
      .toString(36)
      .toUpperCase()
      .padStart(3, "0");

    const payload = `R1-${houseCode}-${progress}-${fragment}-${timeCode}`;
    return `${payload}-${checksum(payload)}`;
  }

  function parseResultCode(code) {
    const value = String(code || "").trim().toUpperCase();
    const match = value.match(
      /^R1-(TH|BP|WE|PO|XX)-([0-8])-([A-Z0-9]{4})-([A-Z0-9]{3,4})-([A-Z0-9]{2})$/
    );

    if (!match) {
      return { valid: false, reason: "format" };
    }

    const payload = value.slice(0, value.lastIndexOf("-"));
    const expected = checksum(payload);
    const actual = match[5];

    if (expected !== actual) {
      return { valid: false, reason: "checksum", expected, actual };
    }

    const elapsed = parseInt(match[4], 36);

    return {
      valid: true,
      version: 1,
      house: CODE_HOUSES[match[1]] || null,
      houseCode: match[1],
      completedCount: Number(match[2]),
      teamFragment: match[3],
      elapsedSeconds: Number.isFinite(elapsed) ? elapsed : 0,
      checksum: actual
    };
  }

  function formatElapsed(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function createRecoverySummary(team) {
    if (!team) return "No local Charterhouse Freeze team found.";

    return [
      "THE GREAT CHARTERHOUSE FREEZE · EMERGENCY RESULT",
      `Team: ${team.teamName || "Emergency Team"}`,
      `House: ${team.houseName || team.house || "Unknown"}`,
      `Progress: ${Number(team.completedCount ?? team.completed?.length) || 0}/8`,
      `Elapsed: ${formatElapsed(elapsedSeconds(team))}`,
      `Finished: ${team.finished ? "YES" : "NO"}`,
      `Reference: ${createResultCode(team)}`,
      `Team ID: ${team.teamId || "—"}`
    ].join("\n");
  }

  window.FREEZE_RECOVERY = Object.freeze({
    createResultCode,
    parseResultCode,
    createRecoverySummary,
    elapsedSeconds
  });
})();
