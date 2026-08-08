(() => {
  "use strict";

  const nowPlaying = document.querySelector(".now-playing");
  const nowPlayingTitle = document.querySelector(".now-playing-title");
  const nowPlayingMeta = document.querySelector(".now-playing-meta");

  document.querySelectorAll(".play-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      nowPlayingTitle.textContent = btn.dataset.title;
      nowPlayingMeta.textContent = btn.dataset.meta;
      nowPlaying.classList.add("is-visible");
    });
  });

  document.querySelector(".now-playing-close")?.addEventListener("click", () => {
    nowPlaying.classList.remove("is-visible");
  });

  const mailForm = document.querySelector(".mail-form");
  mailForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    document.querySelector(".mail-confirm")?.classList.add("is-visible");
    mailForm.reset();
  });
})();
