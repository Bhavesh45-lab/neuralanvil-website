/* Neural Anvil videos: live YouTube player + auto-synced video list.
   - The main player embeds the channel's uploads playlist, so a new upload
     appears in it the moment it is published (no site change needed).
   - The thumbnail list comes from assets/data/youtube.json, refreshed every
     hour by the GitHub "Sync YouTube videos" workflow.
   Click a video to watch it here. Double-click to open it on YouTube. */
(() => {
  const CHANNEL = "UChFVNyFah39gclok8yCbX1w";
  const UPLOADS = "UU" + CHANNEL.slice(2);
  const CHANNEL_URL = "https://www.youtube.com/@NuralAnvil45";
  const root = document.querySelector("[data-yt]");
  if (!root) return;
  const dataUrl = root.dataset.src;
  const player = root.querySelector("[data-yt-player]");
  const list = root.querySelector("[data-yt-list]");
  const nowTitle = root.querySelector("[data-yt-title]");
  const nowMeta = root.querySelector("[data-yt-meta]");
  const openBtn = root.querySelector("[data-yt-open]");
  const watchPage = root.dataset.watch; // overview page: where a click should go
  const limit = +root.dataset.limit || 50;

  const watchUrl = id => `https://www.youtube.com/watch?v=${id}`;
  const fmt = iso => { try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
  const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function embed(src) {
    if (!player) return;
    player.innerHTML = `<iframe src="${src}" title="Neural Anvil video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }
  function playLatest() {
    embed(`https://www.youtube-nocookie.com/embed/videoseries?list=${UPLOADS}&rel=0&modestbranding=1`);
    if (nowTitle) nowTitle.textContent = "Latest from the channel";
    if (nowMeta) nowMeta.textContent = "Newest uploads play first. Use the playlist button in the player to browse.";
    if (openBtn) openBtn.href = CHANNEL_URL + "/videos";
  }
  function play(v, autoplay = true) {
    embed(`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`);
    if (nowTitle) nowTitle.textContent = v.title;
    if (nowMeta) nowMeta.textContent = fmt(v.published);
    if (openBtn) openBtn.href = watchUrl(v.id);
    list && list.querySelectorAll(".yt-card").forEach(c => c.classList.toggle("is-playing", c.dataset.id === v.id));
  }

  function card(v) {
    const el = document.createElement("button");
    el.type = "button"; el.className = "yt-card"; el.dataset.id = v.id;
    el.setAttribute("aria-label", `Play ${v.title}`);
    el.title = "Click to play here · double-click to open on YouTube";
    el.innerHTML = `<span class="yt-thumb"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt=""><span class="yt-play" aria-hidden="true"></span>${v.short ? '<span class="yt-badge">Short</span>' : ""}</span>
      <span class="yt-text"><span class="yt-name">${esc(v.title)}</span><span class="yt-date">${fmt(v.published)}</span></span>`;
    // single click plays here; double click opens YouTube (wait briefly to tell them apart)
    let tm;
    el.addEventListener("click", () => {
      clearTimeout(tm);
      tm = setTimeout(() => {
        if (watchPage) { location.href = `${watchPage}?v=${v.id}`; return; }
        play(v); player && player.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 260);
    });
    el.addEventListener("dblclick", () => { clearTimeout(tm); window.open(watchUrl(v.id), "_blank", "noopener"); });
    return el;
  }

  function empty() {
    if (!list) return;
    list.innerHTML = `<div class="yt-empty"><p>Our latest videos are on YouTube.</p><a class="btn btn-line" href="${CHANNEL_URL}" target="_blank" rel="noopener">Open the channel <span aria-hidden="true">↗</span></a></div>`;
  }

  const wanted = new URLSearchParams(location.search).get("v");
  if (player) { if (!wanted) playLatest(); }

  fetch(dataUrl, { cache: "no-cache" })
    .then(r => (r.ok ? r.json() : { videos: [] }))
    .catch(() => ({ videos: [] }))
    .then(d => {
      const vids = (d.videos || []).slice(0, limit);
      if (player && wanted) {
        const v = vids.find(x => x.id === wanted) || { id: wanted, title: "Now playing", published: "" };
        play(v, false);
      }
      if (!list) return;
      if (!vids.length) return empty();
      list.innerHTML = "";
      vids.forEach(v => list.appendChild(card(v)));
      if (player && wanted) play(vids.find(x => x.id === wanted) || { id: wanted, title: "Now playing" }, false);
    });
})();
