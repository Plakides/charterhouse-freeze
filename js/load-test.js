(() => {
  "use strict";

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const houses = ["thackeray", "baden-powell", "wesley", "portman"];

  const workerUrlInput = document.getElementById("workerUrl");
  const teamCountInput = document.getElementById("teamCount");
  const concurrencyInput = document.getElementById("concurrency");
  const confirmWrite = document.getElementById("confirmWrite");
  const runButton = document.getElementById("runButton");
  const healthButton = document.getElementById("healthButton");
  const boardButton = document.getElementById("boardButton");
  const status = document.getElementById("status");
  const phaseRows = document.getElementById("phaseRows");
  const log = document.getElementById("log");
  const cleanupSql = document.getElementById("cleanupSql");
  const copyCleanup = document.getElementById("copyCleanup");
  const metricTeams = document.getElementById("metricTeams");
  const metricRequests = document.getElementById("metricRequests");
  const metricEvents = document.getElementById("metricEvents");
  const metricTime = document.getElementById("metricTime");
  const metricVerdict = document.getElementById("metricVerdict");

  let requestCount = 0;
  let eventCount = 0;
  let currentCleanupSql = "";

  if (window.FREEZE_CONFIG?.SYNC_URL) {
    workerUrlInput.value = window.FREEZE_CONFIG.SYNC_URL;
  }

  function baseUrl() {
    return workerUrlInput.value.trim().replace(/\/+$/, "");
  }

  function randomToken(length = 8) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
  }

  function makeRunId() {
    return `${Date.now().toString(36).toUpperCase()}${randomToken(4)}`
      .replace(/[^A-Z0-9]/g, "")
      .slice(-12);
  }

  function uniqueTeamIds(count) {
    const ids = new Set();
    while (ids.size < count) ids.add(`CF-${randomToken(8)}`);
    return Array.from(ids);
  }

  function createTeams(runId, count) {
    const ids = uniqueTeamIds(count);
    return ids.map((teamId, index) => {
      const progress = 1 + (index % 7);
      const finished = index % 4 === 0;
      const progressElapsed = 300 + index * 2;
      const finishElapsed = 1200 + index * 3;
      return {
        runId,
        index,
        teamId,
        teamName: `LOADTEST-${runId}-${String(index + 1).padStart(3, "0")}`,
        house: houses[index % houses.length],
        progress,
        finished,
        progressElapsed,
        finishElapsed,
        expectedFinal: {
          completedCount: finished ? 8 : progress,
          finished,
          elapsedSeconds: finished ? finishElapsed : progressElapsed,
          seq: finished ? 21 : 10
        }
      };
    });
  }

  function eventFor(team, seq, type, completedCount, elapsedSeconds, finished = false) {
    return {
      eventId: `${team.teamId}-${seq}-${type}-${team.runId}`,
      seq,
      type,
      createdAt: new Date().toISOString(),
      teamId: team.teamId,
      teamName: team.teamName,
      house: team.house,
      completedCount,
      elapsedSeconds,
      finished,
      finishTime: finished
        ? new Date(Date.now() - 10000 + team.index * 1000).toISOString()
        : null
    };
  }

  async function parseResponse(response) {
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; }
    catch { throw new Error(`Unreadable response (${response.status}): ${text.slice(0,160)}`); }
    return body;
  }

  async function sendBatch(events) {
    requestCount += 1;
    eventCount += events.length;
    const response = await fetch(`${baseUrl()}/sync`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ events }),
      cache: "no-store"
    });
    const body = await parseResponse(response);
    if (!response.ok || !body?.ok) {
      throw new Error(body?.error?.message || `Sync failed (${response.status}).`);
    }
    return body;
  }

  function chunk(items, size = 25) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  async function pool(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function runner() {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index], index);
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, limit) }, runner));
    return results;
  }

  async function runPhase(name, events, concurrency, expectedApplied, expectedStale) {
    status.textContent = `Running ${name}…`;
    const started = performance.now();
    const responses = await pool(chunk(events), concurrency, sendBatch);
    const applied = responses.reduce((sum, r) => sum + Number(r.applied || 0), 0);
    const stale = responses.reduce((sum, r) => sum + Number(r.duplicateOrStale || 0), 0);
    return {
      name, events: events.length, applied, stale,
      elapsed: performance.now() - started,
      passed: applied === expectedApplied && stale === expectedStale,
      expectedApplied, expectedStale
    };
  }

  function addPhaseRow(result) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${result.name}</td>
      <td>${result.events}</td>
      <td>${result.expectedApplied} applied / ${result.expectedStale} stale</td>
      <td>${result.applied} applied / ${result.stale} stale</td>
      <td>${Math.round(result.elapsed)} ms</td>
      <td class="${result.passed ? "pass" : "fail"}">${result.passed ? "PASS" : "FAIL"}</td>`;
    phaseRows.appendChild(row);
  }

  async function readLeaderboard() {
    requestCount += 1;
    const response = await fetch(`${baseUrl()}/leaderboard`, { cache: "no-store" });
    const body = await parseResponse(response);
    if (!response.ok || !body?.ok) throw new Error(`Leaderboard read failed (${response.status}).`);
    return body;
  }

  function setVerdict(pass) {
    metricVerdict.textContent = pass ? "PASS" : "FAIL";
    metricVerdict.className = pass ? "pass" : "fail";
  }

  async function runFullTest() {
    if (!confirmWrite.checked) return;
    runButton.disabled = true; healthButton.disabled = true; boardButton.disabled = true;
    requestCount = 0; eventCount = 0; phaseRows.innerHTML = ""; log.textContent = "";
    metricTeams.textContent = metricRequests.textContent = metricEvents.textContent = metricTime.textContent = "—";
    metricVerdict.textContent = "RUNNING"; metricVerdict.className = "";

    const count = Number(teamCountInput.value) || 50;
    const concurrency = Number(concurrencyInput.value) || 4;
    const runId = makeRunId();
    const teams = createTeams(runId, count);
    const started = performance.now();
    currentCleanupSql = `DELETE FROM leaderboard_teams\nWHERE team_name LIKE 'LOADTEST-${runId}-%';`;
    cleanupSql.textContent = currentCleanupSql; copyCleanup.disabled = false;

    try {
      status.textContent = "Checking Worker health…";
      requestCount += 1;
      const hr = await fetch(`${baseUrl()}/health`, { cache: "no-store" });
      const hb = await parseResponse(hr);
      if (!hr.ok || !hb?.ok || hb.database !== "reachable") throw new Error("Worker health check failed.");

      const phases = [];
      phases.push(await runPhase("Register burst", teams.map(t => eventFor(t,1,"REGISTER",0,0,false)), concurrency, count, 0));
      phases.push(await runPhase("Start burst", teams.map(t => eventFor(t,2,"START",0,5,false)), concurrency, count, 0));
      const progress = teams.map(t => eventFor(t,10,"PROGRESS",t.progress,t.progressElapsed,false));
      phases.push(await runPhase("Newer progress", progress, concurrency, count, 0));
      phases.push(await runPhase("Exact duplicates", progress, concurrency, 0, count));
      phases.push(await runPhase("Out-of-order stale", teams.map(t => eventFor(t,5,"PROGRESS",Math.max(0,t.progress-1),Math.max(0,t.progressElapsed-90),false)), concurrency, 0, count));

      const finished = teams.filter(t => t.finished);
      phases.push(await runPhase("Finish subset", finished.map(t => eventFor(t,20,"FINISH",8,t.finishElapsed,true)), concurrency, finished.length, 0));
      phases.push(await runPhase("Finish regression attack", finished.map(t => eventFor(t,21,"PROGRESS",7,t.finishElapsed+180,false)), concurrency, finished.length, 0));
      phases.forEach(addPhaseRow);

      status.textContent = "Verifying final shared leaderboard state…";
      const board = await readLeaderboard();
      const prefix = `LOADTEST-${runId}-`;
      const rows = (Array.isArray(board.teams) ? board.teams : []).filter(t => String(t.teamName || "").startsWith(prefix));
      const byId = new Map(rows.map(t => [t.teamId, t]));
      const errors = [];
      if (rows.length !== count) errors.push(`Expected ${count} test rows, found ${rows.length}. Clean old LOADTEST rows and retry if the 250-row leaderboard limit was reached.`);

      for (const team of teams) {
        const row = byId.get(team.teamId);
        if (!row) { errors.push(`Missing ${team.teamName}.`); continue; }
        const e = team.expectedFinal;
        if (Number(row.completedCount) !== e.completedCount) errors.push(`${team.teamName}: completed=${row.completedCount}, expected ${e.completedCount}`);
        if (Boolean(row.finished) !== e.finished) errors.push(`${team.teamName}: finished=${row.finished}, expected ${e.finished}`);
        if (Number(row.elapsedSeconds) !== e.elapsedSeconds) errors.push(`${team.teamName}: elapsed=${row.elapsedSeconds}, expected ${e.elapsedSeconds}`);
        if (Number(row.seq) !== e.seq) errors.push(`${team.teamName}: seq=${row.seq}, expected ${e.seq}`);
      }

      status.textContent = "Checking invalid-data rejection…";
      requestCount += 1; eventCount += 1;
      const invalid = {
        eventId:`INVALID-${runId}`, seq:99, type:"PROGRESS", createdAt:new Date().toISOString(),
        teamId:"CF-BADBAD22", teamName:`LOADTEST-${runId}-MALFORMED`, house:"baden-powell",
        completedCount:9, elapsedSeconds:60, finished:false, finishTime:null
      };
      const ir = await fetch(`${baseUrl()}/sync`, { method:"POST", headers:{"Content-Type":"text/plain;charset=UTF-8"}, body:JSON.stringify({events:[invalid]}), cache:"no-store" });
      const ib = await parseResponse(ir);
      const invalidPass = ir.status === 400 && ib?.ok === false && ib?.error?.code === "INVALID_EVENT";
      if (!invalidPass) errors.push("Malformed completedCount=9 event was not rejected as INVALID_EVENT.");

      const phasePass = phases.every(p => p.passed);
      const overall = phasePass && errors.length === 0;
      const elapsed = performance.now() - started;
      metricTeams.textContent = String(count); metricRequests.textContent = String(requestCount); metricEvents.textContent = String(eventCount); metricTime.textContent = `${(elapsed/1000).toFixed(1)}s`; setVerdict(overall);
      log.textContent = [
        `Run ID: ${runId}`, `Worker: ${baseUrl()}`, `Teams: ${count}`, `Finished subset: ${finished.length}`,
        `Concurrency: ${concurrency}`, `HTTP requests: ${requestCount}`, `Events sent: ${eventCount}`, `Elapsed: ${Math.round(elapsed)} ms`, "",
        `Malformed event rejection: ${invalidPass ? "PASS" : "FAIL"}`, `Final verification: ${overall ? "PASS" : "FAIL"}`, "",
        errors.length ? "Errors:\n" + errors.slice(0,50).map(e => `- ${e}`).join("\n") : "No final-state errors found.", "", "Cleanup SQL:", currentCleanupSql
      ].join("\n");
      status.textContent = overall ? "8J automated test PASSED. Clean up the synthetic rows below." : "8J found a problem. Do not freeze it yet.";
    } catch (error) {
      const elapsed = performance.now() - started;
      metricTeams.textContent = String(count); metricRequests.textContent = String(requestCount); metricEvents.textContent = String(eventCount); metricTime.textContent = `${(elapsed/1000).toFixed(1)}s`; setVerdict(false);
      status.textContent = "Test aborted with an error.";
      log.textContent = String(error?.stack || error) + "\n\nCleanup SQL:\n" + currentCleanupSql;
    } finally {
      runButton.disabled = !confirmWrite.checked; healthButton.disabled = false; boardButton.disabled = false;
    }
  }

  confirmWrite.addEventListener("change", () => { runButton.disabled = !confirmWrite.checked; });
  runButton.addEventListener("click", runFullTest);
  healthButton.addEventListener("click", async () => {
    status.textContent = "Checking health…";
    try { const r = await fetch(`${baseUrl()}/health`, {cache:"no-store"}); const b = await parseResponse(r); log.textContent = JSON.stringify(b,null,2); status.textContent = r.ok && b?.ok ? "Health check passed." : "Health check failed."; }
    catch(e){ log.textContent=String(e?.stack||e); status.textContent="Health check failed."; }
  });
  boardButton.addEventListener("click", async () => {
    status.textContent = "Reading shared leaderboard…";
    try { const b = await readLeaderboard(); log.textContent = JSON.stringify(b,null,2); status.textContent = "Leaderboard read completed."; }
    catch(e){ log.textContent=String(e?.stack||e); status.textContent="Leaderboard read failed."; }
  });
  copyCleanup.addEventListener("click", async () => {
    if (!currentCleanupSql) return;
    try { await navigator.clipboard.writeText(currentCleanupSql); status.textContent = "Cleanup SQL copied."; }
    catch { status.textContent = "Copy failed; select the SQL manually."; }
  });
})();
