/* Modals: Onboarding, Generation drawer, Paywall */

const Modal = ({ open, onClose, children, width = 560, dismissable = true }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.45)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      animation: "fadeIn .15s ease",
    }} onClick={() => dismissable && onClose()}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto",
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
        animation: "scaleIn .2s cubic-bezier(.2,.8,.2,1)",
      }}>{children}</div>
    </div>
  );
};

/* ========== Onboarding ========== */
const Onboarding = ({ open, onClose, onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [scanning, setScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [scanned, setScanned] = React.useState(false);

  React.useEffect(() => {
    if (step === 1 && !scanned) {
      setScanning(true);
      setScanProgress(0);
      const iv = setInterval(() => {
        setScanProgress(p => {
          if (p >= 100) { clearInterval(iv); setScanning(false); setScanned(true); return 100; }
          return p + 4;
        });
      }, 50);
      return () => clearInterval(iv);
    }
  }, [step, scanned]);

  const steps = ["Welcome", "Scan site", "Ready"];

  return (
    <Modal open={open} onClose={onClose} width={620} dismissable={false}>
      {/* Step indicator */}
      <div style={{ display: "flex", padding: "20px 28px 0", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? "var(--text)" : "var(--bg-sunken)", transition: "background .3s" }}/>
        ))}
      </div>
      <div style={{ padding: "8px 28px 4px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Step {step + 1} of 3 · {steps[step]}
      </div>

      {step === 0 && (
        <div style={{ padding: "16px 28px 28px" }}>
          <Icon name="logo" size={44} style={{ color: "var(--primary-strong)", marginBottom: 14 }}/>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Welcome to BeepBeep AI.</h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>
            Page SEO that runs continuously in the background. BeepBeep AI crawls your published pages, writes title tags and meta descriptions, and keeps your coverage climbing — without you having to think about it.
          </p>
          <div style={{ marginTop: 20, padding: 16, background: "var(--bg-sunken)", borderRadius: "var(--r-md)", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "shield", text: "Daily crawl to catch pages with missing title & meta" },
              { icon: "zap",    text: "Generate 5 pages per day on Free — no rush" },
              { icon: "flame",  text: "Build a streak — your site stays healthy over time" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--text)" }}>
                <Icon name={f.icon} size={15} style={{ color: "var(--primary)" }}/>
                {f.text}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="primary" size="md" iconRight="arrow-right" onClick={() => setStep(1)}>Let's go</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ padding: "16px 28px 28px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Scanning your site</h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 20px" }}>
            We'll look at every page and tell you what's missing. This won't use any credits.
          </p>
          <div style={{
            padding: 24, background: "var(--bg-sunken)",
            border: "1px solid var(--border)", borderRadius: "var(--r-md)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{scanning ? "Crawling pages & posts…" : scanned ? "Crawl complete" : "Ready"}</span>
              <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>{scanProgress}%</span>
            </div>
            <Progress value={scanProgress} max={100} tone={scanned ? "ok" : "primary"} height={6}/>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <ScanStat label="Total pages"     value={scanned ? 138 : scanning ? Math.floor(138 * scanProgress / 100) : 0}/>
              <ScanStat label="Missing title"  value={scanned ? 24 : 0} tone="danger"/>
              <ScanStat label="Missing meta"   value={scanned ? 41 : 0} tone="warn"/>
            </div>
          </div>
          {scanned && (
            <div style={{
              marginTop: 14, padding: 14,
              background: "var(--ok-soft)", border: "1px solid var(--ok-border)",
              borderRadius: "var(--r-md)", fontSize: 13, color: "var(--ok-ink)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Icon name="check" size={16}/>
              <span><strong>65 pages</strong> need attention. Don't worry — you'll work through them gradually.</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Button variant="ghost" size="md" onClick={() => setStep(0)}>Back</Button>
            <Button variant="primary" size="md" iconRight="arrow-right" disabled={!scanned} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <ReadyStep onComplete={onComplete} onBack={() => setStep(1)}/>
      )}
    </Modal>
  );
};

/* ----------------------------------------------------------------
   ReadyStep — calm onboarding completion.
   The plugin auto-selects the bite-sized daily workflow for free users
   (no decision required). Pro positioning is deferred to later moments.
   A subtle disclosure exposes power-user modes only when asked for.
   ---------------------------------------------------------------- */
const ReadyStep = ({ onComplete, onBack }) => {
  const [showOptions, setShowOptions] = React.useState(false);

  return (
    <div style={{ padding: "12px 28px 28px" }}>
      {/* Soft success badge — reinforces completion before content */}
      <div className="onboarding-success" style={{
        width: 44, height: 44, borderRadius: 999,
        background: "var(--ok-soft)", border: "1px solid var(--ok-border)",
        color: "var(--ok-ink)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <Icon name="check" size={22} strokeWidth={2.4}/>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        Your site is ready
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 6px", lineHeight: 1.55 }}>
        We found <span className="mono tnum" style={{ color: "var(--text)", fontWeight: 600 }}>65</span> pages needing attention.
      </p>
      <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 18px", lineHeight: 1.55 }}>
        We'll guide you through them gradually — no rush.
      </p>

      {/* Reassurance bullets — not feature comparison */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "14px 16px",
        background: "var(--surface-2)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-md)",
        marginBottom: 16,
      }}>
        {[
          "5 pages per day included free",
          "Builds steady SEO coverage",
          "You can change settings anytime",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)" }}>
            <Icon name="check" size={13} strokeWidth={2.4} style={{ color: "var(--ok-ink)", flexShrink: 0 }}/>
            <span>{t}</span>
          </div>
        ))}
      </div>

      {/* Subtle disclosure for power-users — collapsed by default */}
      <div style={{ marginBottom: 4 }}>
        <button
          onClick={() => setShowOptions(v => !v)}
          aria-expanded={showOptions}
          style={{
            background: "transparent", border: "none", padding: 0,
            fontSize: 12.5, color: "var(--text-3)", fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          {showOptions ? "Hide faster options" : "See faster options"}
          <Icon name={showOptions ? "chevron-down" : "chevron-right"} size={12}/>
        </button>
        {showOptions && (
          <div className="fade-in" style={{
            marginTop: 10,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-md)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <FasterOption
              title="Bulk catch-up"
              desc="Optimise your entire site in one pass with Pro, then let Autopilot handle new pages."
            />
            <div style={{ height: 1, background: "var(--hairline)" }}/>
            <FasterOption
              title="Monitor only"
              desc="Just track SEO health and generate manually when you want to."
            />
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
              You can switch to either of these later from Settings.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button variant="ghost" size="md" onClick={onBack}>Back</Button>
        <Button variant="primary" size="md" iconRight="arrow-right" onClick={onComplete}>Open dashboard</Button>
      </div>
    </div>
  );
};

const FasterOption = ({ title, desc }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</div>
    <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{desc}</div>
  </div>
);

const ScanStat = ({ label, value, tone = "neutral" }) => {
  const colors = { neutral: "var(--text)", danger: "var(--danger-ink)", warn: "var(--warn-ink)" };
  return (
    <div style={{ background: "var(--surface)", padding: 12, borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: colors[tone] }}>{value}</div>
    </div>
  );
};

const RhythmOption = ({ icon, title, desc, meta, recommended, accent }) => (
  <div style={{
    padding: 16, borderRadius: "var(--r-md)",
    border: `1px solid ${recommended ? "var(--text)" : "var(--border)"}`,
    background: accent ? "var(--primary-soft)" : "var(--surface)",
    display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer",
    position: "relative",
    transition: "border-color .1s, background .1s",
  }}
  onMouseEnter={e => { if (!recommended) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
  onMouseLeave={e => { if (!recommended) e.currentTarget.style.borderColor = "var(--border)"; }}>
    <div style={{
      width: 36, height: 36, borderRadius: "var(--r-md)",
      background: accent ? "var(--primary)" : "var(--bg-sunken)",
      color: accent ? "#fff" : "var(--text-2)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}><Icon name={icon} size={17}/></div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        {recommended && <Pill tone="ok">Recommended</Pill>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}>{desc}</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{meta}</div>
    </div>
  </div>
);

/* ========== Generation drawer ==========
   Assistant-style sidebar. Reduced width + softer overlay so the dashboard
   stays present behind it. Rotating micro-status phrases during analysis,
   gentle fade-up on each completed card, calm assistant copy throughout.
*/
const ASSISTANT_PHRASES = [
  "Reading page content…",
  "Identifying core topic…",
  "Pulling keywords from H1 & body…",
  "Drafting title tag…",
  "Writing meta description…",
  "Trimming to character budget…",
];

const useRotatingPhrase = (phrases, intervalMs = 1100, active = true) => {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // keep first phrase static
    const t = setInterval(() => setI(x => (x + 1) % phrases.length), intervalMs);
    return () => clearInterval(t);
  }, [phrases, intervalMs, active]);
  return phrases[i];
};

const GenerationDrawer = ({ open, onClose, pages, onComplete, plan }) => {
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState("idle"); // idle | thinking | done
  const [results, setResults] = React.useState([]);
  const closeBtnRef = React.useRef(null);

  // Realistic generated title + meta pairs that match the page URL semantics.
  const generated = [
    {
      title: "About Mission Coffee | Specialty Roasters in San Francisco",
      meta:  "Hand-roasted coffee, espresso equipment, and barista training from our flagship cafe on Mission Street since 2018.",
    },
    {
      title: "The 2026 SEO Guide: Title Tags, Meta, and Schema",
      meta:  "How modern title and meta description writing works post-AI overviews. Tested patterns, character budgets, and 12 real-world examples.",
    },
    {
      title: "Ethiopia Light Roast — Bright, Floral, Single-Origin",
      meta:  "100g of jasmine-forward Ethiopian beans from a single washing station. Roasted weekly, shipped within 48 hours.",
    },
    {
      title: "Jane Davis Review | Mission Coffee Customer Stories",
      meta:  "\"The cappuccino mug set changed my mornings.\" Read Jane's full story and see what she ordered.",
    },
    {
      title: "Make Cafe-Quality Cappuccino at Home in 6 Minutes",
      meta:  "Our barista-tested method for silky cappuccino foam — using any espresso machine. Step-by-step photos and a 90-second walk-through.",
    },
  ];

  React.useEffect(() => {
    if (!open) { setIdx(0); setPhase("idle"); setResults([]); return; }
    if (open && pages && pages.length > 0) {
      setPhase("thinking");
      let i = 0;
      const iv = setInterval(() => {
        const g = generated[i % generated.length];
        setResults(r => [...r, {
          url: pages[i].url,
          section: pages[i].section,
          hue: pages[i].hue,
          title: g.title,
          meta: g.meta,
        }]);
        i++;
        setIdx(i);
        if (i >= pages.length) {
          clearInterval(iv);
          setPhase("done");
        }
      }, 1400);
      return () => clearInterval(iv);
    }
  }, [open, pages]);

  // ESC to dismiss; preserve focus restoration via Modal-free implementation.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !pages) return null;

  const allDone = phase === "done";
  const remaining = pages.length - idx;
  const upcoming = !allDone && pages[idx] ? pages[idx] : null;

  const isPro = plan === "pro";
  const headlinePrimary = allDone
    ? `${pages.length} page${pages.length === 1 ? "" : "s"} improved`
    : isPro
      ? `${idx} page${idx === 1 ? "" : "s"} improved`
      : `${idx} of ${pages.length} complete`;

  const footerStatus = allDone
    ? (isPro
        ? "Optimisation complete · Autopilot active."
        : "Title & meta descriptions are live in your site.")
    : remaining === 1
    ? "Wrapping up the last page…"
    : idx === 0
    ? (isPro ? "Optimising your latest pages…" : "Working through today's pages…")
    : `${remaining} page${remaining === 1 ? "" : "s"} to go`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="BeepBeep AI assistant"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.22)",
        backdropFilter: "blur(1.5px)",
        display: "flex", justifyContent: "flex-end",
        animation: "fadeIn .18s ease",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 420, maxWidth: "100%", background: "var(--surface)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
        animation: "slideInRight .25s cubic-bezier(.2,.8,.2,1)",
        height: "100%", overflow: "hidden",
        borderLeft: "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon name={allDone ? "check" : "sparkles"} size={13} style={{ color: allDone ? "var(--ok-ink)" : "var(--primary)" }}/>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {allDone
                  ? (isPro ? "Optimisation complete" : "Pass complete")
                  : (isPro ? "Optimisation" : "Today's pass")}
              </span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {headlinePrimary}
            </div>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close" style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-3)", padding: 6, borderRadius: 6,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "10px 22px", borderBottom: "1px solid var(--hairline)" }}>
          <Progress value={idx} max={pages.length} tone={allDone ? "ok" : "primary"} height={6}/>
        </div>

        {/* Results stream */}
        <div
          aria-live="polite"
          style={{ flex: 1, overflowY: "auto", padding: "4px 22px 12px" }}
        >
          {results.map((r, i) => (
            <GenResultRow key={i} result={r} index={i} last={i === results.length - 1 && phase !== "thinking"}/>
          ))}
          {phase === "thinking" && upcoming && (
            <GenPlaceholderRow page={upcoming} index={idx}/>
          )}
        </div>

        {/* Footer — calm assistant status, muted cancel */}
        <div style={{
          padding: "12px 22px", borderTop: "1px solid var(--hairline)",
          background: "var(--surface-2)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          {allDone ? (
            <>
              <div style={{ fontSize: 12, color: "var(--ok-ink)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="trend" size={13}/>
                <span>Coverage <strong>+{pages.length}%</strong> · streak extended</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="primary" size="sm" iconRight="arrow-right" onClick={onComplete}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--primary)" }}/>
                {footerStatus}
              </span>
              {/* Muted text-link cancel, lower hierarchy than primary actions */}
              <button onClick={onClose} style={{
                background: "transparent", border: "none", padding: "4px 6px",
                fontSize: 12, color: "var(--text-3)", fontWeight: 500, cursor: "pointer",
              }}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* Alternate title + meta variants used by the Regenerate action.
   Each tap surfaces a fresh phrasing for both the title tag and the
   meta description, so users see real "AI rewrite" behaviour. */
const TITLE_VARIANTS = [
  "{Section} — {Brand} | Specialty Coffee in San Francisco",
  "{Section} at {Brand}: Curated, Roasted, Shipped Weekly",
  "{Brand} {Section} — Made by Hand in Mission District",
  "{Section} | Trusted by 40,000 Home Baristas Since 2018",
];
const META_VARIANTS = [
  "Hand-roasted coffee, espresso equipment, and barista training from our flagship cafe on Mission Street since 2018.",
  "Bright, single-origin beans roasted weekly in small batches. Free shipping over $35.",
  "Practical SEO and barista guides written by working professionals — no fluff, just what works.",
  "Tested techniques, real-world examples, and step-by-step photos for any home espresso setup.",
];

/* Result row — fade-up entry, animated check, calm density.
   Edit toggles inline editable title + meta. Regenerate animates a brief
   "thinking" state and rotates to a fresh title + meta pairing. */
const GenResultRow = ({ result, index, last }) => {
  const [title, setTitle] = React.useState(result.title);
  const [meta,  setMeta]  = React.useState(result.meta);
  const [editing, setEditing] = React.useState(false);
  const [regen, setRegen] = React.useState(false);
  const [variantIdx, setVariantIdx] = React.useState(0);
  const titleRef = React.useRef(null);

  React.useEffect(() => { setTitle(result.title); setMeta(result.meta); }, [result.title, result.meta]);
  React.useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [editing]);

  const handleRegenerate = () => {
    if (regen) return;
    setRegen(true);
    setTimeout(() => {
      const next = (variantIdx + 1) % TITLE_VARIANTS.length;
      setTitle(TITLE_VARIANTS[next].replace("{Section}", result.section || "Page").replace("{Brand}", "Mission Coffee"));
      setMeta(META_VARIANTS[next]);
      setVariantIdx(next);
      setRegen(false);
    }, 800);
  };

  const sectionLetter = (result.section || "P")[0].toUpperCase();
  const hue = result.hue ?? (index * 80) % 360;

  return (
  <div className="gen-row-in" style={{
    padding: "14px 0",
    borderBottom: last ? "none" : "1px solid var(--hairline)",
  }}>
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: `hsl(${hue}, 32%, 94%)`,
          color: `hsl(${hue}, 38%, 32%)`,
          border: "1px solid var(--border)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>{sectionLetter}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{result.url}</span>
          <span className="gen-check" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 16, height: 16, borderRadius: 999,
            background: "var(--ok-soft)", color: "var(--ok-ink)",
            border: "1px solid var(--ok-border)", flexShrink: 0,
          }}>
            <Icon name="check" size={9} strokeWidth={3}/>
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{result.section}</div>

        {editing ? (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") setEditing(false);
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) setEditing(false);
              }}
              placeholder="Title tag"
              style={{
                padding: "8px 10px",
                background: "var(--surface)",
                border: "1px solid var(--primary-border)",
                boxShadow: "0 0 0 3px rgba(37,99,235,0.12)",
                borderRadius: "var(--r-sm)",
                fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-sans)",
                outline: 0,
              }}/>
            <textarea
              value={meta}
              onChange={e => setMeta(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") setEditing(false);
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) setEditing(false);
              }}
              rows={3}
              placeholder="Meta description"
              style={{
                padding: "8px 10px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                fontSize: 12.5, color: "var(--text)", lineHeight: 1.5,
                fontFamily: "var(--font-sans)",
                resize: "vertical", minHeight: 60,
                outline: 0,
              }}/>
          </div>
        ) : (
          <div style={{
            marginTop: 6, padding: "10px 12px",
            background: "var(--surface-2)", borderRadius: "var(--r-sm)",
            border: "1px solid var(--hairline)",
            transition: "color .2s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative", overflow: "hidden",
            opacity: regen ? 0.55 : 1,
          }}>
            {regen ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-3)" }}>
                <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--primary)" }}/>
                <span>Rewriting…</span>
              </span>
            ) : (
              <>
                <div key={title} className="phrase-in" style={{
                  fontSize: 13, lineHeight: 1.35, color: "#1a0dab",
                  fontFamily: "arial, sans-serif", marginBottom: 4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{title}</div>
                <div key={meta} className="phrase-in" style={{
                  fontSize: 12, lineHeight: 1.5, color: "var(--text-2)",
                }}>{meta}</div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 6, display: "flex", gap: 2 }}>
          <Button variant="ghost" size="sm" icon={editing ? "check" : "edit"} onClick={() => setEditing(v => !v)}>
            {editing ? "Done" : "Edit"}
          </Button>
          <Button variant="ghost" size="sm" icon="refresh" disabled={regen || editing} onClick={handleRegenerate}>
            {regen ? "Rewriting" : "Regenerate"}
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
};

/* Placeholder row — shows the URL immediately + rotating assistant phrase */
const GenPlaceholderRow = ({ page, index }) => {
  const phrase = useRotatingPhrase(ASSISTANT_PHRASES, 1100, true);
  const sectionLetter = (page.section || "P")[0].toUpperCase();
  const hue = page.hue ?? 220;
  return (
    <div style={{ padding: "14px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: `hsl(${hue}, 32%, 94%)`,
            color: `hsl(${hue}, 38%, 32%)`,
            border: "1px solid var(--border)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
          }}>{sectionLetter}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{page.section}</div>
          <div style={{
            marginTop: 6, padding: "10px 12px",
            background: "var(--surface-2)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-sm)",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12.5, color: "var(--text-2)",
          }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--primary)", boxShadow: "0 0 0 0 rgba(37,99,235,0.5)" }}/>
            <span key={phrase} className="phrase-in" style={{ lineHeight: 1.4 }}>{phrase}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========== Paywall ========== */
const Paywall = ({ open, onClose, trigger, onUpgrade }) => {
  if (!open) return null;
  const triggers = {
    "daily-limit": { icon: "clock", title: "You've used today's free generations", subtitle: "Pro lifts the daily allowance so you never have to wait — keep optimising every day.", urgency: "Your next 5 unlock in 8h 14m." },
    "monthly-limit": { icon: "alert", title: "You've reached this month's free generations", subtitle: "Pro keeps your site improving without limits — plenty of headroom for any site.", urgency: "Free credits reset in 14 days." },
    "auto-feature": { icon: "zap", title: "Let BeepBeep AI handle title & meta for you", subtitle: "Stay focused on writing — every new page you publish gets title & meta automatically.", urgency: "Set it once. Never think about it again." },
    "bulk": { icon: "library", title: "Optimise your entire site in minutes", subtitle: "Catch up on every page with missing title & meta in one pass. Pro handles the whole site while you work on other things.", urgency: null },
    "schedule": { icon: "calendar", title: "Keep your site improving in the background", subtitle: "Pro crawls daily and quietly covers anything new — so your SEO health only ever goes up.", urgency: null },
    "default": { icon: "crown", title: "Never worry about missing meta again", subtitle: "Continuous, automated page SEO for your WordPress site — quietly running in the background.", urgency: null },
  };
  const t = triggers[trigger] || triggers.default;

  return (
    <Modal open={open} onClose={onClose} width={680}>
      <div style={{ position: "relative" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "var(--bg-sunken)", border: "1px solid var(--border)",
          borderRadius: 999, width: 32, height: 32,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-2)", zIndex: 2,
        }}><Icon name="x" size={14}/></button>

        {/* Header band */}
        <div style={{
          padding: "28px 32px 22px",
          background: "linear-gradient(135deg, #F3F7FE 0%, #EEF0FE 100%)",
          borderBottom: "1px solid var(--primary-border)",
          borderTopLeftRadius: "var(--r-xl)", borderTopRightRadius: "var(--r-xl)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "var(--r-md)",
              background: "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(37,99,235,0.28)",
            }}><Icon name={t.icon} size={22}/></div>
            <div style={{ flex: 1 }}>
              <Pill tone="primary" icon="crown">BeepBeep AI Pro</Pill>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "8px 0 6px" }}>{t.title}</h2>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{t.subtitle}</p>
              {t.urgency && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--warn-ink)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="clock" size={13}/>{t.urgency}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div style={{ padding: "24px 32px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <PlanColumn title="Free" subtitle="What you have today" features={[
              { ok: true, text: "5 AI generations per day" },
              { ok: true, text: "Up to 50 AI generations per month" },
              { ok: true, text: "Site crawling" },
              { ok: false, text: "Auto-generate on publish" },
              { ok: false, text: "Bulk site optimisation" },
              { ok: false, text: "Background monitoring" },
            ]}/>
            <PlanColumn title="Pro" subtitle="$9 / month" features={[
              { ok: true, text: "Unlimited AI generations", strong: true },
              { ok: true, text: "Never worry about missing meta again", strong: true },
              { ok: true, text: "Optimise your entire site in minutes", strong: true },
              { ok: true, text: "We monitor your site automatically", strong: true },
              { ok: true, text: "See your site improving every week" },
              { ok: true, text: "Works across multiple sites" },
            ]} highlight/>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "16px 32px 28px" }}>
          <Button variant="pro" size="lg" full icon="crown" onClick={onUpgrade}>Start 14-day Pro trial · $9/mo after</Button>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11}/> No credit card today</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11}/> Cancel anytime</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11}/> Keep all generated meta</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const PlanColumn = ({ title, subtitle, features, highlight }) => (
  <div style={{
    padding: "16px 18px",
    border: `1px solid ${highlight ? "var(--primary)" : "var(--border)"}`,
    background: highlight ? "var(--surface)" : "var(--surface-2)",
    borderRadius: "var(--r-md)",
    boxShadow: highlight ? "0 4px 12px rgba(37,99,235,0.14)" : "none",
    position: "relative",
  }}>
    {highlight && <div style={{ position: "absolute", top: -10, right: 12, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, letterSpacing: "0.04em" }}>RECOMMENDED</div>}
    <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, marginBottom: 12 }}>{subtitle}</div>
    {features.map((f, i) => (
      <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", alignItems: "center" }}>
        <Icon name={f.ok ? "check" : "x"} size={13} strokeWidth={2.5} style={{ color: f.ok ? "var(--ok-ink)" : "var(--text-3)", opacity: f.ok ? 1 : 0.5 }}/>
        <span style={{
          fontSize: 12.5, color: f.ok ? "var(--text)" : "var(--text-3)",
          opacity: f.ok ? 1 : 0.7,
          fontWeight: f.strong ? 600 : 400,
        }}>{f.text}</span>
      </div>
    ))}
  </div>
);

/* ========== Toast / Notification ========== */
const Toast = ({ message, sub, onDismiss, action, icon = "check", tone = "ok" }) => {
  React.useEffect(() => { const t = setTimeout(onDismiss, 6000); return () => clearTimeout(t); }, []);
  const tones = {
    ok: { bg: "var(--text)", fg: "#fff", icon: "var(--ok)" },
    warn: { bg: "var(--warn-soft)", fg: "var(--warn-ink)", icon: "var(--warn-ink)" },
  };
  const t = tones[tone];
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1500,
      background: t.bg, color: t.fg,
      padding: "12px 14px 12px 16px",
      borderRadius: "var(--r-md)",
      boxShadow: "var(--shadow-lg)",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 13, fontWeight: 500,
      animation: "slideUp .25s cubic-bezier(.2,.8,.2,1)",
      maxWidth: 480,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 999,
        background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: t.icon,
      }}><Icon name={icon} size={15}/></div>
      <div style={{ flex: 1 }}>
        <div>{message}</div>
        {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
          padding: "5px 10px", borderRadius: "var(--r-sm)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>{action.label}</button>
      )}
      <button onClick={onDismiss} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
        <Icon name="x" size={14}/>
      </button>
    </div>
  );
};

/* ========== Help & docs ========== */
const HelpModal = ({ open, onClose }) => {
  const [query, setQuery] = React.useState("");

  const topics = [
    { icon: "sparkles", title: "Getting started",         desc: "Connect your site, run your first pass, and turn on Autopilot." },
    { icon: "zap",      title: "How Autopilot works",     desc: "What BeepBeep AI does in the background and how to control it." },
    { icon: "shield",   title: "Writing better title & meta", desc: "Tone presets, length controls, and SEO best practice." },
    { icon: "crown",    title: "Plans & billing",         desc: "Free vs Pro, switching plans, invoices and refunds." },
    { icon: "settings", title: "Troubleshooting",         desc: "Connection issues, missing pages, regenerating title & meta." },
    { icon: "mail",     title: "Contact support",         desc: "Get a human within one business day." },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q ? topics.filter(t => (t.title + " " + t.desc).toLowerCase().includes(q)) : topics;

  const shortcuts = [
    { keys: ["G"],            label: "Start today's pass" },
    { keys: ["⌘", "K"],       label: "Open command bar" },
    { keys: ["⌘", "/"],       label: "Open help" },
    { keys: ["Esc"],          label: "Close modal / drawer" },
  ];

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div style={{ position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 14, right: 14,
          background: "var(--bg-sunken)", border: "1px solid var(--border)",
          borderRadius: 999, width: 30, height: 30,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-2)", zIndex: 2,
        }}><Icon name="x" size={13}/></button>

        <div style={{ padding: "20px 24px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Help & docs</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", margin: 0 }}>How can we help?</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0", lineHeight: 1.5 }}>
            Search documentation, browse guides, or reach our support team directly.
          </p>

          <div style={{
            marginTop: 14,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
          }}>
            <Icon name="search" size={14} style={{ color: "var(--text-3)" }}/>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search help articles…"
              style={{
                flex: 1, border: 0, outline: 0, background: "transparent",
                fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)",
              }}/>
          </div>
        </div>

        <div style={{
          padding: "0 12px 8px",
          maxHeight: "50vh", overflowY: "auto",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px 12px", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
              No articles matched. Try contacting support.
            </div>
          ) : filtered.map((t, i) => (
            <button key={i} onClick={onClose} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              width: "100%",
              padding: "10px 12px",
              background: "transparent",
              border: 0,
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background .15s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "var(--primary-soft)", color: "var(--primary-ink)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={t.icon} size={14}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1, lineHeight: 1.45 }}>{t.desc}</div>
              </div>
              <Icon name="chevron-right" size={14} style={{ color: "var(--text-3)", marginTop: 7, flexShrink: 0 }}/>
            </button>
          ))}
        </div>

        <div style={{
          borderTop: "1px solid var(--hairline)",
          background: "var(--surface-2)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
          borderBottomLeftRadius: "var(--r-xl)", borderBottomRightRadius: "var(--r-xl)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "var(--text-3)", flexWrap: "wrap" }}>
            {shortcuts.map((s, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                {s.keys.map((k, j) => <KBD key={j}>{k}</KBD>)}
                <span style={{ color: "var(--text-3)" }}>{s.label}</span>
                {i < shortcuts.length - 1 && <span style={{ opacity: 0.5, marginLeft: 4 }}>·</span>}
              </span>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon="external" onClick={onClose}>Open docs site</Button>
        </div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Onboarding, GenerationDrawer, Paywall, Toast, Modal, HelpModal });
