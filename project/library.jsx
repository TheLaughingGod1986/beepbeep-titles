/* ALT Library — calm AI-assisted review surface.
   Refactor goals (per polish brief):
   - Sticky filter/search bar with backdrop blur, no clipping
   - Lighter row density: thumb → name → status → CTA priority
   - Contextual bulk mode (action bar only when rows selected)
   - Quieter upsell footer
   - Visual parity with dashboard tokens */

const ALTLibrary = ({ plan, dailyUsed, dailyLimit, onGenerate, onUpgrade, onBulkGenerate }) => {
  const [filter, setFilter] = React.useState("needs");
  const [selected, setSelected] = React.useState(new Set());
  const [search, setSearch] = React.useState("");
  const [stuck, setStuck] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // image being edited
  const [overrides, setOverrides] = React.useState({}); // id -> new alt text
  const [savedFlash, setSavedFlash] = React.useState(null); // recently-saved id for highlight
  const sentinelRef = React.useRef(null);

  const images = React.useMemo(() => generateMockLibrary(), []);
  const dailyRemaining = (plan === "pro" ? Infinity : dailyLimit) - dailyUsed;

  const filtered = images.filter(img => {
    if (filter === "needs" && img.status !== "missing") return false;
    if (filter === "low" && img.status !== "low") return false;
    if (filter === "ok" && img.status !== "ok") return false;
    if (filter === "new" && !img.isNew) return false;
    if (search && !img.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: images.length,
    needs: images.filter(i => i.status === "missing").length,
    low: images.filter(i => i.status === "low").length,
    ok: images.filter(i => i.status === "ok").length,
    new: images.filter(i => i.isNew).length,
  };

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const tryBulk = () => {
    const ids = Array.from(selected);
    if (plan === "free" && ids.length > dailyRemaining) {
      // Optimise what we can today; surface paywall for the overflow.
      const allowed = ids.slice(0, dailyRemaining);
      if (allowed.length > 0) onBulkGenerate(allowed);
      onUpgrade();
      return;
    }
    onBulkGenerate(ids);
  };

  // Sticky-state detection via IntersectionObserver on a 1px sentinel above
  // the toolbar. When the sentinel scrolls out of view, the toolbar is stuck.
  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "0px 0px 0px 0px", threshold: 1 }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, []);

  const overLimit = plan === "free" && selected.size > dailyRemaining;

  return (
    <div style={{ padding: "28px 32px 64px", maxWidth: 1280, margin: "0 auto" }}>
      {/* ROW 1 — title only. Bulk action is contextual, not always-on. */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Library</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Every image, all in one view</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>Review, optimise, and keep your media library covered.</p>
        </div>
        <Button variant="secondary" size="md" icon="refresh">Re-scan</Button>
      </div>

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }}/>

      {/* ROW 2 — sticky filter + search toolbar (sits below the nAi tab strip) */}
      <div style={{
        position: "sticky", top: 84, zIndex: 5,
        background: stuck ? "rgba(255,255,255,0.82)" : "transparent",
        backdropFilter: stuck ? "blur(10px) saturate(140%)" : "none",
        WebkitBackdropFilter: stuck ? "blur(10px) saturate(140%)" : "none",
        borderBottom: stuck ? "1px solid var(--hairline)" : "1px solid transparent",
        marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32,
        transition: "background .2s ease, border-color .2s ease, padding .2s ease",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          padding: stuck ? "10px 0" : "0 0 14px",
          transition: "padding .2s ease",
        }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { id: "needs", label: "Needs ALT",   count: counts.needs },
              { id: "low",   label: "Low quality", count: counts.low },
              { id: "new",   label: "New uploads", count: counts.new },
              { id: "ok",    label: "Optimised",   count: counts.ok },
              { id: "all",   label: "All images",  count: counts.all },
            ].map(f => {
              const active = filter === f.id;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 11px", borderRadius: "var(--r-pill)",
                  background: active ? "var(--text)" : "var(--surface)",
                  color: active ? "#fff" : "var(--text-2)",
                  border: `1px solid ${active ? "var(--text)" : "var(--hairline)"}`,
                  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  transition: "background .15s ease, color .15s ease, border-color .15s ease",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "var(--hairline)"; }}>
                  {f.label}
                  <span className="mono tnum" style={{
                    fontSize: 10.5,
                    background: active ? "rgba(255,255,255,0.16)" : "var(--bg-sunken)",
                    padding: "0 6px", borderRadius: 999, lineHeight: 1.5,
                    color: active ? "#fff" : "var(--text-3)",
                  }}>{f.count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <Icon name="search" size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search filenames" style={{
              background: "var(--surface)", border: "1px solid var(--hairline)",
              borderRadius: "var(--r-md)", padding: "6px 12px 6px 30px",
              fontSize: 12.5, fontFamily: "var(--font-sans)", color: "var(--text)",
              width: 220, outline: "none",
              transition: "border-color .15s ease",
            }}
            onFocus={e => e.target.style.borderColor = "var(--border-strong)"}
            onBlur={e => e.target.style.borderColor = "var(--hairline)"}/>
          </div>
        </div>
      </div>

      {/* Card-wrapped list */}
      <Card padding={0} style={{ marginTop: 14, overflow: "hidden" }}>
        {/* Compact column header — quiet, no heavy background */}
        <div style={{
          display: "grid", gridTemplateColumns: "32px 60px 1fr 130px 110px",
          padding: "10px 18px", gap: 14, alignItems: "center",
          borderBottom: "1px solid var(--hairline)",
          fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <Checkbox checked={selected.size === filtered.length && filtered.length > 0}
            indeterminate={selected.size > 0 && selected.size < filtered.length}
            onChange={toggleAll}/>
          <span></span>
          <span>Image</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}></span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 620, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "72px 20px", textAlign: "center", color: "var(--text-3)" }}>
              <div style={{
                width: 40, height: 40, margin: "0 auto 12px",
                background: "var(--ok-soft)", border: "1px solid var(--ok-border)",
                borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="check" size={20} style={{ color: "var(--ok-ink)" }}/>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>All caught up</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>No images match this filter.</div>
            </div>
          ) : filtered.map((img, i) => {
            const merged = { ...img, alt: overrides[img.id] ?? img.alt };
            return (
              <LibraryRow key={img.id} img={merged} selected={selected.has(img.id)} onToggle={() => toggle(img.id)}
                onGenerate={() => onGenerate(img)}
                onEdit={() => setEditing(merged)}
                justSaved={savedFlash === img.id}
                plan={plan} dailyRemaining={dailyRemaining}
                onUpgrade={onUpgrade}
                last={i === filtered.length - 1}/>
            );
          })}
        </div>

        {/* Quiet result count footer */}
        <div style={{
          borderTop: "1px solid var(--hairline)",
          padding: "10px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface-2)",
          fontSize: 11.5, color: "var(--text-3)",
        }}>
          <span>
            Showing <span className="mono tnum" style={{ color: "var(--text-2)", fontWeight: 500 }}>{filtered.length}</span> of <span className="mono tnum">{images.length}</span>
          </span>
          {plan === "free" && (
            <span>
              <span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> used today
            </span>
          )}
        </div>
      </Card>

      {/* Contextual bulk action bar — only when rows are selected */}
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          allowed={Math.max(0, dailyRemaining)}
          overLimit={overLimit}
          onClear={clearSelection}
          onOptimise={tryBulk}
          onUpgrade={onUpgrade}
        />
      )}

      {/* Quiet informational strip — replaces the heavy upsell banner */}
      {plan === "free" && selected.size === 0 && (
        <div style={{
          marginTop: 14,
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 12.5, color: "var(--text-3)",
        }}>
          <Icon name="info" size={13} style={{ color: "var(--text-3)", flexShrink: 0 }}/>
          <span style={{ flex: 1 }}>
            On Free, you can optimise up to <span className="mono">{dailyLimit}</span> AI generations per day.
            Pro lifts the daily allowance and unlocks bulk library optimisation.
          </span>
          <button onClick={onUpgrade} style={{
            background: "transparent", border: "none", padding: 0,
            color: "var(--primary-ink)", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            See Pro <Icon name="arrow-right" size={11}/>
          </button>
        </div>
      )}

      <EditAltModal
        image={editing}
        onClose={() => setEditing(null)}
        onSave={(id, alt) => {
          setOverrides(o => ({ ...o, [id]: alt }));
          setEditing(null);
          setSavedFlash(id);
          setTimeout(() => setSavedFlash(curr => curr === id ? null : curr), 1800);
        }}
      />
    </div>
  );
};

/* ----------------------------------------------------------------
   EditAltModal — inline alt text editor for a single library row.
   Saves a local override (no backend) so changes persist in the UI.
   ---------------------------------------------------------------- */
const EditAltModal = ({ image, onClose, onSave }) => {
  const [value, setValue] = React.useState("");
  const taRef = React.useRef(null);

  React.useEffect(() => {
    if (image) {
      setValue(image.alt || "");
      setTimeout(() => taRef.current && taRef.current.focus(), 30);
    }
  }, [image]);

  if (!image) return null;

  const handleSave = () => onSave(image.id, value.trim());

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          animation: "scaleIn .2s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 22px 12px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Thumb label={`#${image.id}`} size={44} radius={8} hue={image.hue}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Edit ALT text</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{image.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {image.page} · <span className="mono">{image.dim}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "transparent", border: 0, padding: 6, cursor: "pointer",
            color: "var(--text-3)", borderRadius: 6,
          }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{ padding: "0 22px 14px" }}>
          <textarea
            ref={taRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
            }}
            rows={4}
            placeholder="Describe what's in this image…"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontSize: 13.5, color: "var(--text)", lineHeight: 1.55,
              fontFamily: "var(--font-sans)",
              background: "var(--surface)",
              resize: "vertical", minHeight: 90,
              outline: 0,
              transition: "border-color .18s ease, box-shadow .18s ease",
            }}
            onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Aim for a clear, descriptive sentence — under 125 characters for screen readers.</span>
            <span className="mono" style={{ fontSize: 11, color: value.length > 125 ? "var(--warn-ink)" : "var(--text-3)" }}>{value.length}/125</span>
          </div>
        </div>

        <div style={{
          padding: "12px 22px",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--hairline)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            <KBD>⌘</KBD> <KBD>↵</KBD> <span style={{ marginLeft: 4 }}>to save</span>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" icon="check" onClick={handleSave} disabled={!value.trim()}>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   BulkActionBar — contextual, pops in from bottom on selection.
   Sticky, full-width within page padding. Carries the bulk CTA so
   the top of the page can stay calm.
   ---------------------------------------------------------------- */
const BulkActionBar = ({ count, allowed = 0, overLimit, onClear, onOptimise, onUpgrade }) => (
  <div style={{
    position: "sticky", bottom: 16, zIndex: 6,
    marginTop: 16,
    background: "var(--text)",
    color: "#fff",
    borderRadius: "var(--r-md)",
    padding: "10px 12px 10px 16px",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "var(--shadow-lg)",
    animation: "slideUp .22s cubic-bezier(.2,.8,.2,1)",
  }}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
      <span className="mono tnum" style={{
        background: "rgba(255,255,255,0.14)", color: "#fff",
        padding: "2px 9px", borderRadius: 999,
        fontSize: 12, fontWeight: 600,
      }}>{count}</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.92)" }}>
        {count === 1 ? "image selected" : "images selected"}
      </span>
      {overLimit && (
        <span style={{
          fontSize: 11.5, color: "rgba(255,255,255,0.7)",
          display: "inline-flex", alignItems: "center", gap: 5,
          marginLeft: 4,
        }}>
          <Icon name="alert" size={12}/>
          Over today's free limit
        </span>
      )}
    </div>
    <button onClick={onClear} style={{
      background: "transparent", border: "none", color: "rgba(255,255,255,0.7)",
      padding: "6px 10px", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
      transition: "color .15s ease",
    }}
    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>
      Clear
    </button>
    {overLimit ? (
      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <button onClick={onOptimise} style={{
          background: "rgba(255,255,255,0.12)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.18)",
          padding: "7px 12px", borderRadius: "var(--r-md)",
          fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="sparkles" size={13}/> Optimise first {allowed}
        </button>
        <button onClick={onUpgrade} style={{
          background: "#fff", color: "var(--text)", border: "none",
          padding: "7px 14px", borderRadius: "var(--r-md)",
          fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="crown" size={13}/> Unlock bulk
        </button>
      </div>
    ) : (
      <button onClick={onOptimise} style={{
        background: "#fff", color: "var(--text)", border: "none",
        padding: "7px 14px", borderRadius: "var(--r-md)",
        fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        <Icon name="sparkles" size={13}/> Optimise {count}
      </button>
    )}
  </div>
);

const Checkbox = ({ checked, indeterminate, onChange }) => (
  <button onClick={onChange} style={{
    width: 16, height: 16, borderRadius: 4,
    border: `1.5px solid ${checked || indeterminate ? "var(--primary)" : "var(--border-strong)"}`,
    background: checked || indeterminate ? "var(--primary)" : "var(--surface)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0, transition: "all .12s ease",
  }}>
    {checked && <Icon name="check" size={11} style={{ color: "#fff" }} strokeWidth={3}/>}
    {indeterminate && !checked && <span style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }}/>}
  </button>
);

/* ----------------------------------------------------------------
   LibraryRow — softer dividers, lifted hover, hierarchy:
   thumb → name → (page · dim secondary line) → status → CTA
   ---------------------------------------------------------------- */
const LibraryRow = ({ img, selected, onToggle, onGenerate, onEdit, justSaved, plan, dailyRemaining, onUpgrade, last }) => {
  const [hover, setHover] = React.useState(false);
  const statusConfig = {
    missing: { tone: "warn", label: "Needs ALT" },
    low:     { tone: "warn", label: "Low quality" },
    ok:      { tone: "ok",   label: "Optimised" },
  };
  const cfg = statusConfig[img.status];
  const canGenerate = plan === "pro" || dailyRemaining > 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "32px 60px 1fr 130px 110px",
        padding: "14px 18px", gap: 14, alignItems: "center",
        borderBottom: last ? "none" : "1px solid var(--hairline)",
        background: justSaved ? "var(--ok-soft)" : selected ? "var(--primary-soft)" : hover ? "var(--surface-2)" : "transparent",
        transition: "background .35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
      <Checkbox checked={selected} onChange={onToggle}/>
      <div style={{
        transition: "filter .2s ease, transform .2s ease",
        filter: hover ? "brightness(1.04)" : "brightness(1)",
      }}>
        <Thumb label={`#${img.id}`} size={48} radius={6} hue={img.hue}/>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</span>
          {img.isNew && <Pill tone="primary" style={{ padding: "1px 7px", fontSize: 10 }}>NEW</Pill>}
        </div>
        {/* Secondary metadata — softer, single line, lower priority */}
        <div style={{
          fontSize: 11.5, color: "var(--text-3)", marginTop: 2,
          display: "flex", alignItems: "center", gap: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.page}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span className="mono">{img.dim}</span>
        </div>
        {img.alt && (
          <div className="mono" style={{
            fontSize: 11, color: "var(--text-3)", marginTop: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            opacity: 0.85,
          }}>
            "{img.alt.slice(0, 80)}{img.alt.length > 80 ? "…" : ""}"
          </div>
        )}
      </div>
      <div><SoftStatus tone={cfg.tone}>{cfg.label}</SoftStatus></div>
      <div style={{ textAlign: "right" }}>
        {img.status !== "ok" ? (
          <Button
            variant={hover ? "primary" : "secondary"}
            size="sm"
            icon="sparkles"
            onClick={canGenerate ? onGenerate : onUpgrade}
          >
            {canGenerate ? "Generate" : "Upgrade"}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>Edit</Button>
        )}
      </div>
    </div>
  );
};

/* SoftStatus — quieter than Pill. No filled background, just a thin border
   and a small leading dot. Status reads as informational, not as a CTA. */
const SoftStatus = ({ tone = "ok", children }) => {
  const tones = {
    ok:      { fg: "var(--ok-ink)",      dot: "var(--ok)" },
    warn:    { fg: "var(--warn-ink)",    dot: "var(--warn)" },
    danger:  { fg: "var(--danger-ink)",  dot: "var(--danger)" },
    primary: { fg: "var(--primary-ink)", dot: "var(--primary)" },
  };
  const t = tones[tone] || tones.ok;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11.5, color: t.fg, fontWeight: 500,
      letterSpacing: "-0.005em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot, flexShrink: 0 }}/>
      {children}
    </span>
  );
};

function generateMockLibrary() {
  const pages = ["Home", "Blog · SEO Guide", "Shop · Coffee", "About", "Reviews", "Blog · Recipes", "Shop · Tea", "Contact", "Gallery", "Landing"];
  const names = [
    "hero-spring-collection.jpg", "team-portrait-2026.jpg", "blog-cover-seo-guide.png",
    "product-shot-coffee-04.jpg", "testimonial-jane-d.jpg", "kitchen-prep-overhead.jpg",
    "matcha-latte-final.png", "office-tour-lobby.jpg", "founder-story-cover.jpg",
    "menu-cover-summer.png", "press-quote-techcrunch.png", "infographic-stats-q1.png",
    "feature-comparison-table.jpg", "client-logo-grid.png", "case-study-acme.jpg",
    "footer-bg-pattern.png", "favicon-large.png", "sample-product-pack.jpg",
    "homepage-banner-fall.jpg", "video-poster-tutorial.jpg",
  ];
  const dims = ["1920×1080", "1200×800", "800×800", "1600×900", "2400×1600", "1080×1080"];
  const out = [];
  for (let i = 0; i < 60; i++) {
    let status, alt;
    if (i < 18) { status = "missing"; alt = ""; }
    else if (i < 26) { status = "low"; alt = ["Coffee", "Image", "Product", "Photo"][i % 4]; }
    else { status = "ok"; alt = [
      "Spring collection hero featuring three models in pastel knitwear against a soft pink studio backdrop",
      "Founder Jane Doe smiling at desk in a sunlit office, holding a ceramic coffee mug",
      "Overhead flat lay of espresso brewing equipment on white marble with morning light",
      "Step-by-step infographic comparing organic vs paid traffic growth in Q1 2026",
    ][i % 4]; }
    out.push({
      id: i + 1,
      name: names[i % names.length].replace(/(\.\w+)$/, `-${String(i).padStart(2, "0")}$1`),
      alt, status,
      page: pages[i % pages.length],
      dim: dims[i % dims.length],
      hue: (i * 47) % 360,
      isNew: i >= 18 && i < 21,
    });
  }
  return out;
}

Object.assign(window, { ALTLibrary });
