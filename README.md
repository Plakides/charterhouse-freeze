# The Great Charterhouse Freeze — Task 6B

Task 6B adds the continuous hidden scene and the real ice-cover/reveal visual system.

## Core implementation
- ONE asset: `assets/game/final-scene.svg`
- the entire 3×3 board sits over that one continuous scene
- the centre cell is a transparent window, visible from the start
- the eight outer challenge buttons are translucent ice covers
- no separate per-tile revealed images
- ice crack texture is a single reusable SVG overlay
- solved-state class is prepared as `.is-revealed`
- reveal animation is prepared as `.is-revealing`
- `prefers-reduced-motion` disables the animation
- Task 5 session/timer behaviour remains unchanged
- Task 6A layout remains unchanged

## Scene content
The scene is a stylised Charterhouse Almaty winter setting with the Tien Shan,
a school building and the eight frozen security-seal symbols distributed through
the eight outer grid regions.

The centre is visible at the start; the rest becomes meaningful as the ice clears.

## Visual demo without changing backend data
Append `?iceDemo=1` to the GitHub Pages URL.

In that mode, clicking a frozen tile locally previews the 6B reveal animation.
It DOES NOT submit a challenge, alter the Sheet, or change backend progress.

Normal mode still shows the Task 6D navigation placeholder when a challenge is clicked.

## Next
Task 6C binds actual backend `completed` + `seals` state to these prepared reveal states.


## Build 6B2 correction
The hidden scene now uses the exact aerial photograph of Charterhouse Almaty supplied by the user.
The school site is embedded directly inside `assets/game/final-scene.svg`, so the board still uses one
continuous scene asset. The eight seal medallions remain part of that same scene and the centre cell
shows the actual campus rather than an invented school building.


## Build 6B3 snowy correction
The continuous hidden scene now uses a winterised/snowy version of the exact supplied
Charterhouse Almaty aerial campus image. This keeps the real campus layout but makes
the puzzle thematically more appropriate for a frozen challenge.


## Build 6B4 gameplay correction
The board now uses the snowy real-campus scene during normal play. When the mission is fully completed, the board automatically switches to the non-snowy real-campus scene, so the school visually looks thawed/unfrozen at the end.


## Build 6C1
Task 6C now binds the dashboard to the real backend progress state.

### What 6C1 adds
- challenge tiles reveal automatically from real `team.completed`
- recovered seals sidebar renders from real `team.seals`
- completed-count meter and thawed-final-scene state are driven from backend data
- if the mission is already complete, the thawed campus scene is shown immediately
- silent polling refreshes mission progress every 15 seconds while the dashboard is open
- returning to the tab also triggers a refresh
- existing demo URLs still work, and `progressDemo=...` was added for safe visual QA


## Build 6D1
Task 6D adds the reusable challenge-navigation framework.

- unsolved dashboard tiles open a dedicated challenge screen
- solved tiles stay locked and do not reopen
- all eight challenges are isolated modules in `js/challenges/`
- challenge URL hashes support browser Back/Forward and refresh recovery
- the same mission timer continues inside a challenge
- generic answer-submission plumbing is wired to the live `submitAnswer` endpoint
- submission is deliberately disabled in the placeholder modules until real puzzle content is authored
- on a future correct submission, the shell is already coded to show ACCESS GRANTED, refresh authoritative state, return to the board and animate the newly recovered tile


## Build 6D2 hotfix
Fixed `?progressDemo=1,3,6` so the simulated completed challenges remain locked
while every simulated-unsolved challenge still opens its challenge shell.

The fix also disables live background polling during progress/thaw demo modes,
so real backend state cannot race or overwrite the visual QA simulation.


## Build 6D3 — fast reconnect
Performance patch before Task 6E.

### Frontend
- safely caches a non-sensitive team snapshot in localStorage
- refresh/reopen renders the existing board immediately from that snapshot
- Apps Script reconciliation then happens quietly in the background
- credentials are still stored separately and remain required for all backend calls
- snapshots do not contain student names or the session token
- live team-state polling reduced from 15 seconds to 30 seconds
- authoritative backend responses continuously refresh the snapshot

### Backend
`getTeamState` is now strictly read-only:
- no global ScriptLock
- no LastSeen write
- no spreadsheet mutation
- token authentication still required

Meaningful mutations still update LastSeen normally.


## Build 6E1 — Field Kit + live leaderboard
Task 6E adds the two reusable live overlays and the standalone projector scoreboard.

### Field Kit
- Caesar decoder
- basic calculator
- unsigned 8-bit binary converter
- Morse reference
- English / Kazakh / Russian mini language guide
- compass reference
- Emergency Banana

Useful and red-herring tools deliberately share the same visual treatment.

### Leaderboard
- live Team and House tabs
- refreshes every 15 seconds while open
- finished teams show rank and elapsed time
- playing teams show seal progress
- House standings show average progress, team count, escaped teams and average successful escape time
- no student names are rendered
- standalone `leaderboard.html` is included for projector use


## Build 6E2 hotfix
Two issues corrected after live testing:

1. The standalone projector page inherited the global `main { display:flex }`
   rule from the student site, which compressed the scoreboard horizontally.
   `leaderboard.html` now explicitly uses a normal block layout.

2. Public leaderboard reads now use the Apps Script GET endpoint with a 12-second
   timeout instead of the generic POST helper. This makes the public scoreboard
   easier to test directly and prevents an endless "Contacting scoreboard..." state.


## Build 6F1 — completion state + vault transition
Task 6 is now feature-complete as an engine.

### 8/8 seals, not yet escaped
- all ice is cleared
- the campus remains snowy
- a pink final route appears across five seal locations
- the sidebar exposes `Proceed to Vault`
- `#vault` supports refresh and browser Back/Forward
- the vault shell is present but the working keypad is intentionally deferred to Task 7I

### Finished / escaped team
- refresh goes directly to a real victory screen
- the non-snowy Charterhouse Almaty campus is shown
- final elapsed time and House are displayed
- leaderboard remains accessible

This corrects the story lifecycle: recovering all eight seals reveals the final route,
but the school only visibly thaws after the final vault has actually been completed.


## Build 6F2 — final visual polish
No gameplay or backend behaviour changed.

- final pink route made thinner and slightly more transparent
- numbered route markers reduced in size
- revealed `SEAL RECOVERED` strips softened so the campus image and final clue read more clearly

This is the final Task 6 presentation pass before freezing the engine.


# Task 7A — House of Confusion

Challenge 01 is now a complete playable puzzle.

## Puzzle
Four students are shown with scarf colour, bag type, carried item and locker number.
Teams use five security notes to eliminate suspects and identify who has the emergency key.

The student cards are interactive:
- click a student to select them as the final answer
- use `Mark eliminated` while reasoning
- selected student automatically populates the common answer field

## Server validation
No Apps Script update is required.
The existing server-side Challenge 1 answer is `amina`, with case/whitespace normalisation.


## Build 7A2 correction
The first 7A build exposed a global CSS collision: the root site's `main` flex rule
was also being applied to the nested challenge `<main>` element, which crushed the
challenge into columns.

7A2 fixes the selector at source and upgrades the puzzle visuals:
- four distinct illustrated fictional student CCTV cards
- visible scarf colours
- visible backpack/satchel
- visible book/compass evidence
- visual clue icons alongside the written clues
- more compact challenge header so the full puzzle reads properly at 1366×768


## 7A3 hotfix
- Replaced placeholder suspect art with four generated suspect evidence cards.
- Desktop layout now uses a 2x2 suspect grid with larger cards and an enlarge-card modal.
- Challenge 1 clues still resolve uniquely to **Amina**.
- Correct answers now apply an immediate optimistic reveal on the mission board, then silently reconcile with the backend.
- API requests now retry once if Apps Script returns a temporary unreadable response.


# V2 / Task 8A — Offline-first foundation

This build deliberately removes Google Apps Script and Google Sheets from the
gameplay path.

## What is authoritative now

The current device stores one versioned game record:

`charterhouseFreeze.v2.game`

It contains:
- local team ID and private local token
- generated team codename
- House
- first names (device only)
- registration/start times
- completed challenge IDs
- recovered seals
- finish state
- a placeholder sync section for the later Cloudflare leaderboard queue

## What works with zero network after the page itself has loaded

- register a new team
- generate a team codename
- reveal the team
- start the mission timer
- enter the mission dashboard
- refresh/reopen the page and restore the same team instantly
- local timer recovery from the stored start timestamp
- local leaderboard preview for the current device

## Intentionally NOT switched on yet

Challenge-answer checking remains disabled in 8A. That is the next local-engine
step (8B/8C). Cloud leaderboard sync is also deliberately absent until 8D–8G.

There are no `fetch()` calls in `api.js`, no Google Apps Script URL, and no
30-second remote gameplay polling.


# Task 8B — Local gameplay state

8A is frozen.

8B proves the next critical path: a correct challenge answer commits progress
directly to the local canonical game state and the dashboard immediately
reflects it.

Current authored puzzle:
- Challenge 01 — House of Confusion
- accepted answer for this temporary 8B proof: `Amina`
- awarded seal: Snow Leopard / 4

The completion mutation itself is generic:
`FREEZE_STATE.completeChallenge(challengeId, seal)`

That mutation:
- atomically adds the challenge to the completed set
- atomically records/replaces its seal
- keeps challenge IDs/seals sorted
- prevents duplicate progress
- updates status to ACTIVE / VAULT_READY
- persists immediately to `charterhouseFreeze.v2.game`

There is still no network request anywhere in gameplay.

Task 8C will replace the temporary direct Challenge 01 answer comparison with
the reusable normalized/hashed offline answer system for all puzzle types.


# Task 8C — Generic local answer engine

8B is frozen.

Challenge validation is no longer hard-coded inside `api.js`.

New module:
`js/answer-engine.js`

It provides:
- Unicode NFKC normalisation
- case-insensitive text answers
- collapsed whitespace
- reusable `text`, `compact`, and `digits` normalisation modes
- SHA-256 fingerprints
- per-challenge pepper values
- multiple accepted hashes per challenge when aliases are needed
- a single async `validate(challengeId, rawAnswer)` API
- no network requests

Challenge 01 is the first registered definition.

Important: hashing is only an obfuscation layer. Browser-side answers can never
be made genuinely secret from a determined user because the browser itself must
be capable of deciding whether an answer is correct. The goal is reliability
and avoiding an obvious plaintext answer table, not pretending client-side
validation is a secure server.

Future puzzle work should add its accepted answer fingerprints to the answer
engine rather than adding special-case answer code to `api.js`.


# Task 8D — Persistent outbound leaderboard queue

8C is frozen.

New module:
`js/sync-queue.js`

Gameplay is still 100% local. Nothing is transmitted in this build.

Meaningful local changes now create tiny leaderboard-safe queue records:
- `REGISTER`
- `START`
- `PROGRESS`
- `FINISH` (supported by the queue ready for the vault stage)

Each record has:
- unique `eventId`
- increasing `seq`
- event type/time
- team ID/codename
- House
- completed challenge count
- elapsed seconds
- finish state

It explicitly does NOT include:
- student names
- local session token
- answer attempts
- puzzle answers

`PROGRESS` coalesces: if several progress changes happen before the network can
send anything, only the latest unsent progress snapshot is retained. This keeps
the queue tiny even during a long outage.

The queue lives inside the canonical V2 game record and therefore survives
refresh/reopen. 8E will add the Cloudflare receiver; 8F will add opportunistic
background flushing.


# Task 8E — Cloudflare leaderboard receiver

8D is frozen.

This build adds the remote receiver as a separate `cloudflare-worker/` folder.
The student game still has `SYNC_ENABLED: false`, so gameplay remains exactly
as reliable/offline as 8D until Task 8F deliberately connects the queue.

Receiver properties:
- Cloudflare Worker + D1
- `POST /sync` accepts one or a batch of events
- prepared D1 statements
- team row upsert
- strictly newer `seq` wins
- stale/duplicate events are harmless
- progress cannot decrease
- finished state cannot regress
- CORS defaults to `https://plakides.github.io`
- `GET /health`
- `GET /leaderboard` for testing/future 8G use

The repository also contains `cloudflare-test.html`, an unlinked test page that
can health-check the deployed Worker, send the same event five times, and read
the leaderboard.


# Task 8F — Opportunistic Cloudflare sync

8E is frozen.

The student game is now connected to:

`https://charterhouse-freeze-leaderboard.p-plakides.workers.dev`

The network is still NOT part of the gameplay transaction.

Order of operations remains:

1. validate/save locally
2. update the student UI locally
3. queue a leaderboard-safe snapshot
4. request a background Cloudflare flush

The API never awaits the Cloudflare request.

Transport behaviour:
- 2.5 second request timeout
- 45 second periodic retry
- retry when the browser comes back online
- retry when the tab/window regains focus
- retry when the document becomes visible
- queued events stay local after any failure
- events are removed only after the Worker acknowledges them
- a newly queued event that arrived during a successful request is retried shortly after
- POST uses `text/plain` JSON to avoid a separate CORS preflight request

The game therefore continues normally even if the Worker is slow, blocked,
temporarily unavailable, or the school internet drops out.

Task 8G will switch the projector leaderboard from its current local preview to
the shared Cloudflare `/leaderboard` feed.


# Task 8G — Shared live projector leaderboard

8F is frozen.

The game and the projector now use the same shared Cloudflare leaderboard:

`https://charterhouse-freeze-leaderboard.p-plakides.workers.dev/leaderboard`

Important architecture:
- student gameplay remains fully local-first
- student devices do NOT poll the leaderboard in the background
- the in-game leaderboard overlay only fetches while the user has it open
- `leaderboard.html` is the projector display and refreshes every 15 seconds
- a 4-second read timeout prevents a bad connection hanging the display
- the last successful leaderboard is cached in localStorage
- if Cloudflare/internet drops out, the projector keeps showing the last-good
  board and labels it as delayed/cached
- when the connection returns, the next refresh replaces the cached board

Client transformation:
- finished teams are ranked by elapsed time
- active teams follow, ordered by completed seals
- House rank is based primarily on average team completion percentage
- House display includes team count, escaped-team count, and average escape time
- all four Houses remain visible even when one currently has no teams

The projector page no longer loads the local gameplay/session/API modules. It
loads only `config.js` and `leaderboard.js`, reducing unnecessary work and
keeping its role purely read-only.


# Task 8H — Full offline asset cache / PWA foundation

8G is frozen.

New files: `service-worker.js`, `manifest.webmanifest`, `js/pwa.js`.

After one successful online visit, the complete runtime is pre-cached. The start screen shows `GAME READY FOR OFFLINE USE ✓` when this browser has the full 8H1 build saved. Gameplay remains local-first; Cloudflare `/sync` and `/leaderboard` are deliberately outside the service-worker cache.

Cache name: `charterhouse-freeze-static-8H1`. Future builds use a new cache name; old Freeze caches are removed on activation.


# Task 8I — Failure recovery / teacher diagnostics

8H is frozen.

Task 8I adds three independent recovery layers without putting network access
back into the gameplay path.

## 1. Rolling local backup

The canonical local game state now uses schema 3. Existing schema-2 missions
migrate automatically.

Before each valid local write, the previous valid state is copied to:

`charterhouseFreeze.v2.backup`

If the primary state becomes invalid JSON or an invalid structure, the game
tries the backup automatically. A damaged primary is quarantined under:

`charterhouseFreeze.v2.corrupt`

Future-schema state is not guessed at, quarantined, downgraded or destructively rewritten. A recent migration/recovery notice is retained for the teacher diagnostics panel.

## 2. Teacher diagnostics

The footer contains a discreet `TEACHER DIAGNOSTICS` button. Keyboard shortcut:

`Ctrl + Alt + D`

The panel shows local-state health, automatic recovery status, offline asset
readiness, browser connectivity, queued leaderboard updates, last sync
attempt/success/error, current team/progress and device/build information.

It can also:
- retry Cloudflare sync manually
- copy a privacy-safe diagnostic report
- copy an emergency result summary
- reset the local mission, but only after typing `RESET`

Reset does not remove the PWA/offline asset cache.

## 3. Emergency result reference

`js/recovery.js` creates a short checked reference such as:

`R1-BP-1-K4M8-02F-7X`

It contains House, progress, a four-character team-ID fragment, elapsed time in
base36 and a checksum. It contains no pupil names. Finished teams show the code
on the victory screen; the teacher panel can show/copy it at any time.

The code is a recovery/reference aid, not authentication.


# Task 8J — Load and resilience validation

8I is frozen.

New unlinked page: `load-test.html`. It creates synthetic `LOADTEST-*` rows only after explicit confirmation, exercises 50/100-team bursts, duplicate sequence numbers, stale/out-of-order updates, finish-state regression protection and invalid input rejection, then verifies the final shared leaderboard and generates run-specific cleanup SQL. Student gameplay is unchanged.
