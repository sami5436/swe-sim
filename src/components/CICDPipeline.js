"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore, PIPELINE_YAML } from "@/lib/store";

function EduCallout({ children }) {
    return (
        <div className="edu-callout text-xs leading-relaxed">
            <span className="font-semibold text-accent">Learn:</span> {children}
        </div>
    );
}

/* ── Simulated Logs ────────────────────────────────── */
const STAGE_LOGS = {
    "Lint": [
        "$ eslint src/ --ext .js",
        "Scanning 4 files...",
        "src/index.js — no issues",
        "src/routes/users.js — no issues",
        "src/middleware/auth.js — no issues",
        "src/db.js — no issues",
        "",
        "0 errors, 0 warnings",
        "Lint passed in 1.2s",
    ],
    "Test": [
        "$ vitest run",
        "",
        " PASS tests/users.test.js (2 tests) 145ms",
        "   - GET /api/users returns user list",
        "   - POST /api/users creates a new user",
        "",
        " Test Files  1 passed (1)",
        " Tests       2 passed (2)",
        " Duration    0.89s",
        "",
        "All tests passed",
    ],
    "Build": [
        "$ docker build -t ghcr.io/my-api:a1b2c3d .",
        "Step 1/8 : FROM node:20-alpine",
        " ---> Using cache",
        "Step 2/8 : WORKDIR /app",
        " ---> Using cache",
        "Step 3/8 : COPY package*.json ./",
        " ---> 3f8a92b1c4d2",
        "Step 4/8 : RUN npm ci --production",
        " ---> Running in 1a2b3c4d5e6f",
        "added 48 packages in 2.1s",
        "Step 5/8 : COPY src/ ./src/",
        " ---> 7e8f9a0b1c2d",
        "Step 6/8 : EXPOSE 3000",
        "Step 7/8 : HEALTHCHECK CMD curl -f http://localhost:3000/health",
        "Step 8/8 : CMD [\"node\", \"src/index.js\"]",
        " ---> Built 4.8s",
        "",
        "Pushing ghcr.io/my-api:a1b2c3d...",
        "Image pushed successfully",
    ],
    "Deploy Dev": [
        "$ kubectl set image deployment/api api=ghcr.io/my-api:a1b2c3d --namespace=dev",
        "deployment.apps/api image updated",
        "",
        "$ kubectl rollout status deployment/api --namespace=dev",
        "Waiting for deployment rollout to finish: 0 of 1 updated replicas available...",
        "deployment \"api\" successfully rolled out",
        "",
        "Verifying health...",
        "GET https://dev.api.myapp.com/health -> 200 OK (42ms)",
        "Dev deployment complete",
    ],
    "Deploy Acc": [
        "$ kubectl set image deployment/api api=ghcr.io/my-api:a1b2c3d --namespace=acc",
        "deployment.apps/api image updated",
        "",
        "$ kubectl rollout status deployment/api --namespace=acc",
        "Waiting for deployment rollout to finish: 0 of 2 updated replicas available...",
        "Waiting for deployment rollout to finish: 1 of 2 updated replicas available...",
        "deployment \"api\" successfully rolled out",
        "",
        "Running smoke tests against acceptance...",
        "$ npm run test:smoke -- --env=acc",
        "  PASS: Health check (23ms)",
        "  PASS: User list endpoint (45ms)",
        "  PASS: Auth flow (112ms)",
        "All smoke tests passed",
        "",
        "Acc deployment complete",
    ],
    "Deploy Prod": [
        "$ kubectl set image deployment/api api=ghcr.io/my-api:a1b2c3d --namespace=prod",
        "deployment.apps/api image updated",
        "",
        "$ kubectl rollout status deployment/api --namespace=prod",
        "Waiting for deployment rollout to finish: 0 of 3 updated replicas available...",
        "Waiting for deployment rollout to finish: 1 of 3 updated replicas available...",
        "Waiting for deployment rollout to finish: 2 of 3 updated replicas available...",
        "deployment \"api\" successfully rolled out",
        "",
        "Running smoke tests against production...",
        "$ npm run test:smoke -- --env=prod",
        "  PASS: Health check (18ms)",
        "  PASS: User list endpoint (32ms)",
        "  PASS: Auth flow (89ms)",
        "All smoke tests passed",
        "",
        "GET https://api.myapp.com/health -> 200 OK (18ms)",
        "Production deployment complete",
    ],
};

const STAGE_DESCRIPTIONS = {
    "Lint": "Static analysis checks your code for style issues, syntax errors, and potential bugs WITHOUT running it. Think of it as spell-check for code.",
    "Test": "Automated tests run your code against expected behaviors. If any test fails, the pipeline stops — catching bugs before they reach users.",
    "Build": "The build step compiles your source code into a Docker container image, tags it with the commit SHA, and pushes it to a container registry.",
    "Deploy Dev": "The Development environment is the first deployment target. It runs the latest code for developers to test against. Usually has minimal resources.",
    "Deploy Acc": "The Acceptance (or Staging) environment mirrors production. QA and stakeholders validate features here before they go live. Smoke tests run automatically.",
    "Deploy Prod": "Production is the live environment serving real users. This is the final gate — only code that passed through Dev and Acc reaches here.",
};

/* ── Stage Node ────────────────────────────────────── */
function StageNode({ stage, index, onClick, selected, isLast }) {
    const statusColors = {
        pending: "border-border text-muted bg-surface",
        running: "border-accent text-accent bg-accent/10 animate-pulse-stage glow-accent",
        passed: "border-success text-success bg-success/10 glow-success",
        failed: "border-error text-error bg-error/10 glow-error",
    };

    const isDeployStage = stage.name.startsWith("Deploy");

    return (
        <div className="flex items-center gap-0 flex-1">
            <button
                onClick={() => onClick(index)}
                className={`relative flex flex-col items-center justify-center w-full py-4 px-3 rounded-xl border-2 transition-all duration-300 cursor-pointer ${statusColors[stage.status]} ${selected ? "ring-2 ring-accent/30 scale-105" : ""
                    }`}
            >
                <span className="text-xs font-semibold">{stage.name}</span>
                <span className="text-[10px] mt-1 opacity-70 capitalize">{stage.status}</span>
                {stage.env && (
                    <span className={`text-[8px] mt-0.5 px-1.5 py-px rounded-full font-medium ${stage.env === "prod" ? "bg-error/20 text-error" : stage.env === "acc" ? "bg-warning/20 text-warning" : "bg-info/20 text-info"
                        }`}>
                        {stage.env}
                    </span>
                )}
                {stage.duration && (
                    <span className="text-[10px] mt-0.5 opacity-50">{stage.duration}</span>
                )}
            </button>
            {!isLast && (
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                    <div className={`h-0.5 w-full transition-colors duration-500 ${stage.status === "passed" ? "bg-success" : stage.status === "running" ? "bg-accent animate-pulse" : "bg-border"
                        }`} />
                </div>
            )}
        </div>
    );
}

/* ── Log Viewer ────────────────────────────────────── */
function LogViewer({ logs, stageName }) {
    const logRef = useRef(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="glass-card overflow-hidden flex flex-col h-64">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/60">
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="font-mono text-muted">{stageName} — logs</span>
                </div>
                <span className="text-[10px] text-muted">{logs.length} lines</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-auto p-4 bg-code-bg">
                <pre className="font-mono text-xs leading-5 text-foreground/80">
                    {logs.map((line, i) => (
                        <div key={i} className={`${line.includes("passed") || line.includes("complete") || line.includes("successfully") || line.includes("PASS") || line.startsWith("  PASS") ? "text-success" : line.includes("FAIL") || line.includes("error") ? "text-error" : line.startsWith("$") ? "text-accent" : ""}`}>
                            {line}
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    );
}

/* ── YAML Viewer ───────────────────────────────────── */
function YAMLViewer() {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">.github/workflows/ci-cd.yml</h3>
                <p className="text-xs text-muted mt-0.5">GitHub Actions pipeline configuration</p>
            </div>
            <div className="flex-shrink-0 px-4 pt-3">
                <EduCallout>
                    This is a <strong>GitHub Actions workflow file</strong> written in YAML. It defines what happens when you push code — which jobs run,
                    in what order, and on what infrastructure. The <code className="bg-surface-active px-1 rounded text-xs">needs</code> keyword creates
                    dependencies between jobs (e.g., deploy only runs after tests pass). Each environment (dev, acc, prod) is a separate job with its own
                    approval gates.
                </EduCallout>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-code-bg mt-3">
                <pre className="font-mono text-xs leading-5">
                    {PIPELINE_YAML.split("\n").map((line, i) => {
                        let color = "text-foreground/80";
                        if (line.trim().startsWith("#")) color = "text-muted/60";
                        else if (line.trim().startsWith("-")) color = "text-foreground/70";
                        else if (line.includes(":") && !line.trim().startsWith("-")) {
                            const key = line.split(":")[0];
                            return (
                                <div key={i} className="flex">
                                    <span className="w-10 text-right pr-3 text-muted/30 select-none">{i + 1}</span>
                                    <span>
                                        <span className="text-accent">{key}</span>
                                        <span className="text-foreground/80">{line.slice(key.length)}</span>
                                    </span>
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="flex">
                                <span className="w-10 text-right pr-3 text-muted/30 select-none">{i + 1}</span>
                                <span className={color}>{line}</span>
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
}

/* ── Pipeline Run Card ─────────────────────────────── */
function PipelineRunCard({ run, isActive, onClick }) {
    const statusColors = {
        running: "border-accent/30 bg-accent/5",
        passed: "border-success/30 bg-success/5",
        failed: "border-error/30 bg-error/5",
    };

    return (
        <button
            onClick={onClick}
            className={`w-full text-left glass-card p-3 transition-all cursor-pointer ${statusColors[run.status]} ${isActive ? "ring-1 ring-accent/30" : ""
                }`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{run.id}</span>
                <span className={`w-2 h-2 rounded-full ${run.status === "running" ? "bg-accent animate-pulse" : run.status === "passed" ? "bg-success" : "bg-error"
                    }`} />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted">
                <span className="font-mono">{run.commit}</span>
                <span>·</span>
                <span>{run.branch}</span>
            </div>
        </button>
    );
}

/* ── Main CI/CD Pipeline ──────────────────────────── */
export default function CICDPipeline() {
    const { state, actions } = useStore();
    const [selectedStage, setSelectedStage] = useState(null);
    const [selectedRun, setSelectedRun] = useState(null);
    const [viewMode, setViewMode] = useState("pipeline"); // pipeline | yaml
    const runningRef = useRef(false);

    const activeRun = state.pipelineRuns.find((r) => r.id === (selectedRun || state.activePipeline));
    const displayRun = activeRun || state.pipelineRuns[0];

    /* ── Pipeline simulation ── */
    const simulatePipeline = useCallback(
        (runId) => {
            if (runningRef.current) return;
            runningRef.current = true;

            const stageNames = ["Lint", "Test", "Build", "Deploy Dev", "Deploy Acc", "Deploy Prod"];
            const durations = [1200, 1800, 2500, 1500, 2000, 2000];

            let stageIdx = 0;

            const runStage = () => {
                if (stageIdx >= stageNames.length) {
                    actions.completePipeline(runId, "passed");
                    actions.addNotification({
                        type: "success",
                        title: "Pipeline Passed",
                        message: "All stages completed — deployment successful across all environments.",
                    });
                    runningRef.current = false;
                    return;
                }

                const stageName = stageNames[stageIdx];
                const logs = STAGE_LOGS[stageName];
                const duration = durations[stageIdx];

                actions.updateStage(runId, stageIdx, { status: "running", logs: [] });
                setSelectedStage(stageIdx);

                let logIdx = 0;
                const logInterval = setInterval(() => {
                    if (logIdx < logs.length) {
                        actions.updateStage(runId, stageIdx, {
                            status: "running",
                            logs: logs.slice(0, logIdx + 1),
                        });
                        logIdx++;
                    } else {
                        clearInterval(logInterval);
                        const stage = stageNames[stageIdx];
                        const envMatch = stage.match(/Deploy (\w+)/);
                        if (envMatch) {
                            const envShort = envMatch[1].toLowerCase();
                            actions.updateInfraDeploy(envShort, "a1b2c3d");
                        }
                        actions.updateStage(runId, stageIdx, {
                            status: "passed",
                            logs,
                            duration: `${(duration / 1000).toFixed(1)}s`,
                        });
                        stageIdx++;
                        setTimeout(runStage, 400);
                    }
                }, duration / logs.length);
            };

            setTimeout(runStage, 300);
        },
        [actions]
    );

    useEffect(() => {
        const runningPipeline = state.pipelineRuns.find((r) => r.status === "running" && r.stages[0].status === "pending");
        if (runningPipeline && !runningRef.current) {
            simulatePipeline(runningPipeline.id);
        }
    }, [state.pipelineRuns, simulatePipeline]);

    const handleManualTrigger = () => {
        const latestCommit = state.commits[0];
        actions.triggerPipeline({
            commit: latestCommit.sha,
            branch: state.currentBranch,
        });
        actions.addNotification({
            type: "info",
            title: "Pipeline Triggered",
            message: `Running on ${state.currentBranch} @ ${latestCommit.sha}`,
        });
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 md:px-6 py-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-foreground">CI/CD Pipeline</h2>
                    {displayRun && viewMode === "pipeline" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${displayRun.status === "running" ? "bg-accent/20 text-accent" : displayRun.status === "passed" ? "bg-success/20 text-success" : "bg-error/20 text-error"
                            }`}>
                            {displayRun.status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-border overflow-hidden">
                        <button
                            onClick={() => setViewMode("pipeline")}
                            className={`text-xs px-3 py-1.5 transition-colors cursor-pointer ${viewMode === "pipeline" ? "bg-accent/15 text-accent-bright" : "text-muted hover:text-foreground"}`}
                        >
                            Pipeline
                        </button>
                        <button
                            onClick={() => setViewMode("yaml")}
                            className={`text-xs px-3 py-1.5 transition-colors cursor-pointer border-l border-border ${viewMode === "yaml" ? "bg-accent/15 text-accent-bright" : "text-muted hover:text-foreground"}`}
                        >
                            YAML Config
                        </button>
                    </div>
                    {viewMode === "pipeline" && (
                        <button
                            onClick={handleManualTrigger}
                            className="text-xs px-4 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent-bright font-medium transition-colors cursor-pointer"
                        >
                            Run Pipeline
                        </button>
                    )}
                </div>
            </div>

            {viewMode === "yaml" ? (
                <YAMLViewer />
            ) : (
                <>
                    {/* Educational Callout */}
                    <div className="flex-shrink-0 px-4 md:px-6 pt-3">
                        <EduCallout>
                            <strong>CI/CD</strong> = Continuous Integration / Continuous Deployment. When you push code, an automated pipeline runs:
                            <strong> Lint</strong> (check code style) &rarr; <strong>Test</strong> (run tests) &rarr; <strong>Build</strong> (containerize) &rarr;
                            <strong> Deploy Dev</strong> &rarr; <strong>Deploy Acc</strong> &rarr; <strong>Deploy Prod</strong>.
                            Each environment is a gate — code must pass through dev and acceptance before reaching production.
                        </EduCallout>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Main pipeline area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            {displayRun ? (
                                <>
                                    {/* Pipeline Stages */}
                                    <div className="flex items-center gap-0">
                                        {displayRun.stages.map((stage, i) => (
                                            <StageNode
                                                key={stage.name}
                                                stage={stage}
                                                index={i}
                                                onClick={setSelectedStage}
                                                selected={selectedStage === i}
                                                isLast={i === displayRun.stages.length - 1}
                                            />
                                        ))}
                                    </div>

                                    {/* Stage Detail */}
                                    {selectedStage !== null && displayRun.stages[selectedStage] && (
                                        <div className="animate-slide-in space-y-3">
                                            <div className="glass-card p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {displayRun.stages[selectedStage].name}
                                                    </h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${displayRun.stages[selectedStage].status === "running" ? "bg-accent/20 text-accent" :
                                                            displayRun.stages[selectedStage].status === "passed" ? "bg-success/20 text-success" :
                                                                displayRun.stages[selectedStage].status === "failed" ? "bg-error/20 text-error" :
                                                                    "bg-surface-active text-muted"
                                                        }`}>
                                                        {displayRun.stages[selectedStage].status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted leading-relaxed">
                                                    {STAGE_DESCRIPTIONS[displayRun.stages[selectedStage].name]}
                                                </p>
                                            </div>

                                            {displayRun.stages[selectedStage].logs.length > 0 && (
                                                <LogViewer
                                                    logs={displayRun.stages[selectedStage].logs}
                                                    stageName={displayRun.stages[selectedStage].name}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Deployment Result */}
                                    {displayRun.status === "passed" && (
                                        <div className="glass-card glow-success p-5 animate-slide-in">
                                            <div className="mb-3">
                                                <h3 className="text-sm font-semibold text-success">All Deployments Successful</h3>
                                                <p className="text-xs text-muted">Pipeline complete — code deployed across all environments.</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {["dev", "acc", "prod"].map((env) => (
                                                    <div key={env} className="bg-surface rounded-lg p-3 text-center">
                                                        <p className="text-[10px] text-muted mb-1 uppercase">{env}</p>
                                                        <p className={`text-xs font-medium ${env === "prod" ? "text-success" : "text-foreground"}`}>Deployed</p>
                                                        <p className="text-[10px] font-mono text-muted mt-0.5">{displayRun.commit}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted">
                                    <h3 className="text-lg font-semibold text-foreground mb-1">No Pipeline Runs Yet</h3>
                                    <p className="text-sm text-center max-w-md">
                                        Pipelines are triggered automatically when you merge a pull request, or you can run one manually above.
                                        Go to the Code & VCS tab to make changes, commit, and create a PR.
                                    </p>
                                    <p className="text-xs text-muted mt-3">
                                        Tip: Check the YAML Config tab to see exactly what the pipeline runs.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar — Run History */}
                        <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto">
                            <div className="px-3 py-2 border-b border-border">
                                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Pipeline History</p>
                            </div>
                            <div className="p-2 space-y-2">
                                {state.pipelineRuns.length === 0 ? (
                                    <p className="text-xs text-muted/50 p-3 text-center">No runs yet</p>
                                ) : (
                                    state.pipelineRuns.map((run) => (
                                        <PipelineRunCard
                                            key={run.id}
                                            run={run}
                                            isActive={displayRun?.id === run.id}
                                            onClick={() => setSelectedRun(run.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
