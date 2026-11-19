/* Neural Anvil — shared site behaviour */
(() => {
  const doc = document.documentElement;

  // Page-load moment (hero headline lift)
  requestAnimationFrame(() => setTimeout(() => doc.classList.add("is-loaded"), 60));

  // When opened straight from disk (file://), folder links like "services/" need index.html
  if (location.protocol === "file:") {
    document.querySelectorAll('a[href]').forEach((a) => {
      const h = a.getAttribute("href");
      if (!/^(https?:|mailto:|tel:|#)/.test(h) && /\/$/.test(h.split("#")[0])) {
        const [path, hash] = h.split("#");
        a.setAttribute("href", path + "index.html" + (hash ? "#" + hash : ""));
      }
    });
  }

  // Header turns solid after scrolling
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("is-solid", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const btn = document.querySelector(".menu-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const open = doc.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        doc.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }


  // Education dropdown: hover on desktop; tap to open on touch screens; Esc closes
  document.querySelectorAll(".nav-links .has-menu").forEach((li) => {
    const a = li.querySelector(":scope > a");
    const set = (on) => { li.classList.toggle("open", on); a.setAttribute("aria-expanded", String(on)); };
    li.addEventListener("mouseenter", () => a.setAttribute("aria-expanded", "true"));
    li.addEventListener("mouseleave", () => set(false));
    a.addEventListener("click", (e) => {
      const touch = window.matchMedia("(hover: none)").matches;
      const mobileMenu = doc.classList.contains("menu-open");
      if (touch && !mobileMenu && !li.classList.contains("open")) { e.preventDefault(); set(true); }
    });
    document.addEventListener("click", (e) => { if (!li.contains(e.target)) set(false); });
    li.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); a.focus(); } });
  });

  // Opt-in reveal for a few key blocks only
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && els.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  // Highlight the current section in the nav (also covers blog posts and lessons)
  const here = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const path = new URL(a.href, location.href).pathname;
    if (path !== "/" && here.startsWith(path)) a.setAttribute("aria-current", "page");
  });

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
