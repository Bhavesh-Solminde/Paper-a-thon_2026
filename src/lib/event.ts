// Single source of truth for event copy, dates and the schedule.
// Edit here — the landing page, dashboard and emails all read from this file.

export const EVENT = {
  name: "Paper-a-thon",
  club: "Microsoft Learn Students Club",
  tagline: ["Fuel your curiosity.", "Shape the future."],
  subTagline: "One paper at a time",
  // All times are IST (+05:30)
  eventStart: "2026-09-29T09:00:00+05:30",
  eventEnd: "2026-09-29T17:30:00+05:30",
  dateLabel: "29 September",
  timeLabel: "9 AM to 5:30 PM",
  venue: "Seminar Hall, Ground Floor",
  hashtags: ["#PaperAthon", "#MLSCVCET"],
  slotMinutes: { presentation: 7, qna: 3 },
};

export const TRACKS = [
  "AI & Machine Learning",
  "Cybersecurity & Privacy",
  "IoT & Embedded Systems",
  "Sustainability & Green Tech",
  "HealthTech",
  "Open Innovation",
];

export type Phase = {
  key: string;
  title: string;
  date: string; // display label
  at: string; // ISO — phase is "done" once this moment has passed
  body: string;
};

// The road to event day. Dates before the 28th are placeholders — confirm with the organisers.
export const PHASES: Phase[] = [
  {
    key: "register",
    title: "Registration",
    date: "Closed",
    at: "2026-09-20T00:00:00+05:30",
    body: "Teams registered and picked their track. Your team lead's registered email is your login here.",
  },
  {
    key: "submit",
    title: "PPT Submission",
    date: "Done · via Google Form",
    at: "2026-09-22T00:00:00+05:30",
    body: "Teams submitted their presentations through the Google Form. Submissions are now closed.",
  },
  {
    key: "shortlist",
    title: "Shortlisting",
    date: "Results on the site",
    at: "2026-09-26T00:00:00+05:30",
    body: "Our panel reviews every PPT. Log in to see your result.",
  },
  {
    key: "seminar",
    title: "Seminar",
    date: "28 Sep",
    at: "2026-09-28T10:00:00+05:30",
    body: "A research-writing seminar by Sneha Ma'am on how to present, defend and publish your work.",
  },
  {
    key: "eventday",
    title: "Event Day",
    date: "29 Sep",
    at: "2026-09-29T09:00:00+05:30",
    body: "Present your paper to the jury in the Seminar Hall.",
  },
];

export type FlowItem = {
  start: string; // "09:00"
  end?: string;
  title: string;
  detail?: string;
  kind: "ceremony" | "talk" | "presentations" | "break" | "wrap";
  forTeams?: string; // what shortlisted teams should be doing
};

// Event Day: 29th
export const FLOW: FlowItem[] = [
  {
    start: "09:00",
    end: "09:30",
    title: "Inauguration",
    kind: "ceremony",
    forTeams: "Reach the Seminar Hall by 8:45, show your QR pass at the desk to check in.",
  },
  {
    start: "09:30",
    end: "09:40",
    title: "Event starts · Rules & regulations",
    detail: "Judging criteria, time limits and presentation order are announced.",
    kind: "talk",
    forTeams: "Hand your slides (PDF / PPTX) to the tech desk on a pen drive.",
  },
  {
    start: "09:40",
    end: "13:30",
    title: "Presentations: Session I",
    detail: "Teams present in slot order: 7 min presentation + 3 min Q&A each.",
    kind: "presentations",
    forTeams: "Your slot time is on your team dashboard. Be seated two slots early.",
  },
  {
    start: "13:30",
    end: "14:00",
    title: "Break",
    detail: "Lunch break.",
    kind: "break",
  },
  {
    start: "14:00",
    end: "17:00",
    title: "Presentations: Session II",
    detail: "Remaining teams present. Same format: 7 + 3 minutes.",
    kind: "presentations",
    forTeams: "Afternoon slots continue from where Session I stopped.",
  },
  {
    start: "17:00",
    end: "17:30",
    title: "Certificates & award ceremony",
    detail: "Winners announced, prizes handed out, certificates for every presenting team.",
    kind: "ceremony",
    forTeams: "Stay till the end. Certificates are handed out in person.",
  },
];

export const FAQ = [
  {
    q: "Who can participate?",
    a: "Students from second year onwards, from any branch. First-year students are not eligible this time.",
  },
  {
    q: "How do we log in?",
    a: "Pick your team from the list. We email a 6-digit code to your team lead's registered email. Enter it and you're in. No passwords.",
  },
  {
    q: "Where do we submit our PPT?",
    a: "PPT submissions were collected through the Google Form and are now closed. Nothing needs to be uploaded on this site.",
  },
  {
    q: "How do we know if we're shortlisted?",
    a: "Log in to your team dashboard, or check the Shortlisted Teams board. Shortlisted teams also see their presentation slot for the 29th.",
  },
  {
    q: "How long is each presentation?",
    a: "7 minutes of presentation followed by 3 minutes of questions from the jury, so 10 minutes per team.",
  },
  {
    q: "What is the QR pass for?",
    a: "Download it from your dashboard and show it at the registration desk on the 29th. It carries your team details and lets volunteers check you in.",
  },
  {
    q: "Can our paper get published?",
    a: "Yes. Standout papers get guidance and an opportunity to be published, and promising projects may get funding.",
  },
];

/** Convert "HH:MM" on event day to a Date. */
export function eventTime(hhmm: string) {
  return new Date(`2026-09-29T${hhmm}:00+05:30`);
}
