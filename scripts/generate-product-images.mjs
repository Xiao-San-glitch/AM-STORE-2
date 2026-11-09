/**
 * Generates the sample pack-shot artwork used by the seeded catalogue.
 * Every image is a local SVG (no external links that can break) and can be
 * replaced by real photography from the admin dashboard at any time.
 *
 * Usage: npm run images
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "public/products");
mkdirSync(OUT, { recursive: true });

const PALETTES = {
  rice: { bg: "#F4ECDD", light: "#EEDFC2", dark: "#C6A469", accent: "#D4AF37", word: "RICE" },
  dal: { bg: "#F6F0E4", light: "#EBDCC2", dark: "#C09A5E", accent: "#B98A3C", word: "DAL & PULSES" },
  oil: { bg: "#FBF3DF", light: "#F4DE9E", dark: "#D3AE4A", accent: "#A8801F", word: "COOKING OIL" },
  spice: { bg: "#F8EDE3", light: "#F0C9A4", dark: "#C9793F", accent: "#A85A2B", word: "SPICES" },
  snack: { bg: "#F7EEE5", light: "#EBD3B6", dark: "#CD9A61", accent: "#C4813C", word: "SNACKS" },
  home: { bg: "#EDF1EC", light: "#D5E0D6", dark: "#93AE9A", accent: "#4F6B55", word: "HOUSEHOLD" },
};

const KINDS = {
  bag: (p) => `
    <ellipse cx="450" cy="792" rx="196" ry="26" fill="#111111" opacity="0.07"/>
    <path d="M296 306c0-36 28-62 62-62h184c34 0 62 26 62 62v384c0 36-28 62-62 62H358c-34 0-62-26-62-62z" fill="url(#body)"/>
    <rect x="288" y="226" width="324" height="52" rx="18" fill="url(#band)"/>
    <rect x="288" y="226" width="324" height="52" rx="18" fill="none" stroke="#111111" stroke-opacity="0.08"/>
    <path d="M296 640h308v50c0 36-28 62-62 62H358c-34 0-62-26-62-62z" fill="${p.dark}" opacity="0.34"/>
    <rect x="352" y="560" width="196" height="3" rx="1.5" fill="#111111" opacity="0.13"/>`,
  pouch: (p) => `
    <ellipse cx="450" cy="786" rx="184" ry="24" fill="#111111" opacity="0.07"/>
    <rect x="318" y="238" width="264" height="36" rx="6" fill="${p.dark}"/>
    <rect x="318" y="274" width="264" height="392" rx="34" fill="url(#body)"/>
    <rect x="318" y="666" width="264" height="34" rx="6" fill="${p.dark}"/>
    <path d="M318 600h264v32c0 19-15 34-34 34H352c-19 0-34-15-34-34z" fill="${p.dark}" opacity="0.28"/>`,
  bottle: (p) => `
    <ellipse cx="450" cy="792" rx="150" ry="22" fill="#111111" opacity="0.07"/>
    <rect x="414" y="176" width="72" height="46" rx="10" fill="url(#band)"/>
    <rect x="428" y="222" width="44" height="54" fill="${p.light}"/>
    <path d="M330 402c0-64 46-92 90-108v-18h60v18c44 16 90 44 90 108v186c0 36-28 62-62 62H392c-34 0-62-26-62-62z" fill="url(#body)"/>
    <rect x="330" y="520" width="240" height="152" fill="#FFFFFF" opacity="0.72"/>
    <rect x="330" y="520" width="240" height="152" fill="none" stroke="#111111" stroke-opacity="0.06"/>`,
  jar: (p) => `
    <ellipse cx="450" cy="780" rx="150" ry="22" fill="#111111" opacity="0.07"/>
    <rect x="336" y="232" width="228" height="58" rx="18" fill="url(#band)"/>
    <rect x="352" y="290" width="196" height="16" fill="${p.dark}" opacity="0.5"/>
    <rect x="330" y="306" width="240" height="286" rx="38" fill="url(#body)"/>
    <rect x="330" y="306" width="240" height="286" rx="38" fill="none" stroke="#111111" stroke-opacity="0.07"/>
    <rect x="330" y="470" width="240" height="122" fill="#FFFFFF" opacity="0.62"/>`,
  box: (p) => `
    <ellipse cx="450" cy="786" rx="176" ry="24" fill="#111111" opacity="0.07"/>
    <path d="M330 286l120-58 120 58v314l-120 64-120-64z" fill="url(#body)"/>
    <path d="M330 286l120 58 120-58" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="3"/>
    <path d="M450 344v320" stroke="#111111" stroke-opacity="0.08" stroke-width="3"/>
    <rect x="330" y="430" width="240" height="34" fill="url(#band)"/>`,
};

function defs(p) {
  return `<defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.light}"/>
      <stop offset="55%" stop-color="${p.light}"/>
      <stop offset="100%" stop-color="${p.dark}"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E7CD7C"/>
      <stop offset="50%" stop-color="${p.accent}"/>
      <stop offset="100%" stop-color="#A9821F"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function monogram(p, cy = 540) {
  return `<g>
    <circle cx="450" cy="${cy}" r="58" fill="#111111"/>
    <circle cx="450" cy="${cy}" r="52" fill="none" stroke="${p.accent}" stroke-width="1.2" stroke-opacity="0.85"/>
    <text x="450" y="${cy + 10}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" letter-spacing="1" fill="${p.accent}">AM</text>
    <text x="450" y="${cy + 74}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="4" fill="#FFFFFF" opacity="0.92">${p.word}</text>
  </g>`;
}

function packScene(p, kind) {
  return `<g>${KINDS[kind](p)}${monogram(p)}</g>`;
}

function productSvg(paletteKey, kind) {
  const p = PALETTES[paletteKey];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900" role="img">
  ${defs(p)}
  <rect width="900" height="900" fill="${p.bg}"/>
  <rect width="900" height="900" fill="url(#halo)"/>
  <circle cx="450" cy="470" r="300" fill="none" stroke="${p.accent}" stroke-opacity="0.18"/>
  <circle cx="450" cy="470" r="272" fill="none" stroke="${p.accent}" stroke-opacity="0.1"/>
  ${packScene(p, kind)}
</svg>`;
}

function categorySvg(paletteKey) {
  const p = PALETTES[paletteKey];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  ${defs(p)}
  <rect width="800" height="600" fill="${p.bg}"/>
  <rect width="800" height="600" fill="url(#halo)"/>
  <circle cx="400" cy="300" r="196" fill="#FFFFFF" opacity="0.5"/>
  <circle cx="400" cy="300" r="196" fill="none" stroke="${p.accent}" stroke-opacity="0.3"/>
  <g transform="translate(-30 20) scale(0.44)">${packScene(p, paletteKey === "oil" ? "bottle" : paletteKey === "spice" ? "jar" : paletteKey === "home" ? "box" : "bag")}</g>
  <g transform="translate(150 -40) scale(0.56)">${packScene(p, paletteKey === "oil" ? "bottle" : paletteKey === "home" ? "box" : "pouch")}</g>
</svg>`;
}

function heroSvg() {
  const p = PALETTES.rice;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1100" width="1400" height="1100" role="img">
  ${defs(p)}
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FBF7EE"/>
      <stop offset="100%" stop-color="#EFE4CB"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="1100" fill="url(#heroBg)"/>
  <circle cx="820" cy="470" r="380" fill="${p.accent}" opacity="0.14"/>
  <circle cx="820" cy="470" r="300" fill="none" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="1.5"/>
  <g transform="translate(-120 330) scale(0.62)">${packScene(PALETTES.oil, "bottle")}</g>
  <g transform="translate(30 120) scale(0.86)">${packScene(PALETTES.rice, "bag")}</g>
  <g transform="translate(590 330) scale(0.6)">${packScene(PALETTES.spice, "jar")}</g>
  <g transform="translate(760 150) scale(0.72)">${packScene(PALETTES.home, "box")}</g>
  <g transform="translate(490 600) scale(0.5)">${packScene(PALETTES.snack, "pouch")}</g>
</svg>`;
}

const CATALOGUE = {
  "premium-rice": ["rice", "bag"],
  "regular-rice": ["rice", "bag"],
  "local-rice": ["rice", "pouch"],
  "basmati-rice": ["rice", "bag"],
  "mini-mogra-rice": ["rice", "pouch"],
  "brown-rice": ["rice", "pouch"],
  "masoor-dal": ["dal", "pouch"],
  "moong-dal": ["dal", "pouch"],
  "toor-dal": ["dal", "pouch"],
  "chana-dal": ["dal", "pouch"],
  "urad-dal": ["dal", "pouch"],
  rajma: ["dal", "bag"],
  "kabuli-chana": ["dal", "bag"],
  "mustard-oil": ["oil", "bottle"],
  "sunflower-oil": ["oil", "bottle"],
  "soybean-oil": ["oil", "bottle"],
  "refined-cooking-oil": ["oil", "bottle"],
  "coconut-oil": ["oil", "jar"],
  "turmeric-powder": ["spice", "jar"],
  "red-chilli-powder": ["spice", "jar"],
  "coriander-powder": ["spice", "jar"],
  "black-pepper": ["spice", "jar"],
  "garam-masala": ["spice", "jar"],
  "ginger-garlic-paste": ["spice", "jar"],
  "cumin-seeds": ["spice", "pouch"],
  "glucose-biscuits": ["snack", "box"],
  "potato-chips": ["snack", "pouch"],
  "namkeen-mixture": ["snack", "pouch"],
  "instant-noodles": ["snack", "box"],
  "milk-chocolate": ["snack", "box"],
  "packaged-snacks-combo": ["snack", "pouch"],
  "rusk-toast": ["snack", "box"],
  "detergent-powder": ["home", "bag"],
  "dishwashing-liquid": ["home", "bottle"],
  "bath-soap": ["home", "box"],
  "toilet-cleaner": ["home", "bottle"],
  "floor-cleaner": ["home", "bottle"],
  "tissue-paper": ["home", "box"],
  "scrub-pad-pack": ["home", "pouch"],
};

const CATEGORY_FILES = {
  "cat-rice": "rice",
  "cat-dal-pulses": "dal",
  "cat-cooking-oils": "oil",
  "cat-spices": "spice",
  "cat-snacks": "snack",
  "cat-household-essentials": "home",
};

let count = 0;
for (const [slug, [palette, kind]] of Object.entries(CATALOGUE)) {
  writeFileSync(resolve(OUT, `${slug}.svg`), productSvg(palette, kind));
  count += 1;
}
for (const [file, palette] of Object.entries(CATEGORY_FILES)) {
  writeFileSync(resolve(OUT, `${file}.svg`), categorySvg(palette));
  count += 1;
}
writeFileSync(resolve(OUT, "hero-groceries.svg"), heroSvg());

console.log(`Generated ${count + 1} SVG images in ${OUT}`);
