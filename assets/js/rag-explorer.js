/* Interactive "how a RAG system works" explorer on the home page */
(() => {
  const root = document.querySelector("[data-explorer]");
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const svg = root.querySelector(".rag");
  const title = root.querySelector("[data-title]");
  const body = root.querySelector("[data-body]");

  const steps = [
    { nodes: ["q"], wires: [], docs: [],
      t: "A question comes in",
      b: "A user asks: <code>What is our refund policy for annual plans?</code> On its own, a language model has never seen your company's documents, so it would guess." },
    { nodes: ["q", "emb"], wires: ["w1"], docs: [],
      t: "Turn it into a vector",
      b: "An embedding model converts the question into a list of numbers that captures its meaning. Similar meanings land close together in this space." },
    { nodes: ["emb", "db"], wires: ["w2"], docs: [1, 4, 6],
      t: "Retrieve the closest passages",
      b: "A vector database compares that vector against millions of pre-indexed document chunks and returns the few most similar ones, usually by cosine similarity." },
    { nodes: ["db", "ctx", "q"], wires: ["w3", "w5"], docs: [1, 4, 6],
      t: "Augment the prompt",
      b: "The retrieved passages are placed into the prompt alongside the original question, with instructions to answer only from that context and cite it." },
    { nodes: ["ctx", "llm", "out"], wires: ["w4", "w6"], docs: [1, 4, 6],
      t: "Generate a grounded answer",
      b: "The LLM writes the answer from the supplied evidence. Because sources travel with it, the answer can be checked, and the knowledge stays current without retraining." },
  ];

  function show(i) {
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    const s = steps[i];
    svg.querySelectorAll(".node").forEach((n) => n.classList.toggle("on", s.nodes.includes(n.dataset.id)));
    svg.querySelectorAll(".wire").forEach((w) => w.classList.toggle("on", s.wires.includes(w.dataset.id)));
    svg.querySelectorAll(".doc").forEach((d, k) => d.classList.toggle("hit", s.docs.includes(k)));
    title.textContent = s.t;
    body.innerHTML = s.b;
  }

  // Autoplay through the steps while visible, until the visitor takes over
  let cur = 0, timer = null, manual = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const play = () => { if (manual || reduce || timer) return; timer = setInterval(() => { cur = (cur + 1) % steps.length; show(cur); }, 3600); };
  const stop = () => { clearInterval(timer); timer = null; };
  const takeOver = () => { manual = true; stop(); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => (e[0].isIntersecting ? play() : stop()), { threshold: 0.4 }).observe(root);
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { takeOver(); cur = i; show(i); });
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + tabs.length) % tabs.length;
      takeOver(); cur = n; tabs[n].focus(); show(n);
    });
  });
  show(0);
})();
