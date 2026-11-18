/* Blog posts and lessons: reading time, table of contents, maths, code copy, share link */
(() => {
  const prose = document.querySelector("[data-prose]");
  if (!prose) return;

  // Reading time (about 220 words a minute)
  const words = (prose.innerText || "").trim().split(/\s+/).length;
  const rt = document.querySelector("[data-readtime]");
  if (rt) rt.textContent = Math.max(1, Math.round(words / 220)) + " min read";

  // Table of contents from h2/h3
  const toc = document.querySelector("[data-toc]");
  const heads = [...prose.querySelectorAll("h2, h3")].filter((h) => !h.closest(".post-foot, .post-pager"));
  heads.forEach((h, i) => {
    if (!h.id) h.id = (h.textContent || "section-" + i).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  });
  if (toc) {
    if (heads.length < 2) toc.closest(".toc") && toc.previousElementSibling && toc.previousElementSibling.classList.contains("toc-sub") ? (toc.previousElementSibling.hidden = true) : null;
    toc.innerHTML = heads.map((h) => `<li class="${h.tagName === "H3" ? "sub" : ""}"><a href="#${h.id}">${h.textContent}</a></li>`).join("");
    const links = [...toc.querySelectorAll("a")];
    if ("IntersectionObserver" in window && links.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      heads.forEach((h) => io.observe(h));
    }
  }

  // Maths (KaTeX). kramdown turns $$...$$ into \[...\] and \(...\)
  const renderMath = () => {
    if (window.renderMathInElement) {
      window.renderMathInElement(prose, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  };
  if (document.readyState === "complete") renderMath(); else window.addEventListener("load", renderMath);

  // Copy buttons on code blocks
  prose.querySelectorAll("pre").forEach((pre) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "copy-code"; b.textContent = "Copy";
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.innerText.replace(/\nCopy$/, "")); b.textContent = "Copied"; }
      catch { b.textContent = "Select and copy"; }
      setTimeout(() => (b.textContent = "Copy"), 1800);
    });
    pre.appendChild(b);
  });

  // Wide tables scroll on small screens
  prose.querySelectorAll("table").forEach((t) => {
    const w = document.createElement("div"); w.className = "table-wrap";
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });

  // Copy page link
  const cl = document.querySelector("[data-copy-link]");
  if (cl) cl.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); cl.textContent = "Link copied"; }
    catch { cl.textContent = location.href; }
  });
})();
