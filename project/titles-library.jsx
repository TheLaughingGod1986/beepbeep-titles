/* BeepBeep AI — Pages Library
   Review every page's title & meta description, one calm view.
   - Sticky filter/search bar with backdrop blur, no clipping
   - URL-first row layout: section chip → URL → title & meta previews → status → CTA
   - Contextual bulk mode (action bar only when rows selected)
   - Dual-field edit modal with SERP preview
   - Visual parity with dashboard tokens */

const PagesLibrary = ({ plan, dailyUsed, dailyLimit, onGenerate, onUpgrade, onBulkGenerate }) => {
  const [filter, setFilter] = React.useState("needs");
  const [selected, setSelected] = React.useState(new Set());
  const [search, setSearch] = React.useState("");
  const [stuck, setStuck] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [overrides, setOverrides] = React.useState({}); // id -> { title, meta }
  const [savedFlash, setSavedFlash] = React.useState(null);
  const sentinelRef = React.useRef(null);

  const pages = React.useMemo(() => generateMockPages(), []);
  const dailyRemaining = (plan === "pro" ? Infinity : dailyLimit) - dailyUsed;

  const needsAttention = (p) => p.status === "missing-both" || p.status === "missing-title" || p.status === "missing-meta";

  const filtered = pages.filter(p => {
    if (filter === "needs" && !needsAttention(p)) return false;
    if (filter === "missing-title" && p.status !== "missing-title" && p.status !== "missing-both") return false;
    if (filter === "missing-meta"  && p.status !== "missing-meta"  && p.status !== "missing-both") return false;
    if (filter === "low" && p.status !== "low") return false;
    if (filter === "ok"  && p.status !== "ok")  return false;
    if (filter === "new" && !p.isNew) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.url.toLowerCase().includes(q) && !(p.title || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: pages.length,
    needs: pages.filter(needsAttention).length,
    "missing-title": pages.filter(p => p.status === "missing-title" || p.status === "missing-both").length,
    "missing-meta":  pages.filter(p => p.status === "missing-meta"  || p.status === "missing-both").length,
    low: pages.filter(p => p.status === "low").length,
    ok:  pages.filter(p => p.status === "ok").length,
    new: pages.filter(p => p.isNew).length,
  };

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const tryBulk = () => {
    const ids = Array.from(selected);
    if (plan === "free" && ids.length > dailyRemaining) {
      const allowed = ids.slice(0, dailyRemaining);
      if (allowed.length > 0) onBulkGenerate(allowed);
      onUpgrade();
      return;
    }
    onBulkGenerate(ids);
  };

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Library</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Every page, all in one view</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>Review titles and meta descriptions across every page on your site.</p>
        </div>
        <Button variant="secondary" size="md" icon="refresh">Re-crawl</Button>
      </div>

      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }}/>

      {/* Sticky filter + search */}
      <div style={{
        position: "sticky", top: 84, zIndex: 5,
        background: stuck ? "rgba(246,248,251,0.82)" : "transparent",
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
              { id: "needs", label: "Needs attention", count: counts.needs },
              { id: "missing-title", label: "Missing title", count: counts["missing-title"] },
              { id: "missing-meta",  label: "Missing meta",  count: counts["missing-meta"] },
              { id: "low",   label: "Low quality", count: counts.low },
              { id: "new",   label: "New pages",   count: counts.new },
              { id: "ok",    label: "Optimised",   count: counts.ok },
              { id: "all",   label: "All pages",   count: counts.all },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search URLs or titles" style={{
              background: "var(--surface)", border: "1px solid var(--hairline)",
              borderRadius: "var(--r-md)", padding: "6px 12px 6px 30px",
              fontSize: 12.5, fontFamily: "var(--font-sans)", color: "var(--text)",
              width: 240, outline: "none",
              transition: "border-color .15s ease",
            }}
            onFocus={e => e.target.style.borderColor = "var(--border-strong)"}
            onBlur={e => e.target.style.borderColor = "var(--hairline)"}/>
          </div>
        </div>
      </div>

      {/* Card-wrapped list */}
      <Card padding={0} style={{ marginTop: 14, overflow: "hidden" }}>
        {/* Compact column header */}
        <div style={{
          display: "grid", gridTemplateColumns: "32px 44px 1.5fr 1.4fr 130px 110px",
          padding: "10px 18px", gap: 14, alignItems: "center",
          borderBottom: "1px solid var(--hairline)",
          fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <Checkbox checked={selected.size === filtered.length && filtered.length > 0}
            indeterminate={selected.size > 0 && selected.size < filtered.length}
            onChange={toggleAll}/>
          <span></span>
          <span>Page</span>
          <span>Title & meta</span>
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
              <div style={{ fontSize: 12.5, marginTop: 4 }}>No pages match this filter.</div>
            </div>
          ) : filtered.map((pg, i) => {
            const ov = overrides[pg.id] || {};
            const merged = { ...pg, title: ov.title ?? pg.title, meta: ov.meta ?? pg.meta };
            return (
              <PageRow key={pg.id} pg={merged}
                selected={selected.has(pg.id)} onToggle={() => toggle(pg.id)}
                onGenerate={() => onGenerate(pg)}
                onEdit={() => setEditing(merged)}
                justSaved={savedFlash === pg.id}
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
            Showing <span className="mono tnum" style={{ color: "var(--text-2)", fontWeight: 500 }}>{filtered.length}</span> of <span className="mono tnum">{pages.length}</span>
          </span>
          {plan === "free" && (
            <span>
              <span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> used today
            </span>
          )}
        </div>
      </Card>

      {/* Contextual bulk action bar */}
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

      {/* Quiet informational strip */}
      {plan === "free" && selected.size === 0 && (
        <div style={{
          marginTop: 14,
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 12.5, color: "var(--text-3)",
        }}>
          <Icon name="info" size={13} style={{ color: "var(--text-3)", flexShrink: 0 }}/>
          <span style={{ flex: 1 }}>
            On Free, you can generate up to <span className="mono">{dailyLimit}</span> titles & metas per day.
            Pro lifts the daily allowance and unlocks bulk site optimisation.
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

      <EditPageSEOModal
        page={editing}
        onClose={() => setEditing(null)}
        onSave={(id, vals) => {
          setOverrides(o => ({ ...o, [id]: vals }));
          setEditing(null);
          setSavedFlash(id);
          setTimeout(() => setSavedFlash(curr => curr === id ? null : curr), 1800);
        }}
      />
    </div>
  );
};

/* ----------------------------------------------------------------
   PageRow — URL chip → URL/section → title & meta preview → status → CTA
   ---------------------------------------------------------------- */
const PageRow = ({ pg, selected, onToggle, onGenerate, onEdit, justSaved, plan, dailyRemaining, onUpgrade, last }) => {
  const [hover, setHover] = React.useState(false);
  const statusConfig = {
    "missing-both":  { tone: "danger", label: "Missing both" },
    "missing-title": { tone: "danger", label: "Missing title" },
    "missing-meta":  { tone: "warn",   label: "Missing meta" },
    "low":           { tone: "warn",   label: "Low quality" },
    "ok":            { tone: "ok",     label: "Optimised" },
  };
  const cfg = statusConfig[pg.status];
  const canGenerate = plan === "pro" || dailyRemaining > 0;
  const isOk = pg.status === "ok";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "32px 44px 1.5fr 1.4fr 130px 110px",
        padding: "14px 18px", gap: 14, alignItems: "center",
        borderBottom: last ? "none" : "1px solid var(--hairline)",
        background: justSaved ? "var(--ok-soft)" : selected ? "var(--primary-soft)" : hover ? "var(--surface-2)" : "transparent",
        transition: "background .35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
      <Checkbox checked={selected} onChange={onToggle}/>

      {/* Section chip */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `hsl(${pg.hue}, 32%, 94%)`,
        color: `hsl(${pg.hue}, 38%, 32%)`,
        border: "1px solid var(--border)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700,
        flexShrink: 0,
        transition: "filter .2s ease",
        filter: hover ? "brightness(0.98)" : "brightness(1)",
      }}>{pg.section[0]}</div>

      {/* URL + section */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.url}</span>
          {pg.isNew && <Pill tone="primary" style={{ padding: "1px 7px", fontSize: 10 }}>NEW</Pill>}
        </div>
        <div style={{
          fontSize: 11.5, color: "var(--text-3)", marginTop: 2,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>{pg.section}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span className="mono">{pg.traffic}/mo</span>
        </div>
      </div>

      {/* Title & meta preview */}
      <div style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.45 }}>
        {pg.title ? (
          <div style={{ color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.title}</div>
        ) : (
          <div style={{ color: "var(--danger-ink)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>— no title set —</div>
        )}
        {pg.meta ? (
          <div style={{ color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.meta}</div>
        ) : (
          <div style={{ color: "var(--warn-ink)", fontStyle: "italic", marginTop: 2, fontSize: 11.5 }}>— no meta description —</div>
        )}
      </div>

      <div><SoftStatus tone={cfg.tone}>{cfg.label}</SoftStatus></div>

      <div style={{ textAlign: "right" }}>
        {!isOk ? (
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

/* ----------------------------------------------------------------
   EditPageSEOModal — separate title (input) + meta (textarea) editor
   with character counters and a Google SERP preview at the bottom.
   ---------------------------------------------------------------- */
const EditPageSEOModal = ({ page, onClose, onSave }) => {
  const [title, setTitle] = React.useState("");
  const [meta, setMeta] = React.useState("");
  const titleRef = React.useRef(null);

  React.useEffect(() => {
    if (page) {
      setTitle(page.title || "");
      setMeta(page.meta || "");
      setTimeout(() => titleRef.current && titleRef.current.focus(), 30);
    }
  }, [page]);

  if (!page) return null;

  const handleSave = () => onSave(page.id, { title: title.trim(), meta: meta.trim() });

  const titleColor = title.length > 60 ? "var(--warn-ink)" : title.length > 0 ? "var(--ok-ink)" : "var(--text-3)";
  const metaColor  = meta.length  > 160 ? "var(--warn-ink)" : meta.length  > 0 ? "var(--ok-ink)" : "var(--text-3)";

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
          width: 620, maxWidth: "100%",
          maxHeight: "90vh", overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          animation: "scaleIn .2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px 12px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: `hsl(${page.hue}, 32%, 94%)`,
            color: `hsl(${page.hue}, 38%, 32%)`,
            border: "1px solid var(--border)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
            flexShrink: 0,
          }}>{page.section[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Edit page SEO</div>
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {page.section} · <span className="mono">{page.traffic}/mo</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "transparent", border: 0, padding: 6, cursor: "pointer",
            color: "var(--text-3)", borderRadius: 6,
          }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Title field */}
        <div style={{ padding: "0 22px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Title tag</label>
            <span className="mono" style={{ fontSize: 11, color: titleColor, fontWeight: 600 }}>{title.length}/60</span>
          </div>
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
            }}
            placeholder="Page title shown in search results and browser tabs"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontSize: 13.5, color: "var(--text)",
              fontFamily: "var(--font-sans)",
              background: "var(--surface)",
              outline: 0,
              transition: "border-color .18s ease, box-shadow .18s ease",
            }}
            onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Meta field */}
        <div style={{ padding: "12px 22px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Meta description</label>
            <span className="mono" style={{ fontSize: 11, color: metaColor, fontWeight: 600 }}>{meta.length}/160</span>
          </div>
          <textarea
            value={meta}
            onChange={e => setMeta(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
            }}
            rows={3}
            placeholder="One-sentence summary shown under the title in search results."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontSize: 13.5, color: "var(--text)", lineHeight: 1.55,
              fontFamily: "var(--font-sans)",
              background: "var(--surface)",
              resize: "vertical", minHeight: 80,
              outline: 0,
              transition: "border-color .18s ease, box-shadow .18s ease",
            }}
            onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)" }}>
            Aim for ~150 characters. Google may truncate longer descriptions.
          </div>
        </div>

        {/* Mini SERP preview */}
        <div style={{ padding: "10px 22px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Search preview</div>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "12px 14px",
            fontFamily: "arial, sans-serif",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                background: "#1a73e8", color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, fontFamily: "var(--font-sans)",
              }}>Y</span>
              <span style={{ fontSize: 12, color: "#5f6368" }}>yoursite.com{page.url}</span>
            </div>
            <div style={{
              fontSize: 18, lineHeight: 1.3, color: "#1a0dab",
              fontFamily: "arial, sans-serif",
              margin: "2px 0 3px",
            }}>
              {title || <em style={{ color: "#b00020", fontStyle: "normal" }}>(no title set)</em>}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#4d5156", fontFamily: "arial, sans-serif" }}>
              {meta || <em style={{ color: "#5f6368" }}>(no meta description — Google will pick a snippet from the page)</em>}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            <Button variant="primary" size="sm" icon="check" onClick={handleSave} disabled={!title.trim() && !meta.trim()}>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------
   BulkActionBar — contextual, pops in from bottom on selection.
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
        {count === 1 ? "page selected" : "pages selected"}
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
          <Icon name="sparkles" size={13}/> Generate first {allowed}
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
        <Icon name="sparkles" size={13}/> Generate {count}
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

/* SoftStatus — quiet inline status, just dot + label */
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

/* ----------------------------------------------------------------
   Mock library — realistic SEO data shape for a small ecommerce site.
   ---------------------------------------------------------------- */
function generateMockPages() {
  const SECTIONS = [
    { id: "Home",    hue: 220 },
    { id: "Blog",    hue: 145 },
    { id: "Shop",    hue: 30  },
    { id: "About",   hue: 280 },
    { id: "Reviews", hue: 200 },
    { id: "Pages",   hue: 90  },
  ];
  const SLUGS = [
    ["/", "Home"],
    ["/about", "About"],
    ["/contact", "Pages"],
    ["/pricing", "Pages"],
    ["/blog/seo-guide-2026", "Blog"],
    ["/blog/cappuccino-at-home", "Blog"],
    ["/blog/why-meta-descriptions-matter", "Blog"],
    ["/blog/coffee-bean-buyers-guide", "Blog"],
    ["/blog/espresso-machine-roundup", "Blog"],
    ["/blog/latte-art-fundamentals", "Blog"],
    ["/blog/single-origin-vs-blends", "Blog"],
    ["/blog/customer-spotlight-q1", "Blog"],
    ["/shop/ethiopia-light-roast", "Shop"],
    ["/shop/colombia-dark-roast", "Shop"],
    ["/shop/cappuccino-mug-set", "Shop"],
    ["/shop/milk-frother-stainless", "Shop"],
    ["/shop/cold-brew-kit", "Shop"],
    ["/shop/grinder-burr-manual", "Shop"],
    ["/shop/espresso-tamper-58mm", "Shop"],
    ["/shop/gift-card-50", "Shop"],
    ["/reviews/jane-davis", "Reviews"],
    ["/reviews/marcus-okafor", "Reviews"],
    ["/reviews/priya-r-sharma", "Reviews"],
    ["/reviews/local-cafe-spotlight", "Reviews"],
    ["/about/our-roastery", "About"],
    ["/about/founder-story", "About"],
    ["/about/sourcing", "About"],
    ["/about/sustainability", "About"],
    ["/landing/holiday-2025", "Pages"],
    ["/landing/free-shipping-promo", "Pages"],
  ];
  // Sample titles & metas in well-written form for the "ok" rows
  const goodTitles = [
    "Mission Coffee | Specialty Roasters in San Francisco",
    "Cappuccino at Home: A 6-Minute Barista Method",
    "The 2026 SEO Guide: Title Tags, Meta, and Schema",
    "Ethiopia Light Roast — Bright, Floral, Single-Origin",
    "Why Meta Descriptions Still Move CTR in 2026",
  ];
  const goodMetas = [
    "Hand-roasted coffee, espresso equipment, and barista training from our flagship cafe on Mission Street since 2018.",
    "Our barista-tested method for silky cappuccino foam — using any espresso machine. Step-by-step photos and a 90-second walk-through.",
    "How modern title and meta description writing works post-AI overviews. Tested patterns, character budgets, and 12 real-world examples.",
    "100g of bright, jasmine-forward Ethiopian beans from a single washing station. Roasted weekly, shipped within 48 hours.",
    "Title tags carry the click. Meta descriptions carry the choice. Here's exactly how to write both for higher SERP performance.",
  ];

  const out = [];
  for (let i = 0; i < SLUGS.length; i++) {
    const [url, secId] = SLUGS[i];
    const sec = SECTIONS.find(s => s.id === secId) || SECTIONS[0];
    let status, title = "", meta = "";
    if (i < 6) { status = "missing-both"; }
    else if (i < 11) { status = "missing-meta"; title = goodTitles[i % goodTitles.length]; }
    else if (i < 14) { status = "missing-title"; meta = goodMetas[i % goodMetas.length]; }
    else if (i < 18) { status = "low"; title = ["About", "Contact", "Home", "Shop"][i % 4]; meta = "Welcome to our site."; }
    else {
      status = "ok";
      title = goodTitles[i % goodTitles.length];
      meta  = goodMetas[i % goodMetas.length];
    }
    out.push({
      id: i + 1,
      url,
      section: sec.id,
      hue: sec.hue,
      title, meta, status,
      traffic: [42, 187, 1240, 3200, 14, 88, 410, 530][i % 8],
      isNew: i >= 6 && i < 9,
    });
  }
  return out;
}

Object.assign(window, { PagesLibrary });
