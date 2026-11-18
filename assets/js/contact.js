/* Contact form: validation, then hand-off.
   Set FORM_ENDPOINT to a Formspree / Getform / your own API URL to receive submissions.
   Until then the form opens the visitor's email app with the message pre-filled. */
(() => {
  const FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx"
  const TO = "hello@neuralanvil.ai";

  const form = document.querySelector("form.contact");
  if (!form) return;
  const status = form.querySelector(".form-status");

  const rules = {
    name: (v) => v.trim().length > 1 || "Enter your name.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter an email address like name@company.com.",
    message: (v) => v.trim().length > 15 || "Tell us a little more: at least a sentence about the project.",
  };

  function check(name) {
    const el = form.elements[name];
    const res = rules[name](el.value);
    const err = form.querySelector(`[data-err="${name}"]`);
    err.textContent = res === true ? "" : res;
    el.setAttribute("aria-invalid", String(res !== true));
    return res === true;
  }
  Object.keys(rules).forEach((n) => form.elements[n].addEventListener("blur", () => check(n)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { status.textContent = "Check the highlighted fields and send again."; return; }

    const data = new FormData(form);
    const interests = data.getAll("interest").join(", ") || "Not specified";

    if (FORM_ENDPOINT) {
      status.textContent = "Sending…";
      try {
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error();
        form.reset();
        status.textContent = "Message sent. We reply within one business day.";
      } catch {
        status.textContent = `Couldn't send right now. Email us directly at ${TO}.`;
      }
      return;
    }

    const body = `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nCompany: ${data.get("company") || "-"}\nInterested in: ${interests}\nBudget: ${data.get("budget")}\n\n${data.get("message")}`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent("Project enquiry from " + data.get("name"))}&body=${encodeURIComponent(body)}`;
    status.textContent = "Your email app is opening with the message ready to send.";
  });
})();
