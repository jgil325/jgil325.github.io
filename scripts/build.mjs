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
for (const filename of await readdir(sourceAssets)) {
  if (!filename.endsWith(".png")) continue;
  await sharp(path.join(sourceAssets, filename))
    .webp({ quality: 90, effort: 5, alphaQuality: 100 })
    .toFile(path.join(out, "assets", filename.replace(/\.png$/, ".webp")));
}
// A real Paper hero composition is used as the social image.
await sharp(path.join(sourceAssets, "social-preview.png"))
  .resize(1200, 630, { fit: "contain", background: "#FAFAFC" })
  .webp({ quality: 90 })
  .toFile(path.join(out, "assets/social-preview.webp"));
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
    content: home(),
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
    content: caseStudy(project),
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
  await writeFile(destination, shell({ ...page, ...manifest }));
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
    { revision, projectCount: projects.length, assets: manifest },
    null,
    2,
  ),
);
console.log(
  `Built ${pages.length} static pages with ${projects.length} curated projects.`,
);
