// Seeds demo teams so you can click around locally: `npm run db:seed`
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { announcements, teams } from "../src/lib/db/schema";
import { pgConnection } from "../src/lib/db/url";
import { TRACKS } from "../src/lib/event";

config({ path: ".env.local" });
config();

const conn = pgConnection(process.env.DATABASE_URL);
const client = postgres(conn.url, { ...conn.options, max: 1 });
const db = drizzle(client);

const [HPC, SEC, GENAI] = TRACKS;
const demo = [
  ["Neural Nomads", GENAI, ["Aarav Shah", "Isha Patil", "Rohan Desai"]],
  ["Cipher Circuit", SEC, ["Meera Nair", "Kabir Joshi"]],
  ["Qubit Quill", HPC, ["Tanvi Rao", "Dev Kulkarni", "Sara Khan", "Om Pawar"]],
  ["Parallel Minds", HPC, ["Aditya Iyer", "Nisha Gupta"]],
  ["Aligned Agents", GENAI, ["Pooja Menon", "Yash Chavan", "Riya Sawant"]],
  ["Lattice Labs", SEC, ["Vihaan More", "Ananya Pillai"]],
  ["Gradient Descent", GENAI, ["Kunal Bhatt", "Sneha Jadhav", "Arjun Rane"]],
  ["Zero Trust Crew", SEC, ["Harsh Vora", "Diya Shetty"]],
] as const;

async function main() {
  await db.delete(teams);
  await db.delete(announcements);
  await db.insert(teams).values(
    demo.map(([name, track, members], i) => ({
      id: `PAT-${String(i + 1).padStart(3, "0")}`,
      name,
      track,
      leaderEmail: `team${i + 1}@example.com`,
      members: members.map((m, j) => ({ name: m, leader: j === 0 })),
      status: "paper_submitted" as const, // PPTs came in via the Google Form
    })),
  );
  await db.insert(announcements).values([
    { message: "PPT submissions are closed. Shortlisted teams will be announced here soon." },
  ]);
  console.log(`Seeded ${demo.length} teams (logins print the OTP to the dev server console).`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
