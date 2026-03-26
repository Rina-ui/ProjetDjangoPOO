import { useState, useEffect } from "react"
import DashboardLayout from "../../../component/sidebar"
import { useAuth } from "../../../context/AuthContext"
import { extractSavedCountByProperty } from "../../../utils/savedProperties"
import "../../../style/dashboard.css"
import "../../../style/owner-pages.css"
import "../../../style/Analytics.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

const Line = ({ data, color = "#b8922a", h = 40 }: { data: number[]; color?: string; h?: number }) => {
    if (data.length < 2) return null
    const w = 100
    const max = Math.max(...data, 1)
    const xs = data.map((_, i) => (i / (data.length - 1)) * w)
    const ys = data.map(v => h - 4 - (v / max) * (h - 8))
    const d  = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
    const area = `M0,${h} ${xs.map((x, i) => `L${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")} L${w},${h} Z`
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
            <path d={area} fill={color} fillOpacity="0.08"/>
            <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
    )
}

const HBar = ({ pct, color }: { pct: number; color: string }) => (
    <div style={{ height: 3, background: "var(--bg2)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .9s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
)

const AnalyticsPage = () => {
    const { user } = useAuth()
    const [biens,   setBiens]   = useState<any[]>([])
    const [convs,   setConvs]   = useState<any[]>([])
    const [likesByBien, setLikesByBien] = useState<Record<number, number>>({})
    const [loading, setLoading] = useState(true)
    const [period,  setPeriod]  = useState<"7d"|"30d"|"90d">("30d")
    const [ready,   setReady]   = useState(false)
    const token = localStorage.getItem("access_token")

    const toNumber = (value: unknown): number | null => {
        const num = Number(value)
        return Number.isFinite(num) ? num : null
    }

    const getLikeCount = (bien: any) => {
        const id = toNumber(bien?.id)
        const fromSaves = id !== null ? likesByBien[id] : undefined
        return fromSaves
            ?? toNumber(bien?.likes_count)
            ?? toNumber(bien?.nb_sauvegardes)
            ?? toNumber(bien?.saved)
            ?? 0
    }

    useEffect(() => {
        Promise.all([
            fetch(`${BASE_URL}/api/patrimoine/biens/`,   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${BASE_URL}/api/chat/conversations/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([b, c]) => {
            const list = Array.isArray(b) ? b : b.results ?? []
            const ownerId = Number(user?.id)
            const ownerBiens = Number.isFinite(ownerId)
                ? list.filter((item: any) => Number(item?.proprietaire) === ownerId)
                : list
            setBiens(ownerBiens)
            setConvs(Array.isArray(c) ? c : c.results ?? [])
            setLoading(false)
            setTimeout(() => setReady(true), 60)
        }).catch(() => setLoading(false))

        fetch(`${BASE_URL}/api/locataires/sauvegardes/?_ts=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store"
        })
            .then(r => (r.ok ? r.json() : null))
            .then(data => setLikesByBien(data ? extractSavedCountByProperty(data) : {}))
            .catch(() => setLikesByBien({}))
    }, [user?.id])

    const rented    = biens.filter(b => b.statut === "LOUE")
    const online    = biens.filter(b => b.en_ligne)
    const revenue   = rented.reduce((a, b) => a + parseFloat(b.loyer_hc ?? 0), 0)
    const occupancy = biens.length ? Math.round((rented.length / biens.length) * 100) : 0
    const avgRent   = biens.length ? Math.round(biens.reduce((a, b) => a + parseFloat(b.loyer_hc ?? 0), 0) / biens.length) : 0
    const totalLikes = biens.reduce((a, b) => a + getLikeCount(b), 0)

    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    const weekBars = [8,14,11,20,17,24,19].map((v, i) => ({ d: days[i], v }))
    const maxBar = Math.max(...weekBars.map(x => x.v))

    const statusRows = [
        { label: "Rented",   count: rented.length,                                       color: "#2d6a4f" },
        { label: "Vacant",   count: biens.filter(b => b.statut === "VACANT").length,     color: "#92400e" },
        { label: "For sale", count: biens.filter(b => b.statut === "EN_VENTE").length,   color: "#1e3a5f" },
        { label: "Works",    count: biens.filter(b => b.statut === "EN_TRAVAUX").length, color: "#4b5563" },
    ]

    const statusMap: Record<string, { label: string; color: string }> = {
        LOUE:      { label: "Rented",   color: "#2d6a4f" },
        VACANT:    { label: "Vacant",   color: "#92400e" },
        EN_VENTE:  { label: "For sale", color: "#1e3a5f" },
        EN_TRAVAUX:{ label: "Works",    color: "#4b5563" },
    }

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Analytics">
            <div className={`op-page ${ready ? "op-visible" : ""}`} style={{ gap: 16 }}>

                <div className="op-head">
                    <div>
                        <h1 className="op-title">Analytics</h1>
                        <p className="op-subtitle">{loading ? "Loading data…" : `${biens.length} properties · ${convs.length} inquiries`}</p>
                    </div>
                    <div className="an2-period">
                        {(["7d","30d","90d"] as const).map(p => (
                            <button key={p} className={`an2-period-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                                {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "3 months"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── 4 number tiles ── */}
                <div className="an2-tiles">
                    {[
                        { label: "Revenue / month",  val: loading ? null : `${revenue.toLocaleString()} XOF`,  sub: `${rented.length} rented`,            trend: [60,70,65,80,75,90,85] },
                        { label: "Occupancy",        val: loading ? null : `${occupancy}%`,                   sub: `${online.length} online`,             trend: [40,50,45,60,58,70,68] },
                        { label: "Avg. rent",        val: loading ? null : `${avgRent.toLocaleString()} XOF`, sub: `across ${biens.length} properties`,    trend: [50,55,52,58,60,65,63] },
                        { label: "Likes",            val: loading ? null : String(totalLikes),                sub: "saved by users",                        trend: [2,5,3,8,6,10,7]       },
                    ].map((t, i) => (
                        <div key={i} className="an2-tile" style={{ animationDelay: `${i * 0.07}s` }}>
                            <span className="an2-tile-label">{t.label}</span>
                            <span className="an2-tile-val">{t.val ?? "—"}</span>
                            <span className="an2-tile-sub">{t.sub}</span>
                            <div className="an2-tile-spark">
                                <Line data={t.trend} h={36}/>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Mid row ── */}
                <div className="an2-mid">
                    <div className="an2-card an2-card--wide">
                        <div className="an2-card-hd">
                            <span>Views per day</span>
                            <span className="an2-card-sub">this week</span>
                        </div>
                        <div className="an2-bars">
                            {weekBars.map((d, i) => (
                                <div key={i} className="an2-bar-col">
                                    <span className="an2-bar-val">{d.v}</span>
                                    <div className="an2-bar-track">
                                        <div className="an2-bar-fill" style={{
                                            height: `${Math.round((d.v / maxBar) * 100)}%`,
                                            animationDelay: `${i * 0.05}s`
                                        }}/>
                                    </div>
                                    <span className="an2-bar-day">{d.d}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="an2-card">
                        <div className="an2-card-hd">
                            <span>Portfolio mix</span>
                            <span className="an2-card-sub">{biens.length} total</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
                            {loading
                                ? [1,2,3,4].map(i => <div key={i} className="op-skeleton" style={{ height: 28, borderRadius: 6 }}/>)
                                : statusRows.map(row => (
                                    <div key={row.label}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{row.label}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>{row.count}</span>
                                        </div>
                                        <HBar pct={biens.length ? Math.round((row.count / biens.length) * 100) : 0} color={row.color}/>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* ── Properties table ── */}
                <div className="an2-card">
                    <div className="an2-card-hd">
                        <span>All properties</span>
                        <span className="an2-card-sub">{biens.length} listings</span>
                    </div>
                    {loading ? (
                        <div className="op-skeleton-group">
                            {[1,2,3].map(i => <div key={i} className="op-skeleton" style={{ height: 44, borderRadius: 8 }}/>)}
                        </div>
                    ) : biens.length === 0 ? (
                        <div className="op-empty-sm">No properties yet</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="an2-table">
                                <thead>
                                <tr>
                                    <th>Address</th>
                                    <th>Status</th>
                                    <th>Rent</th>
                                    <th>Charges</th>
                                    <th>Live</th>
                                    <th>Views</th>
                                    <th>Likes</th>
                                    <th style={{ width: 80 }}>Share</th>
                                </tr>
                                </thead>
                                <tbody>
                                {biens.map(b => {
                                    const maxR = Math.max(...biens.map(x => parseFloat(x.loyer_hc ?? 0)), 1)
                                    const pct  = Math.round((parseFloat(b.loyer_hc ?? 0) / maxR) * 100)
                                    const st   = statusMap[b.statut] ?? { label: b.statut, color: "#4b5563" }
                                    return (
                                        <tr key={b.id} className="an2-tr">
                                            <td className="an2-td-addr">{b.adresse}</td>
                                            <td><span className="an2-badge" style={{ background: `${st.color}14`, color: st.color }}>{st.label}</span></td>
                                            <td className="an2-td-num">{parseFloat(b.loyer_hc ?? 0).toLocaleString()}</td>
                                            <td className="an2-td-muted">{parseFloat(b.charges ?? 0).toLocaleString()}</td>
                                            <td><span className="an2-dot" style={{ background: b.en_ligne ? "#2d6a4f" : "#d1d5db" }}/></td>
                                            <td className="an2-td-num">{b.views ?? 0}</td>
                                            <td className="an2-td-num">{getLikeCount(b)}</td>
                                            <td><HBar pct={pct} color="#b8922a"/></td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Bottom row ── */}
                <div className="an2-bot">
                    <div className="an2-card">
                        <div className="an2-card-hd">
                            <span>Recent inquiries</span>
                            <span className="an2-card-sub">{convs.length} total</span>
                        </div>
                        {convs.length === 0 ? (
                            <div className="op-empty-sm">No inquiries yet</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {convs.slice(0, 6).map((c: any, i: number) => (
                                    <div key={i} className="an2-inq-row">
                                        <div className="an2-inq-av">{(c.client_name ?? "?").charAt(0).toUpperCase()}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="an2-inq-name">{c.client_name ?? "Unknown"}</div>
                                            <div className="an2-inq-prop">{c.property_name ?? "—"}</div>
                                        </div>
                                        <span className="an2-inq-date">
                                            {new Date(c.last_message_at ?? c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="an2-card">
                        <div className="an2-card-hd">
                            <span>Revenue split</span>
                            <span className="an2-card-sub">{rented.length} sources</span>
                        </div>
                        {rented.length === 0 ? (
                            <div className="op-empty-sm">No rented properties</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {rented.map(b => {
                                    const pct = Math.round((parseFloat(b.loyer_hc ?? 0) / (revenue || 1)) * 100)
                                    return (
                                        <div key={b.id}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                                                <span style={{ color: "var(--text2)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.adresse}</span>
                                                <span style={{ fontWeight: 700, color: "var(--dark)", marginLeft: 8 }}>{pct}%</span>
                                            </div>
                                            <HBar pct={pct} color="#b8922a"/>
                                        </div>
                                    )
                                })}
                                <div className="an2-rev-total">
                                    <span>Total / month</span>
                                    <strong>{revenue.toLocaleString()} XOF</strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    )
}

export default AnalyticsPage