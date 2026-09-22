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
