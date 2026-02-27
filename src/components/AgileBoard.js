"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";

const COLUMN_CONFIG = [
    { id: "backlog", label: "Backlog", color: "text-muted" },
    { id: "todo", label: "To Do", color: "text-info" },
    { id: "inProgress", label: "In Progress", color: "text-warning" },
    { id: "inReview", label: "In Review", color: "text-accent" },
    { id: "done", label: "Done", color: "text-success" },
];

const PRIORITY_COLORS = {
    high: "bg-error/20 text-error",
    medium: "bg-warning/20 text-warning",
    low: "bg-info/20 text-info",
};

function EduCallout({ children }) {
    return (
        <div className="edu-callout text-xs leading-relaxed mb-4">
            <span className="font-semibold text-accent">Learn:</span> {children}
        </div>
    );
}

function TaskCard({ task, columnId }) {
    const { state, actions } = useStore();
    const [showActions, setShowActions] = useState(false);

    const getNextColumn = (current) => {
        const order = ["backlog", "todo", "inProgress", "inReview", "done"];
        const idx = order.indexOf(current);
        return idx < order.length - 1 ? order[idx + 1] : null;
    };

    const getPrevColumn = (current) => {
        const order = ["backlog", "todo", "inProgress", "inReview", "done"];
        const idx = order.indexOf(current);
        return idx > 0 ? order[idx - 1] : null;
    };

    const next = getNextColumn(columnId);
    const prev = getPrevColumn(columnId);

    const handleMoveForward = () => {
        if (!next) return;
        actions.moveTask(task.id, columnId, next);

        if (next === "inProgress") {
            const branchName = `feature/${task.id.toLowerCase()}`;
            actions.createBranch(branchName);
            actions.addNotification({
                type: "info",
                title: "Branch Created",
                message: `Created branch '${branchName}' — switch to Code & VCS to start working.`,
            });
        }

        if (next === "done") {
            actions.addNotification({
                type: "success",
                title: "Task Complete",
                message: `"${task.title}" moved to Done`,
            });
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ taskId: task.id, from: columnId }));
            }}
            onClick={() => setShowActions(!showActions)}
            className="glass-card glass-card-hover p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] group"
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-mono text-muted">{task.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                </span>
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1 leading-snug">{task.title}</h4>
            <p className="text-xs text-muted leading-relaxed line-clamp-2">{task.description}</p>

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {task.points} pts
                    </span>
                    {task.branch && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-active text-muted font-mono">
                            {task.branch}
                        </span>
                    )}
                </div>
            </div>

            {showActions && (
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border animate-slide-in">
                    {prev && (
                        <button
                            onClick={(e) => { e.stopPropagation(); actions.moveTask(task.id, columnId, prev); }}
                            className="flex-1 text-[10px] py-1.5 rounded-md bg-surface-active hover:bg-surface-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                            &larr; {COLUMN_CONFIG.find((c) => c.id === prev)?.label}
                        </button>
                    )}
                    {next && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleMoveForward(); }}
                            className="flex-1 text-[10px] py-1.5 rounded-md bg-accent/20 hover:bg-accent/30 text-accent-bright transition-colors cursor-pointer"
                        >
                            {COLUMN_CONFIG.find((c) => c.id === next)?.label} &rarr;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function Column({ config, tasks }) {
    const { actions } = useStore();

    const handleDrop = (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.from !== config.id) {
            actions.moveTask(data.taskId, data.from, config.id);
        }
    };

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col min-w-[240px] flex-1"
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                <span className="text-xs text-muted bg-surface-active px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-h-[200px] p-2 rounded-xl bg-surface/40 border border-border/50">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} columnId={config.id} />
                ))}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted/50 border border-dashed border-border/50 rounded-lg">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}

function CeremonyModal() {
    const { state, actions } = useStore();
    const [sprintGoal, setSprintGoal] = useState("");
    const ceremony = state.ceremonies.active;

    if (!ceremony) return null;

    const ceremonyInfo = {
        planning: {
            title: "Sprint Planning",
            edu: "Sprint Planning is the first event of a sprint. The team decides WHAT to build (selects stories from the backlog) and HOW to build it (breaks stories into tasks). Typically lasts 2-4 hours for a 2-week sprint.",
        },
        standup: {
            title: "Daily Standup",
            edu: "The Daily Standup (or Daily Scrum) is a 15-minute time-boxed meeting. Each team member answers: 1) What did I do yesterday? 2) What will I do today? 3) Any blockers? It's about coordination, NOT status reporting.",
        },
        review: {
            title: "Sprint Review",
            edu: "Sprint Review is held at the end of the sprint to inspect the increment and adapt the backlog. The team demos completed work to stakeholders and gathers feedback. It's a working session, not a presentation.",
        },
        retro: {
            title: "Sprint Retrospective",
            edu: "The Retrospective is where the team inspects itself — processes, interactions, tools. They identify what went well, what didn't, and commit to improvements. This is the #1 driver of continuous improvement in Scrum.",
        },
    };

    const info = ceremonyInfo[ceremony];
    const todoCount = state.columns.todo.length;
    const inProgCount = state.columns.inProgress.length;
    const doneCount = state.columns.done.length;
    const velocity = state.columns.done.reduce((s, t) => s + (t.points || 0), 0);

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => actions.setCeremony(null)}>
            <div className="glass-card glow-accent max-w-lg w-full p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">{info.title}</h2>
                    <button onClick={() => actions.setCeremony(null)} className="text-muted hover:text-foreground transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <EduCallout>{info.edu}</EduCallout>

                {ceremony === "planning" && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted mb-1 block">Sprint Goal</label>
                            <input
                                value={sprintGoal}
                                onChange={(e) => setSprintGoal(e.target.value)}
                                placeholder="e.g. Complete user authentication flow..."
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                            />
                        </div>
                        <div className="text-xs text-muted">
                            <p><strong className="text-foreground">{state.columns.backlog.length}</strong> stories in backlog</p>
                            <p className="mt-1">Move stories from Backlog to To Do to plan your sprint, then start it below.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-surface-active rounded-lg p-3">
                            <span className="text-muted">Tip: A typical sprint has 20-40 story points of work for a team of 4-6 engineers.</span>
                        </div>
                        <button
                            onClick={() => { actions.startSprint(sprintGoal || "Deliver planned user stories"); actions.setCeremony(null); actions.addNotification({ type: "success", title: "Sprint Started", message: `Sprint ${state.sprint.number} is now active` }); }}
                            disabled={state.sprint.status === "active"}
                            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {state.sprint.status === "active" ? "Sprint Already Active" : "Start Sprint"}
                        </button>
                    </div>
                )}

                {ceremony === "standup" && (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs font-medium text-success mb-1">What was done:</p>
                                <p className="text-xs text-muted">{doneCount > 0 ? `Completed ${doneCount} task(s) this sprint so far.` : "No tasks completed yet in this sprint."}</p>
                            </div>
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs font-medium text-warning mb-1">Working on today:</p>
                                <ul className="text-xs text-muted space-y-1">
                                    {state.columns.inProgress.length > 0
                                        ? state.columns.inProgress.map((t) => <li key={t.id}>- {t.title} <span className="text-muted/50">({t.id})</span></li>)
                                        : <li>No tasks currently in progress.</li>}
                                </ul>
                            </div>
                            <div className="bg-surface rounded-lg p-3 border border-border">
                                <p className="text-xs font-medium text-error mb-1">Blockers:</p>
                                <p className="text-xs text-muted">No blockers reported. {state.columns.inProgress.length === 0 ? "Consider picking up a story from the To Do column." : ""}</p>
                            </div>
                        </div>
                        <button onClick={() => actions.setCeremony(null)} className="w-full py-2.5 rounded-lg bg-surface-active hover:bg-surface-hover text-foreground font-medium text-sm transition-colors cursor-pointer">
                            End Standup
                        </button>
                    </div>
                )}

                {ceremony === "review" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface rounded-lg p-3 border border-border text-center">
                                <p className="text-2xl font-bold text-success">{doneCount}</p>
                                <p className="text-[10px] text-muted mt-1">Stories Done</p>
                            </div>
                            <div className="bg-surface rounded-lg p-3 border border-border text-center">
                                <p className="text-2xl font-bold text-accent">{velocity}</p>
                                <p className="text-[10px] text-muted mt-1">Story Points</p>
                            </div>
                            <div className="bg-surface rounded-lg p-3 border border-border text-center">
                                <p className="text-2xl font-bold text-warning">{inProgCount + todoCount}</p>
                                <p className="text-[10px] text-muted mt-1">Remaining</p>
                            </div>
                        </div>
                        {state.sprintHistory.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-foreground mb-2">Velocity History</p>
                                <div className="flex items-end gap-2 h-16">
                                    {state.sprintHistory.map((s, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                            <div className="w-full bg-accent/30 rounded-t" style={{ height: `${Math.max(10, (s.velocity / 20) * 100)}%` }} />
                                            <span className="text-[8px] text-muted">S{s.number}</span>
                                        </div>
                                    ))}
                                    <div className="flex flex-col items-center gap-1 flex-1">
                                        <div className="w-full bg-accent rounded-t" style={{ height: `${Math.max(10, (velocity / 20) * 100)}%` }} />
                                        <span className="text-[8px] text-accent">S{state.sprint.number}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button onClick={() => actions.setCeremony(null)} className="w-full py-2.5 rounded-lg bg-surface-active hover:bg-surface-hover text-foreground font-medium text-sm transition-colors cursor-pointer">
                            Close Review
                        </button>
                    </div>
                )}

                {ceremony === "retro" && (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="bg-success-dim/30 rounded-lg p-3 border border-success/20">
                                <p className="text-xs font-medium text-success mb-2">What went well</p>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>- {doneCount > 0 ? `Completed ${doneCount} stories` : "Team showed up to standups consistently"}</li>
                                    <li>- Code reviews were thorough and timely</li>
                                    <li>- CI/CD pipeline caught issues early</li>
                                </ul>
                            </div>
                            <div className="bg-error-dim/30 rounded-lg p-3 border border-error/20">
                                <p className="text-xs font-medium text-error mb-2">What could improve</p>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>- {todoCount > 0 ? `${todoCount} stories still in To Do — over-committed?` : "Need better estimation"}</li>
                                    <li>- PR review turnaround could be faster</li>
                                </ul>
                            </div>
                            <div className="bg-info-dim/30 rounded-lg p-3 border border-info/20">
                                <p className="text-xs font-medium text-info mb-2">Action Items</p>
                                <ul className="text-xs text-muted space-y-1">
                                    <li>- Set WIP limit to 2 tasks per person</li>
                                    <li>- Add linting step to PR template</li>
                                </ul>
                            </div>
                        </div>
                        <button
                            onClick={() => { actions.completeSprint(); actions.setCeremony(null); actions.addNotification({ type: "success", title: "Sprint Complete", message: `Sprint ${state.sprint.number} archived. Starting fresh.` }); }}
                            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-white font-medium text-sm transition-colors cursor-pointer"
                        >
                            Complete Sprint & Start New
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AgileBoard() {
    const { state, actions } = useStore();

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 md:px-6 py-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-foreground">
                        Sprint {state.sprint.number}
                        {state.sprint.goal && <span className="text-xs text-muted font-normal ml-2">— {state.sprint.goal}</span>}
                    </h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${state.sprint.status === "active" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                        }`}>
                        {state.sprint.status}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {["planning", "standup", "review", "retro"].map((c) => (
                        <button
                            key={c}
                            onClick={() => actions.setCeremony(c)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-bright text-muted hover:text-foreground transition-all cursor-pointer capitalize"
                        >
                            {c === "planning" ? "Planning" : c === "standup" ? "Standup" : c === "review" ? "Review" : "Retro"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 px-4 md:px-6 pt-3">
                <EduCallout>
                    This is a <strong>Kanban board</strong> — a visual tool for managing work. Tasks move left to right through stages.
                    In Scrum, teams work in <strong>sprints</strong> (1-4 week cycles). Click the ceremony buttons above to simulate real Scrum events.
                    Try dragging a task from Backlog to To Do, then to In Progress to create a feature branch automatically.
                </EduCallout>
            </div>

            <div className="flex-1 overflow-x-auto px-4 md:px-6 py-4">
                <div className="flex gap-4 h-full min-w-max">
                    {COLUMN_CONFIG.map((col) => (
                        <Column key={col.id} config={col} tasks={state.columns[col.id]} />
                    ))}
                </div>
            </div>

            <CeremonyModal />
        </div>
    );
}
