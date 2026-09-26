// Generates the landing-page entry clip with Higgsfield: `npm run intro:generate`
//
//  1. Soul V2 (text-to-image) paints a keyframe in the poster's style
//  2. DoP (image-to-video) animates it into a short cinematic clip
//  3. Clips are saved to public/intro/ — the <Intro> component plays them automatically,
//     then tears the screen open onto the site. Delete the files to go back to the paper intro.
//
// Needs HIGGSFIELD_API_KEY="KEY_ID:KEY_SECRET" in .env.local, and network access to api.higgsfield.ai.
// Behind an HTTPS proxy, run with NODE_USE_ENV_PROXY=1 so Node's fetch uses it.
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
const IMAGE_ENDPOINT = process.env.HF_IMAGE_ENDPOINT || "higgsfield-ai/soul/v2/standard";
const VIDEO_ENDPOINT = process.env.HF_VIDEO_ENDPOINT || "/v1/image2video/dop";
const VIDEO_MODEL = process.env.HF_VIDEO_MODEL || "dop-turbo";

// No lettering: image models garble text, and the site draws the real title on top anyway.
// No lettering: image models garble text, and the site draws the real title on top anyway.
const KEYFRAME_PROMPT =
  "Cinematic macro photograph, pitch-black background. A loose stack of crumpled off-white paper sheets with " +
  "torn, jagged, fibrous edges lies at the centre of a dark desk, one sheet partly ripped open. Electric-blue " +
  "(#1f6bff) rim light grazes the torn edges; abstract blue ink brush strokes and splatters on the paper. " +
  "Absolutely no text, no letters, no words, no numbers, no writing. Moody, high contrast, subtle film grain, " +
  "shallow depth of field, lots of negative space around the subject, centered composition.";

const MOTION_PROMPT =
  "Slow cinematic push-in toward the paper stack. The sheets lift and flutter as if caught by a breeze, " +
  "electric-blue light sweeps across the torn edges, then the top sheet rips apart down the middle and small " +
  "paper scraps drift toward the camera. Smooth, dramatic, no text.";

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

// Free check before spending credits. The SDK reports every HTTP 403 as "Not enough credits",
// which hides proxy/firewall blocks, so surface those here.
async function preflight() {
  const r = await fetch("https://api.higgsfield.ai/v1/text2image/soul-styles", {
    headers: { Authorization: `Key ${credentials}`, Accept: "application/json" },
  }).catch((e) => {
    throw new Error(`Cannot reach api.higgsfield.ai (${e.cause?.code || e.message})`);
  });
  if (r.status === 403) {
    const body = await r.text();
    if (/allowlist|egress|proxy/i.test(body)) throw new Error(`Network blocks api.higgsfield.ai: ${body.trim()}`);
  }
  if (r.status === 401) throw new Error("Higgsfield rejected the API key (401). Check HIGGSFIELD_API_KEY.");
}

/**
 * Credit-conscious steps — each costs exactly one Higgsfield generation:
 *   npm run intro:generate image            → 1 image  (saves public/intro/poster.*, prints its URL)
 *   npm run intro:generate video <imageUrl>  → 1 video  (animates that image → public/intro/intro-desktop.mp4)
 * One 16:9 clip is enough: phones play the same clip cropped to fill the screen.
 */
async function main() {
  const [step, arg] = process.argv.slice(2);
  if (step !== "image" && step !== "video") {
    console.log("Usage:\n  npm run intro:generate image\n  npm run intro:generate video <imageUrl>");
    process.exit(1);
  }
  if (step === "video" && !arg?.startsWith("https://")) {
    console.error("Pass the image URL printed by the `image` step.");
    process.exit(1);
  }
  await preflight();
  await fs.mkdir(OUT, { recursive: true });

  if (step === "image") {
    // Soul V2 (docs.higgsfield.ai): POST /higgsfield-ai/soul/v2/standard { prompt, ... } → images[0].url
    const image = await run(IMAGE_ENDPOINT, { prompt: KEYFRAME_PROMPT, aspect_ratio: "16:9", seed: 2909 }, "image");
    await download(image, `poster.${image.split("?")[0].split(".").pop() || "png"}`);
    console.log(`\nCheck public/intro/poster.*, then animate it with:\n  npm run intro:generate video ${image}`);
    return;
  }

  const video = await run(
    VIDEO_ENDPOINT,
    // v1 endpoints take their inputs wrapped in `params`.
    { params: { model: VIDEO_MODEL, prompt: MOTION_PROMPT, input_images: [{ type: "image_url", image_url: arg }], enhance_prompt: true, seed: 2909 } },
    "video",
  );
  await download(video, "intro-desktop.mp4");
  console.log("\nDone — open the landing page in a fresh tab to see the Higgsfield intro.");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("\nHiggsfield generation failed:", msg);
  if (/ENOTFOUND|ECONNREFUSED|403|fetch failed|tunnel/i.test(msg)) {
    console.error("Is api.higgsfield.ai reachable from this machine? (Cloud sandboxes may need it allow-listed.)");
  }
  process.exit(1);
});
