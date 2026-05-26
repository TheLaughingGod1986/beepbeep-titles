/* Auth surfaces — sign-out flow + signed-out (reconnect) screen.

   Tone: calm, minimal, premium AI assistant. The plugin still lives
   inside WordPress admin, so we don't take over the page — only the
   BeepBeep AI content area. Sidebar nav, plan badge, etc. are hidden when
   signed-out (you can't navigate without an account). */

/* ----------------------------------------------------------------
   UserMenu — small avatar + dropdown in the BeepBeep AI tab strip.
   Closes on outside-click and Escape. Keyboard-navigable.
   ---------------------------------------------------------------- */
const UserMenu = ({ user, plan, onSignOut, onAccount, onHelp }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const initials = (user.name || user.email || "?")
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "3px 6px 3px 3px",
          background: open ? "var(--bg-sunken)" : "transparent",
          border: "1px solid",
          borderColor: open ? "var(--border)" : "transparent",
          borderRadius: 999,
          cursor: "pointer",
          transition: "background .15s ease, border-color .15s ease",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "var(--bg-sunken)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Avatar initials={initials} size={22}/>
        <Icon name="chevron-down" size={11} style={{ color: "var(--text-3)" }}/>
      </button>

      {open && (
        <div role="menu" className="fade-in" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 240, zIndex: 30,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}>
          {/* Identity block */}
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--hairline)" }}>
            <Avatar initials={initials} size={32}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || "Account"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Plan badge row */}
          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--hairline)" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Plan</span>
            {plan === "pro"
              ? <Pill tone="primary" icon="crown">Pro</Pill>
              : <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>Free</span>}
          </div>

          <MenuItem icon="settings" label="Account settings" onClick={() => { setOpen(false); onAccount(); }}/>
          <MenuItem icon="info"     label="Help & docs"      onClick={() => { setOpen(false); onHelp(); }}/>

          <div style={{ borderTop: "1px solid var(--hairline)" }}/>
          <MenuItem icon="logout" label="Sign out" tone="danger" onClick={() => { setOpen(false); onSignOut(); }}/>
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, tone }) => {
  const [hover, setHover] = React.useState(false);
  const color = tone === "danger" ? "var(--danger-ink)" : "var(--text-2)";
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 14px",
        background: hover ? "var(--bg-sunken)" : "transparent",
        border: "none", cursor: "pointer",
        textAlign: "left",
        fontSize: 13, color, fontWeight: 500,
        transition: "background .12s ease",
      }}
    >
      <Icon name={icon} size={13} style={{ color, flexShrink: 0 }}/>
      {label}
    </button>
  );
};

const Avatar = ({ initials, size = 28 }) => (
  <span style={{
    width: size, height: size, borderRadius: 999,
    background: "linear-gradient(135deg, #3B82F6, #5046E5)",
    color: "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.round(size * 0.42), fontWeight: 600, letterSpacing: "0.01em",
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
  }}>{initials}</span>
);

/* ----------------------------------------------------------------
   Sign-out confirmation — lightweight modal.
   ---------------------------------------------------------------- */
const SignOutConfirm = ({ open, onCancel, onConfirm }) => (
  <Modal open={open} onClose={onCancel} width={420}>
    <div style={{ padding: "22px 24px 20px" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 999,
        background: "var(--bg-sunken)", border: "1px solid var(--border)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12,
      }}>
        <Icon name="logout" size={17} style={{ color: "var(--text-2)" }}/>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Sign out of BeepBeep AI?</h2>
      <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>
        Autopilot will pause and no new images will be optimised until you sign back in.
        All previously generated ALT text stays on your site.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" size="md" onClick={onCancel}>Stay signed in</Button>
        <Button variant="secondary" size="md" onClick={onConfirm}>Sign out</Button>
      </div>
    </div>
  </Modal>
);

/* ----------------------------------------------------------------
   SignedOutScreen — calm reconnect surface inside the BeepBeep AI area.
   Two paths: magic-link email, or a license key for offline/agency.
   ---------------------------------------------------------------- */
const SignedOutScreen = ({ onSignIn, lastEmail }) => {
  const [email, setEmail] = React.useState(lastEmail || "");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [mode, setMode] = React.useState("password"); // "password" | "license" | "signup"
  const [license, setLicense] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submitPassword = (e) => {
    e?.preventDefault?.();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSignIn({ email, method: "password" }); }, 700);
  };
  const submitLicense = (e) => {
    e?.preventDefault?.();
    if (!license.trim()) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSignIn({ email: "agency@studio.co", method: "license" }); }, 700);
  };
  const submitSignup = (e) => {
    e?.preventDefault?.();
    if (!email.trim() || !password || password.length < 8) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSignIn({ email, name, method: "signup" }); }, 800);
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 32px - 52px)",
      padding: "56px 32px 80px",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div className="signedout-in" style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand mark — tighter, single line */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <Icon name="logo" size={26} style={{ color: "var(--primary-strong)" }}/>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1 }}>BeepBeep AI</span>
          <span aria-hidden="true" style={{ width: 1, height: 12, background: "var(--border-strong)", opacity: 0.7 }}/>
          <span style={{ fontSize: 11.5, color: "var(--text-3)", letterSpacing: "0.04em", fontWeight: 500 }}>Image SEO</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.022em", margin: "0 0 6px", lineHeight: 1.2 }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
          {mode === "password" && "Sign in to keep your images covered."}
          {mode === "license"  && "Paste your license key to connect this site."}
          {mode === "signup"   && "Start covering your images in under a minute. Free, no credit card."}
        </p>

        {mode === "password" && (
          <form onSubmit={submitPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Email">
              <input
                type="email"
                autoFocus={!email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yoursite.com"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
              />
            </Field>

            <Field
              label="Password"
              right={
                <a href="#" style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0" }}>
                  Forgot password?
                </a>
              }
            >
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  autoFocus={!!email}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", padding: 6,
                    color: "var(--text-3)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6,
                    transition: "color .18s ease, background .18s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--bg-sunken)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon name="eye" size={14}/>
                </button>
              </div>
            </Field>

            <Button
              variant="primary"
              size="md"
              full
              type="submit"
              iconRight={submitting ? null : "arrow-right"}
              disabled={!email.trim() || !password || submitting}
              onClick={submitPassword}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}
        {mode === "license" && (
          <form onSubmit={submitLicense} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="License key">
              <input
                autoFocus
                value={license}
                onChange={e => setLicense(e.target.value)}
                placeholder="nai_live_••••••••••••••••"
                style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
              />
            </Field>
            <Button
              variant="primary"
              size="md"
              full
              type="submit"
              iconRight={submitting ? null : "arrow-right"}
              disabled={!license.trim() || submitting}
              onClick={submitLicense}
            >
              {submitting ? "Connecting…" : "Connect site"}
            </Button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={submitSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Name">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yoursite.com"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
              />
            </Field>
            <Field
              label="Password"
              right={
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  At least 8 characters
                </span>
              }
            >
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.025) inset"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", padding: 6,
                    color: "var(--text-3)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6,
                    transition: "color .18s ease, background .18s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--bg-sunken)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon name="eye" size={14}/>
                </button>
              </div>
            </Field>
            <Button
              variant="primary"
              size="md"
              full
              type="submit"
              iconRight={submitting ? null : "arrow-right"}
              disabled={!email.trim() || password.length < 8 || submitting}
              onClick={submitSignup}
            >
              {submitting ? "Creating account…" : "Create account"}
            </Button>
            <p style={{ fontSize: 11, color: "var(--text-3)", margin: "4px 0 0", textAlign: "center", lineHeight: 1.5 }}>
              By creating an account you agree to BeepBeep AI's{" "}
              <a href="#" style={{ color: "var(--text-3)", fontWeight: 500 }}>Terms</a> and{" "}
              <a href="#" style={{ color: "var(--text-3)", fontWeight: 500 }}>Privacy Policy</a>.
            </p>
          </form>
        )}

        {/* Mode switch — quiet text link. Hidden during signup; that has its own footer. */}
        {mode !== "signup" && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setMode(mode === "password" ? "license" : "password")}
              style={{
                background: "transparent", border: "none", padding: 6,
                fontSize: 12.5, color: "var(--text-3)", fontWeight: 500, cursor: "pointer",
                transition: "color .15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-2)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
            >
              {mode === "password" ? "Use a license key instead" : "Use email instead"}
            </button>
          </div>
        )}

        {/* Reassurance strip — quiet, mature, no marketing. Functions as the
            "system alive" signal: confirms the user's data is intact while signed out. */}
        <div style={{
          marginTop: 20, padding: "11px 13px",
          background: "var(--surface-2)", border: "1px solid var(--hairline)",
          borderRadius: "var(--r-md)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {[
            "Your existing ALT text stays on your site.",
            "Autopilot resumes the moment you sign back in.",
            "You can switch plans anytime from Settings.",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-2)", letterSpacing: "-0.005em" }}>
              <Icon name="check" size={11} strokeWidth={2.6} style={{ color: "var(--ok-ink)", flexShrink: 0 }}/>
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* Footer — swaps between sign-up prompt and sign-in prompt by mode.
            "What is BeepBeep AI?" surfaces a concise tooltip on hover. */}
        <div style={{ marginTop: 22, fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("password")}
                style={authLinkStyle}
              >Sign in</button>
            </>
          ) : (
            <>
              New to BeepBeep AI?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                style={authLinkStyle}
              >Create an account</button>
              <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>
              <WhatIsNai/>
            </>
          )}
        </div>

        {/* Tiny system-alive footnote — the quietest sign of life on the page. */}
        <div style={{
          marginTop: 28,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          fontSize: 11, color: "var(--text-3)", letterSpacing: "0",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: 999,
            background: "var(--ok)", opacity: 0.7,
          }}/>
          <span>Your media library is ready when you sign in.</span>
        </div>
      </div>
    </div>
  );
};

/* WhatIsNai — small trigger that reveals a concise, non-marketing
   explanation on hover/focus. No modal, no marketing surface. */
const WhatIsNai = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          background: "transparent", border: "none", padding: 0,
          color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          cursor: "help",
          borderBottom: "1px dotted var(--border-strong)",
          transition: "color .18s ease, border-color .18s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderBottomColor = "var(--text-3)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderBottomColor = "var(--border-strong)"; }}
      >What is BeepBeep AI?</button>
      {open && (
        <span role="tooltip" className="fade-in" style={{
          position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
          transform: "translateX(-50%)",
          width: 256,
          padding: "10px 12px",
          background: "var(--text)", color: "#CBD5E1",
          fontSize: 11.5, lineHeight: 1.55, fontWeight: 400,
          borderRadius: 8,
          textAlign: "left", letterSpacing: "-0.003em",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          zIndex: 50, pointerEvents: "none",
        }}>
          BeepBeep AI automatically scans your media library and improves image
          <span style={{ whiteSpace: "nowrap" }}> ALT text</span>
          {" "}for accessibility and SEO. Runs quietly in the background.
          <span style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid var(--text)",
          }}/>
        </span>
      )}
    </span>
  );
};

const authLinkStyle = {
  background: "transparent", border: "none", padding: 0,
  color: "var(--primary-ink)", fontSize: 12, fontWeight: 500, cursor: "pointer",
  transition: "color .18s ease",
};

const Field = ({ label, right, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      {right}
    </div>
    {children}
  </label>
);

const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "11px 13px",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  transition: "border-color .18s ease, box-shadow .18s ease, background .18s ease",
  boxShadow: "0 1px 2px rgba(15,23,42,0.025) inset",
  boxSizing: "border-box",
};

Object.assign(window, { UserMenu, SignOutConfirm, SignedOutScreen });
