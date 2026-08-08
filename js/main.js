(() => {
  "use strict";

  const mailForm = document.querySelector(".mail-form");
  mailForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    document.querySelector(".mail-confirm")?.classList.add("is-visible");
    mailForm.reset();
  });
})();
