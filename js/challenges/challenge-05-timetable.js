(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 5,
    shortTitle: 'TIMETABLE',
    title: 'The Impossible Timetable',
    eyebrow: 'LOGIC GRID',
    duration: '5 min',
    intro: 'Five subjects. Five periods. An unreasonable number of constraints.',
    brief: 'Use the timetable clues to determine the requested lesson position.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">05</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>The Impossible Timetable</h3>
        <p>Use the timetable clues to determine the requested lesson position.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
