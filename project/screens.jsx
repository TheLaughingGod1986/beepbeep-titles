/* Activity + Automation + Settings screens */

const ActivityScreen = ({ plan }) => {
  const monthData = generateMonthActivity();
  const weeklyTotal = monthData.slice(-7).reduce((a, b) => a + b.count, 0);
  const monthTotal = monthData.reduce((a, b) => a + b.count, 0);
  const activeDays = monthData.filter(d => d.count > 0).length;

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Activity</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Your optimisation activity</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>Track your progress, streaks, and history.</p>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatTile label="This week" value={weeklyTotal} unit="optimised" tone="ok" delta="+12%"/>
        <StatTile label="This month" value={monthTotal} unit="optimised" tone="primary" delta="+8%"/>
        <StatTile label="Active days" value={`${activeDays} / 30`} unit="this month" tone="neutral"/>
        <StatTile label="Avg / day" value={(monthTotal/30).toFixed(1)} unit="images" tone="neutral"/>
      </div>

      {/* Heatmap */}
      <Card padding={0}>
        <div style={{ padding: "20px 24px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Last 30 days</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Daily optimisation heatmap</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} style={{
                width: 14, height: 14, borderRadius: 3,
                background: l === 0 ? "var(--bg-sunken)" : `oklch(${0.92 - l*0.08} ${0.04 + l*0.025} 152)`,
                border: "1px solid var(--border)",
              }}/>
            ))}
            <span>More</span>
          </div>
        </div>
        <div style={{ padding: "8px 24px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(30, 1fr)", gap: 4 }}>
            {monthData.map((d, i) => {
              const intensity = d.count === 0 ? 0 : Math.min(4, Math.ceil(d.count / 1.5));
              return (
                <div key={i} title={`${d.date}: ${d.count} optimised`} style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  background: intensity === 0 ? "var(--bg-sunken)" : `oklch(${0.92 - intensity*0.08} ${0.04 + intensity*0.025} 152)`,
                  border: `1px solid ${d.isToday ? "var(--text)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: intensity >= 3 ? "#fff" : "var(--text-3)",
                  fontFamily: "var(--font-mono)", fontWeight: 600,
                }}>{d.count > 0 ? d.count : ""}</div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </Card>

      {/* Full event log */}
      <div style={{ marginTop: 16 }}>
        <Card padding={0}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Event log</div>
            <Button variant="ghost" size="sm" icon="external">Export CSV</Button>
          </div>
          <div>
            {generateEventLog().map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "12px 24px", borderTop: i ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", width: 100, flexShrink: 0 }}>{e.time}</span>
                <Pill tone={e.tone}>{e.kind}</Pill>
                <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{e.desc}</span>
                <span className="mono tnum" style={{ fontSize: 11, color: "var(--text-3)" }}>{e.actor}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, unit, tone, delta }) => {
  const toneColors = { ok: "var(--ok-ink)", primary: "var(--primary-ink)", warn: "var(--warn-ink)", neutral: "var(--text)" };
  return (
    <Card padding={20}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="mono tnum" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: toneColors[tone] }}>{value}</span>
        {delta && <span style={{ fontSize: 11, color: "var(--ok-ink)", fontWeight: 600 }}>{delta}</span>}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{unit}</div>
    </Card>
  );
};

function generateMonthActivity() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    let count;
    if (i > 22) count = 0;
    else if (i > 18) count = [12, 8, 0, 0][i % 4];
    else if (i > 5) count = Math.floor(Math.random() * 5);
    else count = [4, 3, 5, 2, 4, 0][i] || 3;
    days.push({
      date: date.toLocaleDateString(),
      count,
      isToday: i === 0,
    });
  }
  return days;
}

function generateEventLog() {
  return [
    { time: "Just now", kind: "Scan", tone: "ok", desc: "Library scan complete · 3 new images flagged", actor: "auto" },
    { time: "2m ago", kind: "Upload", tone: "warn", desc: "New image detected: /blog/seo-guide-feature.jpg", actor: "wp" },
    { time: "12m ago", kind: "Generate", tone: "primary", desc: "ALT generated: \"Step-by-step infographic comparing organic vs paid…\"", actor: "admin" },
    { time: "12m ago", kind: "Generate", tone: "primary", desc: "ALT generated: \"Founder Jane Doe in sunlit office holding mug\"", actor: "admin" },
    { time: "12m ago", kind: "Generate", tone: "primary", desc: "ALT generated: \"Overhead flat lay of espresso brewing equipment\"", actor: "admin" },
    { time: "Yesterday", kind: "Streak", tone: "warn", desc: "3-day optimisation streak unlocked", actor: "system" },
    { time: "Yesterday", kind: "Generate", tone: "primary", desc: "Optimised 5 images from queue", actor: "admin" },
    { time: "2 days ago", kind: "Scan", tone: "ok", desc: "Scheduled scan: 412 images verified", actor: "auto" },
    { time: "3 days ago", kind: "Quality", tone: "warn", desc: "12 ALT texts flagged as low quality (under 5 words)", actor: "system" },
  ];
}

/* AutomationScreen and SettingsScreen now live in autopilot.jsx + settings.jsx */

Object.assign(window, { ActivityScreen });
