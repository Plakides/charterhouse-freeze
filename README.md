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


# Task 9A — Challenge 01 content freeze

Tasks 8A–8J infrastructure are frozen.

Challenge 01 is now content-frozen:

- Title: `House of Confusion`
- Type: visual deduction
- Target time: ~4 minutes
- Suspects: Amina, Timur, Sofia, Daniyar
- Clue 1: key holder wears a blue scarf
- Clue 2: key is inside a backpack, not a satchel
- Clue 3: locker number is odd
- Clue 4: key holder is not carrying the compass
- Unique solution: `Amina`
- Awarded seal: `Snow Leopard`
- Seal code number: `4`

The redundant fifth line ("Exactly one student matches every clue") has been
moved out of the clue list and replaced by clearer team-strategy guidance.

Interaction/accessibility freeze:
- clicking a student selects that answer
- typed answers still work
- cards can be enlarged
- students can mark/undo eliminations
- selected/eliminated controls expose `aria-pressed`
- wrong answers do not alter progress
- correct answer commits locally before any network activity
- completion persists through refresh/offline use

The current card artwork/layout is intentionally NOT being redesigned in 9A.
The MacBook Neo responsive pass and whole-game visual/UX redesign are reserved
for Phase 10A–10C so all eight puzzles can be improved consistently.


# Task 10A2b — Universal 30-second wrong-answer penalty

Challenge 01 remains content-frozen from 9A1.

A generic wrong-answer cooldown now applies to every current/future puzzle that
uses the standard challenge submission flow.

Rules:
- blank submissions do not trigger it
- technical errors do not trigger it
- every genuinely wrong answer triggers exactly 30 seconds
- answer field remains editable during the countdown
- Submit is disabled during the countdown
- button displays `Try again in Ns`
- penalty survives refresh, leaving/reopening a puzzle, and closing/reopening
  the page because it is stored as an absolute timestamp
- pressing Enter cannot bypass it because the submit handler checks the
  cooldown independently
- cooldown is local-only and never sent to Cloudflare
- each team/challenge has an independent timer

Storage key:
`charterhouseFreeze.v2.wrongAnswerCooldowns`

Future challenges inherit this globally. Individual puzzle files must not
implement their own penalty timers.


# Task 9B-C — Lost in Almaty interactive map/UI

9B-A logic and 9B-B landmark artwork are frozen.

This build installs the actual interactive route-building interface for
Challenge 02.

Frozen route:
`Abai Square → Republic Square → Astana Square → Panfilov Park → Green Bazaar
→ Hotel Kazakhstan → Abai Square → Central State Museum → Kok Tobe → Medeu`

Interaction:
- Abai Square is preselected as route stop 1
- clicking a landmark appends it to the route
- landmarks may be revisited
- route line and numbered visit badges update immediately
- route is shown as a readable strip below the map
- Undo last and Clear route are available
- Check route compares the entire sequence only
- no per-step right/wrong feedback is given
- wrong whole-route checks use the existing persistent 30-second cooldown
- route remains editable while the penalty counts down
- route + verified state persist locally per team
- refresh/leave/reopen cannot clear the route or bypass the cooldown

Challenge 02 uses a custom submission UI, so the generic text-answer panel is
hidden only for this challenge. Challenge 01 remains unchanged.

9B-C deliberately stops short of awarding the Mountain seal. A verified route
is connected to actual game completion in 9B-D.


# Task 10A2b — Screenshot-led layout correction

Based on the 1536×960 Chrome screenshot:

- landmark artwork is slightly smaller so images + labels remain inside the map
- Botanical Gardens, Central State Museum and Kok Tobe are moved upward
- Medeu is moved substantially upward and rendered slightly smaller
- route history now renders in rows of maximum five stops
- the complete correct 10-stop route therefore appears as two neat rows
- horizontal scrolling is removed from the route history
- custom Challenge 02 submission now forcibly hides the generic answer form,
  fixing the stray disabled "Route check" panel visible below the puzzle

No puzzle logic, correct route, landmark artwork or cooldown behaviour changed.


# Task 9B-D — Lost in Almaty completion integration

9B-C is frozen.

The correct route now completes Challenge 02 through the SAME local completion
pipeline used by standard answer puzzles:

1. custom map UI proves the full route locally
2. an internal Challenge 02 proof is submitted to `FREEZE_API.submitAnswer`
3. `answer-engine.js` validates its SHA-256 fingerprint
4. canonical game state records Challenge 02 complete
5. Mountain seal / code number 8 is added
6. a normal PROGRESS event is queued
7. opportunistic Cloudflare sync runs in the background
8. the UI returns to the mission board and animates the newly recovered seal

This avoids a second completion/state system for custom puzzles.

The internal proof is not a student-facing answer. As with all browser-local
validation, it is obfuscation rather than a security boundary.

Migration:
- if a tester had `verified:true` stored from 9B-C, the exact route is preserved
- because 9B-C did not award a seal, 9B-D clears only the old verified flag and
  requires one fresh `Check route` click to record the real completion


# Task 9C-B — Secret Message UI

9C-A logic is frozen.

Frozen puzzle:
- three intercepted notes: Kazakh, Russian, English
- six cards: Book, Mountain, Snow Leopard, Key, Eagle, Teapot
- decoder rail: 2 · 4 · 1 · 3 · 5 · 2
- unique intended order:
  Book → Mountain → Snow Leopard → Key → Eagle → Teapot
- extracted message: TULPAR
- target solve time: 6–8 minutes
- eventual reward: Book seal / code 2

9C-B installs the complete visual/interaction layer:
- three paper-style multilingual transmission sheets
- built-in emergency glossaries
- six scrambled security cards
- click-to-select + click-position placement
- desktop drag/drop support
- filled positions can be picked up and moved
- slot-specific TAKE LETTER numbers
- live extracted-letter rail
- arrangement persists per team through refresh/offline use
- Clear arrangement / Restore scramble controls

The final answer input is deliberately disabled in 9C-B. 9C-C will register the
accepted answer fingerprint(s), enable submission, inherit the global
30-second wrong-answer penalty, and award Book seal 2.


# Task 10A2b — Manual extraction correction

9C-B was reopened after testing feedback.

Critical correction:
- the site no longer calculates or displays extracted letters
- the site no longer automatically reveals TULPAR
- each slot still tells students which character to use
- after arranging all six cards, students are explicitly told to do the
  extraction themselves:

  1 → 2nd letter
  2 → 4th letter
  3 → 1st letter
  4 → 3rd letter
  5 → 5th letter
  6 → 2nd letter

- students then type their own six-letter answer into the Decoded message box

For this UI-stage build the answer field is typeable so the intended workflow
can be tested, but Submit is still disabled. 9C-C will enable validation,
30-second penalties and Book seal 2.

The Kazakh wording is unchanged.


# Task 10A2b — Card readability pass

Based directly on live-browser screenshot feedback.

No puzzle logic changed.

Readability changes:
- card titles enlarged
- five-letter code characters enlarged substantially
- code boxes enlarged and spaced further apart
- placed-card layout enlarged
- slot height increased to prevent crowding
- POSITION labels enlarged slightly
- TAKE LETTER instruction transformed into a prominent pink-accent strip
- extraction number displayed as a larger pink circular badge
- decoder heading enlarged
- manual decoder pattern enlarged

The UI still does not calculate or reveal TULPAR.


# Task 9C-C — Secret Message answer/reward integration

9C-B3 is frozen.

Challenge 03 now uses the standard answer engine and canonical completion path.

Accepted answers:
- `TULPAR` (case/whitespace tolerant through normal text normalization)
- `ТҰЛПАР` (Kazakh Cyrillic equivalent)

The website still does NOT calculate or reveal the answer from the arranged
cards. Students must:
1. solve the order
2. manually apply 2 · 4 · 1 · 3 · 5 · 2
3. type the six-letter message themselves
4. submit it

Wrong submitted answers use the existing persistent 30-second cooldown.

Correct submission:
- completes Challenge 03
- awards Book seal / code number 2
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- syncs opportunistically when connectivity is available
- locks the solved challenge using the existing completion behaviour


# Task 9C-D — Final regression / freeze

Challenge 03 is now frozen.

Frozen specification:
- title: Құпия хабар / Secret Message
- target solve time: 6–8 minutes
- three intercepted notes: Kazakh, Russian, English
- six cards: Book, Mountain, Snow Leopard, Key, Eagle, Teapot
- intended order:
  Book → Mountain → Snow Leopard → Key → Eagle → Teapot
- decoder rail:
  2 · 4 · 1 · 3 · 5 · 2
- students must perform extraction manually
- website must NOT calculate or reveal the final word
- accepted final answers:
  TULPAR
  ТҰЛПАР
- wrong answer:
  existing persistent 30-second cooldown
- reward:
  Book seal / code number 2
- completion:
  canonical local state + queued PROGRESS sync
- refresh/offline persistence:
  required and preserved

9C-D introduces no gameplay or visual changes from the approved 9C-C1 build.
It exists only to mark the final tested/frozen state and provide a final
regression checkpoint before work begins on Challenge 04.


# Task 9D-B — Charterhouse Telegram UI

9D-A logic is frozen.

Frozen puzzle:
- Caesar cipher
- plaintext encrypted by shifting letters +8
- students decrypt by shifting -8
- ciphertext:
  `BPM PMIBQVO KWVBZWT ZWWU QA TWKSML.`
  `BPM XIAAEWZL QA EQVBMZ.`
- plaintext:
  `THE HEATING CONTROL ROOM IS LOCKED.`
  `THE PASSWORD IS WINTER.`
- final answer: WINTER
- target solve time: 4–6 minutes
- eventual reward: Teapot seal / code 7

9D-B installs:
- heritage-style emergency telegram
- large monospaced ciphertext
- Show hint / Hide hint control
- hint: `Open Field Kit → Caesar Shift.`
- direct button to open the Caesar Shift tool
- hint state persistence per team
- typeable final password field
- Submit disabled until 9D-C

The challenge page itself does not reveal the shift value or decoded plaintext.


# Task 10A2b — Caesar shift changed to 8

Reason for revision:
- the Field Kit Caesar tool defaults to shift 3
- Challenge 04 now uses shift 8 so students must actually adjust/test the tool

Frozen 9D-A logic is therefore revised to:
- plaintext encrypted +8
- students decode using shift 8 in the Field Kit
- no shift value is shown on the challenge page
- final answer remains WINTER


# Task 9D-C — Charterhouse Telegram answer/reward integration

9D-B2 is frozen.

Challenge 04 now uses the standard answer engine and canonical completion flow.

Accepted answer:
- `WINTER` (case and surrounding whitespace tolerant through normal text normalization)

The approved UI/cipher is unchanged:
- Caesar shift remains 8
- challenge page does not reveal shift 8
- hint only points to Field Kit → Caesar Shift
- students decode the message themselves

Wrong submitted answers use the existing persistent 30-second cooldown.

Correct submission:
- completes Challenge 04
- awards Teapot seal / code number 7
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- syncs opportunistically on reconnect
- locks the solved challenge through existing completion behaviour


# Task 9D-D — Final regression / freeze

Challenge 04 is now frozen.

Frozen specification:
- title: The Charterhouse Telegram
- target solve time: 4–6 minutes
- Caesar cipher
- plaintext encrypted with shift +8
- students discover the shift using Field Kit → Caesar Shift
- challenge hint does NOT reveal the number 8
- ciphertext:
  BPM PMIBQVO KWVBZWT ZWWU QA TWKSML.
  BPM XIAAEWZL QA EQVBMZ.
- plaintext:
  THE HEATING CONTROL ROOM IS LOCKED.
  THE PASSWORD IS WINTER.
- accepted answer:
  WINTER
- wrong answer:
  persistent 30-second cooldown
- reward:
  Teapot seal / code number 7
- completion:
  canonical local state + queued PROGRESS sync
- offline:
  full local validation/persistence required

9D-D introduces no gameplay or visual changes from the approved 9D-C1 build.
It only marks the final tested/frozen state and provides a final regression
checkpoint before Challenge 05.


# Task 9E-B — Impossible Timetable UI

9E-A logic is frozen.

Frozen puzzle:
- five lessons:
  Art, Science, Music, Maths, Computing
- five clues:
  1. Computing is immediately after Maths.
  2. Science is neither first nor last.
  3. Music is later than Science.
  4. Art is earlier than Maths.
  5. Music is earlier than Maths.
- unique intended timetable:
  P1 Art
  P2 Science
  P3 Music
  P4 Maths
  P5 Computing
- final question:
  Which subject is in Period 3?
- final answer:
  MUSIC
- target solve time:
  5–7 minutes
- eventual reward:
  Eagle seal / code 5

9E-B installs the complete interaction layer:
- scheduling-console visual
- five displaced subject cards
- five Period 1–5 timetable slots
- click-to-select + click-period placement
- desktop drag/drop
- move and swap placed lessons
- no per-placement correctness feedback
- five scheduling rules shown prominently
- final Period 3 question shown prominently
- arrangement persists per team through refresh/offline
- Clear timetable / Restore scramble controls
- final answer field typeable for UI testing
- Submit remains disabled until 9E-C

The UI does not automatically check or reveal the correct timetable.


# Task 9E-C — Impossible Timetable answer/reward integration

9E-B1 is frozen.

Challenge 05 now uses the standard answer engine and canonical completion flow.

Accepted answer:
- `MUSIC` (case and surrounding whitespace tolerant through normal text normalization)

The timetable UI remains intentionally non-validating:
- students may arrange cards freely
- the website does NOT confirm whether the timetable itself is correct
- the website does NOT reveal the Period 3 answer
- students must use the five clues, decide the unique schedule, and submit the
  final Period 3 subject themselves

Wrong submitted answers use the existing persistent 30-second cooldown.

Correct submission:
- completes Challenge 05
- awards Eagle seal / code number 5
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- syncs opportunistically on reconnect
- locks the solved challenge through existing completion behaviour


# Task 9E-D — Final regression / freeze

Challenge 05 is now frozen.

Frozen specification:
- title: The Impossible Timetable
- target solve time: 5–7 minutes
- five subjects:
  Art, Science, Music, Maths, Computing
- five rules:
  1. Computing is immediately after Maths.
  2. Science is neither first nor last.
  3. Music is later than Science.
  4. Art is earlier than Maths.
  5. Music is earlier than Maths.
- unique timetable:
  P1 Art
  P2 Science
  P3 Music
  P4 Maths
  P5 Computing
- final question:
  Which subject is in Period 3?
- accepted answer:
  MUSIC
- wrong answer:
  persistent 30-second cooldown
- reward:
  Eagle seal / code number 5
- arrangement:
  free placement/moving/swapping; no automatic correctness feedback
- completion:
  canonical local state + queued PROGRESS sync
- offline:
  local puzzle state + answer validation + persistence required

9E-D introduces no gameplay or visual changes from the approved 9E-C1 build.
It marks the final tested/frozen state before Challenge 06.


# Task 9F-B — Brain Freeze UI

9F-A logic is frozen.

Frozen puzzle:
- Panel A: `1 · 1 · 2 · 3 · 5 · ?` -> 8
- Panel B:
  Mitten + Mitten + Mitten = 18
  Mitten + Mug + Mug = 14
  Mug + Snowflake = 7
  Snowflake = ? -> 3
- Panel C:
  1 | 4 | 4
  2 | 3 | 6
  3 | 2 | ? -> 6
- Panel D:
  I am an odd number.
  Remove one letter and I become even.
  What number am I?
  -> SEVEN -> 7
- final code: 8367
- target solve time: 5–7 minutes
- eventual reward: Snowflake seal / code 1

9F-B installs the visual / interaction layer:
- four distinct A–D puzzle panels in a 2×2 cognition-test grid
- inline SVG winter symbols for Panel B
- no trick symbol variations
- riddle hint toggle:
  `Think about how number names are spelled in English.`
- hint state persists per team
- no per-panel correctness checks
- final A → B → C → D instruction strip
- four-digit answer field typeable for testing
- Submit remains disabled until 9F-C

The UI never calculates or displays the final code.


# Task 9F-C — Brain Freeze answer/reward integration

9F-B1 is frozen.

Challenge 06 now uses the standard answer engine and canonical completion flow.

Accepted answer:
- `8367` (surrounding whitespace tolerant through normal text normalization)

The approved Brain Freeze UI remains unchanged:
- Panel A sequence
- Panel B winter symbol equations
- Panel C number grid
- Panel D odd/even riddle
- no per-panel correctness checking
- no automatic final-code reveal
- riddle hint remains optional

Wrong submitted answers use the existing persistent 30-second cooldown.

Correct submission:
- completes Challenge 06
- awards Snowflake seal / code number 1
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- syncs opportunistically on reconnect
- locks the solved challenge through existing completion behaviour


# Task 9F-D — Final regression / freeze

Challenge 06 is now frozen.

Frozen specification:
- title: Brain Freeze
- target solve time: 5–7 minutes
- four independent panels:
  A. sequence -> 8
  B. winter symbol equations -> 3
  C. number grid -> 6
  D. odd/even spelling riddle -> 7
- final code:
  8367
- riddle hint:
  Think about how number names are spelled in English.
- no per-panel correctness checking
- no automatic final code reveal
- accepted final answer:
  8367
- wrong answer:
  persistent 30-second cooldown
- reward:
  Snowflake seal / code number 1
- completion:
  canonical local state + queued PROGRESS sync
- offline:
  full local validation / persistence required

9F-D introduces no gameplay or visual changes from the approved 9F-C1 build.
It marks the final tested/frozen state before Challenge 07.


# Task 9G-B — Frozen Crossword UI

9G-A is frozen.

Approved answer set:
- FLOREAT
- BANCO
- MEDEU
- KOKTOBE
- BINARY
- PIXEL
- PRIME
- EQUATOR
- ELEMENT
- ECOSYSTEM

The ten entries form one connected crossword with genuine shared crossing
letters. Six manually lettered icy cells (A–F) extract the final word SUMMIT.

9G-B installs the interaction layer only:
- proper 14 x 9 connected crossword grid
- five Across and five Down clues
- click a clue to highlight/focus its word
- one-letter keyboard input
- automatic advance within the selected word
- arrow-key movement
- Backspace clear/back behaviour
- Space switches direction at a crossing
- crossing letters are genuinely shared cells
- six extraction cells marked A–F
- no clue-by-clue right/wrong checking
- no automatic extraction
- grid letters persist per team through refresh/offline
- final six-letter answer field is typeable for UI testing
- Submit remains disabled until 9G-C

Target solve time: 7–9 minutes.
Eventual reward: Key seal / code 9.


# Task 10A2b — Extraction labels and BANCO clue refinement

Changes from 9G-B1:
- extraction cells now use A, B, C, D, E, F instead of 1–6 so they cannot
  be confused with crossword clue numbering
- extraction instruction now reads A → F
- BANCO clue revised to:
  `Our Charterhouse word for homework.`

No crossword layout, crossings, extraction letters, answer logic or other clues
have changed.


# Task 9G-C — Frozen Crossword answer/reward integration

9G-B2 is frozen.

Challenge 07 now uses the standard answer engine and canonical completion flow.

Accepted answer:
- `SUMMIT` (case and surrounding whitespace tolerant through normal text normalization)

The approved crossword UI remains unchanged:
- 10 connected entries
- 5 Across / 5 Down
- extraction cells labelled A–F
- BANCO clue: `Our Charterhouse word for homework.`
- no clue-by-clue correctness feedback
- no automatic extraction
- students manually read A → F and submit the final six-letter word

Wrong submitted answers use the existing persistent 30-second cooldown.

Correct submission:
- completes Challenge 07
- awards Key seal / code number 9
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- syncs opportunistically on reconnect
- locks the solved challenge through existing completion behaviour


# Task 9G-D — Final regression / freeze

Challenge 07 is now frozen.

Frozen specification:
- title: The Frozen Crossword
- target solve time: 7–9 minutes
- 10 connected entries:
  PRIME
  EQUATOR
  BINARY
  FLOREAT
  PIXEL
  BANCO
  KOKTOBE
  ECOSYSTEM
  MEDEU
  ELEMENT
- clues mix Charterhouse terminology, Almaty knowledge and familiar school concepts
- BANCO clue:
  Our Charterhouse word for homework.
- crossword interaction:
  clue selection/highlighting
  keyboard letter entry
  arrow-key movement
  Backspace clear/back
  Space switches direction at a crossing
  genuine shared crossing cells
- extraction:
  six icy cells labelled A–F
  students manually read A → F
  website does not auto-extract the letters
- final word:
  SUMMIT
- wrong answer:
  persistent 30-second cooldown
- reward:
  Key seal / code number 9
- completion:
  canonical local state + queued PROGRESS sync
- offline:
  crossword state, answer validation and completion persistence required

9G-D introduces no gameplay or visual changes from the approved 9G-C1 build.
It marks the final tested/frozen state before Challenge 08.


# Task 9H-B — Snow Leopard Memory Test UI

Challenge 08 replaces the placeholder with the approved memory-test interface.

9H-B interaction:
- team starts the test manually
- first observation window is exactly 30 seconds
- absolute timestamps prevent refresh/reopen from resetting that timer
- nine evidence objects:
  blue scarf
  Medeu ticket at 19:45
  FLOREAT book
  Green Bazaar receipt for 2,800 ₸
  compass pointing East
  red mitten
  brass key tagged A315
  white mug with snow-leopard paw
  Kok Tobe postcard in the lower-right
- six multiple-choice memory questions
- every answer option carries a vault digit
- no question is marked right or wrong
- one optional 10-second second look
- second-look timer also survives refresh/reopen
- selected answers persist per team
- final instruction is to read selected vault digits from Q1 to Q6
- final six-digit answer field is typeable
- Submit remains disabled until 9H-C

Recovery design:
The challenge exposes `FREEZE_MEMORY_TEST.grantRecoveryReview()`.
9H-C will connect this to the existing wrong-answer cooldown so every wrong
final submission eventually grants another 10-second evidence review.
Memory therefore affects completion time but can never permanently lock a team
out of the game.

Target solve time: 6–8 minutes.
Eventual reward: Compass seal / code 3.


# Task 9H-C — Memory answer/reward + recovery integration

9H-B1 is frozen.

Challenge 08 now uses the standard answer engine and canonical completion flow.

Accepted final code:
- `648237`
- digit-normalised, so formatting such as `648 237` or `648-237` is also accepted

Correct submission:
- completes Challenge 08
- awards Compass seal / code number 3
- increments local mission progress
- queues the normal PROGRESS sync event
- persists offline
- locks the challenge as solved

Wrong submission:
- starts the existing persistent 30-second cooldown
- immediately records a pending recovery review for the cooldown expiry time
- when the cooldown expires, a 10-second RECOVERY REVIEW becomes available
- leaving/reopening the challenge cannot lose that recovery entitlement
- refreshing after the penalty has already expired converts the pending review
  into an available review automatically
- every further wrong answer creates another recovery-review entitlement

This means memory affects completion time only; it can never permanently prevent
a team from finishing the game.


# Task 9H-D — Final regression / freeze

Challenge 08 is now frozen.

Frozen specification:
- title: The Snow Leopard’s Memory Test
- target solve time: 6–8 minutes
- first observation:
  30 seconds
  absolute timestamp so refresh/reopen cannot restart the timer
- nine evidence items:
  Blue scarf
  Medeu ticket / 19:45
  FLOREAT book
  Green Bazaar receipt / 2,800 ₸
  compass pointing East
  red mitten
  brass key / A315
  white mug / snow-leopard paw
  Kok Tobe postcard in lower-right
- six multiple-choice memory questions
- every answer option carries a vault digit
- no per-question correctness feedback
- one optional 10-second SECOND LOOK
- selected answers persist per team
- final code:
  648237
- final-code validation:
  digit-normalised
- wrong answer:
  persistent 30-second cooldown
- recovery rule:
  after every wrong final code and after the 30-second cooldown ends,
  another 10-second RECOVERY REVIEW becomes available
- recovery entitlement survives refresh / leave / reopen
- optional second look remains independent of recovery reviews
- reward:
  Compass seal / code number 3
- completion:
  canonical local state + queued PROGRESS sync
- offline:
  complete local timers, review recovery, validation and persistence

9H-D introduces no gameplay or visual changes from the approved 9H-C1 build.
It marks the final tested/frozen state before the Final Vault stage.


# Task 9I-B — Final Vault UI / animation framework

9I-A is frozen.

Final Vault interface:
- only reached after all 8 challenge seals are recovered
- all 8 recovered seals shown around a central circular emergency vault
- seal labels and numbers remain visible
- five clue-driven route steps:
  1. Begin at the highest place.
  2. Next, choose something that can be opened without a key.
  3. Then find the creature that leaves tracks in the snow.
  4. Choose the object that pours but never drinks.
  5. Finish beneath the wings of Kazakhstan.
- click-based route placement is the accessibility baseline
- drag/drop is also supported
- a seal can only occupy one route slot at a time
- the system does not mark route choices correct/incorrect
- once all five route slots are filled, the keypad activates
- keypad accepts five digits and Backspace
- VERIFY remains disabled until 9I-C
- route and keypad state persist per team through refresh/offline

Animation framework:
- subtle frost shimmer while the vault is idle
- selected seal lift/highlight
- seal docking animation
- route trace animates when all five steps are filled
- keypad depress animation
- complete staged victory preview:
  route seals illuminate in order
  vault ring/wheel rotate
  frost cracks appear
  warm light spreads
  thawed campus appears
  heating-restored result card fades in
  subtle snow-leopard paw print appears
- reduced-motion users get an immediate simplified reveal

For visual QA only, after filling all five route slots run:
`FREEZE_FINAL_VAULT.previewVictory()`

This preview does NOT finish the game or write a FINISH event.
9I-C will connect code validation, cooldown and the real finish/victory flow.


# Task 9I-C — Live Final Vault / canonical finish

9I-B1 is frozen.

The Final Vault is now live.

Validation:
- intended five-step route remains:
  Mountain → Book → Snow Leopard → Teapot → Eagle
- students manually read the five seal numbers
- accepted final code is locally hash-validated
- digit formatting is normalised
- route choices themselves are not checked by the application

Wrong final code:
- uses the shared persistent 30-second cooldown under local vault ID 9
- VERIFY becomes `TRY AGAIN IN Ns`
- route and keypad code remain editable during the penalty
- refresh / leave / reopen cannot bypass the penalty
- a brief vault-rejection animation runs
- no mission-finish state is written

Correct final code:
- freezes the canonical local elapsed time immediately
- marks the local team FINISHED before any network request
- queues canonical `FINISH`
- requests opportunistic Cloudflare sync
- plays the real staged vault-unlock animation
- then opens the existing victory screen with team, House, final time,
  8/8 seals and result reference
- if the browser is closed/reloaded during the animation, the saved FINISHED
  state causes the victory screen to restore on next load

The existing 9I-B preview remains available:
`FREEZE_FINAL_VAULT.previewVictory()`
It still does not finish the game.


# Task 9I-D — Final Vault regression / freeze

The Final Vault is now frozen.

Frozen specification:
- unlock condition:
  all 8 challenge seals recovered
- route clues:
  1. Begin at the highest place.
  2. Next, choose something that can be opened without a key.
  3. Then find the creature that leaves tracks in the snow.
  4. Choose the object that pours but never drinks.
  5. Finish beneath the wings of Kazakhstan.
- intended route:
  Mountain → Book → Snow Leopard → Teapot → Eagle
- visible seal numbers:
  8 → 2 → 4 → 7 → 5
- final vault code:
  82475
- route interaction:
  click-to-place + drag/drop
  no route-by-route correctness feedback
  duplicate seal prevention
  route persistence
- keypad:
  locked until five route slots are filled
  five-digit input
  Backspace
  physical keyboard support
  persistence
- wrong code:
  persistent 30-second cooldown
  route and code remain editable
  refresh/reopen cannot bypass
- correct code:
  local hash validation
  local FINISHED state written immediately
  elapsed time frozen immediately
  canonical FINISH event queued
  opportunistic sync requested
- victory choreography:
  five route seals illuminate in order
  vault ring/wheel rotate
  frost cracks
  warm light
  thawed campus
  HEATING RESTORED result
  snow-leopard paw detail
  then normal victory screen
- result text:
  Heating restored to an extravagant 19°C.
  The snow leopard continues to deny involvement.
- resilience:
  correct finish works offline
  closing/reloading during victory animation restores FINISHED state
  finish timestamp is idempotent and does not move
- preview:
  FREEZE_FINAL_VAULT.previewVictory()
  remains visual-only and never writes FINISH

9I-D introduces no gameplay or visual changes from the passed 9I-C1 build.
It marks the Final Vault and all of Phase 9 as frozen.


# Phase 10A2b — MacBook Neo responsive QA

Target test viewport:
- 1204 × 680 CSS px
- Chrome page zoom 100%
- emulator scale 100%
- DPR 2 if available

This pass deliberately does NOT alter puzzle logic.

Changes:
- compact Charterhouse masthead at short 1204px-class laptop viewports
- opening screen CTA brought above the fold
- codename / Start Mission flow compacted above the fold
- mission board preserved with only modest chrome reduction
- challenge top bar, heading and right rail compacted
- puzzle content itself kept readable rather than globally scaled down
- Final Vault heading, route builder and machine tightened for 1204 × 680
- remaining Frozen Crossword side-panel wording corrected from 1–6 to A–F
- obsolete B-stage development notes removed from Challenges 4, 5, 6 and 7
- explicit PNG favicon added to remove Chrome's automatic favicon.ico 404 during QA

All Phase 9 puzzle answers, cooldowns, seals, persistence, offline logic,
Final Vault code and FINISH flow remain unchanged.


# Phase 10A2b — Single-screen game shell

10A1 is superseded. This is a structural responsive redesign rather than a compression pass.

At 1204×680 and larger desktop widths:
- gameplay masthead is 50px
- student footer is removed from the active game screens
- Mission Board sidebar becomes a compact horizontal mission deck
- challenge right rail is removed entirely
- progress, status, Field Kit and timer sit in the top utility bar
- challenge stage uses the full remaining width and height
- submission controls stay visible at the bottom of the stage
- Final Vault right rail is removed
- puzzle-specific single-screen layouts are used for all eight challenges

Puzzle layout changes:
1. House of Confusion: four suspects in one row; four clue tiles across the top.
2. Lost in Almaty: large map + fixed route sheet, no overlap.
3. Secret Message: transmissions + six cards + six decoder positions in one stage.
4. Telegram: telegram + compact hint/check panel.
5. Timetable: rules left; five subjects and five periods across the workspace.
6. Brain Freeze: true 2×2 A/B/C/D grid; permanent side cards removed.
7. Crossword: crossword + Across/Down + A–F extraction simultaneously.
8. Memory: observation fills the stage; questions use a 3×2 grid.
Final Vault: route builder and circular vault fill the entire stage.

No puzzle answers, validation rules, cooldowns, seals, persistence, offline logic, or FINISH flow were changed.


# 10A2b — QA hotfix

Fixes three issues found immediately after deploying 10A2:

1. Challenge links:
   - 10A2 removed the old permanent `.challenge-status-card`.
   - `app.js` still called `.classList` on that now-missing element.
   - the new compact `.challenge-mini-status` is now the supported status
     container and the update is null-safe.
   - challenge tiles open normally again.

2. Charterhouse masthead:
   - the full 687×223 logo lockup was too tall at 188px wide for the 50px
     gameplay masthead.
   - it now fits fully inside the bar without clipping the crest.

3. Mission progress:
   - 0/8 style counters are now rendered without spaces and explicitly
     prevented from wrapping onto two lines.

No puzzle logic, answers, cooldowns, seals, offline behavior or final-vault
finish logic were changed.
