/* Visitor analytics, loaded on every page.
   Paste your GoatCounter code below (the part before .goatcounter.com),
   e.g. "neuralanvil" for https://neuralanvil.goatcounter.com
   Optionally add a Google Analytics 4 ID ("G-XXXXXXXXXX") too. */
(() => {
  const GOATCOUNTER = "";
  const GA4 = "";

  window.NA_ANALYTICS = { GOATCOUNTER, GA4 };

  // Don't count the admin area or local previews
  if (location.pathname.startsWith("/admin") || location.protocol === "file:" || /^(localhost|127\.)/.test(location.hostname)) return;

  if (GOATCOUNTER) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${GOATCOUNTER}.goatcounter.com/count`;
    document.head.appendChild(s);
  }
  if (GA4) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4);
  }
})();
