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
