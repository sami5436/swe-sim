"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";

function EduCallout({ children }) {
    return (
        <div className="edu-callout text-xs leading-relaxed">
            <span className="font-semibold text-accent">Learn:</span> {children}
        </div>
    );
}

function FileTree() {
    const { state, actions } = useStore();
    const files = Object.keys(state.files).sort();

    const tree = useMemo(() => {
        const root = {};
        files.forEach((path) => {
            const parts = path.split("/");
            let current = root;
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    current[part] = path;
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            });
        });
        return root;
    }, [files]);

    const isModified = (path) => state.files[path] !== state.originalFiles[path];

    function renderNode(node, depth = 0) {
        return Object.entries(node).map(([name, value]) => {
            const isFile = typeof value === "string";
            const isActive = isFile && value === state.currentFile;
            const modified = isFile && isModified(value);
            return (
                <div key={name}>
                    <button
                        onClick={() => isFile && actions.setFile(value)}
                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${isActive ? "bg-accent/15 text-accent-bright" : "text-muted hover:text-foreground hover:bg-surface-hover"
                            }`}
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    >
                        <span className="opacity-60 text-[10px]">{isFile ? (
                            <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                        )}</span>
                        <span className="truncate">{name}</span>
                        {modified && <span className="ml-auto w-2 h-2 rounded-full bg-warning flex-shrink-0" />}
                    </button>
                    {!isFile && renderNode(value, depth + 1)}
                </div>
            );
        });
    }

    return <div className="flex flex-col py-1">{renderNode(tree)}</div>;
}

function DiffViewer({ original, modified, fileName }) {
    const origLines = (original || "").split("\n");
    const modLines = (modified || "").split("\n");
    const maxLen = Math.max(origLines.length, modLines.length);

    return (
        <div className="h-full overflow-auto">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs">
                <span className="text-error">--- a/{fileName}</span>
                <span className="text-muted">/</span>
                <span className="text-success">+++ b/{fileName}</span>
            </div>
            <div className="font-mono text-xs leading-5">
                {Array.from({ length: maxLen }).map((_, i) => {
                    const orig = origLines[i] || "";
                    const mod = modLines[i] || "";
                    const same = orig === mod;
                    if (same) {
                        return (
                            <div key={i} className="flex">
                                <span className="w-10 text-right pr-2 text-muted/40 select-none flex-shrink-0">{i + 1}</span>
                                <span className="flex-1 px-2 whitespace-pre">{orig}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={i}>
                            {orig && (
                                <div className="flex bg-error-dim/20">
                                    <span className="w-10 text-right pr-2 text-error/40 select-none flex-shrink-0">{i + 1}</span>
                                    <span className="flex-1 px-2 whitespace-pre text-error/80">- {orig}</span>
                                </div>
                            )}
                            {mod && (
                                <div className="flex bg-success-dim/20">
                                    <span className="w-10 text-right pr-2 text-success/40 select-none flex-shrink-0">{i + 1}</span>
                                    <span className="flex-1 px-2 whitespace-pre text-success/80">+ {mod}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function GitLog() {
    const { state } = useStore();
    return (
        <div className="space-y-1 p-3">
            {state.commits.map((commit, i) => (
                <div key={commit.sha} className="flex items-start gap-3 text-xs group">
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? "border-accent bg-accent" : "border-border bg-surface"}`} />
                        {i < state.commits.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                        <p className="font-medium text-foreground">{commit.message}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-muted">
                            <span className="font-mono text-accent/70">{commit.sha}</span>
                            <span>·</span>
                            <span>{commit.branch}</span>
                            <span>·</span>
                            <span>{commit.author}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PullRequests() {
    const { state, actions } = useStore();

    const handleMerge = (pr) => {
        actions.mergePR(pr.id);

        const latestCommit = state.commits.find((c) => c.branch === pr.branch) || state.commits[0];
        actions.triggerPipeline({
            commit: latestCommit.sha,
            branch: "main",
        });

        if (pr.taskId) {
            const inReview = state.columns.inReview.find((t) => t.id === pr.taskId);
            if (inReview) {
                actions.moveTask(pr.taskId, "inReview", "done");
            }
        }

        actions.addNotification({
            type: "success",
            title: "PR Merged & Pipeline Triggered",
            message: `${pr.id} merged into main — CI/CD pipeline started. Switch to the Pipeline tab to watch.`,
        });

        setTimeout(() => actions.setTab("cicd"), 500);
    };

    if (state.pullRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted text-xs p-6">
                <p className="font-medium mb-1">No pull requests yet</p>
                <p>Make changes, commit, and create a PR</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-3">
            {state.pullRequests.map((pr) => (
                <div key={pr.id} className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${pr.status === "open" ? "bg-success" : pr.status === "merged" ? "bg-accent" : "bg-error"}`} />
                            <span className="text-sm font-medium text-foreground">{pr.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted">{pr.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span className="font-mono bg-surface-active px-1.5 py-0.5 rounded">{pr.branch}</span>
                        <span>&rarr;</span>
                        <span className="font-mono bg-surface-active px-1.5 py-0.5 rounded">main</span>
                    </div>
                    {pr.description && <p className="text-xs text-muted">{pr.description}</p>}
                    {pr.status === "open" && (
                        <button
                            onClick={() => handleMerge(pr)}
                            className="w-full py-1.5 rounded-lg bg-success/20 hover:bg-success/30 text-success font-medium text-xs transition-colors cursor-pointer"
                        >
                            Approve & Merge
                        </button>
                    )}
                    {pr.status === "merged" && (
                        <div className="text-[10px] text-accent flex items-center gap-1">
                            Merged into main
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function CreatePRModal({ onClose }) {
    const { state, actions } = useStore();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const branchCommits = state.commits.filter((c) => c.branch === state.currentBranch);
    const linkedTask = [...state.columns.inProgress, ...state.columns.inReview].find(
        (t) => t.branch === state.currentBranch || `feature/${t.id.toLowerCase()}` === state.currentBranch
    );

    const handleCreate = () => {
        actions.createPR({
            title: title || `Merge ${state.currentBranch} into main`,
            description,
            taskId: linkedTask?.id || null,
        });

        if (linkedTask) {
            const currentCol = state.columns.inProgress.find((t) => t.id === linkedTask.id) ? "inProgress" : null;
            if (currentCol) {
                actions.moveTask(linkedTask.id, currentCol, "inReview");
            }
        }

        actions.addNotification({
            type: "info",
            title: "Pull Request Created",
            message: `Ready for review: ${state.currentBranch} to main`,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card glow-accent max-w-md w-full p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Create Pull Request</h2>
                    <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <EduCallout>
                    A <strong>Pull Request</strong> (PR) is how you propose changes to the codebase.
                    Other developers review your code, leave comments, and approve before it gets merged into the main branch.
                    This is a key quality gate in professional teams.
                </EduCallout>

                <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono bg-surface-active px-2 py-1 rounded text-accent">{state.currentBranch}</span>
                        <span className="text-muted">&rarr;</span>
                        <span className="font-mono bg-surface-active px-2 py-1 rounded text-foreground">main</span>
                    </div>

                    {linkedTask && (
                        <div className="text-xs bg-accent/10 rounded-lg p-2 text-accent-bright">
                            Linked to: <strong>{linkedTask.id}</strong> — {linkedTask.title}
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-muted mb-1 block">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`Merge ${state.currentBranch} into main`}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your changes..."
                            rows={3}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
                        />
                    </div>

                    <div className="text-xs text-muted">
                        {branchCommits.length} commit(s) on this branch
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={state.currentBranch === "main"}
                        className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {state.currentBranch === "main" ? "Switch to a feature branch first" : "Create Pull Request"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CodeEditor() {
    const { state, actions } = useStore();
    const [commitMsg, setCommitMsg] = useState("");
    const [newBranch, setNewBranch] = useState("");
    const [showNewBranch, setShowNewBranch] = useState(false);
    const [showPRModal, setShowPRModal] = useState(false);
    const [rightPanel, setRightPanel] = useState("staging");

    const currentContent = state.files[state.currentFile] || "";
    const originalContent = state.originalFiles[state.currentFile] || "";
    const isModified = currentContent !== originalContent;
    const modifiedFiles = Object.keys(state.files).filter((f) => state.files[f] !== state.originalFiles[f]);
    const lines = currentContent.split("\n");

    const handleCommit = () => {
        if (!commitMsg.trim() || state.stagedFiles.length === 0) return;
        actions.commit(commitMsg);
        actions.addNotification({
            type: "success",
            title: "Changes Committed",
            message: `"${commitMsg}" — ${state.stagedFiles.length} file(s)`,
        });
        setCommitMsg("");
    };

    const handleCreateBranch = () => {
        if (!newBranch.trim()) return;
        actions.createBranch(newBranch.trim().replace(/\s+/g, "-"));
        setNewBranch("");
        setShowNewBranch(false);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 md:px-6 py-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted">branch:</span>
                        <select
                            value={state.currentBranch}
                            onChange={(e) => actions.switchBranch(e.target.value)}
                            className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent/50 cursor-pointer"
                        >
                            {state.branches.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowNewBranch(!showNewBranch)}
                            className="text-xs px-2 py-1 rounded-md bg-surface-active hover:bg-surface-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                            title="New branch"
                        >
                            +
                        </button>
                    </div>
                    {showNewBranch && (
                        <div className="flex items-center gap-1 animate-slide-in">
                            <input
                                value={newBranch}
                                onChange={(e) => setNewBranch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateBranch()}
                                placeholder="feature/my-feature"
                                className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 w-48"
                            />
                            <button onClick={handleCreateBranch} className="text-xs px-2 py-1 rounded-md bg-accent/20 text-accent-bright cursor-pointer">
                                Create
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => actions.toggleDiff()}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${state.showDiff ? "bg-accent/20 text-accent-bright border border-accent/30" : "bg-surface border border-border text-muted hover:text-foreground"
                            }`}
                    >
                        {state.showDiff ? "Editor" : "Diff"}
                    </button>
                    <button
                        onClick={() => setShowPRModal(true)}
                        disabled={state.currentBranch === "main"}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Create PR
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 px-4 md:px-6 pt-3">
                <EduCallout>
                    <strong>Version Control (Git)</strong> lets you track changes, work on features in isolation via <strong>branches</strong>,
                    and collaborate through <strong>pull requests</strong>. Edit a file below, stage it, write a commit message, and commit — just like using Git in a real project.
                    When you&apos;re ready, create a PR to merge your changes and trigger the CI/CD pipeline.
                </EduCallout>
            </div>

            <div className="flex-1 flex overflow-hidden mt-3">
                <div className="w-48 flex-shrink-0 border-r border-border overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-wider">Explorer</div>
                    <FileTree />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center border-b border-border px-3 h-8 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-foreground">{state.currentFile.split("/").pop()}</span>
                            {isModified && <span className="w-2 h-2 rounded-full bg-warning" />}
                            <span className="text-muted/40 ml-1 font-mono text-[10px]">{state.currentFile}</span>
                        </div>
                    </div>

                    {state.showDiff ? (
                        <DiffViewer original={originalContent} modified={currentContent} fileName={state.currentFile} />
                    ) : (
                        <div className="flex-1 overflow-auto bg-editor-bg">
                            <div className="flex min-h-full">
                                <div className="flex-shrink-0 w-12 text-right pr-3 py-3 select-none">
                                    {lines.map((_, i) => (
                                        <div key={i} className="text-[11px] leading-5 font-mono text-muted/30">{i + 1}</div>
                                    ))}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={currentContent}
                                        onChange={(e) => actions.editFile(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-transparent text-foreground font-mono text-[13px] leading-5 p-3 resize-none focus:outline-none"
                                        spellCheck={false}
                                        style={{ tabSize: 2 }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto flex flex-col">
                    <div className="flex border-b border-border flex-shrink-0">
                        {[
                            { id: "staging", label: "Changes" },
                            { id: "log", label: "Log" },
                            { id: "prs", label: `PRs (${state.pullRequests.length})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setRightPanel(tab.id)}
                                className={`flex-1 py-2 text-[10px] font-medium transition-colors cursor-pointer ${rightPanel === tab.id ? "text-accent-bright border-b-2 border-accent" : "text-muted hover:text-foreground"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {rightPanel === "staging" && (
                        <div className="flex-1 p-3 space-y-3">
                            <div>
                                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Changed Files</p>
                                {modifiedFiles.length === 0 ? (
                                    <p className="text-xs text-muted/50">No changes detected</p>
                                ) : (
                                    <div className="space-y-1">
                                        {modifiedFiles.map((f) => {
                                            const staged = state.stagedFiles.includes(f);
                                            return (
                                                <div key={f} className="flex items-center justify-between text-xs group">
                                                    <span className={`truncate ${staged ? "text-success" : "text-warning"}`}>
                                                        {staged ? "+" : "M"} {f.split("/").pop()}
                                                    </span>
                                                    <button
                                                        onClick={() => staged ? actions.unstageFile(f) : actions.stageFile(f)}
                                                        className="opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded bg-surface-active text-muted hover:text-foreground transition-all cursor-pointer"
                                                    >
                                                        {staged ? "Unstage" : "Stage"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {modifiedFiles.length > 0 && (
                                <button
                                    onClick={() => {
                                        const allStaged = modifiedFiles.every((f) => state.stagedFiles.includes(f));
                                        modifiedFiles.forEach((f) => allStaged ? actions.unstageFile(f) : actions.stageFile(f));
                                    }}
                                    className="w-full text-[10px] py-1.5 rounded-md bg-surface-active hover:bg-surface-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {modifiedFiles.every((f) => state.stagedFiles.includes(f)) ? "Unstage All" : "Stage All"}
                                </button>
                            )}

                            <div className="pt-2 border-t border-border">
                                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Commit</p>
                                <input
                                    value={commitMsg}
                                    onChange={(e) => setCommitMsg(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCommit()}
                                    placeholder="feat: add user endpoint..."
                                    className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 mb-2"
                                />
                                <button
                                    onClick={handleCommit}
                                    disabled={!commitMsg.trim() || state.stagedFiles.length === 0}
                                    className="w-full py-1.5 rounded-md bg-accent/20 hover:bg-accent/30 text-accent-bright text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Commit ({state.stagedFiles.length} staged)
                                </button>
                            </div>
                        </div>
                    )}

                    {rightPanel === "log" && <GitLog />}
                    {rightPanel === "prs" && <PullRequests />}
                </div>
            </div>

            {showPRModal && <CreatePRModal onClose={() => setShowPRModal(false)} />}
        </div>
    );
}
