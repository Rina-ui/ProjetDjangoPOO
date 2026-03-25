import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const token = () => localStorage.getItem("access_token")

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

interface Bail {
    id: number
    bien_adresse: string
    locataire_nom: string
    loyer_initial: string
    date_entree: string
    date_sortie: string | null
    actif: boolean
    depot_garantie: string
}

const Transactions = () => {
    const [baux,    setBaux]    = useState<Bail[]>([])
    const [loading, setLoading] = useState(true)
    const [filter,  setFilter]  = useState<"all" | "actif" | "expire">("all")
    const [search,  setSearch]  = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setTimeout(() => setMounted(true), 50)
        fetch(`${BASE_URL}/api/locataires/baux/`, { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(d => setBaux(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setBaux([]))
            .finally(() => setLoading(false))
    }, [])

    const filtered = baux
        .filter(b => filter === "all" || (filter === "actif" ? b.actif : !b.actif))
        .filter(b =>
            (b.bien_adresse ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (b.locataire_nom ?? "").toLowerCase().includes(search.toLowerCase())
        )

    const totalRevenue = baux.filter(b => b.actif).reduce((sum, b) => sum + parseFloat(b.loyer_initial || "0"), 0)
    const totalDeposit = baux.reduce((sum, b) => sum + parseFloat(b.depot_garantie || "0"), 0)
    const activeBaux   = baux.filter(b => b.actif).length

    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })

    // Sparkline simulation
    const months = ["J","F","M","A","M","J","J","A","S","O","N","D"]
    const barHeights = [45, 62, 55, 78, 65, 82, 58, 90, 72, 85, 68, 95]

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Transactions">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes growBar { from{height:0} to{height:var(--h)} }
                .tx-anim { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
                .bar-anim { animation: growBar .8s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="pg-header">
                <div>
                    <div className="pg-title">Transactions</div>
                    <div className="pg-subtitle">Lease contracts and financial overview</div>
                </div>
                <div className="tbl-search-wrap" style={{ width: 260 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input placeholder="Search leases…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Monthly Revenue",  value: `$${totalRevenue.toLocaleString()}`,  color: "#15803d", bg: "#f0fdf4", sub: "Active leases" },
                    { label: "Active Leases",    value: String(activeBaux),                    color: "#1d4ed8", bg: "#eff6ff", sub: `of ${baux.length} total` },
                    { label: "Total Deposits",   value: `$${totalDeposit.toLocaleString()}`,   color: "#7c3aed", bg: "#f5f3ff", sub: "Held in escrow" },
                    { label: "Avg. Rent",        value: activeBaux > 0 ? `$${Math.round(totalRevenue / activeBaux).toLocaleString()}` : "$0", color: "#b8922a", bg: "#fdf6e7", sub: "Per active lease" },
                ].map((s, i) => (
                    <div key={s.label} className="stat-card tx-anim" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                            </svg>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</span>
                            <span style={{ fontSize: 11, color: "var(--text3)" }}>{s.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 24 }}>
                {/* Revenue chart */}
                <div className="card">
                    <div className="card-hd">
                        <div className="card-title">Revenue Overview</div>
                        <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>+12.4% this year</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, padding: "0 4px" }}>
                        {barHeights.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{
                                    width: "100%", height: `${h}%`,
                                    background: i === 11 ? "var(--gold)" : "var(--bg2)",
                                    borderRadius: "4px 4px 0 0",
                                    transition: "height .8s cubic-bezier(.4,0,.2,1)",
                                    transitionDelay: `${i * 60}ms`,
                                    position: "relative"
                                }}>
                                    {i === 11 && (
                                        <div style={{
                                            position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
                                            background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700,
                                            padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap"
                                        }}>Peak</div>
                                    )}
                                </div>
                                <span style={{ fontSize: 9, color: "var(--text3)" }}>{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lease status donut */}
                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                    <div className="card-hd"><div className="card-title">Lease Status</div></div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
                        {[
                            { label: "Active",   value: activeBaux,               color: "var(--green)", pct: baux.length ? Math.round(activeBaux / baux.length * 100) : 0 },
                            { label: "Expired",  value: baux.length - activeBaux, color: "var(--text3)", pct: baux.length ? Math.round((baux.length - activeBaux) / baux.length * 100) : 0 },
                        ].map(s => (
                            <div key={s.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                                    <span style={{ color: s.color, fontWeight: 700 }}>{s.value} ({s.pct}%)</span>
                                </div>
                                <div style={{ height: 6, background: "var(--bg2)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 3, transition: "width 1s cubic-bezier(.4,0,.2,1)" }}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leases table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                    <div className="tab-pills">
                        {(["all", "actif", "expire"] as const).map(f => (
                            <button key={f} className={`tab-pill ${filter === f ? "tab-pill--active" : ""}`} onClick={() => setFilter(f)}>
                                {f === "all" ? "All" : f === "actif" ? "Active" : "Expired"}
                            </button>
                        ))}
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)" }}>{filtered.length} leases</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", gap: 12, padding: "10px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    {["Property", "Tenant", "Monthly Rent", "Deposit", "Start Date", "Status"].map(h => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</div>
                    ))}
                </div>

                {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Loading…</div>}

                {filtered.map((b, i) => (
                    <div key={b.id} className="tx-anim"
                         style={{
                             display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
                             gap: 12, padding: "14px 20px", alignItems: "center",
                             borderBottom: "1px solid var(--border)",
                             animationDelay: `${i * 40}ms`,
                             transition: "background .15s"
                         }}
                         onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                         onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{b.bien_adresse}</div>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text2)" }}>{b.locataire_nom}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                            ${parseFloat(b.loyer_initial).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text2)" }}>
                            ${parseFloat(b.depot_garantie).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{fmt(b.date_entree)}</div>
                        <div>
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                                background: b.actif ? "var(--green-bg)" : "var(--bg2)",
                                color: b.actif ? "var(--green)" : "var(--text3)"
                            }}>
                                {b.actif ? "Active" : "Expired"}
                            </span>
                        </div>
                    </div>
                ))}

                {!loading && filtered.length === 0 && (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                        No transactions found
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default Transactions