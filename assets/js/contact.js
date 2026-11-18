/* Contact form: validation, then delivery to your inbox via FormSubmit (free, no account).
   Put the email address that should receive enquiries in RECEIVE_AT.
   The first submission sends a one-time "Activate Form" email to that address: click it once.
   Until RECEIVE_AT is set, the form falls back to opening the visitor's email app. */
(() => {
  const RECEIVE_AT = ""; // e.g. "you@gmail.com"
  const FORM_ENDPOINT = RECEIVE_AT ? `https://formsubmit.co/ajax/${RECEIVE_AT}` : "";
  const TO = "hello@neuralanvilai.com";

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
    if (data.get("_honey")) return; // bot filled the hidden field
    const interests = data.getAll("interest").join(", ") || "Not specified";

    if (FORM_ENDPOINT) {
      status.textContent = "Sending…";
      try {
        const payload = {
          name: data.get("name"), email: data.get("email"), company: data.get("company") || "-",
          budget: data.get("budget"), interested_in: interests, message: data.get("message"),
          page: location.href,
          _subject: `New enquiry from ${data.get("name")} (neuralanvilai.com)`,
          _replyto: data.get("email"), _template: "table", _captcha: "false",
        };
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json", Accept: "application/json" } });
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
