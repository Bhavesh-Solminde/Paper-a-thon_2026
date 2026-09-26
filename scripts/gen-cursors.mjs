// Renders the static paper-plane cursor images: `node scripts/gen-cursors.mjs`
// These are only the no-JS fallback (and what shows for a moment before JS loads). With JS,
// <PlaneCursor/> hides the OS cursor and draws the plane itself so it can rotate continuously.
// PNG @1x (32×32) + @2x (64×64): PNG is what every browser supports for cursors; @2x keeps it sharp.
import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const plane = (belly, top, left) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">` +
  `<polygon points="16,17 8,28 13,22" fill="${belly}" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<polygon points="1,1 16,17 28,8" fill="${top}" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<polygon points="1,1 8,28 16,17" fill="${left}" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const variants = { plane: plane("#94A3B8", "#E2E8F0", "#FFFFFF"), hover: plane("#1F6BFF", "#BFD6FF", "#FFFFFF") };
fs.rmSync("public/cursors", { recursive: true, force: true });
fs.mkdirSync("public/cursors", { recursive: true });
for (const [name, svg] of Object.entries(variants)) {
  for (const [suffix, size] of [["", 32], ["@2x", 64]]) {
    fs.writeFileSync(`public/cursors/${name}${suffix}.png`, new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng());
  }
}
console.log("wrote", fs.readdirSync("public/cursors").join(", "));
