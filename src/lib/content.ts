// Single source of truth for site copy.
// Two voice registers: `hud` speaks lowercase terminal, `panels` speak sharp professional.

export const identity = {
  name: "arin kaushik",
  tagline: "building things that (usually) work.",
  positioning:
    "I turn messy operational data into structured, automated intelligence.",
  sub: "data analyst · automation builder · ai-first",
  hint: "> scroll to run the pipeline",
  email: "arinkaushik60@gmail.com",
  github: "https://github.com/Arin117Kaushik",
  linkedin: "https://linkedin.com/in/arinkaushik",
};

export const sceneLabels = [
  "SCN 00 // RAW",
  "SCN 01 // VAHAN GATE",
  "SCN 02 // TAXONOMY",
  "SCN 03 // SIGNAL",
  "SCN 04 // ORDER",
];

export interface StationContent {
  id: string;
  label: string;
  title: string;
  line: string;
  stack: string;
  metric: string;
  metricCaption: string;
  side: "left" | "right";
  window: [number, number]; // scroll progress window for the panel
}

export const stations: StationContent[] = [
  {
    id: "vahan",
    label: "STATION 01 — INGEST",
    title: "Vahan Portal Pipeline",
    line: "A zero-touch n8n workflow that solves live government CAPTCHAs, parses the portal DOM, and writes 250+ vehicle registration statuses back to Sheets. Runs weekly in production, unsupervised.",
    stack: "n8n · 2captcha · Sheets API · DOM parsing",
    metric: "3 hrs → 0",
    metricCaption: "weekly manual lookups eliminated",
    side: "right",
    window: [0.17, 0.33],
  },
  {
    id: "classify",
    label: "STATION 02 — CLASSIFY",
    title: "LLM Classification Engine",
    line: "600+ rows of free-text chaos — closure notes, statuses and categories mashed into one column. Claude pre-classifies every row into 80 categories before the formula layer runs. Clean in, clean out.",
    stack: "Claude API · Apps Script · 80-category taxonomy",
    metric: "600+ → 80",
    metricCaption: "messy rows sorted into clean categories",
    side: "left",
    window: [0.4, 0.56],
  },
  {
    id: "gmail",
    label: "STATION 03 — SIGNAL",
    title: "Gmail Intelligence Tracker",
    line: "An automated scanner across 500+ threads that logs every interaction, flags action-required items, and briefs the whole team each morning before anyone opens their inbox.",
    stack: "Gmail API · Apps Script · time triggers · Claude",
    metric: "500+",
    metricCaption: "threads monitored on autopilot",
    side: "right",
    window: [0.62, 0.78],
  },
];

export const stats = [
  { value: "250+", caption: "active cases tracked weekly" },
  { value: "40%", caption: "of the workday clawed back via automation" },
  { value: "500+", caption: "leads managed per day" },
  { value: "5+", caption: "systems built from scratch" },
];

export const workCluster = [
  {
    name: "Interstate Estimator",
    line: "AI reads RC documents and screenshots, extracts vehicle data, calculates re-registration tax. Hosted on Railway with OAuth.",
    stack: "Gemini · Apps Script · Railway",
  },
  {
    name: "Pendency Dashboard",
    line: "600+ open cases, 80-category classification, aging analysis and KPI tiles.",
    stack: "Sheets · Apps Script",
  },
  {
    name: "Reconciliation Engine",
    line: "Cross-references 6 source sheets by phone number; auto-flags payment blockers.",
    stack: "Apps Script v2.1",
  },
  {
    name: "Agent Dashboards",
    line: "Live performance and revenue tracking for a full sales team — 500+ leads a day.",
    stack: "Sheets · QUERY",
  },
  {
    name: "MLS Lead System",
    line: "End-to-end lead management with role-specific views, backups and version control.",
    stack: "Apps Script",
  },
  {
    name: "Billing Reports",
    line: "Fully formula-driven monthly billing across POCs. Zero manual entry.",
    stack: "SUMPRODUCT · DATEVALUE",
  },
];

export const personalCluster = {
  featured: {
    name: "Reddit Focus",
    line: "I kept getting distracted by Reddit, so I built a Chrome extension that strips it down to a plain, distraction-free forum. Fighting the algorithm with a manifest file.",
    stack: "JavaScript · Chrome MV3",
    href: "https://github.com/Arin117Kaushik/reddit-focus",
  },
  rest: [
    { name: "obsidian-scripts", line: "PDF OCR and automation for my second brain" },
    { name: "comic-search", line: "offline word-search across German comic scans" },
    { name: "focusee-renderer", line: "local renderer for FocuSee project folders" },
    { name: "playlist-maker", line: "because sorting music manually is a job for a script" },
    { name: "water-reminder", line: "hydration, but make it automated" },
    { name: "ai-assistant", line: "python voice assistant — my first taste of this" },
  ],
};

export const skills = [
  { group: "data", items: "Sheets power-user · SQL · Python (pandas) · Power BI" },
  { group: "automation", items: "Apps Script · n8n · REST APIs · webhooks" },
  { group: "ai", items: "Claude (daily driver) · prompt engineering · LLM-in-the-loop pipelines" },
  { group: "ops", items: "reconciliation · case tracking · CX dashboards" },
];

export const footerLine =
  "designed & built by arin — three.js, react three fiber, gsap, and an unreasonable amount of particles";
