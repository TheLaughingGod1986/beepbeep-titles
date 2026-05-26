/* BeepBeep AI — Settings screen
   The boring-but-necessary stuff: plan, account, notifications, advanced, danger.
   Designed to feel light and quick to scan — every section earns its place. */

const SettingsScreen = ({ plan, onUpgrade }) => {
  const isPro = plan === "pro";
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [notifFresh, setNotifFresh] = React.useState(true);
  const [notifDigest, setNotifDigest] = React.useState(isPro);
  const [notifLimit, setNotifLimit] = React.useState(true);
  const [uninstallData, setUninstallData] = React.useState(false);

  // Mock usage figures — would come from billing API.
  const used = isPro ? 487 : 6;
  const limit = isPro ? 1000 : 50;
  const pct = (used / limit) * 100;
  const resetDate = "June 1, 2026";

  return (
    <div data-screen-label="Settings" style={{ padding: "24px 32px 56px", maxWidth: 880, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Settings</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>Plan & preferences</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0", lineHeight: 1.5 }}>Manage your account, notifications, and advanced options.</p>
      </div>

      {/* PLAN & BILLING — hero card */}
      <PlanCard isPro={isPro} used={used} limit={limit} pct={pct} resetDate={resetDate} onUpgrade={onUpgrade}/>

      {/* ACCOUNT */}
      <SettingsSection title="Account" eyebrow="Sign-in">
        <SettingsRow
          label="Email"
          desc="The address connected to your BeepBeep AI account."
          right={<span className="mono" style={{ fontSize: 13, color: "var(--text-2)" }}>alex@yoursite.com</span>}
        />
        <SettingsRow
          label="Connection"
          desc="Last successful sync with BeepBeep AI servers."
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pill tone="ok"><span className="pulse-dot" style={{ width: 6, height: 6 }}/> Connected</Pill>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>2 min ago</span>
            </div>
          }
          last
        />
      </SettingsSection>

      {/* NOTIFICATIONS */}
      <SettingsSection title="Notifications" eyebrow="Email & in-app">
        <SettingsRow
          label="New upload alerts"
          desc="In-app banner when fresh uploads need attention."
          right={<Toggle on={notifFresh} onChange={setNotifFresh}/>}
        />
        <SettingsRow
          label="Weekly digest"
          desc={isPro ? "Sunday email with coverage + activity summary." : "Pro · Sunday email with coverage + activity summary."}
          right={
            <Toggle
              on={notifDigest && isPro}
              disabled={!isPro}
              onChange={(v) => isPro ? setNotifDigest(v) : onUpgrade()}/>
          }
        />
        <SettingsRow
          label="Quota warnings"
          desc="Email me when I'm close to my monthly credit limit."
          right={<Toggle on={notifLimit} onChange={setNotifLimit}/>}
          last
        />
      </SettingsSection>

      {/* ADVANCED — disclosure */}
      <Card padding={0} style={{ marginBottom: 12 }}>
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          style={{
            width: "100%", padding: "13px 20px",
            display: "flex", alignItems: "center", gap: 12,
            background: "transparent", border: 0,
            cursor: "pointer", textAlign: "left",
            borderRadius: "var(--r-lg)",
          }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Advanced</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>Debug & system info</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>For troubleshooting and support. Most users never need to open this.</div>
          </div>
          <Icon name={advancedOpen ? "chevron-down" : "chevron-right"} size={16} style={{ color: "var(--text-3)" }}/>
        </button>

        {advancedOpen && <AdvancedPanel/>}
      </Card>

      {/* DANGER ZONE */}
      <SettingsSection title="Danger zone" eyebrow="Destructive" tone="danger">
        <SettingsRow
          label="Reset generated ALT text"
          desc="Clear all BeepBeep AI-generated ALT from your library. This cannot be undone."
          right={<Button variant="secondary" size="sm">Reset…</Button>}
        />
        <SettingsRow
          label="Delete data on uninstall"
          desc="Remove all BeepBeep AI settings and history when the plugin is uninstalled."
          right={<Toggle on={uninstallData} onChange={setUninstallData}/>}
          last
        />
      </SettingsSection>
    </div>
  );
};

/* ── Plan / billing hero ────────────────────────────────────────── */

const PlanCard = ({ isPro, used, limit, pct, resetDate, onUpgrade }) => (
  <Card padding={0} style={{
    marginBottom: 18,
    overflow: "hidden",
    ...(isPro ? {
      background: "var(--primary-soft)",
      borderColor: "var(--primary-border)",
    } : {}),
  }}>
    <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: isPro ? "var(--primary)" : "var(--bg-sunken)",
        color: isPro ? "#fff" : "var(--text-2)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        border: isPro ? "none" : "1px solid var(--border)",
      }}>
        <Icon name={isPro ? "crown" : "shield"} size={18} strokeWidth={2}/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{isPro ? "BeepBeep AI Pro" : "Free plan"}</span>
          <Pill tone={isPro ? "primary" : "neutral"}>{isPro ? "Pro" : "Free"}</Pill>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>
          {isPro
            ? "Unlimited AI generations · no daily or monthly limits · automation & priority queue."
            : "5 AI generations per day · up to 50 per month · manual generation only."}
        </div>
      </div>

      {isPro
        ? <Button variant="secondary" size="sm" icon="external">Manage billing</Button>
        : <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Upgrade to Pro</Button>}
    </div>

    <div style={{
      borderTop: "1px solid var(--hairline)",
      padding: "12px 20px 14px",
      background: "var(--surface-2)",
    }}>
      {isPro ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, background: "var(--ok)" }}/>
            <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>Continuous optimisation enabled</span>
          </div>
          <div className="tnum" style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            <span className="mono" style={{ color: "var(--text-2)", fontWeight: 500 }}>{used}</span> images improved this cycle
            <span style={{ margin: "0 6px", opacity: 0.6 }}>·</span>
            <span>Renews {resetDate}</span>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>This billing cycle</span>
            <span className="mono tnum" style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" }}>
              {used} / {limit} AI generations used
            </span>
          </div>
          <Progress value={used} max={limit} tone={pct > 90 ? "danger" : pct > 75 ? "warn" : "primary"} height={5}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-3)" }}>
            <span className="mono">{(limit - used).toLocaleString()} remaining</span>
            <span className="mono">Resets {resetDate}</span>
          </div>
        </>
      )}
    </div>
  </Card>
);

/* ── Settings primitives ──────────────────────────────────────────── */

const SettingsSection = ({ title, eyebrow, tone, children }) => (
  <Card padding={0} style={{
    marginBottom: 12,
    ...(tone === "danger" ? { borderColor: "var(--border)" } : {}),
  }}>
    <div style={{
      padding: "12px 20px",
      borderBottom: "1px solid var(--hairline)",
    }}>
      {eyebrow && (
        <div style={{
          fontSize: 11, color: "var(--text-3)",
          fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 2,
        }}>{eyebrow}</div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: tone === "danger" ? "var(--text)" : "var(--text)", lineHeight: 1.25 }}>{title}</div>
    </div>
    <div>{children}</div>
  </Card>
);

const SettingsRow = ({ label, desc, right, last }) => (
  <div style={{
    padding: "12px 20px",
    display: "flex", alignItems: "center", gap: 16,
    borderBottom: last ? "none" : "1px solid var(--hairline)",
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
    </div>
    <div style={{ flexShrink: 0 }}>{right}</div>
  </div>
);

/* ── Advanced disclosure content ──────────────────────────────────── */

const AdvancedPanel = () => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fade-in" style={{ borderTop: "1px solid var(--hairline)" }}>
      {/* System info */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>System info</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px 24px" }}>
          <SysRow k="Plugin" v="BeepBeep AI 1.4.2"/>
          <SysRow k="WordPress" v="6.5.3"/>
          <SysRow k="PHP" v="8.2.18"/>
          <SysRow k="Theme" v="twentytwentyfour"/>
          <SysRow k="Site URL" v="yoursite.com"/>
          <SysRow k="Last error" v="None in 7d" tone="ok"/>
        </div>
      </div>

      <Divider/>

      {/* Debug actions */}
      <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>Diagnostic logs</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>
            Share these with support if something looks wrong.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="secondary" size="sm" icon={copied ? "check" : "external"} onClick={handleCopy}>
            {copied ? "Copied" : "Copy debug info"}
          </Button>
          <Button variant="ghost" size="sm">Export CSV</Button>
        </div>
      </div>

      <Divider/>

      {/* Recent events compact */}
      <div style={{ padding: "14px 20px 16px" }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Recent events</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {DEBUG_EVENTS.map((e, i) => <DebugEventRow key={i} {...e} last={i === DEBUG_EVENTS.length - 1}/>)}
        </div>
        <button style={{
          marginTop: 10,
          background: "transparent", border: 0, padding: 0,
          color: "var(--text-2)", fontSize: 12, fontWeight: 600,
          cursor: "pointer",
        }}>View full log →</button>
      </div>
    </div>
  );
};

const SysRow = ({ k, v, tone }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--hairline)" }}>
    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{k}</span>
    <span className="mono" style={{ fontSize: 12, color: tone === "ok" ? "var(--ok-ink)" : "var(--text-2)", fontWeight: 500 }}>{v}</span>
  </div>
);

const DebugEventRow = ({ time, level, msg, last }) => {
  const tones = { info: "neutral", debug: "neutral", warn: "warn", error: "danger" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "7px 2px",
      borderBottom: last ? "none" : "1px solid var(--hairline)",
    }}>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", width: 64, flexShrink: 0 }}>{time}</span>
      <Pill tone={tones[level]} style={{ fontSize: 10.5, padding: "1px 8px", minWidth: 52, textAlign: "center" }}>{level}</Pill>
      <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>
    </div>
  );
};

const DEBUG_EVENTS = [
  { time: "3:42 pm", level: "info",  msg: "Plugin initialised — 412 images indexed" },
  { time: "3:41 pm", level: "debug", msg: "API request started — POST /api/alt-text" },
  { time: "3:41 pm", level: "debug", msg: "API response received — 200 OK · 1,142ms" },
  { time: "1:18 pm", level: "info",  msg: "Scheduled scan complete — 0 issues" },
  { time: "Yesterday", level: "warn",  msg: "Quota warning — 85% of monthly credits used" },
];

Object.assign(window, { SettingsScreen });
