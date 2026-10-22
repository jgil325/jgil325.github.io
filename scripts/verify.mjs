import { readdir, readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../src/projects.mjs";
import sharp from "sharp";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    ),
  );
  return nested.flat();
}
const all = await files(root);
const htmlFiles = all.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `One h1: ${file}`);
  assert(html.includes('name="viewport"'), `Viewport: ${file}`);
  assert(html.includes('id="main"'), `Main landmark: ${file}`);
  const destinations = [
    ...html.matchAll(/\b(href|src|srcset)="([^"]+)"/g),
  ].flatMap(([, attribute, value]) =>
    attribute === "srcset"
      ? value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0])
      : [value],
  );
  for (const url of destinations) {
    if (!url.startsWith("/")) continue;
    const parsed = new URL(url, "https://example.test");
    const target = path.join(
      root,
      parsed.pathname,
      parsed.pathname.endsWith("/") ? "index.html" : "",
    );
    assert(
      (await stat(target)).isFile(),
      `Internal destination ${url} in ${file}`,
    );
    if (parsed.hash) {
      const targetHtml = await readFile(target, "utf8");
      assert(
        targetHtml.includes(`id="${parsed.hash.slice(1)}"`),
        `Anchor ${url} in ${file}`,
      );
    }
  }
  for (const [, tag] of html.matchAll(/(<img\b[^>]*>)/g)) {
    assert(/\balt="[^"]*"/.test(tag), `Image alternative text: ${file}`);
    assert(
      /\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag),
      `Reserved image dimensions: ${file}`,
    );
    assert(
      /\bsrcset="[^"]+"/.test(tag) && /\bsizes="[^"]+"/.test(tag),
      `Responsive image sources: ${file}`,
    );
  }
  assert(
    !/file:\/\/|app\.paper\.design\/file-assets|localhost|127\.0\.0\.1/.test(
      html,
    ),
    `No local/editor URLs: ${file}`,
  );
}
// A single small export must never be stretched across Retina screens again.
const imageManifest = JSON.parse(
  await readFile(path.join(root, "build.json"), "utf8"),
).images;
for (const [key, image] of Object.entries(imageManifest)) {
  const requiredWidth = key.startsWith("hero-")
    ? 3 * 424
    : key.endsWith("-mobile")
      ? 3 * 727
      : 3 * 1312;
  assert(
    image.variants.at(-1).width >= requiredWidth,
    `3x image coverage: ${key}`,
  );
  for (const variant of image.variants) {
    const metadata = await sharp(path.join(root, variant.src)).metadata();
    assert.equal(
      metadata.width,
      variant.width,
      `Truthful srcset width: ${variant.src}`,
    );
    assert.equal(
      metadata.height,
      variant.height,
      `Image aspect ratio: ${variant.src}`,
    );
    assert(
      /-\d+-[a-f0-9]{10}\.webp$/.test(variant.src),
      `Cache-safe image URL: ${variant.src}`,
    );
  }
}
const home = await readFile(path.join(root, "index.html"), "utf8");
const headings = [...home.matchAll(/<h3>([^<]+)<\/h3>/g)].map(
  (match) => match[1],
);
assert.equal(headings[0], "OFC Mobile");
assert(
  headings.indexOf("Card Vendor Tracker") <
    headings.indexOf("AI Audio Interface"),
  "Card Vendor Tracker has priority over OiStir",
);
assert.equal(
  new Set(projects.map((project) => project.slug)).size,
  projects.length,
  "Unique project URLs",
);
assert.equal(projects.length, 8, "Eight curated projects");
assert(
  projects.filter((project) => project.image).every((project) => project.alt),
  "Every project visual has a description",
);
const styles = await readFile(
  all.find((file) => /site-.*\.css$/.test(file)),
  "utf8",
);
assert(styles.includes("prefers-reduced-motion"), "Reduced-motion support");
assert(
  styles.includes("(hover: hover) and (pointer: fine)"),
  "Touch-safe hover feedback",
);
assert(!/transition:\s*all\b/.test(styles), "Explicit transition properties");
const client = await readFile(
  all.find((file) => /site-.*\.js$/.test(file)),
  "utf8",
);
assert(
  !/addEventListener\(['"]scroll['"]/.test(client),
  "No per-frame scroll handlers",
);
console.log(
  `Verified ${htmlFiles.length} pages, all internal destinations and srcset candidates, 3x image coverage, project order, and motion safeguards.`,
);
