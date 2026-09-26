// Generates the landing-page entry clip with Higgsfield: `npm run intro:generate`
//
//  1. Soul (text-to-image) paints a keyframe in the poster's style
//  2. DoP (image-to-video) animates it into a short cinematic clip
//  3. Clips are saved to public/intro/ — the <Intro> component plays them automatically,
//     then tears the screen open onto the site. Delete the files to go back to the paper intro.
//
// Needs HIGGSFIELD_API_KEY="KEY_ID:KEY_SECRET" in .env.local, and network access to api.higgsfield.ai.
// Endpoints/models can be overridden with HF_IMAGE_ENDPOINT, HF_VIDEO_ENDPOINT, HF_VIDEO_MODEL.
import { config as loadEnv } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { createHiggsfieldClient } from "@higgsfield/client/v2";

loadEnv({ path: ".env.local" });
loadEnv();

const credentials = process.env.HIGGSFIELD_API_KEY;
if (!credentials) {
  console.error("HIGGSFIELD_API_KEY is not set (expected KEY_ID:KEY_SECRET in .env.local)");
  process.exit(1);
}

const client = createHiggsfieldClient({ credentials, maxPollTime: 15 * 60_000, pollInterval: 4000 });
const OUT = path.join(process.cwd(), "public", "intro");
const IMAGE_ENDPOINT = process.env.HF_IMAGE_ENDPOINT || "/v1/text2image/soul";
const VIDEO_ENDPOINT = process.env.HF_VIDEO_ENDPOINT || "/v1/image2video/dop";
const VIDEO_MODEL = process.env.HF_VIDEO_MODEL || "dop-turbo";

const KEYFRAME_PROMPT =
  "Cinematic macro shot on a pitch-black background: a stack of crumpled off-white research papers with torn, " +
  "jagged edges, lying on a dark desk. The top sheet has the word 'PAPER-A-THON' in bold black brush-marker " +
  "lettering. Electric-blue (#1f6bff) rim light and blue ink scribbles, handwritten notes 'Read Analyse Think Write' " +
  "in blue pen. Moody, high contrast, film grain, shallow depth of field, poster-like composition, centered subject.";

const MOTION_PROMPT =
  "Slow dramatic push-in toward the paper stack. Pages flutter as if caught by a breeze, blue light sweeps across the " +
  "torn edges, ink scribbles glow, then the top sheet begins to rip down the middle with paper fibres and small scraps " +
  "flying toward the camera. Cinematic, smooth, 24fps, no text changes.";

type Result = { images?: { url: string }[]; video?: { url: string }; jobs?: { results?: { raw?: { url: string } } }[] };

function urlOf(r: Result, kind: "image" | "video") {
  if (kind === "image" && r.images?.[0]?.url) return r.images[0].url;
  if (kind === "video" && r.video?.url) return r.video.url;
  return r.jobs?.[0]?.results?.raw?.url; // older JobSet shape
}

async function run(endpoint: string, input: Record<string, unknown>, kind: "image" | "video") {
  console.log(`→ ${endpoint} (${kind})…`);
  const res = (await client.subscribe(endpoint, { input, withPolling: true })) as unknown as Result & { status?: string };
  const url = urlOf(res, kind);
  if (!url) throw new Error(`${endpoint} finished without a ${kind} URL: ${JSON.stringify(res).slice(0, 400)}`);
  console.log(`  ✓ ${url}`);
  return url;
}

async function download(url: string, file: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed ${r.status} for ${url}`);
  await fs.writeFile(path.join(OUT, file), Buffer.from(await r.arrayBuffer()));
  console.log(`  saved public/intro/${file}`);
}

async function variant(name: "desktop" | "mobile", size: string, seed: number) {
  const image = await run(
    IMAGE_ENDPOINT,
    { prompt: KEYFRAME_PROMPT, width_and_height: size, quality: "1080p", batch_size: 1, enhance_prompt: true, seed },
    "image",
  );
  if (name === "desktop") await download(image, "poster.jpg");
  const video = await run(
    VIDEO_ENDPOINT,
    { model: VIDEO_MODEL, prompt: MOTION_PROMPT, input_images: [{ type: "image_url", image_url: image }], enhance_prompt: true, seed },
    "video",
  );
  await download(video, `intro-${name}.mp4`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const only = process.argv[2]; // optional: "desktop" | "mobile"
  if (!only || only === "desktop") await variant("desktop", process.env.HF_DESKTOP_SIZE || "2048x1152", 2909);
  if (!only || only === "mobile") await variant("mobile", process.env.HF_MOBILE_SIZE || "1152x2048", 2910);
  console.log("\nDone — reload the landing page (in a new tab/session) to see the Higgsfield intro.");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("\nHiggsfield generation failed:", msg);
  if (/ENOTFOUND|ECONNREFUSED|403|fetch failed|tunnel/i.test(msg)) {
    console.error("Is api.higgsfield.ai reachable from this machine? (Cloud sandboxes may need it allow-listed.)");
  }
  process.exit(1);
});
