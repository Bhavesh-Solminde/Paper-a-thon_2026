// Seeds demo teams so you can click around locally: `npm run db:seed`
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { announcements, teams } from "../src/lib/db/schema";
import { pgConnection } from "../src/lib/db/url";

config({ path: ".env.local" });
config();

const conn = pgConnection(process.env.DATABASE_URL);
const client = postgres(conn.url, { ...conn.options, max: 1 });
const db = drizzle(client);

const demo = [
  ["Neural Nomads", "AI & Machine Learning", ["Aarav Shah", "Isha Patil", "Rohan Desai"]],
  ["Cipher Circuit", "Cybersecurity & Privacy", ["Meera Nair", "Kabir Joshi"]],
  ["Green Quill", "Sustainability & Green Tech", ["Tanvi Rao", "Dev Kulkarni", "Sara Khan", "Om Pawar"]],
  ["Sensor Sapiens", "IoT & Embedded Systems", ["Aditya Iyer", "Nisha Gupta"]],
  ["MedMatrix", "HealthTech", ["Pooja Menon", "Yash Chavan", "Riya Sawant"]],
  ["Blank Page Club", "Open Innovation", ["Vihaan More", "Ananya Pillai"]],
  ["Gradient Descent", "AI & Machine Learning", ["Kunal Bhatt", "Sneha Jadhav", "Arjun Rane"]],
  ["Zero Trust Crew", "Cybersecurity & Privacy", ["Harsh Vora", "Diya Shetty"]],
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
      status: i < 5 ? ("paper_submitted" as const) : ("registered" as const),
      paperTitle: i < 5 ? `A study by ${name}` : null,
      paperUrl: i < 5 ? "https://example.com/paper.pdf" : null,
      submittedAt: i < 5 ? new Date() : null,
    })),
  );
  await db.insert(announcements).values([
    { message: "Paper submissions are open — log in to your team dashboard to submit." },
  ]);
  console.log(`Seeded ${demo.length} teams (logins print the OTP to the dev server console).`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
