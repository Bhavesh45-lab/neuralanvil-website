# Neural Anvil — website

Official website for **Neural Anvil**, an AI engineering and education institute.
*Forging the future of intelligence.*

Design principle: dark cinematic sections alternate with clean white editorial sections.

Static site: plain HTML, CSS and JavaScript. No build step and no dependencies, so it runs on GitHub Pages, Netlify, Vercel or any web host.

## Folder structure

```
neuralanvil-website/
├── index.html              Home
├── research/index.html     Research & academy → /research/
├── intelligence/index.html Intelligence (services) → /intelligence/
├── institute/index.html    The institute   → /institute/
├── insights/index.html     Insights + AI glossary → /insights/
├── contact/index.html      Contact form    → /contact/
├── 404.html                Not-found page
├── assets/
│   ├── css/style.css       Design system and all styles
│   ├── js/
│   │   ├── main.js         Header, mobile menu, shared behaviour
│   │   ├── motion.js       Scroll reveals, parallax, tilt cards, cursor glow
│   │   ├── forge.js        Hero scene (planet horizon, network, light)
│   │   ├── rag-explorer.js Interactive RAG walkthrough (home)
│   │   ├── glossary.js     Searchable AI glossary (insights)
│   │   └── contact.js      Contact form validation and sending
│   └── img/
│       ├── favicon.png
│       └── brand/          mark.png, wordmark.png, logo-full.png, og-image.png
├── robots.txt
├── sitemap.xml
└── README.md
```

## Preview locally

Double-click `index.html`, or run a local server for the most accurate result:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Things to set before launch

| What | Where |
|---|---|
| YouTube / Instagram / LinkedIn URLs | footer in every page, and `insights/index.html` |
| Email addresses (`hello@`, `academy@`, `careers@`) | footer, `contact/index.html`, `assets/js/contact.js` |
| Form endpoint (Formspree, etc.) | `FORM_ENDPOINT` in `assets/js/contact.js` — until set, the form opens the visitor's email app |
| Domain | `sitemap.xml`, `robots.txt`, canonical tags (currently `https://neuralanvil.ai`) |

## Deploy on GitHub Pages

1. Create a repository and push this folder.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Add a file named `CNAME` containing your domain (e.g. `neuralanvil.ai`).
4. At your domain registrar, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<your-github-username>.github.io`
5. Back in Settings → Pages, tick *Enforce HTTPS* once the certificate is issued.
