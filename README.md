# Diwali 3D – personalised, interactive celebration

## Run
```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```

## Sender-only personalised link
- Open the site with no parameters → **creation page** (one field: your name).
- *Create Diwali Experience* → `https://yoursite.com/?from=Soumyajit` (built with `URLSearchParams`, so spaces and special/Unicode characters are encoded).
- Buttons: Copy Link, Share on WhatsApp, Preview Experience.
- A receiver opening `?from=Name` sees no form – only **Start Experience**, then the full experience ending in
  `WITH LOVE, <Name>`. Missing/empty `from` falls back to the creation page; names are stripped of control chars and `<>`, limited to 40 chars, and rendered as plain text.

## Deploy to GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the site whenever
`main` or `master` is pushed. Vite automatically uses the repository name as the project
site base path (for example, `/diwali-3d/`), so bundled JavaScript, CSS, textures, and
other resources load from GitHub Pages correctly.

To enable deployment:

1. Push this project to GitHub.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or `master`, or run **Deploy to GitHub Pages** from the Actions tab.

The Vite config also supports `VITE_BASE_PATH` for a custom deployment path. A repository
named `<username>.github.io` automatically uses `/` as its base path.

For Netlify/Cloudflare Pages, `public/_redirects` sends paths to `index.html`; `vercel.json`
provides the equivalent Vercel fallback.

## Experience flow
Loading → (creator **or** welcome) → cinematic aerial intro for personalised links → tap the single diya → rangoli powder-reveals from the centre → tap the lantern → fireworks (12 types, chips + tap the sky; *Grand Finale*) → cinematic greeting.

## Files
`src/Scene.jsx` scene assembly + camera rig · `House.jsx` house/facade · `Courtyard.jsx` tiles, walls, trees, pots, petals, rangoli, sky · `Diyas.jsx` + `shaders.js` diyas/flame shader · `Fireworks.jsx` particle system · `audio.js` synthesized music + SFX (no audio files) · `textures.js` procedural PBR textures · `App.jsx` UI/flow · `styles.css`.

## Known limits
- All models/textures are procedural (no downloaded assets) to stay offline, licence-free and light; it is detailed but not photoscan-realistic.
- Quality auto-lowers on phones (fewer particles/lights/decor).
