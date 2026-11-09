#!/usr/bin/env node
/**
 * Renders PHOTO-CREDITS.md from .cache/photos/credits.json so every CC BY /
 * CC BY-SA photo in public/products keeps its required attribution.
 *
 *   node scripts/write-photo-credits.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const credits = JSON.parse(await readFile(".cache/photos/credits.json", "utf8"));
const rows = Object.values(credits).sort((a, b) => a.slug.localeCompare(b.slug));

const lines = [
  "# Photo credits",
  "",
  "The photographs in `public/products` were sourced through the [Openverse](https://openverse.org) API and are",
  "used under the licences listed below. CC BY and CC BY-SA images require the attribution shown here; keep this",
  "file with the project if you keep the photos. Product images were cropped to a square and the hero image to 4:3,",
  "then re-encoded; no other edits were made. The six aisle cards on the homepage reuse product photos, credited",
  "once below. Replace any photo with your own pack shots from the admin dashboard whenever you like.",
  "",
  "| Image | Photo | Creator | Licence | Source |",
  "| ------- | ----- | ------- | ------- | ------ |",
];

function licenceLabel(credit) {
  let name = String(credit.license || "").trim();
  if (/^(BY|BY-SA|BY-NC|BY-ND|BY-NC-SA|BY-NC-ND)\b/i.test(name)) name = `CC ${name}`;
  const version = String(credit.license_version || "").trim();
  if (version && !name.includes(version)) name = `${name} ${version}`;
  return name.replace(/\s+/g, " ").trim();
}

for (const credit of rows) {
  const label = licenceLabel(credit);
  const licence = credit.license_url ? `[${label}](${credit.license_url})` : label;
  const title = credit.title.replace(/\|/g, "/");
  lines.push(
    `| \`${credit.slug}\` | ${title} | ${credit.creator.replace(/\|/g, "/")} | ${licence} | [${credit.source}](${credit.landing}) |`,
  );
}

lines.push("");
await writeFile("PHOTO-CREDITS.md", `${lines.join("\n")}\n`);
console.log(`PHOTO-CREDITS.md written with ${rows.length} entries`);
