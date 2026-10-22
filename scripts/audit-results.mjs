import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const report = JSON.parse(await readFile(process.argv[2], "utf8"));
for (const name of ["performance", "accessibility", "best-practices", "seo"]) {
  const score = report.categories[name]?.score;
  assert.equal(typeof score, "number", `Lighthouse returned a ${name} score`);
  console.log(`${name}: ${Math.round(score * 100)}`);
  assert(score >= 0.9, `Lighthouse ${name} must score at least 90`);
}
for (const name of [
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
]) {
  console.log(`${name}: ${report.audits[name]?.displayValue}`);
}
