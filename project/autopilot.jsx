/* BeepBeep AI — Autopilot screen
   One job: configure how BeepBeep AI writes and when it runs.
   Hero status + generation prefs + live preview + scheduled work. */

const PRESETS = [
  {
    id: "descriptive",
    label: "Descriptive",
    desc: "Natural, neutral describing of what's in the image.",
    sample: "Wooden cafe table with a white ceramic mug holding a cappuccino, leaf-shaped foam art on top, soft morning light streaming in from the left window and a folded newspaper beside it.",
  },
  {
    id: "seo",
    label: "SEO-focused",
    desc: "Pulls in keywords from the page context where relevant.",
    sample: "Cappuccino latte art in a white ceramic mug, handcrafted by our downtown barista, served fresh each morning at our flagship coffee shop on Mission Street since 2018.",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    desc: "Product-first phrasing: material, colour, finish, key features.",
    sample: "Matte white 12oz ceramic cappuccino mug with hand-poured leaf-pattern foam art, sold separately from the saucer set, dishwasher and microwave safe, available in three sizes.",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    desc: "Optimised for screen readers — content first, no fluff.",
    sample: "A white ceramic mug containing a cappuccino with leaf-shaped foam latte art, resting on a wooden cafe table, with a folded newspaper and a small spoon placed beside it.",
  },
];

const LENGTHS = [
  { id: "short",  label: "Short",  range: "5–10 words" },
  { id: "medium", label: "Medium", range: "10–18 words" },
  { id: "long",   label: "Long",   range: "18–28 words" },
];

const trimToWords = (text, max) => {
  const words = text.split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ").replace(/[,.;:]$/, "") + "…";
};

const AutopilotScreen = ({ plan, autoOptimise, onAutoToggle, onUpgrade, onToast }) => {
  const isPro = plan === "pro";
  const [style, setStyle] = React.useState("descriptive");
  const [length, setLength] = React.useState("medium");
  const [instructions, setInstructions] = React.useState("");
  const [scanDaily, setScanDaily] = React.useState(isPro);
  const [weeklyDigest, setWeeklyDigest] = React.useState(isPro);
  const [driftAlerts, setDriftAlerts] = React.useState(false);

  const preset = PRESETS.find(p => p.id === style);
  const maxWords = length === "short" ? 10 : length === "medium" ? 18 : 28;
  const previewText = trimToWords(preset.sample, maxWords);

  return (
    <div data-screen-label="Autopilot" style={{ padding: "24px 32px 56px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Autopilot</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>Hands-off image SEO</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0", maxWidth: 560, lineHeight: 1.5 }}>
          Decide how BeepBeep AI writes ALT text — and let it run quietly in the background on every new upload.
        </p>
      </div>

      {/* HERO: master toggle */}
      <AutopilotHero
        isPro={isPro}
        on={isPro && autoOptimise}
        onToggle={() => isPro ? onAutoToggle(!autoOptimise) : onUpgrade()}
        onUpgrade={onUpgrade}
      />

      {/* HOW NAI WRITES */}
      <SectionTitle eyebrow="Generation" title="How BeepBeep AI writes" subtitle="These preferences apply to every image — manual and automated."/>

      <Card padding={0} style={{ marginBottom: 12 }}>
        <div style={{ padding: "16px 20px" }}>
          <Label>Description style</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8 }}>
            {PRESETS.map(p => (
              <PresetCard key={p.id} preset={p} active={style === p.id} onClick={() => setStyle(p.id)}/>
            ))}
          </div>
        </div>

        <Divider/>

        <div style={{ padding: "16px 20px" }}>
          <Label>Length</Label>
          <div style={{
            display: "flex", gap: 3, marginTop: 8,
            background: "var(--bg-sunken)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: 3,
          }}>
            {LENGTHS.map(l => {
              const isOn = length === l.id;
              return (
                <button key={l.id} onClick={() => setLength(l.id)}
                  style={{
                    flex: 1, padding: "7px 12px",
                    background: isOn ? "var(--surface)" : "transparent",
                    color: "var(--text)",
                    border: "1px solid",
                    borderColor: isOn ? "var(--border)" : "transparent",
                    borderRadius: 7,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all .15s ease",
                    boxShadow: isOn ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                  }}>
                  <div style={{ lineHeight: 1.2 }}>{l.label}</div>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginTop: 2 }}>{l.range}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Divider/>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <Label>Custom instructions <span style={{ color: "var(--text-3)", fontWeight: 400, marginLeft: 6 }}>Optional</span></Label>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{instructions.length}/280</span>
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value.slice(0, 280))}
            placeholder='e.g. "Mention our brand name when relevant, never use marketing fluff."'
            rows={3}
            style={{
              width: "100%", marginTop: 8,
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontSize: 13, fontFamily: "var(--font-sans)",
              color: "var(--text)",
              background: "var(--surface)",
              resize: "vertical",
              minHeight: 68,
              lineHeight: 1.5,
            }}/>
        </div>
      </Card>

      {/* LIVE PREVIEW */}
      <PreviewCard preset={preset} text={previewText} instructions={instructions}/>

      {/* SCHEDULED WORK (Pro) */}
      <SectionTitle eyebrow="Run on a schedule" title="Background work" subtitle="Optional Pro extras that keep your library healthy without you opening BeepBeep AI."/>

      <Card padding={0} style={{ marginBottom: 14 }}>
        <ScheduleRow
          icon="calendar"
          title="Daily library scan"
          desc="Sweep your media library every morning to catch missing or low-quality ALT text."
          on={isPro && scanDaily}
          locked={!isPro}
          onChange={() => {
            if (!isPro) return onUpgrade();
            const next = !scanDaily;
            setScanDaily(next);
            if (next && onToast) onToast({
              message: "Daily scan enabled",
              sub: "BeepBeep AI will sweep your library every morning at 6 am.",
              icon: "calendar", tone: "ok",
            });
          }}
        />
        <Divider/>
        <ScheduleRow
          icon="mail"
          title="Weekly digest email"
          desc="A Sunday health report: what was optimised, what needs review, coverage trend."
          on={isPro && weeklyDigest}
          locked={!isPro}
          onChange={() => {
            if (!isPro) return onUpgrade();
            const next = !weeklyDigest;
            setWeeklyDigest(next);
            if (next && onToast) onToast({
              message: "Weekly digest enabled",
              sub: "Next report lands Sunday at 9 am.",
              icon: "mail", tone: "ok",
            });
          }}
        />
        <Divider/>
        <ScheduleRow
          icon="bell"
          title="SEO drift alerts"
          desc="Notify when content updates make existing ALT text stale or off-topic."
          on={isPro && driftAlerts}
          locked={!isPro}
          onChange={() => {
            if (!isPro) return onUpgrade();
            const next = !driftAlerts;
            setDriftAlerts(next);
            if (next && onToast) onToast({
              message: "SEO drift alerts enabled",
              sub: "Sample alert: 3 images on /blog may be off-topic after recent edits.",
              icon: "bell", tone: "warn",
            });
          }}
        />
      </Card>

      {/* Save bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button variant="ghost" size="md">Reset defaults</Button>
        <Button variant="primary" size="md" icon="check">Save changes</Button>
      </div>
    </div>
  );
};

/* ── Hero ─────────────────────────────────────────────────────────── */

const AutopilotHero = ({ isPro, on, onToggle, onUpgrade }) => {
  if (!isPro) {
    return (
      <Card padding={0} style={{
        marginBottom: 22,
        background: "var(--primary-soft)",
        borderColor: "var(--primary-border)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "var(--primary)", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="crown" size={17} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Auto-optimise new uploads</span>
              <Pill tone="primary" icon="crown">Pro</Pill>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>
              Every image uploaded to your media library gets ALT text in seconds. Free users can still generate manually from the Library.
            </div>
          </div>
          <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Upgrade</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={0} style={{ marginBottom: 22, borderColor: on ? "var(--ok-border)" : "var(--border)" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: on ? "var(--ok-soft)" : "var(--bg-sunken)",
          color: on ? "var(--ok-ink)" : "var(--text-3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          border: `1px solid ${on ? "var(--ok-border)" : "var(--border)"}`,
        }}>
          <Icon name="zap" size={18} strokeWidth={2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Auto-optimise new uploads</span>
            {on
              ? <Pill tone="ok"><span className="pulse-dot" style={{ width: 6, height: 6 }}/> Running</Pill>
              : <Pill tone="neutral">Paused</Pill>}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>
            {on
              ? "BeepBeep AI will generate ALT text for every new image the moment it hits your media library."
              : "Turn this on so you never have to think about ALT text again."}
          </div>
        </div>
        <Toggle on={on} onChange={onToggle}/>
      </div>

      {on && (
        <div className="fade-in" style={{
          borderTop: "1px solid var(--hairline)",
          padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 24,
          background: "var(--surface-2)",
          fontSize: 12,
        }}>
          <HeroStat label="Optimised, last 24h" value="8 images"/>
          <HeroStat label="Avg generation time" value="3.2s"/>
          <HeroStat label="Last run" value="2 min ago"/>
        </div>
      )}
    </Card>
  );
};

const HeroStat = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>{label}</span>
    <span className="mono tnum" style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{value}</span>
  </div>
);

/* ── Section title ───────────────────────────────────────────────── */

const SectionTitle = ({ eyebrow, title, subtitle }) => (
  <div style={{ margin: "4px 0 10px" }}>
    <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{eyebrow}</div>
    <h2 style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.25 }}>{title}</h2>
    {subtitle && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{children}</div>
);

/* ── Preset cards ─────────────────────────────────────────────────── */

const PresetCard = ({ preset, active, onClick }) => (
  <button onClick={onClick} style={{
    textAlign: "left",
    padding: "12px 14px",
    background: active ? "var(--primary-soft)" : "var(--surface)",
    border: "1px solid",
    borderColor: active ? "var(--primary-border)" : "var(--border)",
    borderRadius: "var(--r-md)",
    cursor: "pointer",
    transition: "all .15s ease",
    position: "relative",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: `1.5px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
        background: active ? "var(--primary)" : "transparent",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {active && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }}/>}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--primary-ink)" : "var(--text)", whiteSpace: "nowrap", lineHeight: 1.2 }}>{preset.label}</span>
    </div>
    <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45, paddingLeft: 22 }}>{preset.desc}</div>
  </button>
);

/* ── Live preview ─────────────────────────────────────────────────── */

const PreviewCard = ({ preset, text, instructions }) => (
  <Card padding={0} style={{ marginBottom: 22, background: "var(--surface-2)" }}>
    <div style={{
      padding: "10px 20px",
      borderBottom: "1px solid var(--hairline)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
        <Icon name="eye" size={13} style={{ color: "var(--text-3)" }}/>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Live preview</span>
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{preset.label}</span>
    </div>
    <div style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
      <Thumb size={80} radius={8} hue={30} label="sample.jpg"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Generated ALT</div>
        <div key={preset.id + text} style={{
          fontSize: 13.5, lineHeight: 1.55, color: "var(--text)",
          background: "var(--surface)",
          padding: "11px 13px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          transition: "opacity .2s ease",
        }}>
          {text}
        </div>
        {instructions && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-3)", display: "flex", gap: 6, alignItems: "flex-start", lineHeight: 1.45 }}>
            <Icon name="info" size={12} style={{ marginTop: 2, flexShrink: 0 }}/>
            <span>Your instructions will be applied: <em style={{ color: "var(--text-2)" }}>"{instructions}"</em></span>
          </div>
        )}
      </div>
    </div>
  </Card>
);

/* ── Schedule row ────────────────────────────────────────────────── */

const ScheduleRow = ({ icon, title, desc, on, locked, onChange }) => (
  <div style={{ padding: "13px 20px", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: locked ? "transparent" : on ? "var(--ok-soft)" : "var(--bg-sunken)",
      color: locked ? "var(--text-3)" : on ? "var(--ok-ink)" : "var(--text-3)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      border: locked ? "1px solid var(--border)" : "none",
    }}>
      <Icon name={locked ? "lock" : icon} size={14}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: locked ? "var(--text-2)" : "var(--text)", lineHeight: 1.3 }}>{title}</span>
        {locked && <Pill tone="neutral">Pro</Pill>}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
    </div>
    <Toggle on={on} disabled={locked} onChange={onChange}/>
  </div>
);

Object.assign(window, { AutopilotScreen });
