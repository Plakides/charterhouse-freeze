const DEFAULT_ALLOWED_ORIGINS = [
  "https://plakides.github.io",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];

const VALID_HOUSES = new Set([
  "thackeray",
  "baden-powell",
  "wesley",
  "portman"
]);

const VALID_EVENT_TYPES = new Set([
  "REGISTER",
  "START",
  "PROGRESS",
  "FINISH"
]);

const MAX_EVENTS_PER_REQUEST = 25;

const UPSERT_SQL = `
INSERT INTO leaderboard_teams (
  team_id,
  team_name,
  house,
  completed_count,
  elapsed_seconds,
  finished,
  finish_time,
  last_seq,
  last_event_type,
  first_seen_at,
  updated_at
)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)
ON CONFLICT(team_id) DO UPDATE SET
  team_name = excluded.team_name,
  house = excluded.house,
  completed_count = CASE
    WHEN excluded.completed_count > leaderboard_teams.completed_count
      THEN excluded.completed_count
    ELSE leaderboard_teams.completed_count
  END,
  elapsed_seconds = CASE
    WHEN leaderboard_teams.finished = 1
      THEN leaderboard_teams.elapsed_seconds
    ELSE excluded.elapsed_seconds
  END,
  finished = CASE
    WHEN leaderboard_teams.finished = 1 OR excluded.finished = 1
      THEN 1
    ELSE 0
  END,
  finish_time = CASE
    WHEN leaderboard_teams.finish_time IS NOT NULL
      THEN leaderboard_teams.finish_time
    ELSE excluded.finish_time
  END,
  last_seq = excluded.last_seq,
  last_event_type = excluded.last_event_type,
  updated_at = excluded.updated_at
WHERE excluded.last_seq > leaderboard_teams.last_seq
`;

function parseAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = parseAllowedOrigins(env);
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  });

  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function jsonResponse(request, env, body, status = 200, extraHeaders = {}) {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  Object.entries(extraHeaders).forEach(([name, value]) => {
    headers.set(name, String(value));
  });

  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}

function errorResponse(request, env, status, code, message, details = null) {
  return jsonResponse(
    request,
    env,
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    },
    status
  );
}

function cleanString(value, maxLength) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}

function parseInteger(value, minimum, maximum) {
  const number = Number(value);

  if (!Number.isInteger(number)) return null;
  if (number < minimum || number > maximum) return null;

  return number;
}

function validateEvent(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "Event must be an object." };
  }

  const eventId = cleanString(raw.eventId, 120);
  const type = cleanString(raw.type, 20).toUpperCase();
  const teamId = cleanString(raw.teamId, 40);
  const teamName = cleanString(raw.teamName, 80);
  const house = cleanString(raw.house, 30);
  const seq = parseInteger(raw.seq, 1, 1_000_000);
  const completedCount = parseInteger(raw.completedCount, 0, 8);
  const elapsedSeconds = parseInteger(raw.elapsedSeconds, 0, 86_400);
  const finished = raw.finished === true;
  const finishTime = raw.finishTime == null
    ? null
    : cleanString(raw.finishTime, 40);

  if (!eventId) return { ok: false, reason: "Missing eventId." };
  if (!VALID_EVENT_TYPES.has(type)) {
    return { ok: false, reason: `Invalid event type: ${type || "(blank)"}.` };
  }

  if (!/^CF-[A-Z2-9]{8}$/.test(teamId)) {
    return { ok: false, reason: "Invalid teamId format." };
  }

  if (!teamName || teamName.length < 3) {
    return { ok: false, reason: "Missing/invalid teamName." };
  }

  if (!VALID_HOUSES.has(house)) {
    return { ok: false, reason: "Invalid House." };
  }

  if (seq === null) return { ok: false, reason: "Invalid sequence number." };
  if (completedCount === null) {
    return { ok: false, reason: "Invalid completedCount." };
  }

  if (elapsedSeconds === null) {
    return { ok: false, reason: "Invalid elapsedSeconds." };
  }

  if (finished && completedCount < 8) {
    return {
      ok: false,
      reason: "A finished team cannot have fewer than 8 completed challenges."
    };
  }

  if (finished && !finishTime) {
    return { ok: false, reason: "Finished event requires finishTime." };
  }

  return {
    ok: true,
    value: {
      eventId,
      type,
      teamId,
      teamName,
      house,
      seq,
      completedCount,
      elapsedSeconds,
      finished,
      finishTime
    }
  };
}

function teamStatement(env, event, now) {
  return env.DB.prepare(UPSERT_SQL).bind(
    event.teamId,
    event.teamName,
    event.house,
    event.completedCount,
    event.elapsedSeconds,
    event.finished ? 1 : 0,
    event.finished ? event.finishTime : null,
    event.seq,
    event.type,
    now
  );
}

async function handleHealth(request, env) {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS team_count FROM leaderboard_teams"
  ).first();

  return jsonResponse(request, env, {
    ok: true,
    service: "charterhouse-freeze-leaderboard",
    version: "8E1",
    database: "reachable",
    teamCount: Number(row?.team_count || 0),
    now: new Date().toISOString()
  });
}

async function handleSync(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      request,
      env,
      400,
      "INVALID_JSON",
      "Request body must be valid JSON."
    );
  }

  const rawEvents = Array.isArray(body?.events)
    ? body.events
    : body?.event
      ? [body.event]
      : [];

  if (!rawEvents.length) {
    return errorResponse(
      request,
      env,
      400,
      "NO_EVENTS",
      "Send one event or an events array."
    );
  }

  if (rawEvents.length > MAX_EVENTS_PER_REQUEST) {
    return errorResponse(
      request,
      env,
      413,
      "TOO_MANY_EVENTS",
      `Maximum ${MAX_EVENTS_PER_REQUEST} events per request.`
    );
  }

  const acceptedEvents = [];
  const rejected = [];

  rawEvents.forEach((raw, index) => {
    const result = validateEvent(raw);

    if (result.ok) {
      acceptedEvents.push(result.value);
    } else {
      rejected.push({
        index,
        eventId: cleanString(raw?.eventId, 120) || null,
        reason: result.reason
      });
    }
  });

  if (rejected.length) {
    return errorResponse(
      request,
      env,
      400,
      "INVALID_EVENT",
      "One or more sync events failed validation.",
      { rejected }
    );
  }

  const now = new Date().toISOString();
  const statements = acceptedEvents.map(event =>
    teamStatement(env, event, now)
  );

  const results = await env.DB.batch(statements);

  const resultSummary = acceptedEvents.map((event, index) => {
    const meta = results[index]?.meta || {};
    const changes = Number(meta.changes || 0);

    return {
      eventId: event.eventId,
      teamId: event.teamId,
      seq: event.seq,
      applied: changes > 0,
      duplicateOrStale: changes === 0
    };
  });

  return jsonResponse(request, env, {
    ok: true,
    received: acceptedEvents.length,
    applied: resultSummary.filter(item => item.applied).length,
    duplicateOrStale: resultSummary.filter(item => item.duplicateOrStale).length,
    results: resultSummary,
    serverTime: now
  });
}

async function handleLeaderboard(request, env) {
  const teamsResult = await env.DB.prepare(`
    SELECT
      team_id,
      team_name,
      house,
      completed_count,
      elapsed_seconds,
      finished,
      finish_time,
      last_seq,
      updated_at
    FROM leaderboard_teams
    ORDER BY
      finished DESC,
      CASE WHEN finished = 1 THEN elapsed_seconds END ASC,
      completed_count DESC,
      elapsed_seconds ASC,
      team_name ASC
    LIMIT 250
  `).all();

  const houseResult = await env.DB.prepare(`
    SELECT
      house,
      COUNT(*) AS team_count,
      SUM(CASE WHEN finished = 1 THEN 1 ELSE 0 END) AS finished_count,
      AVG(completed_count * 12.5) AS average_progress
    FROM leaderboard_teams
    GROUP BY house
  `).all();

  const teams = (teamsResult.results || []).map(row => ({
    teamId: row.team_id,
    teamName: row.team_name,
    house: row.house,
    completedCount: Number(row.completed_count || 0),
    elapsedSeconds: Number(row.elapsed_seconds || 0),
    finished: Number(row.finished || 0) === 1,
    finishTime: row.finish_time || null,
    seq: Number(row.last_seq || 0),
    updatedAt: row.updated_at
  }));

  const houses = (houseResult.results || []).map(row => ({
    house: row.house,
    teamCount: Number(row.team_count || 0),
    finishedCount: Number(row.finished_count || 0),
    averageProgress: Math.round(Number(row.average_progress || 0) * 10) / 10
  }));

  return jsonResponse(request, env, {
    ok: true,
    generatedAt: new Date().toISOString(),
    teamCount: teams.length,
    teams,
    houses
  });
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, env)
    });
  }

  if (request.method === "GET" && url.pathname === "/") {
    return jsonResponse(request, env, {
      ok: true,
      service: "Charterhouse Freeze leaderboard receiver",
      version: "8E1",
      endpoints: {
        health: "GET /health",
        sync: "POST /sync",
        leaderboard: "GET /leaderboard"
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return handleHealth(request, env);
  }

  if (request.method === "POST" && url.pathname === "/sync") {
    return handleSync(request, env);
  }

  if (request.method === "GET" && url.pathname === "/leaderboard") {
    return handleLeaderboard(request, env);
  }

  return errorResponse(
    request,
    env,
    404,
    "NOT_FOUND",
    "Unknown endpoint."
  );
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Unhandled leaderboard receiver error:", error);

      return errorResponse(
        request,
        env,
        500,
        "SERVER_ERROR",
        "The leaderboard receiver could not process this request."
      );
    }
  }
};
