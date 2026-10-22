import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  rm,
  copyFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import assert from "node:assert/strict";
import { profile, projects } from "../src/projects.mjs";
import {
  shell,
  home,
  library,
  caseStudy,
  resume,
  notFound,
} from "../src/templates.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "assets"), { recursive: true });
const manifest = {};
for (const [type, source] of [
  ["css", "src/styles.css"],
  ["js", "src/client.js"],
]) {
  const content = await readFile(path.join(root, source));
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 10);
  manifest[type] = `site-${hash}.${type}`;
  await writeFile(path.join(out, "assets", manifest[type]), content);
}
const sourceAssets = path.join(root, "assets/source");
const images = {};
const imageWidths = [
  360, 480, 640, 768, 960, 1200, 1536, 1920, 2304, 2688, 3072, 4096,
];
async function saveImage(name, buffer) {
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 10);
  const filename = `${name}-${hash}.webp`;
  await writeFile(path.join(out, "assets", filename), buffer);
  return `/assets/${filename}`;
}
for (const filename of await readdir(sourceAssets)) {
  if (!filename.endsWith(".png") || filename === "social-preview.png") continue;
  const key = filename.replace(/\.png$/, "");
  const source = path.join(sourceAssets, filename);
  const metadata = await sharp(source).metadata();
  const minimumWidth = key.startsWith("hero-")
    ? 1536
    : key.endsWith("-mobile")
      ? 2304
      : 4096;
  assert(
    metadata.width >= minimumWidth,
    `${filename}: re-export from Paper at ${minimumWidth}px or wider; do not upscale a 1x export.`,
  );
  const widths = imageWidths.filter((width) => width <= metadata.width);
  const variants = [];
  for (const width of widths) {
    // Lossless WebP preserves the small text and card details in UI captures.
    const { data, info } = await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ lossless: true, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const src = await saveImage(`${key}-${width}`, data);
    variants.push({
      src,
      width: info.width,
      height: info.height,
      bytes: data.length,
    });
  }
  const fallback =
    variants.find((variant) => variant.width >= 1536) || variants.at(-1);
  images[key] = {
    src: fallback.src,
    width: metadata.width,
    height: metadata.height,
    variants,
  };
}
// A real Paper hero composition is used as the social image.
const socialImage = await sharp(path.join(sourceAssets, "social-preview.png"))
  .resize(1200, 630, { fit: "contain", background: "#FAFAFC" })
  .webp({ lossless: true, effort: 4 })
  .toBuffer();
const socialImageUrl = await saveImage("social-preview", socialImage);
await copyFile(
  path.join(root, "assets/favicon.svg"),
  path.join(out, "favicon.svg"),
);
await writeFile(path.join(out, ".nojekyll"), "");

const pages = [
  {
    path: "/",
    file: "index.html",
    title: "Jacob Gil | Product Lead & Engineer",
    description:
      "Thoughtful software, from mobile products and practical tools to live broadcast graphics. Selected work by Jacob Gil.",
    content: home(images),
    page: "home",
  },
  {
    path: "/work/",
    file: "work/index.html",
    title: "The project library | Jacob Gil",
    description:
      "Explore Jacob Gil’s selected apps, tools, broadcast graphics, and earlier collaborations.",
    content: library(),
    page: "library",
  },
  ...projects.map((project) => ({
    path: `/work/${project.slug}/`,
    file: `work/${project.slug}/index.html`,
    title: `${project.title} | Jacob Gil`,
    description: project.summary,
    content: caseStudy(project, images),
    page: "project",
  })),
  {
    path: "/resume/",
    file: "resume/index.html",
    title: "Resume | Jacob Gil",
    description:
      "Jacob Gil’s product and engineering experience, selected projects, and professional focus.",
    content: resume(),
    page: "resume",
  },
  {
    path: "/404.html",
    file: "404.html",
    title: "Page not found | Jacob Gil",
    description: "Find your way back to Jacob Gil’s portfolio.",
    content: notFound(),
    page: "404",
    noindex: true,
  },
];
for (const page of pages) {
  const destination = path.join(out, page.file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, shell({ ...page, ...manifest, socialImageUrl }));
}
const urls = pages
  .filter((page) => !page.noindex)
  .map((page) => `${profile.site}${page.path}`);
await writeFile(
  path.join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  path.join(out, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${profile.site}/sitemap.xml\n`,
);
const revision = process.env.GITHUB_SHA || "local";
await writeFile(
  path.join(out, "build.json"),
  JSON.stringify(
    { revision, projectCount: projects.length, assets: manifest, images },
    null,
    2,
  ),
);
console.log(
  `Built ${pages.length} static pages with ${projects.length} curated projects.`,
);
