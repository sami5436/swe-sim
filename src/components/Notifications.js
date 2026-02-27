"use client";
import { useStore } from "@/lib/store";

export default function Notifications() {
    const { state, actions } = useStore();

    if (state.notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {state.notifications.slice(0, 5).map((n) => (
                <div
                    key={n.id}
                    className={`animate-slide-in glass-card p-3 flex items-start gap-3 text-sm ${n.type === "success" ? "border-success/30" : n.type === "error" ? "border-error/30" : "border-accent/30"
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "success" ? "bg-success" : n.type === "error" ? "bg-error" : "bg-accent"
                        }`} />
                    <div className="flex-1">
                        <p className="font-medium">{n.title}</p>
                        {n.message && <p className="text-muted text-xs mt-0.5">{n.message}</p>}
                    </div>
                    <button
                        onClick={() => actions.dismissNotification(n.id)}
                        className="text-muted hover:text-foreground text-xs cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}
