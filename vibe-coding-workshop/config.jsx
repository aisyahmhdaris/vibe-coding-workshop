/* ─────────────────────────────────────────────────────────────
   National AI Builder Programme · config + Google Sheets API
   ───────────────────────────────────────────────────────────── */

const CONFIG = {
  city:      "Melaka",
  date:      "23 May 2026",
  venue:     "K7, Melaka",
  numGroups: 50,
  workshop:  "Melaka",
  sheetUrl:  "https://script.google.com/macros/s/AKfycbzajiJyH4iTfLU1uAinzv2RsCg2vCdLYzgMSh2MhxjqsI5Yzovgp2XCfZd_2d-j6xg/exec",
  googleClientId: "364719068559-ds5qdalpj492sigofo4t8t6ierg41rbb.apps.googleusercontent.com",
};

const YEAR   = (CONFIG.date.match(/\d{4}/) || [String(new Date().getFullYear())])[0];
const GROUPS = Array.from({ length: CONFIG.numGroups }, (_, i) => `Kumpulan ${i + 1}`);

const CRITERIA = [
  { key: "functionality", label: "Functionality",  sub: "Does it actually work?" },
  { key: "visual",        label: "Visual Design",   sub: "Polish, layout, identity" },
  { key: "problem",       label: "Problem Solving", sub: "Real-world utility" },
  { key: "concept",       label: "Concept",         sub: "Originality, ambition" },
];

// ─────────────────────────────────────────────────────────────
// FACILITATOR GROUP ASSIGNMENTS
// Each facilitator is assigned the groups they MENTOR.
// They will NOT be able to score these groups.
// ── HOW TO UPDATE TOMORROW ───────────────────────────────────
// Just edit the arrays below with the correct group numbers.
// Example: "aisyaharis88@gmail.com": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// ─────────────────────────────────────────────────────────────
const FACILITATOR_GROUPS = {
  "aisyaharis88@gmail.com":  [3,7],   // ← fill in group numbers tomorrow
  "n.saw192@gmail.com":      [],
  "sunnieloh@gmail.com":     [],
  "thivassini@gmail.com":    [],
  "jonnychu89@gmail.com":    [],
  "pivot.tpp@gmail.com":     [],
};

// ─────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────
function isPlaceholder(value) { return !value || /PASTE_YOUR/i.test(value); }

function buildUrl(params) {
  const url = new URL(CONFIG.sheetUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function getJSON(url) {
  const res = await fetch(url, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const text = await res.text();
  try { return JSON.parse(text); }
  catch (e) { throw new Error("Bad JSON: " + text.slice(0, 120)); }
}

function normalize(rawData, mapRow) {
  let rows = [];
  if (Array.isArray(rawData))                   rows = rawData;
  else if (Array.isArray(rawData?.submissions)) rows = rawData.submissions;
  else if (Array.isArray(rawData?.scores))      rows = rawData.scores;
  else if (Array.isArray(rawData?.data))        rows = rawData.data;
  else if (Array.isArray(rawData?.rows))        rows = rawData.rows;
  else if (rawData && typeof rawData === "object") rows = Object.values(rawData);

  const out = {};
  rows.forEach((r) => {
    if (!r || typeof r !== "object") return;
    if (r.workshop && CONFIG.workshop &&
        String(r.workshop).toLowerCase() !== String(CONFIG.workshop).toLowerCase()) return;
    const mapped = mapRow(r);
    if (!mapped || !mapped.group) return;
    const existing = out[mapped.group];
    const t  = Number(mapped.updatedAt  || mapped.timestamp) || 0;
    const tE = Number(existing?.updatedAt || existing?.timestamp) || 0;
    if (!existing || t >= tE) out[mapped.group] = mapped;
  });
  return out;
}

function parseTimestamp(t) {
  if (t == null || t === "") return 0;
  if (typeof t === "number") return t;
  const n = Number(t);
  if (!Number.isNaN(n) && n > 0) return n;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function parseBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "yes" || s === "1" || s === "y";
}

function isWhitelistAllowed(data) {
  if (data === true) return true;
  if (data === false) return false;
  if (typeof data !== "object" || data === null) return false;
  if (data.allowed === true || data.whitelisted === true || data.authorized === true || data.access === true) return true;
  if (typeof data.status === "string") {
    const s = data.status.toLowerCase();
    if (["allowed","ok","yes","whitelisted","granted","authorized"].includes(s)) return true;
    if (["denied","no","blocked","forbidden","rejected"].includes(s)) return false;
  }
  if (data.ok === true && data.allowed !== false && data.whitelisted !== false) return true;
  return false;
}

const sheetsApi = {
  configured: !isPlaceholder(CONFIG.sheetUrl),

  async fetchAll() {
    const [subsData, scoresData] = await Promise.all([
      getJSON(buildUrl({ action: "getSubmissions" })),
      getJSON(buildUrl({ action: "getScores" })),
    ]);
    const submissions = normalize(subsData, (r) => ({
      group:     r.group    || r.groupName,
      name:      r.appName  || r.name     || "",
      members:   r.members  || r.teamMembers || "",
      problem:   r.problem  || "",
      solution:  r.solution || "",
      link:      r.appLink  || r.link || r.url || "",
      timestamp: parseTimestamp(r.timestamp || r.createdAt || r.ts || r.date),
    }));
    const scores = normalize(scoresData, (r) => ({
      group:           r.group    || r.groupName,
      functionality:   Number(r.functionality) || 0,
      visual:          Number(r.visual)        || 0,
      problem:         Number(r.problem)       || 0,
      concept:         Number(r.concept)       || 0,
      shortlisted:     parseBool(r.shortlisted),
      liked:           r.liked   || "",
      improve:         r.improve || "",
      facilitatorEmail: r.facilitatorEmail || "",
      updatedAt:       parseTimestamp(r.updatedAt || r.timestamp || r.ts || r.date),
    }));
    return { submissions, scores };
  },

  async submit(entry) {
    return await getJSON(buildUrl({
      action: "submit", workshop: CONFIG.workshop,
      group: entry.group, appName: entry.name,
      members: entry.members || "", problem: entry.problem || "",
      solution: entry.solution || "", appLink: entry.link,
    }));
  },

  async saveScore(entry) {
    return await getJSON(buildUrl({
      action: "saveScore", workshop: CONFIG.workshop,
      group: entry.group, facilitatorEmail: entry.facilitatorEmail || "",
      functionality: Number(entry.functionality) || 0,
      visual:        Number(entry.visual)        || 0,
      problem:       Number(entry.problem)       || 0,
      concept:       Number(entry.concept)       || 0,
      shortlisted:   entry.shortlisted ? "true" : "false",
      liked:         entry.liked   || "",
      improve:       entry.improve || "",
    }));
  },

  async checkWhitelist(email) {
    const data = await getJSON(buildUrl({ action: "checkWhitelist", email }));
    return isWhitelistAllowed(data);
  },
};

// ─────────────────────────────────────────────────────────────
// useWorkshopData hook
// ─────────────────────────────────────────────────────────────
function useWorkshopData() {
  const [submissions, setSubmissions] = React.useState({});
  const [scores,      setScores]      = React.useState({});
  const [loading,     setLoading]     = React.useState(true);
  const [error,       setError]       = React.useState(null);

  const refetch = React.useCallback(async () => {
    try {
      setError(null);
      const data = await sheetsApi.fetchAll();
      setSubmissions(data.submissions || {});
      setScores(data.scores || {});
    } catch (e) { setError(String(e.message || e)); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  const submitEntry = React.useCallback(async (entry) => {
    setSubmissions((prev) => ({ ...prev, [entry.group]: { ...entry, timestamp: Date.now() } }));
    await sheetsApi.submit(entry);
    sheetsApi.fetchAll().then((d) => { setSubmissions(d.submissions||{}); setScores(d.scores||{}); }).catch(() => {});
  }, []);

  const saveScore = React.useCallback(async (entry) => {
    setScores((prev) => ({ ...prev, [entry.group]: { ...entry, updatedAt: Date.now() } }));
    await sheetsApi.saveScore(entry);
    sheetsApi.fetchAll().then((d) => { setSubmissions(d.submissions||{}); setScores(d.scores||{}); }).catch(() => {});
  }, []);

  return { submissions, scores, loading, error, refetch, submitEntry, saveScore };
}

Object.assign(window, { CONFIG, YEAR, GROUPS, CRITERIA, FACILITATOR_GROUPS, sheetsApi, useWorkshopData, isPlaceholder });
