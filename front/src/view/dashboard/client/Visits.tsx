import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

interface BienDetail {
    id:              number
    adresse:         string
    loyer_hc:        string
    statut:          string
    photo:           string | null
    proprietaire_nom: string
}

interface Visite {
    id:          number
    bien:        number
    bien_detail: BienDetail
    date_visite: string
    statut:      string
    note:        string
    created_at:  string
}

const token = () => localStorage.getItem("access_token")

const STATUT_COLOR: Record<string, { bg: string; color: string }> = {
    EN_ATTENTE: { bg: "var(--gold-bg)",  color: "var(--gold)"  },
    CONFIRMEE:  { bg: "var(--green-bg)", color: "var(--green)" },
    ANNULEE:    { bg: "var(--red-bg)",   color: "var(--red)"   },
    EFFECTUEE:  { bg: "var(--bg2)",      color: "var(--text2)" },
}
const STATUT_LABEL: Record<string, string> = {
    EN_ATTENTE: "Pending",
    CONFIRMEE:  "Confirmed",
    ANNULEE:    "Cancelled",
    EFFECTUEE:  "Completed",
}

const Visits = () => {
    const [visits,  setVisits]  = useState<Visite[]>([])
    const [loading, setLoading] = useState(true)
    const [filter,  setFilter]  = useState<"all" | "upcoming" | "past">("all")
    const [cancelling, setCancelling] = useState<number | null>(null)

    useEffect(() => {
        fetch(`${BASE_URL}/api/locataires/visites/`, {
            headers: { Authorization: `Bearer ${token()}` }
        })
            .then(r => r.json())
            .then(d => setVisits(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setVisits([]))
            .finally(() => setLoading(false))
    }, [])

    const cancel = async (id: number) => {
        setCancelling(id)
        try {
            await fetch(`${BASE_URL}/api/locataires/visites/${id}/annuler/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` }
            })
            setVisits(prev => prev.map(v => v.id === id ? { ...v, statut: "ANNULEE" } : v))
        } finally {
            setCancelling(null)
        }
    }

    const now = new Date()
    const filtered = visits.filter(v => {
        if (filter === "upcoming") return new Date(v.date_visite) >= now && v.statut !== "ANNULEE"
        if (filter === "past")     return new Date(v.date_visite) <  now || v.statut === "EFFECTUEE"
        return true
    })

    const upcoming = visits.filter(v => new Date(v.date_visite) >= now && v.statut !== "ANNULEE").length
    const completed = visits.filter(v => v.statut === "EFFECTUEE").length
    const pending   = visits.filter(v => v.statut === "EN_ATTENTE").length

    const fmt = (iso: string) => {
        const d = new Date(iso)
        return {
            date: d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
            time: d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
            year: d.getFullYear(),
        }
    }

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="My Visits">
            <div className="pg-header">
                <div>
                    <div className="pg-title">My Visits</div>
                    <div className="pg-subtitle">Scheduled and past property visits</div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
                {[
                    { label: "Upcoming",  value: upcoming,  color: "var(--blue-bg)",  ic: "var(--blue)"  },
                    { label: "Pending",   value: pending,   color: "var(--gold-bg)",  ic: "var(--gold)"  },
                    { label: "Completed", value: completed, color: "var(--green-bg)", ic: "var(--green)" },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon-wrap" style={{ background: s.color }}>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {(["all", "upcoming", "past"] as const).map(f => (
                    <button key={f} className={`tab-pill ${filter === f ? "tab-pill--active" : ""}`}
                            onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--text3)", fontSize: 14 }}>Loading…</div>
            )}

            {!loading && filtered.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 260, gap: 12 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)" }}>No visits {filter !== "all" ? filter : "yet"}</div>
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>Book a visit from a property page</div>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map(v => {
                    const { date, time } = fmt(v.date_visite)
                    const isPast    = new Date(v.date_visite) < now
                    const canCancel = v.statut === "EN_ATTENTE" || v.statut === "CONFIRMEE"
                    const sc        = STATUT_COLOR[v.statut] ?? STATUT_COLOR.EN_ATTENTE

                    return (
                        <div key={v.id} className="card" style={{ display: "flex", gap: 20, padding: 20, alignItems: "stretch" }}>
                            {/* Date block */}
                            <div style={{
                                width: 72, flexShrink: 0,
                                background: isPast ? "var(--bg2)" : "var(--gold-bg)",
                                border: `1px solid ${isPast ? "var(--border)" : "rgba(184,146,42,0.2)"}`,
                                borderRadius: 12,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                gap: 2, padding: "12px 8px"
                            }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: isPast ? "var(--text3)" : "var(--gold)", lineHeight: 1 }}>
                                    {new Date(v.date_visite).getDate()}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: isPast ? "var(--text3)" : "var(--gold)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                                    {new Date(v.date_visite).toLocaleDateString("en", { month: "short" })}
                                </span>
                                <span style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{time}</span>
                            </div>

                            {/* Property image */}
                            <div style={{
                                width: 90, height: 90, flexShrink: 0, borderRadius: 10, overflow: "hidden",
                                background: "linear-gradient(135deg,#e8e0d0,#d4c9b0)"
                            }}>
                                {v.bien_detail.photo && (
                                    <img src={v.bien_detail.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{v.bien_detail.adresse}</div>
                                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                                            {date} · {time} · <span style={{ color: "var(--text2)" }}>{v.bien_detail.proprietaire_nom}</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        ...sc, fontSize: 11, fontWeight: 600,
                                        padding: "3px 10px", borderRadius: 20,
                                        background: sc.bg, color: sc.color,
                                        whiteSpace: "nowrap", flexShrink: 0, marginLeft: 12
                                    }}>
                                        {STATUT_LABEL[v.statut] ?? v.statut}
                                    </span>
                                </div>

                                {v.note && (
                                    <div style={{ fontSize: 12, color: "var(--text2)", background: "var(--bg)", padding: "6px 10px", borderRadius: 8, marginBottom: 10 }}>
                                        {v.note}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                        ${parseFloat(v.bien_detail.loyer_hc).toLocaleString()}
                                        {v.bien_detail.statut !== "EN_VENTE" && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text3)" }}>/mo</span>}
                                    </div>
                                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                        {canCancel && !isPast && (
                                            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px", color: "var(--red)", borderColor: "var(--red)" }}
                                                    disabled={cancelling === v.id}
                                                    onClick={() => cancel(v.id)}>
                                                {cancelling === v.id ? "…" : "Cancel"}
                                            </button>
                                        )}
                                        <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}
                                                onClick={() => window.location.href = "/dashboard/client/messages"}>
                                            Message Owner
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </DashboardLayout>
    )
}

export default Visits