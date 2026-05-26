/* nAi Dashboard — daily image accessibility & coverage assistant
   Refactor: one dominant workflow, calmer hierarchy, single primary CTA. */

const Dashboard = ({ state, plan, autoOptimise, onAutoToggle, onGenerate, onUpgrade, onView, lastVisit, streak }) => {
  // state: "fresh" | "mid" | "near"
  const data = {
    fresh: { total: 412, optimised: 28, needsAlt: 384, lowQuality: 0, newSinceVisit: 0, coverage: 7 },
    mid:   { total: 412, optimised: 247, needsAlt: 142, lowQuality: 23, newSinceVisit: 3, coverage: 60 },
    near:  { total: 412, optimised: 389, needsAlt: 11, lowQuality: 12, newSinceVisit: 3, coverage: 94 },
  }[state];

  const dailyUsed    = { fresh: 0, mid: 3, near: 1 }[state];
  const monthlyUsed  = { fresh: 0, mid: 27, near: 41 }[state];
  const dailyLimit   = plan === "pro" ? 200 : 5;
  const monthlyLimit = plan === "pro" ? 1000 : 50;
  const dailyRemaining = dailyLimit - dailyUsed;

  // Coverage tone for ring — low scores use a calm, neutral 'primary' tone
  // rather than 'danger'. Users early in their journey should feel
  // momentum, not shame.
  const coverageTone = data.coverage >= 90 ? "ok" : data.coverage >= 50 ? "warn" : "primary";

  // Encouraging stage label — replaces harsh red 'low score' framing.
  const stageLabel =
    data.coverage >= 90 ? "Healthy coverage"
    : data.coverage >= 50 ? "Coverage building"
    : data.coverage >= 15 ? "Early optimisation stage"
    : "Getting started";

  // Time-saved estimate: ~55s of manual editing per generated image (research, type, save).
  // Lightweight, frontend-only — preserves no backend coupling.
  const totalGenerated = data.optimised;
  const minutesSavedTotal = Math.round((totalGenerated * 55) / 60);
  const hoursSavedTotal = (minutesSavedTotal / 60).toFixed(1);

  // Milestone logic — next 15-point rung, capped at 100
  const nextMilestone = Math.min(100, Math.ceil((data.coverage + 1) / 15) * 15);

  // Forward-looking 'steady improvement' projection. Assumes ~5 images/day
  // at the current pace closes ~1.2 coverage points/day; we round to weeks
  // and target 75% as a tangible mid-term horizon.
  const projectionTarget = data.coverage >= 75 ? 95 : 75;
  const pointsPerWeek = 8.4; // ~1.2/day * 7 — calm, realistic figure
  const weeksToTarget = Math.max(1, Math.round((projectionTarget - data.coverage) / pointsPerWeek));

  return (
    <div style={{ padding: "24px 32px 48px", maxWidth: 1180, margin: "0 auto" }}>
      {/* HERO — Today's Pass is the immediate focal point. */}
      <TodaysPassHero
        data={data}
        plan={plan}
        dailyUsed={dailyUsed}
        dailyLimit={dailyLimit}
        dailyRemaining={dailyRemaining}
        onGenerate={onGenerate}
        onUpgrade={onUpgrade}
      />

      {/* Secondary row: progress narrative + workflow upgrade.
          alignItems:stretch keeps both cards the same height for paired symmetry. */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14, marginTop: 20, alignItems: "stretch" }}>
        <LibraryHealthCard
          coverage={data.coverage}
          tone={coverageTone}
          stageLabel={stageLabel}
          nextMilestone={nextMilestone}
          hoursSaved={hoursSavedTotal}
          totalGenerated={totalGenerated}
          projectionTarget={projectionTarget}
          weeksToTarget={weeksToTarget}
        />
        {plan === "free"
          ? <AutopilotUpsellCard onUpgrade={onUpgrade}/>
          : <AutopilotActiveCard autoOptimise={autoOptimise} onToggle={onAutoToggle}/>}
      </div>

      {/* Library coverage — reinforces overall progress momentum */}
      <LibraryCoverageCard data={data}/>

      {/* Tertiary — very quiet activity strip (2 events only) */}
      <ActivityStrip onView={onView}/>

      {/* Footer metrics — renamed labels */}
      <FooterMetrics
        streak={streak}
        dailyUsed={dailyUsed}
        dailyLimit={dailyLimit}
        monthlyUsed={monthlyUsed}
        monthlyLimit={monthlyLimit}
        plan={plan}
        onUpgrade={onUpgrade}
      />
    </div>
  );
};

/* ----------------------------------------------------------------
   useCountUp — smooth count-up for hero metrics.
   Respects prefers-reduced-motion.
   ---------------------------------------------------------------- */
const useCountUp = (target, { duration = 900, decimals = 0 } = {}) => {
  const [value, setValue] = React.useState(target);
  const startRef = React.useRef({ from: target, to: target, t0: 0 });
  React.useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setValue(target); return; }
    const from = startRef.current.to;
    if (from === target) return;
    startRef.current = { from, to: target, t0: performance.now() };
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current.t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = startRef.current.from + (startRef.current.to - startRef.current.from) * eased;
      setValue(decimals ? +v.toFixed(decimals) : Math.round(v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, duration, decimals]);
  return value;
};

/* ----------------------------------------------------------------
   HERO — Today's Pass.
   Merged greeting banner + queue card. Entire card is clickable.
   Single primary CTA. Quota text becomes a quiet footer line.
   ---------------------------------------------------------------- */
const TodaysPassHero = ({ data, plan, dailyUsed, dailyLimit, dailyRemaining, onGenerate, onUpgrade }) => {
  // Each image carries an "intelligence signal" — why it was picked.
  // Tone hierarchy:
  //   warn      = actionable (Missing ALT, Needs review)
  //   neutral   = informational context (Homepage, High traffic, Product)
  const queueImages = [
    { name: "hero-spring-collection.jpg", page: "Home",    hue: 30,  signal: "Homepage",     tone: "neutral" },
    { name: "team-portrait-2026.jpg",     page: "About",   hue: 220, signal: "Missing ALT",  tone: "danger" },
    { name: "blog-cover-seo-guide.png",   page: "Blog",    hue: 145, signal: "High traffic", tone: "neutral" },
    { name: "product-shot-coffee-04.jpg", page: "Shop",    hue: 60,  signal: "Product",      tone: "neutral" },
    { name: "testimonial-jane-d.jpg",     page: "Reviews", hue: 280, signal: "Needs review", tone: "warn" },
  ];
  const queueCount = Math.min(dailyRemaining, data.needsAlt, 5);
  const showQueue = queueCount > 0;
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const handleActivate = () => {
    if (!showQueue) return;
    onGenerate();
  };
  const handleKey = (e) => {
    if (!showQueue) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onGenerate();
    }
  };

  // Subtle hover lift only when interactive
  const interactive = showQueue;
  const baseShadow = "var(--shadow-sm)";
  const hoverShadow = "var(--shadow-md)";

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-label={interactive ? `Start today's pass — ${queueCount} images ready` : undefined}
      onClick={interactive ? handleActivate : undefined}
      onKeyDown={handleKey}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => interactive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: interactive && hover ? hoverShadow : baseShadow,
        borderColor: interactive && hover ? "var(--border-strong)" : "var(--border)",
        transform: pressed ? "scale(0.998)" : "scale(1)",
        transition: "box-shadow .18s ease, border-color .18s ease, transform .08s ease",
        cursor: interactive ? "pointer" : "default",
        overflow: "hidden",
        outline: "none",
      }}
    >
      {/* Header row */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4, whiteSpace: "nowrap" }}>
            <Icon name="zap" size={13} style={{ color: "var(--primary)" }}/>
            <span style={{ fontSize: 11, color: "var(--primary-ink)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Today's pass</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
            {showQueue
              ? <>{data.newSinceVisit > 0
                    ? <><span className="mono tnum">{data.newSinceVisit}</span> new image{data.newSinceVisit === 1 ? "" : "s"} detected since your last scan</>
                    : <><span className="mono tnum">{queueCount}</span> images ready for today's pass</>}</>
              : <>Today's pass complete</>}
          </div>
        </div>
      </div>

      {/* Image cards row */}
      {showQueue ? (
        <div style={{
          padding: "12px 20px 0",
          display: "grid",
          gridTemplateColumns: `repeat(${queueCount}, minmax(0, 1fr))`,
          gap: 8,
        }}>
          {queueImages.slice(0, queueCount).map((img, i) => (
            <div key={i} style={{
              padding: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-md)",
              display: "flex", alignItems: "center", gap: 10,
              minWidth: 0,
              transition: "background .15s ease, border-color .15s ease",
            }}>
              <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                <Thumb label={`#${i+1}`} size={"100%"} hue={img.hue}/>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
                <div style={{ marginTop: 3 }}>
                  <SignalChip tone={img.tone}>{img.signal}</SignalChip>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "10px 20px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px",
            background: "var(--ok-soft)", border: "1px solid var(--ok-border)", borderRadius: "var(--r-md)",
          }}>
            <Icon name="check" size={16} style={{ color: "var(--ok-ink)" }}/>
            <div style={{ flex: 1, fontSize: 13, color: "var(--ok-ink)", lineHeight: 1.45 }}>
              {plan === "pro"
                ? <><strong style={{ fontWeight: 600 }}>Optimisation complete.</strong> Autopilot is monitoring new uploads in the background.</>
                : <><strong style={{ fontWeight: 600 }}>Daily goal complete.</strong> Next pass unlocks in 8h 14m.</>}
            </div>
          </div>
        </div>
      )}

      {/* CTA + status footer — Pro: automation framing; Free: quota framing. */}
      <div style={{
        padding: "12px 20px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div className="tnum" style={{ fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {plan === "pro" ? (
            showQueue ? (
              <>
                <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--ok)" }}/>
                <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                  Autopilot active
                </span>
                <span>· <span className="mono tnum">{dailyUsed}</span> images improved today</span>
              </>
            ) : (
              <>
                <Icon name="check" size={12} style={{ color: "var(--ok-ink)" }} strokeWidth={2.6}/>
                <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                  <span className="mono tnum">{dailyUsed}</span> images improved today
                </span>
                <span>· continuous optimisation enabled</span>
              </>
            )
          ) : showQueue ? (
            <>
              <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                <span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> today's free generations
              </span>
              <span>· refreshes in 8h 14m</span>
            </>
          ) : (
            <>
              <Icon name="check" size={12} style={{ color: "var(--ok-ink)" }} strokeWidth={2.6}/>
              <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                <span className="mono">{dailyLimit}</span> of <span className="mono">{dailyLimit}</span> completed today
              </span>
              <span>· next pass in 8h 14m</span>
            </>
          )}
        </div>
        {/* Nested button — stop bubbling so card click doesn't double-fire */}
        <div onClick={(e) => e.stopPropagation()}>
          {showQueue ? (
            <Button variant="primary" size="lg" icon="sparkles" onClick={onGenerate}>
              {plan === "pro" ? "Run optimisation pass" : "Start today's pass"}
            </Button>
          ) : plan === "free" ? (
            <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Lift the daily allowance</Button>
          ) : (
            <Button variant="secondary" size="md" disabled>All caught up</Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* Subtle intelligence chip on image queue cards.
   warn   = actionable (slightly stronger; leading dot reinforces urgency)
   neutral= informational (muted, low contrast) */
const SignalChip = ({ tone = "neutral", children }) => {
  const tones = {
    primary: { bg: "var(--primary-soft)", fg: "var(--primary-ink)", bd: "var(--primary-border)", dot: null },
    warn:    { bg: "var(--warn-soft)",    fg: "var(--warn-ink)",    bd: "var(--warn-border)",    dot: "var(--warn)" },
    danger:  { bg: "var(--danger-soft)",  fg: "var(--danger-ink)",  bd: "var(--danger-border)",  dot: "var(--danger)" },
    neutral: { bg: "var(--bg-sunken)",    fg: "var(--text-3)",      bd: "var(--hairline)",       dot: null },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      borderRadius: 999,
      padding: "1px 7px",
      fontSize: 10.5, fontWeight: (tone === "warn" || tone === "danger") ? 600 : 500, lineHeight: 1.5,
      letterSpacing: "-0.005em",
      whiteSpace: "nowrap",
      maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
    }}>
      {t.dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: t.dot, flexShrink: 0 }}/>}
      {children}
    </span>
  );
};

/* ----------------------------------------------------------------
   Library health — calm progress card.
   Score, weekly delta, next milestone, steady-improvement insight,
   and a quiet 'work saved' footer. Outcome-focused, not analytical.
   ---------------------------------------------------------------- */
const LibraryHealthCard = ({ coverage, tone, stageLabel, nextMilestone, hoursSaved, totalGenerated, projectionTarget, weeksToTarget }) => {
  const distance = Math.max(0, nextMilestone - coverage);
  const animCoverage = useCountUp(coverage);
  const animHours = useCountUp(parseFloat(hoursSaved), { decimals: 1 });

  // Stage label retained for screen-reader / aria context but no longer rendered
  // as a chip — the card narrative already communicates progress without it.
  return (
    <Card padding={0} style={{ display: "flex", flexDirection: "column" }}>
      {/* Top row — ring + headline */}
      <div style={{ padding: "14px 18px 12px", display: "flex", gap: 14, alignItems: "center" }}>
        <Ring value={animCoverage} size={56} stroke={5} tone={tone}>
          <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>{animCoverage}</div>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }} aria-label={stageLabel}>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Library health</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{animCoverage}</span>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>/ 100</span>
            <span style={{ fontSize: 12, color: "var(--ok-ink)", fontWeight: 600, marginLeft: 2, whiteSpace: "nowrap" }}>+12 this week</span>
          </div>
          {distance > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              Next milestone <span className="mono tnum" style={{ color: "var(--text)", fontWeight: 600 }}>{nextMilestone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Steady improvement — calm progress insight (not analytics).
          The tiny dot pulses gently — the one ambient 'alive' behavior on the dashboard.
          Respects prefers-reduced-motion via .ambient-pulse keyframes. */}
      <div style={{
        padding: "12px 18px 14px",
        borderTop: "1px solid var(--hairline)",
        flex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 4,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="ambient-pulse" style={{
            width: 6, height: 6, borderRadius: 999,
            background: "var(--ok-ink)", flexShrink: 0,
          }}/>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.005em" }}>
            Steady improvement
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, paddingLeft: 12 }}>
          At your current pace, your library could reach{" "}
          <span className="mono tnum" style={{ color: "var(--text)", fontWeight: 600 }}>{projectionTarget}%</span>{" "}
          coverage in around{" "}
          <span className="mono tnum" style={{ color: "var(--text)", fontWeight: 600 }}>{weeksToTarget}</span>{" "}
          week{weeksToTarget === 1 ? "" : "s"}.
        </div>
      </div>

      {/* Work saved — supportive secondary line, softer weight + contrast */}
      <div style={{
        borderTop: "1px solid var(--hairline)",
        padding: "9px 18px",
        background: "var(--surface-2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Work saved</div>
        <div className="tnum" style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400, whiteSpace: "nowrap" }}>
          ~<span className="mono" style={{ fontWeight: 500, color: "var(--text-2)" }}>{animHours.toFixed(1)}</span> hours saved
          <span style={{ color: "var(--text-3)", margin: "0 6px", opacity: 0.6 }}>·</span>
          <span className="mono" style={{ fontWeight: 500, color: "var(--text-2)" }}>{totalGenerated}</span> images improved
        </div>
      </div>
    </Card>
  );
};

/* ----------------------------------------------------------------
   Library coverage — calm progress module. Compact full-width strip
   that reinforces "you're making progress" without adding analytics noise.
   ---------------------------------------------------------------- */
const LibraryCoverageCard = ({ data }) => {
  const optimised = data.optimised;
  const remaining = data.total - data.optimised;
  const pct = Math.round((optimised / data.total) * 100);
  // Coverage tone — completion is success-green; in-progress reads as a calm
  // primary/info blue so building coverage never feels like an alert.
  const tone = pct >= 90 ? "ok" : "primary";
  return (
    <Card padding={0} style={{ marginTop: 20 }}>
      <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Library coverage</span>
            <span className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{pct}%</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>optimised</span>
          </div>
          <div className="tnum" style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            <span className="mono" style={{ color: "var(--text-2)", fontWeight: 500 }}>{optimised}</span> improved
            <span> · </span>
            <span className="mono" style={{ color: "var(--text-2)", fontWeight: 500 }}>{remaining}</span> remaining
          </div>
        </div>
        <Progress value={optimised} max={data.total} tone={tone} height={6}/>
      </div>
    </Card>
  );
};

/* ----------------------------------------------------------------
   Autopilot — workflow upgrade framing (not a sales banner)
   ---------------------------------------------------------------- */
const AutopilotUpsellCard = ({ onUpgrade }) => (
  <Card padding={0}>
    <div style={{ padding: "18px 22px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Autopilot</div>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
        Automatically optimise new uploads in the background.
      </div>
    </div>
    <div style={{ padding: "2px 22px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      {[
        "New uploads covered instantly",
        "Weekly progress summary",
        "WooCommerce support",
      ].map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
          <Icon name="check" size={13} style={{ color: "var(--ok-ink)", flexShrink: 0 }} strokeWidth={2.4}/>
          <span>{t}</span>
        </div>
      ))}
    </div>
    <div style={{ padding: "0 22px 18px" }}>
      <Button variant="pro" size="md" full onClick={onUpgrade}>Enable Autopilot</Button>
    </div>
  </Card>
);

const AutopilotActiveCard = ({ autoOptimise, onToggle }) => (
  <Card padding={0}>
    <div style={{ padding: "18px 22px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Autopilot</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {autoOptimise ? "Running in the background." : "Paused."}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>
          {autoOptimise
            ? "New uploads get ALT text the moment they're added."
            : "Re-enable to keep new uploads covered automatically."}
        </div>
      </div>
      <SmallToggle on={autoOptimise} onChange={() => onToggle(!autoOptimise)}/>
    </div>
    <div style={{ padding: "10px 22px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
      {[
        { label: "New uploads covered instantly", on: autoOptimise },
        { label: "Weekly progress summary", on: true },
        { label: "WooCommerce support", on: true },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: r.on ? "var(--text)" : "var(--text-3)" }}>
          <Icon name="check" size={13} style={{ color: r.on ? "var(--ok-ink)" : "var(--text-3)", flexShrink: 0 }} strokeWidth={2.4}/>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  </Card>
);

const SmallToggle = ({ on, onChange, disabled }) => (
  <button onClick={onChange} disabled={disabled} style={{
    width: 34, height: 20, borderRadius: 999,
    background: on ? "var(--primary)" : "var(--bg-sunken)",
    border: `1px solid ${on ? "var(--primary)" : "var(--border-strong)"}`,
    position: "relative", cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .15s, border-color .15s",
    padding: 0, flexShrink: 0,
  }}>
    <span style={{
      position: "absolute", top: 2, left: on ? 16 : 2,
      width: 14, height: 14, borderRadius: 999,
      background: "#fff", transition: "left .15s ease",
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}/>
  </button>
);

/* ----------------------------------------------------------------
   Activity — quieter, ~35% shorter, secondary
   ---------------------------------------------------------------- */
/* ----------------------------------------------------------------
   Latest improvements — quiet 2-item momentum strip. Forward-looking
   progress framing, no log/system tone. No "See all" — Activity is
   intentionally not a primary surface in the simplified IA.
   ---------------------------------------------------------------- */
const ActivityStrip = ({ onView }) => {
  // Only the two most recent items keep this section from dominating Home.
  // Tone: positive progress, not system log.
  const events = [
    { time: "2m ago",     icon: "upload",   tone: "warn",    text: "3 new uploads detected in /blog",                action: "Review", onAction: () => onView && onView("library") },
    { time: "Yesterday",  icon: "sparkles", tone: "primary", text: "5 images improved · coverage increased by 12%",  action: null },
  ];
  return (
    <div style={{
      marginTop: 22,
      borderTop: "1px solid var(--hairline)",
      paddingTop: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Latest improvements</span>
      </div>
      <div>
        {events.map((e, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "4px 0",
            borderTop: i ? "1px solid var(--hairline)" : "none",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: 999,
              background: e.tone === "ok" ? "var(--ok-soft)" : e.tone === "warn" ? "var(--warn-soft)" : "var(--primary-soft)",
              color:      e.tone === "ok" ? "var(--ok-ink)"  : e.tone === "warn" ? "var(--warn-ink)"  : "var(--primary-ink)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={e.icon} size={9} strokeWidth={2.4}/>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--text-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{e.time}</span>
            {e.action && (
              <button onClick={e.onAction} style={{
                background: "transparent", border: "none", padding: "2px 4px",
                fontSize: 12, color: "var(--text-2)", fontWeight: 600, cursor: "pointer",
                borderRadius: 4,
                transition: "color .18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={ev => ev.currentTarget.style.color = "var(--text)"}
              onMouseLeave={ev => ev.currentTarget.style.color = "var(--text-2)"}
              >{e.action}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   Footer metrics — Free shows quota framing; Pro shows automation
   stats (no daily/monthly counters, no refill timers).
   ---------------------------------------------------------------- */
const FooterMetrics = ({ streak, dailyUsed, dailyLimit, monthlyUsed, monthlyLimit, plan }) => {
  const Item = ({ label, value }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value}</div>
    </div>
  );
  const dailyExhausted = plan === "free" && dailyUsed >= dailyLimit;

  if (plan === "pro") {
    return (
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 4px 4px", gap: 40, flexWrap: "wrap",
        borderTop: "1px solid var(--hairline)", marginTop: 20,
      }}>
        <Item label="Editing streak" value={<><span className="mono tnum">{streak}</span>-day streak · <span style={{ color: "var(--text-3)" }}>12 of last 14</span></>}/>
        <Item label="Improvements this week" value={<><span className="mono tnum">{monthlyUsed}</span> images · <span style={{ color: "var(--text-3)" }}>+18% vs last week</span></>}/>
        <Item label="Autopilot" value={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--ok)" }}/>
            Active · <span style={{ color: "var(--text-3)" }}>monitoring new uploads</span>
          </span>
        }/>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "14px 4px 4px", gap: 40, flexWrap: "wrap",
      borderTop: "1px solid var(--hairline)", marginTop: 20,
    }}>
      <Item label="Editing streak" value={<><span className="mono tnum">{streak}</span>-day streak · <span style={{ color: "var(--text-3)" }}>12 of last 14</span></>}/>
      <Item label="Daily allowance"    value={
        dailyExhausted
          ? <><span className="mono tnum">{dailyLimit}</span> of <span className="mono tnum">{dailyLimit}</span> completed · <span style={{ color: "var(--text-3)" }}>next pass in 8h</span></>
          : <><span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> · <span style={{ color: "var(--text-3)" }}>refills in 8h</span></>
      }/>
      <Item label="Monthly usage"  value={<><span className="mono tnum">{monthlyUsed}</span> of <span className="mono tnum">{monthlyLimit}</span> · <span style={{ color: "var(--text-3)" }}>resets in 4d</span></>}/>
    </div>
  );
};

Object.assign(window, { Dashboard });
