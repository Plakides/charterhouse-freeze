(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 6,
    shortTitle: 'BRAIN FREEZE',
    title: 'Brain Freeze',
    eyebrow: 'RAPID-FIRE',
    duration: '4–5 min',
    intro: 'A short collection of questions has escaped into the heating controls.',
    brief: 'Split the questions across the team and combine the answers.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">06</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>Brain Freeze</h3>
        <p>Split the questions across the team and combine the answers.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
