"use client";
import { StoreProvider, useStore } from "@/lib/store";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { TutorialProvider, useTutorial } from "@/lib/tutorial";
import AgileBoard from "@/components/AgileBoard";
import CodeEditor from "@/components/CodeEditor";
import CICDPipeline from "@/components/CICDPipeline";
import Infrastructure from "@/components/Infrastructure";
import HomePage from "@/components/HomePage";
import Notifications from "@/components/Notifications";
import TutorialModal from "@/components/TutorialModal";

const TABS = [
  { id: "home", label: "Home" },
  { id: "agile", label: "Agile Board" },
  { id: "code", label: "Code & VCS" },
  { id: "cicd", label: "CI/CD Pipeline" },
  { id: "infra", label: "Infrastructure" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg border border-border hover:border-border-bright flex items-center justify-center text-muted hover:text-foreground transition-all cursor-pointer"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function TutorialButton() {
  const { active, start, dismissed } = useTutorial();

  if (active) return null;

  return (
    <button
      onClick={start}
      className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dismissed
        ? "bg-surface border border-border text-muted hover:text-foreground hover:border-border-bright"
        : "bg-accent/20 text-accent-bright border border-accent/30 hover:bg-accent/30 animate-pulse"
        }`}
    >
      {dismissed ? "Restart Tutorial" : "Start Tutorial"}
    </button>
  );
}

function AppShell() {
  const { state, actions } = useStore();

  const activePRs = state.pullRequests.filter((p) => p.status === "open").length;
  const activePipelines = state.pipelineRuns.filter((p) => p.status === "running").length;
  const inProgressTasks = state.columns.inProgress.length + state.columns.inReview.length;

  const badges = {
    home: null,
    agile: inProgressTasks > 0 ? inProgressTasks : null,
    code: activePRs > 0 ? activePRs : null,
    cicd: activePipelines > 0 ? activePipelines : null,
    infra: null,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar */}
      <header className="flex-shrink-0 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-none">SWE Sim</h1>
              <p className="text-[10px] text-muted mt-0.5">Software Engineering Workflow</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => actions.setTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${state.activeTab === tab.id
                  ? "bg-accent/15 text-accent-bright border border-accent/30"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                {badges[tab.id] && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
                    {badges[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <TutorialButton />
            <div className="hidden md:flex items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${state.sprint.status === "active" ? "bg-success animate-pulse" : "bg-warning"}`} />
                Sprint {state.sprint.number}
              </div>
              <div className="w-px h-4 bg-border" />
              <span>{state.commits.length} commits</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {state.activeTab === "home" && <HomePage />}
        {state.activeTab === "agile" && <AgileBoard />}
        {state.activeTab === "code" && <CodeEditor />}
        {state.activeTab === "cicd" && <CICDPipeline />}
        {state.activeTab === "infra" && <Infrastructure />}
      </main>

      <Notifications />
      <TutorialModal />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <TutorialProvider>
          <AppShell />
        </TutorialProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
