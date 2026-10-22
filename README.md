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
- Edit `src/scene.js` for the dot-field scenes behind the home hero and the contact band: each scene's framing (mirroring, subject) and idle animation (wind, clouds, sunlight, lamps, particles, contrast) live in its `SCENES` entry. The rotation order is `sceneOrder` in `src/templates.mjs`, and each stage's anchor and edge dissolve are set where it is placed. Source pictures live in `assets/scenes/`; the build resizes them to 1280 px WebP.
- Replace approved visual compositions in `assets/source/` with high resolution Paper exports: at least 4096 px wide for project desktop/case images and 2304 px for mobile. Do not enlarge the old 1× PNGs. The build creates responsive lossless WebP sizes with content hashes in their URLs.
- `src/images.mjs` keeps browser image selection aligned with the desktop, tablet, mobile, and case-study layouts. Image validation checks every `srcset` candidate and enough resolution for 3× displays.

The site has no runtime framework, tracking scripts, API keys, or backend. Each project has a real static URL that can be opened directly. The page content works without JavaScript; search, filters, theme preferences, and motion are progressive enhancements.

## Motion

The first-visit hero uses a 400 ms entrance with a 50 ms stagger, while its scene dissolves in dot by dot over 1.1 s. The contact scene dissolves in the first time it scrolls into view. Both stages rotate through seven scenes, holding each for 8 s of visible time. A 1.9 s ripple spreads across the dots from the top right: each dot shrinks, swaps to the new picture and pops back, and the new scene's idle animation fades in over 1.2 s once the ripple has passed. Idle animations run at 30 fps: grass, wheat and hair sway, clouds billow, sunlight passes, lamps flicker, and snow, paper or dust drift across the dot grid. Only the current and next pictures are loaded. Scenes pause offscreen and in background tabs; where WebGL is software-rendered, or frames fall below about 22 fps, they hold a still frame. Below the hero the home page sits on a faint dot grid; around a mouse pointer the dots grow and take the accent in a ring that stays light at its center, so text under the pointer remains readable. The glow follows at most once per frame and fades after 1.6 s at rest. The theme switch grows the new theme out of the toggle as a 620 ms circle. Project reveals run once per visit at 300 ms. Fine-pointer hover feedback is 200 ms, press feedback is 160 ms, and filter results use a 150 ms crossfade. Keyboard actions are immediate, and reduced motion removes transforms, smooth scrolling, and scene animation (each scene draws one still frame).

## Credits and image provenance

- App previews and visual compositions come from the approved Paper design and actual project screenshots.
- Hustler Casino Live and Lodge Card Club previews use the actual RF Cloud renderer with sample hand and player data. The Lodge view uses the Lodge Livestream header.
- Card Vendor Tracker shows the current Stack design with a demo collection. Its public source may have an earlier interface.
- Weekly Slopmeter is adapted from [JeanMeijer/slopmeter](https://github.com/JeanMeijer/slopmeter), licensed MIT. The preview uses illustrative sample usage data.
- OiStir / AI Audio Interface and Vanilla Chat are credited as team projects.
- Professional broadcast work is credited to RF Labs / RF Cloud. Private source code is not included in this repository.
- The home scenes are Mushoku Tensei artwork and anime screenshots: [Roxy & Rudeus, hillside](https://wallhaven.cc/w/gpeoyl), [Eris, open skies](https://wallhaven.cc/w/v936d8), [Sylphie, golden hour](https://wallhaven.cc/w/g76xe3), [snowy mountain crossing](https://wallhaven.cc/w/jxvl8p), [Roxy, arcane city](https://wallhaven.cc/w/x6vlw3) ([artist](https://www.pixiv.net/artworks/123786185)), [sunlit study](https://wallhaven.cc/w/j3ym5y) ([artist](https://www.pixiv.net/en/artworks/88777467)), and [sleepy cats](https://wallhaven.cc/w/6dzz36). The artwork belongs to its creators and rights holders; replace it with original art before relying on it commercially.
- Geist and Geist Mono are by Vercel and basement.studio, licensed under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`). The build serves Latin subsets.

## Publish

GitHub Actions builds, validates, and deploys `dist/` to GitHub Pages on pushes to `main`. Content and asset URLs are rooted at the account domain, `https://jgil325.github.io`.
