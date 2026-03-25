import { useState, useEffect } from "react"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"
import "../../../style/owner-pages.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

// ── Animated counter hook ────────────────────────────────
const useCounter = (target: number, duration = 1200) => {
    const [val, setVal] = useState(0)
    useEffect(() => {
        if (target === 0) return
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= target) { setVal(target); clearInterval(timer) }
            else setVal(Math.floor(start))
        }, 16)
        return () => clearInterval(timer)
    }, [target])
    return val
}

// ── Sparkline SVG ─────────────────────────────────────────
const Sparkline = ({ data, color, filled }: { data: number[]; color: string; filled?: boolean }) => {
    if (!data.length) return null
    const max = Math.max(...data, 1)
    const w = 200, h = 56
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`)
    const poly = pts.join(" ")
    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 56 }} preserveAspectRatio="none">
            {filled && (
                <defs>
                    <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0"/>
                    </linearGradient>
                </defs>
            )}
            {filled && (
                <polygon
                    points={`0,${h} ${poly} ${w},${h}`}
                    fill={`url(#g-${color.replace("#","")})`}
                />
            )}
            <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            {data.map((v, i) => (
                <circle
                    key={i}
                    cx={(i / (data.length - 1)) * w}
                    cy={h - (v / max) * (h - 8) - 4}
                    r="3"
                    fill={color}
                    className="spark-dot"
                />
            ))}
        </svg>
    )
}

// ── Donut chart ──────────────────────────────────────────
const DonutChart = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
    const total = segments.reduce((a, b) => a + b.value, 0) || 1
    const r = 52, cx = 64, cy = 64, stroke = 18
    const circumference = 2 * Math.PI * r
    let offset = 0
    return (
        <div className="an-donut-wrap">
            <svg width={128} height={128} viewBox="0 0 128 128">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
                {segments.map((s, i) => {
                    const pct = s.value / total
                    const dash = pct * circumference
                    const gap  = circumference - dash
                    const rot  = -90 + (offset / total) * 360
                    offset += s.value
                    return (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                                stroke={s.color} strokeWidth={stroke}
                                strokeDasharray={`${dash} ${gap}`}
                                strokeDashoffset={0}
                                style={{ transform: `rotate(${rot}deg)`, transformOrigin: "64px 64px", transition: "stroke-dasharray 1s ease" }}
                        />
                    )
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">{total}</text>
                <text x={cx} y={cx + 14} textAnchor="middle" fontSize="10" fill="var(--text3)">total</text>
            </svg>
            <div className="an-donut-legend">
                {segments.map(s => (
                    <div key={s.label} className="an-legend-row">
                        <span className="an-legend-dot" style={{ background: s.color }}/>
                        <span className="an-legend-lbl">{s.label}</span>
                        <span className="an-legend-val">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Bar chart ────────────────────────────────────────────
const BarChart = ({ data, color }: { data: { label: string; value: number }[]; color: string }) => {
    const max = Math.max(...data.map(d => d.value), 1)
    return (
        <div className="an-bar-chart">
            {data.map((d, i) => (
                <div key={i} className="an-bar-col">
                    <div className="an-bar-track">
                        <div
                            className="an-bar-fill"
                            style={{ height: `${(d.value / max) * 100}%`, background: color, animationDelay: `${i * 0.06}s` }}
                        />
                    </div>
                    <span className="an-bar-lbl">{d.label}</span>
                </div>
            ))}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────
const AnalyticsPage = () => {
    const [biens, setBiens] = useState<any[]>([])
    const [convs, setConvs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<"7d"|"30d"|"90d">("30d")
    const [visible, setVisible] = useState(false)
    const token = localStorage.getItem("access_token")

    useEffect(() => {
        Promise.all([
            fetch(`${BASE_URL}/api/patrimoine/biens/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${BASE_URL}/api/chat/conversations/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([b, c]) => {
            setBiens(Array.isArray(b) ? b : b.results ?? [])
            setConvs(Array.isArray(c) ? c : c.results ?? [])
            setLoading(false)
            setTimeout(() => setVisible(true), 80)
        }).catch(() => setLoading(false))
    }, [])

    // Computed stats
    const totalViews    = biens.reduce((a, b) => a + (b.views ?? 0), 0)
    const totalRevenue  = biens.filter(b => b.statut === "LOUE").reduce((a, b) => a + parseFloat(b.loyer_hc ?? 0), 0)
    const occupancyRate = biens.length ? Math.round((biens.filter(b => b.statut === "LOUE").length / biens.length) * 100) : 0
    const totalSaved    = biens.reduce((a, b) => a + (b.saved ?? 0), 0)

    const cViews    = useCounter(totalViews)
    const cRevenue  = useCounter(Math.round(totalRevenue))
    const cOcc      = useCounter(occupancyRate)
    const cInq      = useCounter(convs.length)

    // Synthetic weekly data
    const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    const viewsWeek = [12, 24, 18, 36, 29, 41, 33].map((v, i) => ({ label: weekDays[i], value: totalViews > 0 ? v : 0 }))
    const inqWeek   = convs.length > 0 ? [2,5,3,8,4,7,6] : [0,0,0,0,0,0,0]

    const statusSegments = [
        { label: "Rented",   value: biens.filter(b => b.statut === "LOUE").length,      color: "#15803d" },
        { label: "Vacant",   value: biens.filter(b => b.statut === "VACANT").length,     color: "#b8922a" },
        { label: "For Sale", value: biens.filter(b => b.statut === "EN_VENTE").length,   color: "#1d4ed8" },
        { label: "Works",    value: biens.filter(b => b.statut === "EN_TRAVAUX").length, color: "#94a3b8" },
    ].filter(s => s.value > 0)

    const topBiens = [...biens].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5)

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Analytics">
            <div className={`op-page ${visible ? "op-visible" : ""}`}>

                {/* ── Header ── */}
                <div className="op-head">
                    <div>
                        <h1 className="op-title">Analytics</h1>
                        <p className="op-subtitle">Views, inquiries and portfolio performance</p>
                    </div>
                    <div className="op-period-pills">
                        {(["7d","30d","90d"] as const).map(p => (
                            <button key={p} className={`op-period-pill ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                                {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "3 months"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI row ── */}
                <div className="an-kpi-grid">
                    {[
                        { label: "Total Views",     val: cViews,   unit: "",   color: "#1d4ed8", change: "+18%" },
                        { label: "Monthly Revenue", val: cRevenue, unit: "XOF", color: "#b8922a", change: "+12%" },
                        { label: "Occupancy",       val: cOcc,    unit: "%",  color: "#15803d", change: "+5%"  },
                        { label: "Inquiries",       val: cInq,    unit: "",   color: "#7c3aed", change: "+9%"  },
                    ].map((k, i) => (
                        <div className="an-kpi-card" key={k.label} style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="an-kpi-bar" style={{ background: k.color }}/>
                            <div className="an-kpi-body">
                                <span className="an-kpi-label">{k.label}</span>
                                <div className="an-kpi-val-row">
                                    <span className="an-kpi-val">{loading ? "—" : k.val.toLocaleString()}</span>
                                    {k.unit && <span className="an-kpi-unit">{k.unit}</span>}
                                </div>
                                <span className="an-kpi-change">{k.change} vs last period</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Charts row ── */}
                <div className="an-charts-grid">
                    <div className="op-card an-chart-card">
                        <div className="op-card-hd">
                            <span className="op-card-title">Views per day</span>
                            <span className="op-card-badge">{weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}</span>
                        </div>
                        {loading
                            ? <div className="op-skeleton" style={{ height: 100 }}/>
                            : <BarChart data={viewsWeek} color="#b8922a"/>
                        }
                    </div>

                    <div className="op-card an-chart-card">
                        <div className="op-card-hd">
                            <span className="op-card-title">Inquiries trend</span>
                        </div>
                        {loading
                            ? <div className="op-skeleton" style={{ height: 100 }}/>
                            : <div style={{ padding: "8px 0" }}>
                                <Sparkline data={inqWeek} color="#7c3aed" filled/>
                                <div className="spark-lbl" style={{ marginTop: 6 }}>
                                    {weekDays.map(d => <span key={d}>{d}</span>)}
                                </div>
                            </div>
                        }
                    </div>

                    <div className="op-card an-chart-card">
                        <div className="op-card-hd">
                            <span className="op-card-title">Portfolio status</span>
                        </div>
                        {loading
                            ? <div className="op-skeleton" style={{ height: 128 }}/>
                            : statusSegments.length > 0
                                ? <DonutChart segments={statusSegments}/>
                                : <div className="op-empty-sm">No properties yet</div>
                        }
                    </div>
                </div>

                {/* ── Top properties ── */}
                <div className="op-card" style={{ animationDelay: "0.4s" }}>
                    <div className="op-card-hd">
                        <span className="op-card-title">Top Properties by Views</span>
                    </div>
                    {loading
                        ? <>{[1,2,3].map(i => <div key={i} className="op-skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 10 }}/>)}</>
                        : topBiens.length === 0
                            ? <div className="op-empty-sm">No data yet</div>
                            : <table className="an-top-table">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Property</th>
                                    <th>Status</th>
                                    <th>Rent</th>
                                    <th>Views</th>
                                    <th>Score</th>
                                </tr>
                                </thead>
                                <tbody>
                                {topBiens.map((b, i) => {
                                    const maxV = topBiens[0]?.views ?? 1
                                    const pct = Math.round(((b.views ?? 0) / (maxV || 1)) * 100)
                                    return (
                                        <tr key={b.id} className="an-top-row">
                                            <td className="an-rank">{i + 1}</td>
                                            <td className="an-prop-cell">
                                                <div className="an-prop-thumb"/>
                                                <span>{b.adresse}</span>
                                            </td>
                                            <td>
                                                    <span className={`badge badge-${b.statut === "LOUE" ? "rented" : b.statut === "VACANT" ? "vacant" : "for_sale"}`}>
                                                        {b.statut === "LOUE" ? "Rented" : b.statut === "VACANT" ? "Vacant" : "For Sale"}
                                                    </span>
                                            </td>
                                            <td className="an-rent">{parseFloat(b.loyer_hc ?? 0).toLocaleString()} XOF</td>
                                            <td className="an-views-val">{b.views ?? 0}</td>
                                            <td>
                                                <div className="an-score-track">
                                                    <div className="an-score-fill" style={{ width: `${pct}%` }}/>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                    }
                </div>

                {/* ── Revenue breakdown ── */}
                <div className="an-revenue-grid">
                    <div className="op-card">
                        <div className="op-card-hd">
                            <span className="op-card-title">Revenue Breakdown</span>
                        </div>
                        <div className="an-rev-list">
                            {biens.filter(b => b.statut === "LOUE").map(b => (
                                <div key={b.id} className="an-rev-row">
                                    <div className="an-rev-dot"/>
                                    <span className="an-rev-addr">{b.adresse}</span>
                                    <span className="an-rev-amt">{parseFloat(b.loyer_hc ?? 0).toLocaleString()} XOF</span>
                                </div>
                            ))}
                            {biens.filter(b => b.statut === "LOUE").length === 0 && (
                                <div className="op-empty-sm">No rented properties</div>
                            )}
                            {biens.filter(b => b.statut === "LOUE").length > 0 && (
                                <div className="an-rev-total">
                                    <span>Total / month</span>
                                    <strong>{totalRevenue.toLocaleString()} XOF</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="op-card">
                        <div className="op-card-hd">
                            <span className="op-card-title">Engagement Summary</span>
                        </div>
                        <div className="an-eng-grid">
                            {[
                                { label: "Saved by users",  val: totalSaved,      color: "#c0392b" },
                                { label: "Active listings", val: biens.filter(b => b.en_ligne).length, color: "#15803d" },
                                { label: "Pending review",  val: biens.filter(b => b.statut === "EN_ATTENTE_VALIDATION").length, color: "#b8922a" },
                                { label: "Avg. rent",       val: biens.length ? Math.round(biens.reduce((a,b) => a + parseFloat(b.loyer_hc??0), 0) / biens.length) : 0, color: "#1d4ed8" },
                            ].map(e => (
                                <div key={e.label} className="an-eng-card" style={{ borderTopColor: e.color }}>
                                    <span className="an-eng-val" style={{ color: e.color }}>{loading ? "—" : e.val.toLocaleString()}</span>
                                    <span className="an-eng-lbl">{e.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    )
}

export default AnalyticsPage