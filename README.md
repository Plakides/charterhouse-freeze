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
