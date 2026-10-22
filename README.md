# Jacob Gil’s portfolio

A static portfolio built from the approved Paper design. Public site: [jgil325.github.io](https://jgil325.github.io).

## Develop

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

The preview runs at `http://127.0.0.1:4339`. After an edit, run `npm run build` and refresh the browser.

## Verify

```sh
npm run format
npm run build
npm test
```

The validation checks every static page, internal links and anchors, image descriptions and dimensions, curated project order, and motion safeguards. Browser checks cover desktop and mobile layouts, dark mode, reduced motion, library filtering, search, and navigation.

## Update content

- Edit `src/projects.mjs` for project descriptions, order, credits, and public source links.
- Edit `src/templates.mjs` for page structure and shared content.
- Edit `src/styles.css` for the responsive design and motion tokens.
- Edit `src/client.js` for the theme switch and project library interactions.
- Replace approved visual compositions in `assets/source/`. The build converts them to WebP.

The site has no runtime framework, tracking scripts, API keys, or backend. Each project has a real static URL that can be opened directly. The page content works without JavaScript; search, filters, theme preferences, and motion are progressive enhancements.

## Motion

The first-visit hero uses a 400 ms entrance with a 50 ms stagger. Project reveals run once per visit at 300 ms. Fine-pointer hover feedback is 200 ms, press feedback is 160 ms, and filter results use a 150 ms crossfade. Keyboard actions are immediate, and reduced motion removes transforms and smooth scrolling.

## Credits and image provenance

- App previews and visual compositions come from the approved Paper design and actual project screenshots.
- Hustler Casino Live and Lodge Card Club previews use the actual RF Cloud renderer with sample hand and player data. The Lodge view uses the Lodge Livestream header.
- Card Vendor Tracker shows the current Stack design with a demo collection. Its public source may have an earlier interface.
- Weekly Slopmeter is adapted from [JeanMeijer/slopmeter](https://github.com/JeanMeijer/slopmeter), licensed MIT. The preview uses illustrative sample usage data.
- OiStir / AI Audio Interface and Vanilla Chat are credited as team projects.
- Professional broadcast work is credited to RF Labs / RF Cloud. Private source code is not included in this repository.

## Publish

GitHub Actions builds, validates, and deploys `dist/` to GitHub Pages on pushes to `main`. Content and asset URLs are rooted at the account domain, `https://jgil325.github.io`.
