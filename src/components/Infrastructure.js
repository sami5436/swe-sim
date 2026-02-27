"use client";
import { useStore } from "@/lib/store";

function EduCallout({ children }) {
    return (
        <div className="edu-callout text-xs leading-relaxed">
            <span className="font-semibold text-accent">Learn:</span> {children}
        </div>
    );
}

function StatusDot({ status }) {
    const colors = {
        healthy: "bg-success",
        degraded: "bg-warning",
        down: "bg-error",
        running: "bg-success",
        stopped: "bg-error",
    };
    return <span className={`w-2 h-2 rounded-full ${colors[status] || "bg-muted"}`} />;
}

function ResourceBar({ label, used, total, unit }) {
    const pct = (used / total) * 100;
    const color = pct > 80 ? "bg-error" : pct > 60 ? "bg-warning" : "bg-success";

    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">{label}</span>
                <span className="text-foreground font-medium">{used} / {total} {unit}</span>
            </div>
            <div className="h-2 bg-surface-active rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function Infrastructure() {
    const { state } = useStore();
    const { environments, services, resources } = state.infra;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 md:px-6 py-3">
                <h2 className="text-sm font-semibold text-foreground">Infrastructure</h2>
                <div className="flex items-center gap-2 text-xs text-muted">
                    <StatusDot status="healthy" />
                    <span>All systems operational</span>
                </div>
            </div>

            {/* Educational Callout */}
            <div className="flex-shrink-0 px-4 md:px-6 pt-3">
                <EduCallout>
                    <strong>Infrastructure</strong> is the set of servers, databases, and network resources that run your application.
                    Modern teams use <strong>Kubernetes (k8s)</strong> clusters across multiple <strong>environments</strong> — Dev for testing,
                    Acceptance for QA, and Production for real users. Each environment is isolated with its own resources, scaling configs, and URLs.
                </EduCallout>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Environments */}
                <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Environments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {environments.map((env) => (
                            <div key={env.shortName} className={`glass-card p-4 space-y-3 ${env.shortName === "prod" ? "border-success/30" : ""
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={env.status} />
                                        <h4 className="text-sm font-semibold text-foreground">{env.name}</h4>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${env.shortName === "prod" ? "bg-error/20 text-error" :
                                            env.shortName === "acc" ? "bg-warning/20 text-warning" :
                                                "bg-info/20 text-info"
                                        }`}>
                                        {env.shortName}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted">URL</span>
                                        <span className="text-accent font-mono text-[10px]">{env.url}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Cluster</span>
                                        <span className="text-foreground font-mono text-[10px]">{env.cluster}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Replicas</span>
                                        <span className="text-foreground">{env.replicas}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">CPU / Memory</span>
                                        <span className="text-foreground">{env.cpu} / {env.memory}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Uptime</span>
                                        <span className="text-success">{env.uptime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Version</span>
                                        <span className="text-foreground font-mono">{env.version}</span>
                                    </div>
                                    {env.lastDeploy && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">Last Deploy</span>
                                            <span className="text-foreground">{new Date(env.lastDeploy).toLocaleTimeString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cluster Resources */}
                <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Cluster Resources (Production)</h3>
                    <div className="glass-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResourceBar label="CPU" used={resources.cpu.used} total={resources.cpu.total} unit={resources.cpu.unit} />
                        <ResourceBar label="Memory" used={resources.memory.used} total={resources.memory.total} unit={resources.memory.unit} />
                        <ResourceBar label="Pods" used={resources.pods.used} total={resources.pods.total} unit={resources.pods.unit} />
                        <ResourceBar label="Storage" used={resources.storage.used} total={resources.storage.total} unit={resources.storage.unit} />
                    </div>
                </div>

                {/* Services */}
                <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Services</h3>
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted">
                                    <th className="text-left px-4 py-2 font-medium">Service</th>
                                    <th className="text-left px-4 py-2 font-medium">Type</th>
                                    <th className="text-left px-4 py-2 font-medium">Replicas</th>
                                    <th className="text-left px-4 py-2 font-medium">Port</th>
                                    <th className="text-left px-4 py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((svc) => (
                                    <tr key={svc.name} className="border-b border-border/50 text-xs">
                                        <td className="px-4 py-2.5 text-foreground font-medium">{svc.name}</td>
                                        <td className="px-4 py-2.5 text-muted font-mono text-[10px]">{svc.type}</td>
                                        <td className="px-4 py-2.5 text-foreground">{svc.replicas}</td>
                                        <td className="px-4 py-2.5 text-muted font-mono">{svc.port}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <StatusDot status={svc.status} />
                                                <span className="text-success capitalize">{svc.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Architecture Note */}
                <div className="edu-callout text-xs leading-relaxed">
                    <span className="font-semibold text-accent">Architecture Note:</span> This simulates a typical <strong>Kubernetes</strong> deployment
                    with an API server, PostgreSQL database, Redis cache, and Ingress controller. In a real setup, infrastructure is defined as code
                    using tools like <strong>Terraform</strong> or <strong>Pulumi</strong>, and managed through GitOps workflows where changes to
                    infrastructure go through the same PR and CI/CD process as application code.
                </div>
            </div>
        </div>
    );
}
