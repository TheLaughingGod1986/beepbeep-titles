/* BeepBeep AI — Titles & meta plugin — main app orchestrator */

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
  const [drawer, setDrawer] = React.useState({ open: false, pages: null });
  const [toast, setToast] = React.useState(null);
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  const user = { name: "Alex Morgan", email: "alex@yoursite.com" };

  React.useEffect(() => {
    if (tweaks.showOnboarding) {
      setOnboardingOpen(true);
      setTweak("showOnboarding", false);
    }
  }, [tweaks.showOnboarding]);

  const lastVisit = "2h ago";

  // Mock "Today's pass" queue — real pages needing title / meta.
  const queuePages = [
    { id: 1, url: "/about",                         section: "About",   missing: "both", hue: 220 },
    { id: 2, url: "/blog/seo-guide-2026",           section: "Blog",    missing: "meta", hue: 145 },
    { id: 3, url: "/shop/ethiopia-light-roast",     section: "Shop",    missing: "both", hue: 30  },
    { id: 4, url: "/reviews/jane-davis",            section: "Reviews", missing: "title", hue: 280 },
    { id: 5, url: "/recipes/cappuccino-at-home",    section: "Blog",    missing: "both", hue: 60  },
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
    setDrawer({ open: true, pages: queuePages.slice(0, count) });
  };
  const openGenSingle = (pg) => {
    if (tweaks.plan === "free" && dailyRemaining <= 0) {
      setPaywall({ open: true, trigger: "daily-limit" });
      return;
    }
    setDrawer({ open: true, pages: [pg] });
  };
  const openBulk = (ids) => {
    if (tweaks.plan === "free" && ids.length > dailyRemaining) {
      setPaywall({ open: true, trigger: "bulk" });
      return;
    }
    const pages = ids.slice(0, 5).map((id, i) => ({
      id,
      url: `/page-${id}`,
      section: ["Blog", "Shop", "Pages", "Reviews"][i % 4],
      missing: "both",
      hue: (i * 70) % 360,
    }));
    setDrawer({ open: true, pages });
  };

  const handleAutoToggle = (val) => {
    if (tweaks.plan === "free") {
      setPaywall({ open: true, trigger: "auto-feature" });
      return;
    }
    setTweak("autoOptimise", val);
    setToast({
      message: val ? "Auto-generate enabled" : "Auto-generate paused",
      sub: val ? "BeepBeep AI will write title & meta for every new page you publish." : null,
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
      sub: "Auto-generate is now running. Your trial ends in 14 days.",
      icon: "crown",
      tone: "ok",
    });
  };

  const completeGen = () => {
    const n = drawer.pages?.length || 0;
    setDrawer({ open: false, pages: null });
    setToast({
      message: `${n} page${n === 1 ? "" : "s"} improved`,
      sub: "Title & meta descriptions are live in your site.",
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
      body = <PagesLibrary plan={tweaks.plan}
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
            ? { message: "Welcome to BeepBeep AI", sub: "Autopilot is monitoring your site — continuous optimisation enabled.", icon: "zap", tone: "ok" }
            : { message: "Welcome to BeepBeep AI", sub: "Your first 5 daily generations are ready.", icon: "logo", tone: "ok" });
        }}/>

      <GenerationDrawer
        open={drawer.open}
        pages={drawer.pages}
        plan={tweaks.plan}
        onClose={() => setDrawer({ open: false, pages: null })}
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
          <TweakSelect label="Site state" value={tweaks.state} onChange={v => setTweak("state", v)}
            options={[
              { label: "Fresh install (7%)", value: "fresh" },
              { label: "Mid optimisation (60%)", value: "mid" },
              { label: "Nearly done (94%)", value: "near" },
            ]}/>
          <TweakSlider label="Daily streak" value={tweaks.streak} min={0} max={30} step={1}
            onChange={v => setTweak("streak", v)} unit=" days"/>
        </TweakSection>
        <TweakSection label="Automation">
          <TweakToggle label="Auto-generate on publish" value={tweaks.autoOptimise}
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
