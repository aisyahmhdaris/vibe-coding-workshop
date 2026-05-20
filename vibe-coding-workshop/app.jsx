const { useState, useEffect, useMemo, useRef, useCallback } = React;

// CONFIG, GROUPS, CRITERIA, YEAR, sheetsApi, useWorkshopData, useAuth, GoogleSignInButton
// are all loaded from config.jsx + auth.jsx as window globals.

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────
function Streaks() {
  return (
    <div className="streaks" aria-hidden="true">
      <div className="streak streak-1"></div>
      <div className="streak streak-2"></div>
      <div className="streak streak-3"></div>
      <div className="streak streak-4"></div>
      <div className="streak streak-5"></div>
    </div>);

}

function HudRings() {
  return (
    <>
      <div className="hud-rings" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <g className="ring-spin">
            <circle cx="100" cy="100" r="94" fill="none" stroke="#9DE5FF" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.55" />
            <circle cx="100" cy="100" r="82" fill="none" stroke="#9DE5FF" strokeWidth="0.6" opacity="0.35" />
            <path d="M100 6 L100 14 M100 186 L100 194 M6 100 L14 100 M186 100 L194 100" stroke="#FF6BB0" strokeWidth="1" opacity="0.7" />
          </g>
          <g className="ring-spin-rev">
            <circle cx="100" cy="100" r="68" fill="none" stroke="#FF6BB0" strokeWidth="0.6" strokeDasharray="6 4" opacity="0.55" />
            <circle cx="100" cy="100" r="54" fill="none" stroke="#9DE5FF" strokeWidth="0.4" opacity="0.4" />
          </g>
          <circle cx="100" cy="100" r="34" fill="none" stroke="#B89DFF" strokeWidth="0.4" opacity="0.6" />
          <circle cx="100" cy="100" r="3" fill="#9DE5FF" opacity="0.8" />
        </svg>
      </div>
      <div className="hud-rings-tr" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <g className="ring-spin-rev">
            <circle cx="100" cy="100" r="94" fill="none" stroke="#FF6BB0" strokeWidth="0.6" strokeDasharray="3 6" opacity="0.55" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="#9DE5FF" strokeWidth="0.4" opacity="0.4" />
          </g>
          <g className="ring-spin">
            <circle cx="100" cy="100" r="60" fill="none" stroke="#9DE5FF" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.6" />
          </g>
        </svg>
      </div>
    </>);

}

function GridBG() {return <div className="grid-bg" aria-hidden="true"></div>;}

function PivotLabMark() {
  return (
    <div className="pivot-mark-wrap">
      <img
        src="/pivotlab-logo.png"
        alt="PivotLab"
        style={{ height: "32px", objectFit: "contain", mixBlendMode: "screen" }} />
      
      <div className="brand-programme">National AI Builder Programme</div>
    </div>);

}

function Spinner({ size = 16, className = "" }) {
  return (
    <svg className={`spinner ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.2" />
      <path d="M12 3 a 9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>);

}

function StarRow({ value, onChange, id }) {
  return (
    <div className="star-row" role="radiogroup" aria-label={id}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`star-btn ${active ? "active" : ""}`}
            onClick={() => onChange(value === n ? 0 : n)}>
            
            <Star filled={active} />
          </button>);

      })}
      <span className="star-val">{value || 0}<span className="star-val-dim">/5</span></span>
    </div>);

}
function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96L12 2.6z"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>);

}
function Pill({ children, tone = "cyan", className = "" }) {
  return <span className={`pill pill-${tone} ${className}`}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────
// Setup / status banners
// ─────────────────────────────────────────────────────────────
function SetupBanner({ auth }) {
  const sheetMissing = !sheetsApi.configured;
  const authMissing = !auth.configured;
  if (!sheetMissing && !authMissing) return null;
  return (
    <div className="setup-banner">
      <div className="setup-banner-icon">⚙</div>
      <div className="setup-banner-body">
        <strong>Setup mode</strong> — some integrations missing:
        <ul>
          {sheetMissing && <li>Set <code>CONFIG.sheetUrl</code> in <code>config.jsx</code> to your Google Apps Script <code>/exec</code> URL.</li>}
          {authMissing && <li>Set <code>CONFIG.googleClientId</code> in <code>config.jsx</code> to your OAuth client ID.</li>}
        </ul>
      </div>
    </div>);

}

function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error-banner">
      <span className="error-banner-icon">⚠</span>
      <span className="error-banner-msg">Backend error: {error}</span>
      {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Retry</button>}
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function Header({ tab, setTab, auth, onOpenLogin, submissionCount }) {
  const allTabs = [
  { id: "submit", label: "Submit App", sub: "Student", facil: false },
  { id: "submissions", label: "Submissions", sub: "Facilitator", facil: true },
  { id: "scoring", label: "Scoring", sub: "Facilitator", facil: true }];

  const visibleTabs = allTabs.filter((t) => !t.facil || auth.user);

  return (
    <header className="app-header">
      <div className="brand-bar">
        <PivotLabMark />
        <div></div>
        <div className="brand-status">
          <div className="status-line"><span className="status-dot status-dot-cyan"></span><span>LIVE&nbsp;·&nbsp;{CONFIG.date.toUpperCase()}</span></div>
          <div className="status-line status-dim"><span>{CONFIG.venue.toUpperCase()}</span></div>
        </div>
      </div>

      <div className="title-block">
        <h1 className="title-words">
          <span className="title-vibe">
            <span className="title-cyan" style={{ fontFamily: "Orbitron" }}>Vibe Coding</span>
            <span className="title-outline" style={{ fontFamily: "Orbitron" }}>{YEAR}</span>
          </span>
          <span className="title-vibe">
            <span className="title-cyan" style={{ fontFamily: "Orbitron" }}>Workshop</span>
            <span className="title-melaka" style={{ fontFamily: "Orbitron" }}>{CONFIG.city.toUpperCase()}</span>
          </span>
        </h1>
      </div>

      <nav className="tab-bar" role="tablist">
        {visibleTabs.map((t) =>
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          className={`tab ${tab === t.id ? "active" : ""}`}
          onClick={() => setTab(t.id)}>
          
            <span className="tab-sub">{t.sub}</span>
            <span className="tab-label">
              <span>{t.label}</span>
            </span>
            <span className="tab-underline"></span>
          </button>
        )}
        <div className="tab-spacer"></div>
        {auth.user ?
        <FacilitatorChip auth={auth} /> :

        <button className="facil-login-btn" onClick={onOpenLogin}>
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>Facilitator login</span>
          </button>
        }
      </nav>
    </header>);

}

function FacilitatorChip({ auth }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="facil-chip-wrap">
      <button className="facil-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {auth.user.picture ?
        <img src={auth.user.picture} alt="" className="facil-avatar" referrerPolicy="no-referrer" /> :

        <div className="facil-avatar facil-avatar-fallback">{(auth.user.name || "?").slice(0, 1).toUpperCase()}</div>
        }
        <div className="facil-chip-text">
          <span className="facil-name">{auth.user.name}</span>
          <span className="facil-role mono">FACILITATOR</span>
        </div>
        <svg viewBox="0 0 12 8" width="10" height="6" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      {open &&
        <div className="facil-menu" onMouseLeave={() => setOpen(false)}>
          <div className="facil-menu-head">
            <div className="facil-menu-name">{auth.user.name}</div>
            <div className="facil-menu-email dim">{auth.user.email}</div>
          </div>
          <button className="facil-menu-item" onClick={auth.signOut}>
            Sign out
          </button>
        </div>
      }
    </div>  
  );
}

function LoginModal({ auth, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-eyebrow mono">// facilitator access</div>
        <h2 className="modal-title">Sign in to score teams</h2>
        <p className="modal-sub">Facilitator tools (submissions list + scoring) are gated to signed-in PivotLab staff.</p>

        <div className="modal-gsi">
          <GoogleSignInButton gsiReady={auth.gsiReady} />
          {!auth.gsiReady && !auth.checking &&
          <div className="modal-loading"><Spinner size={14} /> <span>LOADING GOOGLE SIGN-IN…</span></div>
          }
          {auth.checking &&
          <div className="modal-loading"><Spinner size={14} /> <span>VERIFYING ACCESS…</span></div>
          }
        </div>

        {auth.error &&
        <div className="modal-error">
            <strong>⚠ Access denied</strong>
            <div>{auth.error}</div>
            <button className="modal-error-dismiss" onClick={auth.clearError}>Try a different account</button>
          </div>
        }

        <div className="modal-foot mono dim">

        </div>
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Skeletons / loading
// ─────────────────────────────────────────────────────────────
function LoadingPanel({ label = "Loading from Google Sheet…" }) {
  return (
    <section className="panel loading-panel">
      <div className="loading-inner">
        <Spinner size={28} />
        <div className="loading-label mono">{label}</div>
        <div className="loading-bar"><div className="loading-bar-fill"></div></div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// TAB 1 · Submit App
// ─────────────────────────────────────────────────────────────
function SubmitTab({ submissions, submitEntry, loading }) {
  const [group, setGroup] = useState(GROUPS[0]);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [desc, setDesc] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const existing = submissions[group];

  useEffect(() => {
    if (existing) {
      setName(existing.name || "");
      setLink(existing.link || "");
      setDesc(existing.desc || "");
    } else {
      setName("");setLink("");setDesc("");
    }
  }, [group, existing?.timestamp]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !link.trim() || submitting) return;
    const entry = {
      group,
      name: name.trim(),
      link: link.trim(),
      desc: desc.trim(),
      timestamp: Date.now()
    };
    setSubmitting(true);
    setError(null);
    try {
      await submitEntry(entry);
      setConfirmed(entry);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {setConfirmed(null);}

  if (confirmed) {
    return (
      <section className="panel submit-confirm">
        <div className="confirm-glow"></div>
        <div className="confirm-hex">
          <div className="confirm-hex-border" aria-hidden="true">
            <svg viewBox="0 0 200 200" preserveAspectRatio="none">
              <polygon points="100,2 198,52 198,148 100,198 2,148 2,52"
              fill="none" stroke="#9DE5FF" strokeWidth="0.6" strokeDasharray="2 2.5" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(157,229,255,0.6))" }} />
            </svg>
          </div>
          <div className="confirm-inner">
            <div className="confirm-badge">
              <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="confirm-script">Submitted!</div>
            <h2 className="confirm-title">{confirmed.group} is locked in.</h2>
            <p className="confirm-sub">Your app <strong>{confirmed.name}</strong> has been transmitted to the PivotLab judging panel.</p>

            <div className="confirm-card">
              <div className="confirm-row"><span>GROUP</span><span className="mono">{confirmed.group}</span></div>
              <div className="confirm-row"><span>APP</span><span className="mono">{confirmed.name}</span></div>
              <div className="confirm-row"><span>LINK</span><a href={confirmed.link} target="_blank" rel="noopener noreferrer" className="link-cyan mono">{confirmed.link}</a></div>
              <div className="confirm-row"><span>AT</span><span className="mono">{new Date(confirmed.timestamp).toLocaleTimeString()}</span></div>
            </div>

            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={reset}>Edit submission</button>
              <button className="btn btn-primary" onClick={() => {reset();setGroup(GROUPS[(GROUPS.indexOf(group) + 1) % GROUPS.length]);}}>
                Submit another →
              </button>
            </div>
          </div>
        </div>
      </section>);

  }

  return (
    <section className="panel submit-panel">
      <div className="submit-aside">
        <h2 className="aside-title">Ship your prototype.</h2>
        <p className="aside-body">Drop your app link before judging starts.</p>
        <p className="aside-body">Re-submitting will overwrite your group's previous entry — last save wins.</p>
        <ol className="aside-list">
          <li><span className="aside-num">01</span> Select your group</li>
          <li><span className="aside-num">02</span> Name your app + paste link</li>
          <li><span className="aside-num">03</span> Hit submit</li>
        </ol>
        <div className="aside-footer">
          <div className="aside-stat">
            <div className="stat-big">
              {Object.keys(submissions).length}
              <span className="stat-of">/{CONFIG.numGroups}</span>
            </div>
            <div className="stat-cap">
              {loading ? <><Spinner size={10}/><span>syncing…</span></> : <span>submissions in</span>}
            </div>
          </div>
        </div>
      </div>

      <form className="submit-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Group <em>required</em></span>
          <div className="select-wrap">
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="input select">
              {GROUPS.map((g) => {
                const hasSub = !!submissions[g];
                return <option key={g} value={g}>{g}{hasSub ? "  ·  submitted" : ""}</option>;
              })}
            </select>
            <svg className="select-caret" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </div>
          {existing &&
          <div className="field-hint hint-warn">
              ⚠ {group} already submitted <strong>{existing.name}</strong> — submitting again will overwrite it.
            </div>
          }
        </label>

        <label className="field">
          <span className="field-label">App name <em>required</em></span>
          <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pasar Pintar" maxLength={60} />
        </label>

        <label className="field">
          <span className="field-label">App link <em>required</em></span>
          <input className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </label>

        <label className="field">
          <span className="field-label">Short description <em className="opt">optional</em></span>
          <textarea className="input textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="One sentence on what your app does and who it's for." maxLength={240} rows={3} />
          <div className="field-counter">{desc.length}/240</div>
        </label>

        {error && <div className="form-error">⚠ {error}</div>}

        <div className="form-actions">
          <div className="form-actions-meta">
            <span className="status-dot status-dot-pink"></span>
            <span className="mono dim">{existing ? "OVERWRITE MODE" : "NEW SUBMISSION"}</span>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!name.trim() || !link.trim() || submitting}>
            {submitting ? <><Spinner size={14} /><span>Submitting…</span></> : <>
              <span>Submit</span>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </>}
          </button>
        </div>
      </form>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// TAB 2 · Submissions
// ─────────────────────────────────────────────────────────────
function SubmissionsTab({ submissions, scores, loading, onRefresh }) {
  const list = useMemo(() => {
    return Object.values(submissions).sort((a, b) => {
      const na = parseInt(String(a.group).replace(/\D/g, ""), 10);
      const nb = parseInt(String(b.group).replace(/\D/g, ""), 10);
      return na - nb;
    });
  }, [submissions]);

  const totalSubs = list.length;
  const shortlisted = Object.values(scores).filter((s) => s.shortlisted).length;
  const fullyScored = Object.values(scores).filter((s) => CRITERIA.every((c) => s[c.key])).length;

  function exportCSV() {
    const rows = [["Group", "App Name", "App Link", "Description", "Timestamp",
    ...CRITERIA.map((c) => c.label), "Total", "Shortlisted", "Notes"]];
    list.forEach((s) => {
      const sc = scores[s.group] || {};
      const ratings = CRITERIA.map((c) => sc[c.key] ?? "");
      const total = CRITERIA.reduce((sum, c) => sum + (Number(sc[c.key]) || 0), 0);
      rows.push([s.group, s.name, s.link, s.desc || "",
      new Date(Number(s.timestamp) || s.timestamp).toISOString(),
      ...ratings, total, sc.shortlisted ? "yes" : "no", sc.notes || ""]);
    });
    const csv = rows.map((row) => row.map((cell) => {
      const v = String(cell ?? "");
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibe-coding-${CONFIG.city.toLowerCase()}-${YEAR}-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="panel subs-panel">
      <div className="subs-head">
        <div className="stats-row">
          <Stat n={totalSubs} of={CONFIG.numGroups} label="Submissions" tone="cyan" />
          <Stat n={CONFIG.numGroups - totalSubs} label="Awaiting" tone="dim" />
          <Stat n={shortlisted} label="Shortlisted" tone="pink" />
          <Stat n={fullyScored} label="Fully scored" tone="violet" />
        </div>
        <div className="subs-head-actions">
          <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading}>
            {loading ? <Spinner size={12} /> : <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4M12 1v3.5H8.5M4 15v-3.5H7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            <span>Refresh</span>
          </button>
          <button className="btn btn-outline" onClick={exportCSV} disabled={totalSubs === 0}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v8m0 0l-3-3m3 3l3-3M2 13h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {totalSubs === 0 ?
      <div className="empty">
          <div className="empty-glyph">∅</div>
          <h3>{loading ? "Loading submissions…" : "No submissions yet"}</h3>
          <p>{loading ? "Pulling from the Google Sheet." : "Once kumpulans start shipping, they'll appear here in order."}</p>
        </div> :

      <div className="cards-grid">
          {list.map((s) => {
          const sc = scores[s.group] || {};
          const total = CRITERIA.reduce((sum, c) => sum + (Number(sc[c.key]) || 0), 0);
          const isScored = CRITERIA.every((c) => sc[c.key]);
          const ts = Number(s.timestamp) || (s.timestamp ? new Date(s.timestamp).getTime() : 0);
          return (
            <article key={s.group} className={`sub-card ${sc.shortlisted ? "shortlisted" : ""}`}>
                <div className="sub-card-bar"></div>
                <div className="sub-card-head">
                  <div className="sub-card-group mono">{String(s.group).toUpperCase()}</div>
                  <div className="sub-card-pills">
                    {sc.shortlisted && <Pill tone="pink">★ Shortlisted</Pill>}
                    {isScored && <Pill tone="cyan">{total}/20</Pill>}
                  </div>
                </div>
                <h3 className="sub-card-title">{s.name}</h3>
                {s.desc && <p className="sub-card-desc">{s.desc}</p>}
                <div className="sub-card-foot">
                  <div className="sub-card-time mono dim">
                    {ts ? new Date(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </div>
                  <a className="link-cyan link-arrow" href={s.link} target="_blank" rel="noopener noreferrer">
                    Open app
                    <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true"><path d="M4 10l6-6M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </article>);

        })}
        </div>
      }
    </section>);

}

function Stat({ n, of, label, tone = "cyan" }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-n">
        {n}
        {of !== undefined && <span className="stat-of">/{of}</span>}
      </div>
      <div className="stat-l">{label}</div>
    </div>);

}

// ─────────────────────────────────────────────────────────────
// TAB 3 · Scoring
// ─────────────────────────────────────────────────────────────
function ScoringTab({ submissions, scores, saveScore, loading, facilitatorEmail }) {
  const submitted = useMemo(() => {
    return Object.values(submissions).sort((a, b) => {
      const na = parseInt(String(a.group).replace(/\D/g, ""), 10);
      const nb = parseInt(String(b.group).replace(/\D/g, ""), 10);
      return na - nb;
    });
  }, [submissions]);

  const [selected, setSelected] = useState(submitted[0]?.group || "");
  useEffect(() => {
    if ((!selected || !submissions[selected]) && submitted[0]) setSelected(submitted[0].group);
  }, [submitted, selected]);

  const current = submissions[selected];
  const currentScore = scores[selected] || {};

  const [draft, setDraft] = useState({});
  useEffect(() => {
    setDraft({
      functionality: Number(currentScore.functionality) || 0,
      visual: Number(currentScore.visual) || 0,
      problem: Number(currentScore.problem) || 0,
      concept: Number(currentScore.concept) || 0,
      shortlisted: !!currentScore.shortlisted,
      notes: currentScore.notes || ""
    });
  }, [selected, currentScore.updatedAt]);

  const draftTotal = CRITERIA.reduce((sum, c) => sum + (Number(draft[c.key]) || 0), 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function setCriterion(key, value) {setDraft((d) => ({ ...d, [key]: value }));}

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveScore({ ...draft, group: selected, facilitatorEmail, updatedAt: Date.now() });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  const leaderboard = useMemo(() => {
    const rows = submitted.map((s) => {
      const sc = scores[s.group] || {};
      const total = CRITERIA.reduce((sum, c) => sum + (Number(sc[c.key]) || 0), 0);
      const filled = CRITERIA.every((c) => sc[c.key]);
      return {
        group: s.group, name: s.name, total,
        shortlisted: !!sc.shortlisted, scored: filled
      };
    });
    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (a.shortlisted !== b.shortlisted) return a.shortlisted ? -1 : 1;
      const na = parseInt(String(a.group).replace(/\D/g, ""), 10);
      const nb = parseInt(String(b.group).replace(/\D/g, ""), 10);
      return na - nb;
    });
    return rows;
  }, [submitted, scores]);

  if (submitted.length === 0) {
    return (
      <section className="panel">
        <div className="empty">
          <div className="empty-glyph">⌁</div>
          <h3>{loading ? "Loading submissions…" : "Nothing to score yet"}</h3>
          <p>{loading ? "Pulling from the Google Sheet." : "Once kumpulans submit their apps, you can score them here."}</p>
        </div>
      </section>);

  }

  return (
    <section className="panel scoring-panel">
      <div className="scoring-grid">
        <div className="scoring-card">
          <div className="scoring-head">
            <div>
              <div className="field-label">Scoring kumpulan</div>
              <div className="select-wrap select-wrap-lg">
                <select className="input select select-lg" value={selected} onChange={(e) => setSelected(e.target.value)}>
                  {submitted.map((s) => {
                    const sc = scores[s.group] || {};
                    const t = CRITERIA.reduce((sum, c) => sum + (Number(sc[c.key]) || 0), 0);
                    const tag = CRITERIA.every((c) => sc[c.key]) ? `  ·  ${t}/20` : "  ·  unscored";
                    return <option key={s.group} value={s.group}>{s.group} — {s.name}{tag}</option>;
                  })}
                </select>
                <svg className="select-caret" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </div>
            </div>
            <div className="total-tile">
              <div className="total-eyebrow mono">TOTAL</div>
              <div className="total-num">{draftTotal}<span className="total-of">/20</span></div>
              <div className="total-bar">
                <div className="total-bar-fill" style={{ width: `${draftTotal / 20 * 100}%` }}></div>
              </div>
            </div>
          </div>

          {current &&
          <div className="scoring-meta">
              <a className="link-cyan link-arrow" href={current.link} target="_blank" rel="noopener noreferrer">
                <span className="mono dim">APP →</span> {current.name}
                <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true"><path d="M4 10l6-6M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              {current.desc && <p className="scoring-desc">{current.desc}</p>}
            </div>
          }

          <div className="criteria-list">
            {CRITERIA.map((c, i) =>
            <div key={c.key} className="criterion">
                <div className="criterion-text">
                  <div className="criterion-num mono">0{i + 1}</div>
                  <div>
                    <div className="criterion-label">{c.label}</div>
                    <div className="criterion-sub">{c.sub}</div>
                  </div>
                </div>
                <StarRow id={c.key} value={draft[c.key] || 0} onChange={(v) => setCriterion(c.key, v)} />
              </div>
            )}
          </div>

          <label className="field">
            <span className="field-label">Facilitator notes <em className="opt">optional</em></span>
            <textarea className="input textarea" rows={4} value={draft.notes || ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Strengths, weaknesses, anything to remember during deliberations…" />
          </label>

          {error && <div className="form-error">⚠ {error}</div>}

          <div className="scoring-actions">
            <button type="button" className={`btn btn-toggle ${draft.shortlisted ? "on" : ""}`}
            onClick={() => setDraft((d) => ({ ...d, shortlisted: !d.shortlisted }))} aria-pressed={!!draft.shortlisted}>
              <span className="toggle-dot"></span>
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.1 1.12-6.55L2.48 9.52l6.58-.96L12 2.6z" fill={draft.shortlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <span>{draft.shortlisted ? "Shortlisted" : "Shortlist team"}</span>
            </button>
            <div className="scoring-actions-right">
              {saved && <span className="saved-flash mono">✓ SAVED</span>}
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><Spinner size={14} /><span>Saving…</span></> : "Save score"}
              </button>
            </div>
          </div>
        </div>

        <Leaderboard rows={leaderboard} selected={selected} onSelect={setSelected} />
      </div>
    </section>);

}

function Leaderboard({ rows, selected, onSelect }) {
  return (
    <aside className="leaderboard">
      <div className="lb-head">
        <div className="lb-eyebrow mono">// live leaderboard</div>
        <h3 className="lb-title">Ranked by total score</h3>
        <div className="lb-legend mono dim">
          <span><span className="legend-sw legend-pink"></span> shortlisted</span>
          <span><span className="legend-sw legend-cyan"></span> current</span>
        </div>
      </div>
      <ol className="lb-list">
        {rows.map((r, i) =>
        <li key={r.group}
        className={`lb-row ${r.shortlisted ? "shortlisted" : ""} ${r.group === selected ? "current" : ""} ${r.scored ? "" : "unscored"}`}
        onClick={() => onSelect(r.group)}>
          
            <div className="lb-rank">
              <span className="lb-rank-n">{i + 1}</span>
              {r.shortlisted && <span className="lb-star">★</span>}
            </div>
            <div className="lb-main">
              <div className="lb-group mono">{r.group}</div>
              <div className="lb-name">{r.name}</div>
              <div className="lb-bar">
                <div className="lb-bar-fill" style={{ width: `${r.total / 20 * 100}%` }}></div>
              </div>
            </div>
            <div className="lb-score">
              <div className="lb-score-n">{r.total}<span className="lb-score-of">/20</span></div>
              <div className="lb-score-cap mono">{r.scored ? "scored" : "—"}</div>
            </div>
          </li>
        )}
      </ol>
    </aside>);

}

// ─────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("submit");
  const [loginOpen, setLoginOpen] = useState(false);
  const auth = useAuth();
  const data = useWorkshopData();

  // If user signs out while on a facilitator tab, bounce them back to submit.
  useEffect(() => {
    if (!auth.user && (tab === "submissions" || tab === "scoring")) setTab("submit");
  }, [auth.user, tab]);

  // Close login modal once auth flips on
  useEffect(() => {if (auth.user) setLoginOpen(false);}, [auth.user]);

  // (the form mounts immediately; loading state is shown inside the counter card)

  return (
    <div className="app-root" data-screen-label={`Vibe Coding Workshop · ${tab}`}>
      <GridBG />
      <Streaks />
      <HudRings />
      <div className="app-shell">
        <Header tab={tab} setTab={setTab} auth={auth} onOpenLogin={() => setLoginOpen(true)} submissionCount={Object.keys(data.submissions).length} />

        <SetupBanner auth={auth} />
        <ErrorBanner error={data.error} onRetry={data.refetch} />

        <main className="app-main">
          {tab === "submit" && (
            <SubmitTab submissions={data.submissions} submitEntry={data.submitEntry} loading={data.loading} />
          )}
          {tab === "submissions" && auth.user &&
          <SubmissionsTab submissions={data.submissions} scores={data.scores} loading={data.loading} onRefresh={data.refetch} />
          }
          {tab === "scoring" && auth.user &&
          <ScoringTab submissions={data.submissions} scores={data.scores} saveScore={data.saveScore} loading={data.loading} facilitatorEmail={auth.user.email} />
          }
        </main>

        <footer className="app-foot mono dim">
          <span>PIVOTLAB · VIBE CODING WORKSHOP {YEAR} · {CONFIG.city.toUpperCase()}</span>
          <span>{sheetsApi.configured ? "\n" : "LOCAL FALLBACK · NO BACKEND CONFIGURED"}</span>
        </footer>
      </div>

      {loginOpen && <LoginModal auth={auth} onClose={() => setLoginOpen(false)} />}
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
