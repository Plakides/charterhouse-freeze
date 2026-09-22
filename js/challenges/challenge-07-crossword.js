(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 7,
    shortTitle: 'CROSSWORD',
    title: 'The Frozen Crossword',
    eyebrow: 'CROSS-CURRICULAR',
    duration: '5 min',
    intro: 'The emergency system has decided that a crossword is a security feature.',
    brief: 'Complete the clues and use the highlighted letters to recover the submission answer.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">07</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>The Frozen Crossword</h3>
        <p>Complete the clues and use the highlighted letters to recover the submission answer.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
