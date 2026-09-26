import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const teamStatus = pgEnum("team_status", [
  "registered",
  "paper_submitted",
  "shortlisted",
  "not_shortlisted",
]);

export type TeamStatus = (typeof teamStatus.enumValues)[number];

// checkedInAt: ISO time the member was checked in at the event desk (null/absent = not yet).
export type Member = { name: string; email?: string; leader?: boolean; checkedInAt?: string | null };

export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // e.g. PAT-007
  name: text("name").notNull(),
  track: text("track").notNull(),
  leaderEmail: text("leader_email").notNull(),
  members: jsonb("members").$type<Member[]>().notNull().default([]),
  status: teamStatus("status").notNull().default("registered"),
  paperTitle: text("paper_title"),
  paperUrl: text("paper_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  presentationOrder: integer("presentation_order"),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Team = typeof teams.$inferSelect;

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Announcement = typeof announcements.$inferSelect;

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
