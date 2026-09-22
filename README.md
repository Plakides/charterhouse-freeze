# The Great Charterhouse Freeze — Task 5C

Task 5C completes the student entry/session lifecycle.

## Live backend
`https://script.google.com/macros/s/AKfycbzGoDvgj7ihj1ZU318MIEjFbxOstCR24GifT9NYW4tpZ7IvpEtvbzeeSLNiqyE2i-Getw/exec`

## Implemented
- live team registration
- save only TeamID + SessionToken in browser localStorage
- Start Mission calls the real `startMission` endpoint
- backend StartTime is set once only
- elapsed timer begins from the backend StartTime
- page refresh restores the existing team through `getTeamState`
- closing/reopening the tab restores the same team on the same browser/device
- a registered-but-not-started team returns to the codename reveal
- a started team returns to the active mission holding screen
- invalid/deleted backend sessions are cleared safely
- temporary network failure does NOT erase the saved session
- Retry Connection is offered if recovery cannot reach the backend
- public UI never displays the token
- no second team can be accidentally registered while a valid session is saved

## Resetting a test browser
For teacher testing only, append:

`?reset=1`

to the site URL once.

Example:
`https://YOUR-GITHUB-PAGES-URL/?reset=1`

The page clears the local TeamID/token and immediately removes `reset=1` from the address bar.

This only clears the browser copy. It does NOT delete the previous row from the backend Sheet.

## Next
Task 6 replaces the mission holding screen with the actual 3×3 frozen challenge dashboard.
