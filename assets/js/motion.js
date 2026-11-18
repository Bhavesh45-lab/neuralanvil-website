/* Neural Anvil — motion layer
   Scroll progress, hero parallax, staggered reveals, word-by-word headings,
   tilt + spotlight cards, magnetic buttons, cursor aura, self-drawing timeline.
   Everything switches off under prefers-reduced-motion. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  /* ---------- Scroll progress + hero parallax ---------- */
  const bar = document.createElement("div");
  bar.className = "progress";
  document.body.appendChild(bar);
  const hero = document.querySelector(".hero");
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (hero && !reduce) {
        const y = Math.min(scrollY, innerHeight * 1.2);
        hero.style.setProperty("--sy", y.toFixed(1));
      }
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  if (reduce) return;

  /* ---------- Cursor aura ---------- */
  if (fine) {
    const aura = document.createElement("div");
    aura.className = "aura";
    document.body.prepend(aura);
    let ax = innerWidth / 2, ay = innerHeight / 2, tx = ax, ty = ay;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      root.classList.add("has-pointer");
    }, { passive: true });
    (function loop() {
      ax += (tx - ax) * 0.12; ay += (ty - ay) * 0.12;
      aura.style.setProperty("--ax", ax + "px");
      aura.style.setProperty("--ay", ay + "px");
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Word-by-word headings ---------- */
  document.querySelectorAll("main h2, .cta h2").forEach((h) => {
    if (h.closest(".hero") || h.children.length || h.classList.contains("label")) return;
    const words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(" ");
    h.classList.add("wsplit");
    h.setAttribute("aria-label", words.join(" "));
  });

  /* ---------- Staggered reveals ---------- */
  const groups = [
    ".sec-head > *", ".practice", ".pillar", ".step", ".industry", ".svc-item", ".model",
    ".track", ".principle", ".role", ".channel", ".statement", ".explorer", ".equation",
    ".topics span", ".contact-info", "form.contact", ".glossary-tools", ".stack",
    ".col", ".impact article", ".row-label", ".sub", ".note", ".inst-emblem", ".inst-actions", ".row-split > .btn",
    ".academy-band > div > .lede", ".academy-band > div > .btn", ".split > div", ".cta .lede", ".cta .actions",
  ];
  const targets = new Set();
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest(".hero") || el.closest(".page-hero")) return;
      const sibs = [...el.parentElement.children].filter((c) => c.matches(sel));
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 8));
      el.classList.add("reveal");
      targets.add(el);
    });
  });
  document.querySelectorAll(".wsplit, .process").forEach((el) => targets.add(el));
  document.querySelectorAll(".process .step").forEach((el, i) => el.style.setProperty("--d", i));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  targets.forEach((el) => io.observe(el));

  /* ---------- Tilt + spotlight cards ---------- */
  document.querySelectorAll(".pillar, .model, .track, .channel, .industry, .svc-item, .term, .explorer, .equation").forEach((card) => {
    card.classList.add("tilt");
    const strength = card.matches(".pillar, .model, .track, .channel") ? 7 : card.matches(".explorer, .equation") ? 2 : 4;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", x * 100 + "%");
      card.style.setProperty("--my", y * 100 + "%");
      if (!fine) return;
      card.classList.add("is-tilting");
      card.style.setProperty("--ry", ((x - 0.5) * strength).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * strength).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine) {
    document.querySelectorAll(".btn-arc, .btn-outline, .menu-btn").forEach((b) => {
      b.classList.add("magnet");
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px");
        b.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", () => {
        b.style.setProperty("--bx", "0px");
        b.style.setProperty("--by", "0px");
      });
    });
  }
})();
