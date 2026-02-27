"use client";
import { useEffect, useCallback } from "react";
import { useTutorial } from "@/lib/tutorial";
import { useStore } from "@/lib/store";

/* ── Markdown-lite renderer for step descriptions ──── */
function renderDescription(text) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        // Code blocks (inline)
        let processed = line.replace(/`([^`]+)`/g, '<code class="bg-surface-active px-1.5 py-0.5 rounded text-accent text-[11px] font-mono">$1</code>');
        // Bold
        processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');

        // Code block start/end (multi-line)
        if (line.trim() === "```" || line.trim().startsWith("```")) {
            return null; // skip code fence markers
        }

        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
            return (
                <div key={i} className="flex gap-2 ml-1">
                    <span className="text-accent font-medium flex-shrink-0">{line.trim().split(".")[0]}.</span>
                    <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, "") }} />
                </div>
            );
        }

        // Bullet list
        if (line.trim().startsWith("- ")) {
            return (
                <div key={i} className="flex gap-2 ml-1">
                    <span className="text-accent flex-shrink-0">-</span>
                    <span dangerouslySetInnerHTML={{ __html: processed.replace(/^- /, "") }} />
                </div>
            );
        }

        // Empty line
        if (line.trim() === "") {
            return <div key={i} className="h-2" />;
        }

        // Regular text
        return <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
}

/* ── Tutorial Modal ───────────────────────────────── */
export default function TutorialModal() {
    const { active, currentStep, stepIndex, totalSteps, next, skip } = useTutorial();
    const { state, actions } = useStore();

    // Auto-switch tabs when the tutorial step requires it
    useEffect(() => {
        if (active && currentStep?.tab && state.activeTab !== currentStep.tab) {
            actions.setTab(currentStep.tab);
        }
    }, [active, currentStep, state.activeTab, actions]);

    // Handle the merge conflict trigger step
    const handleConflictTrigger = useCallback(() => {
        // Simulate someone else editing the same file on main
        const currentContent = state.files["src/index.js"] || "";
        const conflictContent = currentContent.replace(
            "app.listen(3000, () => {",
            `<<<<<<< feature/story-108
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: Date.now() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

app.listen(3000, () => {
=======
// Added by teammate: request ID middleware
app.use((req, res, next) => {
  req.id = Math.random().toString(36).slice(2, 10);
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.listen(3000, () => {
>>>>>>> main`
        );
        actions.editFile(conflictContent);
        actions.addNotification({
            type: "error",
            title: "Merge Conflict Detected",
            message: "src/index.js has conflicting changes from main. Resolution required.",
        });
        next();
    }, [state.files, actions, next]);

    // Handle "Continue" / action buttons
    const handleAction = useCallback(() => {
        if (!currentStep) return;

        if (currentStep.action === "trigger-conflict") {
            handleConflictTrigger();
            return;
        }

        // For validation-based steps, check if the condition is met
        if (currentStep.validate && !currentStep.validate(state)) {
            // Not ready yet — don't advance
            return;
        }

        next();
    }, [currentStep, state, next, handleConflictTrigger]);

    // Auto-advance when validation passes for interactive steps
    useEffect(() => {
        if (!active || !currentStep?.validate) return;
        if (currentStep.validate(state)) {
            // Small delay so user sees the result of their action
            const timer = setTimeout(() => next(), 800);
            return () => clearTimeout(timer);
        }
    }, [active, currentStep, state, next]);

    if (!active || !currentStep) return null;

    const progress = ((stepIndex + 1) / totalSteps) * 100;
    const isCenter = currentStep.position === "center";
    const isInteractive = currentStep.validate && !currentStep.validate(state);
    const canContinue = !currentStep.validate || currentStep.validate(state);
    const isFinish = currentStep.action === "finish";
    const isContinue = currentStep.action === "continue" || currentStep.action === "trigger-conflict";

    return (
        <>
            {/* Backdrop for center modals */}
            {isCenter && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
            )}

            {/* Modal */}
            <div
                className={`fixed z-[70] animate-slide-in ${isCenter
                    ? "inset-0 flex items-center justify-center p-4"
                    : currentStep.position === "top"
                        ? "top-16 left-1/2 -translate-x-1/2 w-full max-w-xl px-4"
                        : "bottom-4 right-4 w-full max-w-md"
                    }`}
            >
                <div className={`glass-card glow-accent overflow-hidden ${isCenter ? "max-w-lg w-full" : "w-full"}`}>
                    {/* Progress bar */}
                    <div className="h-1 bg-surface-active">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                                        Step {stepIndex + 1} of {totalSteps}
                                    </span>
                                    {currentStep.tab && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-active text-muted">
                                            {currentStep.tab === "agile" ? "Agile Board" : currentStep.tab === "code" ? "Code & VCS" : currentStep.tab === "cicd" ? "CI/CD Pipeline" : "Infrastructure"}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base font-semibold text-foreground">{currentStep.title}</h3>
                            </div>
                            <button
                                onClick={skip}
                                className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer flex-shrink-0 ml-4"
                            >
                                Skip tutorial
                            </button>
                        </div>

                        {/* Description */}
                        <div className="text-xs text-muted leading-relaxed space-y-0.5 mb-4">
                            {renderDescription(currentStep.description)}
                        </div>

                        {/* Hint for interactive steps */}
                        {isInteractive && currentStep.hint && (
                            <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-xs text-accent-bright mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{currentStep.hint}</span>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalSteps, 16) }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === stepIndex ? "w-4 bg-accent" : i < stepIndex ? "w-2 bg-accent/40" : "w-2 bg-surface-active"
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {isInteractive && (
                                    <span className="text-[10px] text-muted animate-pulse">Waiting for you...</span>
                                )}
                                {(isContinue || canContinue || isFinish) && (
                                    <button
                                        onClick={isFinish ? skip : handleAction}
                                        className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-dim text-white text-xs font-medium transition-colors cursor-pointer"
                                    >
                                        {isFinish ? "Finish Tutorial" : currentStep.action === "trigger-conflict" ? "Simulate Conflict" : "Continue"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
