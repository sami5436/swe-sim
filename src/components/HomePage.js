"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";

/* ─── tiny helpers ──────────────────────────────────── */
const Tag = ({ children }) => (
    <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface-active text-muted border border-border">
        {children}
    </span>
);

const CMD = ({ children }) => (
    <code className="font-mono text-accent-bright">{children}</code>
);

/* ─── section data ──────────────────────────────────── */
const SECTIONS = [
    {
        id: "agile",
        num: "01",
        title: "Agile Board",
        oneLiner: "Plan work the way real teams do.",
        body: (
            <>
                You start each sprint with a pile of tickets — bug reports, feature
                requests, tech debt. Here you triage them, estimate effort, and drag
                them across a Kanban board from <CMD>Backlog</CMD> through{" "}
                <CMD>In Progress</CMD> to <CMD>Done</CMD>.
            </>
        ),
        example: (
            <>
                Your PM files <CMD>TASK-42: Users can't reset password on mobile</CMD>.
                You size it at 3 points, pull it into the sprint, and move it to{" "}
                <CMD>In Progress</CMD>. After the fix you advance it to{" "}
                <CMD>In Review</CMD>, and once your teammate approves, it lands in{" "}
                <CMD>Done</CMD>. Sprint velocity: tracked.
            </>
        ),
        tags: ["kanban", "sprint-planning", "standups", "retros", "story-points"],
    },
    {
        id: "code",
        num: "02",
        title: "Code & VCS",
        oneLiner: "Branch, commit, review, merge.",
        body: (
            <>
                A file tree, a syntax-highlighted editor, and a full Git workflow.
                Create a feature branch, make changes, commit them, then open a pull
                request with a side-by-side diff — exactly the loop you do in VS Code +
                GitHub every day.
            </>
        ),
        example: (
            <>
                You checkout <CMD>feature/oauth-callback</CMD>, fix a null-pointer in{" "}
                <CMD>src/middleware/auth.js</CMD>, commit with the message{" "}
                <CMD>fix: guard against missing token</CMD>, and open PR #17.
                Your reviewer sees the diff, leaves a comment, and you merge to{" "}
                <CMD>main</CMD>.
            </>
        ),
        tags: ["git-branches", "pull-requests", "diffs", "commit-log"],
    },
    {
        id: "cicd",
        num: "03",
        title: "CI/CD Pipeline",
        oneLiner: "From push to production in six stages.",
        body: (
            <>
                Every merge kicks off a pipeline: <CMD>Lint</CMD> catches style issues,{" "}
                <CMD>Test</CMD> runs your suite, <CMD>Build</CMD> packages a Docker
                image, then the deploys roll through <CMD>Dev</CMD>, <CMD>Acc</CMD>, and{" "}
                <CMD>Prod</CMD>. You watch real terminal output at each stage.
            </>
        ),
        example: (
            <>
                You merge PR #17. The pipeline fires: ESLint scans 4 files, Jest runs
                23 tests (all green), Docker builds <CMD>ghcr.io/my-api:a1b2c3d</CMD>,
                and <CMD>kubectl</CMD> rolls it out to the dev namespace. Smoke tests
                pass. You promote to acc, then prod. Done — zero-downtime deploy.
            </>
        ),
        tags: ["lint", "jest", "docker", "kubectl", "yaml-config"],
    },
    {
        id: "infra",
        num: "04",
        title: "Infrastructure",
        oneLiner: "See where your code actually runs.",
        body: (
            <>
                Three environments side-by-side — Dev, Acc, Prod — each showing pod
                count, CPU usage, memory pressure, and deployment status. It's the
                dashboard an SRE checks at 2 AM when an alert fires.
            </>
        ),
        example: (
            <>
                Prod shows 4 healthy pods at 38% CPU after your latest deploy. Dev has
                2 pods running the canary build. Acc is idle — last deploy was
                yesterday. You spot that Dev memory is creeping toward the limit and
                file a ticket before it becomes a problem.
            </>
        ),
        tags: ["kubernetes", "pods", "cpu-memory", "environments"],
    },
];

/* ─── section row ───────────────────────────────────── */
function SectionRow({ section, onNavigate }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="group border-b border-border last:border-b-0">
            {/* main row — always visible */}
            <div
                className="flex items-start gap-5 px-5 py-5 cursor-pointer transition-colors hover:bg-surface-hover"
                onClick={() => onNavigate(section.id)}
            >
                {/* number */}
                <span className="font-mono text-xs text-muted pt-1 select-none w-6 text-right flex-shrink-0">
                    {section.num}
                </span>

                {/* content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-accent-bright transition-colors">
                            {section.title}
                        </h3>
                        <span className="text-sm text-muted">
                            {section.oneLiner}
                        </span>
                    </div>

                    <p className="mt-2 text-[13px] text-muted leading-relaxed max-w-2xl">
                        {section.body}
                    </p>

                    {/* tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {section.tags.map((t) => (
                            <Tag key={t}>{t}</Tag>
                        ))}
                    </div>
                </div>

                {/* right side: expand + go */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(!open);
                        }}
                        className="text-[11px] font-mono text-muted hover:text-accent-bright transition-colors cursor-pointer px-1"
                    >
                        {open ? "[-]" : "[+]"}
                    </button>
                    <svg
                        className="w-4 h-4 text-border-bright group-hover:text-accent-bright group-hover:translate-x-0.5 transition-all"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            {/* expandable example */}
            {open && (
                <div className="px-5 pb-5 pl-16 animate-slide-in">
                    <div className="rounded-lg bg-code-bg border border-border px-4 py-3 text-[13px] leading-relaxed">
                        <span className="font-mono text-[10px] text-accent-bright uppercase tracking-widest block mb-1.5">
                            scenario
                        </span>
                        <p className="text-muted">{section.example}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── main page ─────────────────────────────────────── */
export default function HomePage() {
    const { actions } = useStore();

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-12 md:py-20">

                {/* ── header ───────────────────────────────── */}
                <div className="mb-10">
                    <p className="font-mono text-[11px] text-accent-bright tracking-widest uppercase mb-3">
                        swe-sim v1.0
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug tracking-tight">
                        A sandbox for learning how
                        <br className="hidden sm:block" />
                        software teams ship code.
                    </h1>
                    <p className="mt-4 text-sm text-muted leading-relaxed max-w-xl">
                        Four tabs, one workflow. Plan a sprint, write code on a branch,
                        watch CI build and deploy it, then check the infra it lands on.
                        Everything here mirrors the tools and rituals used at places
                        like GitHub, Stripe, and Vercel — just compressed into something
                        you can explore in an afternoon.
                    </p>
                </div>

                {/* ── section list ─────────────────────────── */}
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                    {/* header bar */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-surface-hover/50">
                        <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                            sections
                        </span>
                        <span className="font-mono text-[11px] text-muted">
                            {SECTIONS.length} modules
                        </span>
                    </div>

                    {SECTIONS.map((s) => (
                        <SectionRow
                            key={s.id}
                            section={s}
                            onNavigate={(id) => actions.setTab(id)}
                        />
                    ))}
                </div>

                {/* ── footer hint ──────────────────────────── */}
                <p className="mt-6 text-center text-[11px] text-muted font-mono">
                    click a section to jump in — or hit{" "}
                    <span className="text-accent-bright">Start Tutorial</span> for a
                    guided run-through
                </p>
            </div>
        </div>
    );
}
