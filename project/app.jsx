/* BeepBeep AI — main app orchestrator */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "plan": "free",
  "state": "mid",
  "autoOptimise": false,
  "showOnboarding": false,
  "streak": 4,
  "signedIn": true
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState("dashboard");
  const [paywall, setPaywall] = React.useState({ open: false, trigger: "default" });
  const [drawer, setDrawer] = React.useState({ open: false, images: null });
  const [toast, setToast] = React.useState(null);
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  // Mock authenticated user. Real implementation would source this from
  // the host (WP user meta + BeepBeep AI account API).
  const user = { name: "Alex Morgan", email: "alex@yoursite.com" };

  React.useEffect(() => {
    if (tweaks.showOnboarding) {
      setOnboardingOpen(true);
      setTweak("showOnboarding", false);
    }
  }, [tweaks.showOnboarding]);

  const lastVisit = "2h ago";

  // Build the queue based on state
  const queueImages = [
    { id: 1, name: "hero-spring-collection.jpg", page: "Home", hue: 30 },
    { id: 2, name: "team-portrait-2026.jpg", page: "About", hue: 220 },
    { id: 3, name: "blog-cover-seo-guide.png", page: "Blog", hue: 145 },
    { id: 4, name: "product-shot-coffee-04.jpg", page: "Shop", hue: 60 },
    { id: 5, name: "testimonial-jane-d.jpg", page: "Reviews", hue: 280 },
  ];

  const dailyUsedMap = { fresh: 0, mid: 3, near: 1 };
  const monthlyUsedMap = { fresh: 0, mid: 27, near: 41 };
  const dailyUsed = dailyUsedMap[tweaks.state];
  const monthlyUsed = monthlyUsedMap[tweaks.state];
  const dailyLimit = tweaks.plan === "pro" ? 200 : 5;
  const dailyRemaining = dailyLimit - dailyUsed;

  const openGen = () => {
    if (tweaks.plan === "free" && dailyRemaining <= 0) {
      setPaywall({ open: true, trigger: "daily-limit" });
      return;
    }
    const count = Math.min(dailyRemaining, 5);
    setDrawer({ open: true, images: queueImages.slice(0, count) });
  };
  const openGenSingle = (img) => {
    if (tweaks.plan === "free" && dailyRemaining <= 0) {
      setPaywall({ open: true, trigger: "daily-limit" });
      return;
    }
    setDrawer({ open: true, images: [img] });
  };
  const openBulk = (ids) => {
    if (tweaks.plan === "free" && ids.length > dailyRemaining) {
      setPaywall({ open: true, trigger: "bulk" });
      return;
    }
    const imgs = ids.slice(0, 5).map((id, i) => ({ id, name: `image-${id}.jpg`, page: "Various", hue: (i*70)%360 }));
    setDrawer({ open: true, images: imgs });
  };

  const handleAutoToggle = (val) => {
    if (tweaks.plan === "free") {
      setPaywall({ open: true, trigger: "auto-feature" });
      return;
    }
    setTweak("autoOptimise", val);
    setToast({
      message: val ? "Auto-optimisation enabled" : "Auto-optimisation paused",
      sub: val ? "BeepBeep AI will generate ALT text for every new upload." : null,
      icon: val ? "check" : "info",
      tone: "ok",
    });
  };

  const handleUpgrade = () => {
    setPaywall({ open: false, trigger: "default" });
    setTweak("plan", "pro");
    setTweak("autoOptimise", true);
    setToast({
      message: "Welcome to BeepBeep AI Pro! 🎉",
      sub: "Auto-optimisation is now running. Your trial ends in 14 days.",
      icon: "crown",
      tone: "ok",
    });
  };

  const completeGen = () => {
    const n = drawer.images?.length || 0;
    setDrawer({ open: false, images: null });
    // Completion dopamine — calm, premium, no confetti.
    setToast({
      message: `${n} image${n === 1 ? "" : "s"} improved`,
      sub: "Your site is now more accessible.",
      icon: "sparkles",
      tone: "ok",
    });
  };

  let body = null;
  switch (tab) {
    case "dashboard":
      body = <Dashboard
        state={tweaks.state} plan={tweaks.plan}
        autoOptimise={tweaks.autoOptimise} onAutoToggle={handleAutoToggle}
        onGenerate={openGen} onUpgrade={() => setPaywall({ open: true, trigger: "default" })}
        onView={setTab} lastVisit={lastVisit} streak={tweaks.streak}/>;
      break;
    case "library":
      body = <ALTLibrary plan={tweaks.plan}
        dailyUsed={dailyUsed} dailyLimit={dailyLimit}
        onGenerate={openGenSingle}
        onBulkGenerate={openBulk}
        onUpgrade={() => setPaywall({ open: true, trigger: "bulk" })}/>;
      break;
    case "automation":
      body = <AutopilotScreen plan={tweaks.plan}
        autoOptimise={tweaks.autoOptimise}
        onAutoToggle={(v) => setTweak("autoOptimise", v)}
        onToast={setToast}
        onUpgrade={() => setPaywall({ open: true, trigger: "auto-feature" })}/>;
      break;
    case "settings":
      body = <SettingsScreen plan={tweaks.plan} onUpgrade={() => setPaywall({ open: true, trigger: "default" })}/>;
      break;
  }

  return (
    <>
      {tweaks.signedIn ? (
        <WPChrome activeTab={tab} onTab={setTab} plan={tweaks.plan}
          user={user}
          onSignOut={() => setSignOutOpen(true)}
          onHelp={() => setOnboardingOpen(true)}
          onUpgrade={() => setPaywall({ open: true, trigger: "default" })}>
          {body}
        </WPChrome>
      ) : (
        // Signed-out: keep WP chrome shell, replace BeepBeep AI area with reconnect screen.
        // Tabs + status + user menu are hidden when there's no session.
        <WPChrome activeTab={tab} onTab={setTab} plan={tweaks.plan}
          user={null}
          signedOut={true}
          onSignOut={() => {}}
          onUpgrade={() => {}}>
          <SignedOutScreen
            lastEmail={user.email}
            onSignIn={() => {
              setTweak("signedIn", true);
              setToast({ message: "Welcome back", sub: "Autopilot is resuming…", icon: "check", tone: "ok" });
            }}
          />
        </WPChrome>
      )}

      <Onboarding
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setOnboardingOpen(false);
          setToast(tweaks.plan === "pro"
            ? { message: "Welcome to BeepBeep AI", sub: "Autopilot is monitoring your library — continuous optimisation enabled.", icon: "zap", tone: "ok" }
            : { message: "Welcome to BeepBeep AI", sub: "Your first 5 daily optimisations are ready.", icon: "logo", tone: "ok" });
        }}/>

      <GenerationDrawer
        open={drawer.open}
        images={drawer.images}
        plan={tweaks.plan}
        onClose={() => setDrawer({ open: false, images: null })}
        onComplete={completeGen}/>

      <Paywall
        open={paywall.open}
        trigger={paywall.trigger}
        onClose={() => setPaywall({ open: false, trigger: "default" })}
        onUpgrade={handleUpgrade}/>

      <SignOutConfirm
        open={signOutOpen}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          setTweak("signedIn", false);
          setTab("dashboard");
        }}
      />

      {toast && <Toast {...toast} onDismiss={() => setToast(null)}/>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Plan & state">
          <TweakRadio label="Plan" value={tweaks.plan} onChange={v => setTweak("plan", v)}
            options={[{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }]}/>
          <TweakSelect label="Library state" value={tweaks.state} onChange={v => setTweak("state", v)}
            options={[
              { label: "Fresh install (7%)", value: "fresh" },
              { label: "Mid optimisation (60%)", value: "mid" },
              { label: "Nearly done (94%)", value: "near" },
            ]}/>
          <TweakSlider label="Daily streak" value={tweaks.streak} min={0} max={30} step={1}
            onChange={v => setTweak("streak", v)} unit=" days"/>
        </TweakSection>
        <TweakSection label="Automation">
          <TweakToggle label="Auto-optimise uploads" value={tweaks.autoOptimise}
            onChange={v => tweaks.plan === "pro" ? setTweak("autoOptimise", v) : setPaywall({ open: true, trigger: "auto-feature" })}/>
        </TweakSection>
        <TweakSection label="Account">
          <TweakToggle label="Signed in" value={tweaks.signedIn}
            onChange={v => setTweak("signedIn", v)}/>
          <TweakButton label="Trigger sign-out" onClick={() => setSignOutOpen(true)}/>
        </TweakSection>
        <TweakSection label="Demo flows">
          <TweakButton label="Replay onboarding" onClick={() => setOnboardingOpen(true)}/>
          <TweakButton label="Open paywall" onClick={() => setPaywall({ open: true, trigger: "default" })}/>
          <TweakButton label="Generation drawer" onClick={() => openGen()}/>
          <TweakButton label="Trigger daily limit" onClick={() => setPaywall({ open: true, trigger: "daily-limit" })}/>
          <TweakButton label="Trigger monthly limit" onClick={() => setPaywall({ open: true, trigger: "monthly-limit" })}/>
        </TweakSection>
        <TweakSection label="Navigation">
          <TweakSelect label="Screen" value={tab} onChange={setTab}
            options={[
              { label: "Home", value: "dashboard" },
              { label: "Library", value: "library" },
              { label: "Autopilot", value: "automation" },
              { label: "Settings", value: "settings" },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
