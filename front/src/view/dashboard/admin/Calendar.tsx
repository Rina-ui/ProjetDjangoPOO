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

interface Visite {
    id: number
    bien_detail: { adresse: string; photo: string | null; proprietaire_nom: string }
    date_visite: string
    statut: string
    note: string
}

const STATUT_COLOR: Record<string, { bg: string; color: string; dot: string }> = {
    EN_ATTENTE: { bg: "#fdf6e7", color: "#b8922a", dot: "#b8922a" },
    CONFIRMEE:  { bg: "#f0fdf4", color: "#15803d", dot: "#15803d" },
    ANNULEE:    { bg: "#fef2f2", color: "#c0392b", dot: "#c0392b" },
    EFFECTUEE:  { bg: "#f5f3ff", color: "#7c3aed", dot: "#7c3aed" },
}

const DAYS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

const Calendar = () => {
    const [visites,  setVisites]  = useState<Visite[]>([])
    const [loading,  setLoading]  = useState(true)
    const [today]  = useState(new Date())
    const [current, setCurrent]   = useState(new Date())
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${BASE_URL}/api/locataires/visites/`, { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(d => setVisites(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setVisites([]))
            .finally(() => setLoading(false))
    }, [])

    const year  = current.getFullYear()
    const month = current.getMonth()
    const firstDay   = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const visitsByDate = visites.reduce<Record<string, Visite[]>>((acc, v) => {
        const d = v.date_visite.split("T")[0]
        if (!acc[d]) acc[d] = []
        acc[d].push(v)
        return acc
    }, {})

    const selectedVisits = selected ? (visitsByDate[selected] ?? []) : []

    const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
    const mkDate   = (d: number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`

    const upcoming = visites.filter(v => new Date(v.date_visite) >= today && v.statut !== "ANNULEE")
    const pending  = visites.filter(v => v.statut === "EN_ATTENTE")

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Calendar">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes popIn  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
                .cal-anim { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
                .event-pop { animation: popIn .25s cubic-bezier(.4,0,.2,1) both; }
                .cal-day-cell { transition: all .15s; }
                .cal-day-cell:hover { background: var(--bg2) !important; transform: scale(1.06); }
            `}</style>

            <div className="pg-header">
                <div>
                    <div className="pg-title">Calendar</div>
                    <div className="pg-subtitle">{visites.length} total visits · {upcoming.length} upcoming</div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Visits",  value: visites.length,   color: "#1d4ed8", bg: "#eff6ff" },
                    { label: "Upcoming",      value: upcoming.length,  color: "#15803d", bg: "#f0fdf4" },
                    { label: "Pending",       value: pending.length,   color: "#b8922a", bg: "#fdf6e7" },
                    { label: "This Month",    value: visites.filter(v => new Date(v.date_visite).getMonth() === month).length, color: "#7c3aed", bg: "#f5f3ff" },
                ].map((s, i) => (
                    <div key={s.label} className="stat-card cal-anim" style={{ animationDelay: `${i * 70}ms` }}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                {/* Calendar grid */}
                <div className="card cal-anim" style={{ animationDelay: "200ms" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                            {MONTHS[month]} <span style={{ color: "var(--text3)", fontWeight: 400 }}>{year}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={prevMonth} style={{
                                width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)",
                                background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s"
                            }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <button onClick={() => setCurrent(new Date())} style={{
                                padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border)",
                                background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                                transition: "all .15s"
                            }}>Today</button>
                            <button onClick={nextMonth} style={{
                                width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)",
                                background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s"
                            }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Day labels */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text3)", padding: "4px 0", textTransform: "uppercase", letterSpacing: ".5px" }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`}/>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d    = i + 1
                            const dateStr = mkDate(d)
                            const dayVisits = visitsByDate[dateStr] ?? []
                            const isToday   = dateStr === todayStr
                            const isSel     = dateStr === selected
                            return (
                                <div key={d} className="cal-day-cell"
                                     onClick={() => setSelected(isSel ? null : dateStr)}
                                     style={{
                                         aspectRatio: "1", borderRadius: 10, padding: 4, cursor: "pointer",
                                         background: isToday ? "var(--gold)" : isSel ? "var(--gold-bg)" : "transparent",
                                         border: isSel && !isToday ? "1.5px solid var(--gold)" : "1.5px solid transparent",
                                         display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                                         position: "relative"
                                     }}>
                                    <span style={{
                                        fontSize: 13, fontWeight: isToday ? 800 : 500,
                                        color: isToday ? "#fff" : "var(--text)",
                                        lineHeight: 1.6
                                    }}>{d}</span>
                                    {dayVisits.length > 0 && (
                                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                                            {dayVisits.slice(0, 3).map((v, vi) => (
                                                <div key={vi} style={{
                                                    width: 6, height: 6, borderRadius: "50%",
                                                    background: STATUT_COLOR[v.statut]?.dot ?? "var(--gold)"
                                                }}/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                        {Object.entries(STATUT_COLOR).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text3)" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.dot }}/>
                                {k === "EN_ATTENTE" ? "Pending" : k === "CONFIRMEE" ? "Confirmed" : k === "ANNULEE" ? "Cancelled" : "Completed"}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Selected day events */}
                    {selected && (
                        <div className="card event-pop">
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                                {new Date(selected + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                            </div>
                            {selectedVisits.length === 0
                                ? <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", padding: "20px 0" }}>No visits this day</div>
                                : selectedVisits.map(v => {
                                    const sc = STATUT_COLOR[v.statut] ?? STATUT_COLOR.EN_ATTENTE
                                    return (
                                        <div key={v.id} style={{
                                            display: "flex", gap: 12, padding: "12px", borderRadius: 10,
                                            background: sc.bg, marginBottom: 8, border: `1px solid ${sc.dot}22`
                                        }}>
                                            <div style={{ width: 3, borderRadius: 2, background: sc.dot, flexShrink: 0 }}/>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{v.bien_detail.adresse}</div>
                                                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                                                    {new Date(v.date_visite).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                                    {v.bien_detail.proprietaire_nom && ` · ${v.bien_detail.proprietaire_nom}`}
                                                </div>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fff", color: sc.color }}>
                                                    {v.statut.replace("_", " ")}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )}

                    {/* Upcoming visits */}
                    <div className="card cal-anim" style={{ animationDelay: "300ms" }}>
                        <div className="card-hd">
                            <div className="card-title">Upcoming Visits</div>
                            <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>{upcoming.length}</span>
                        </div>
                        {loading && <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", padding: 16 }}>Loading…</div>}
                        {!loading && upcoming.length === 0 && (
                            <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", padding: 16 }}>No upcoming visits</div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {upcoming.slice(0, 6).map(v => {
                                const sc = STATUT_COLOR[v.statut]
                                const d  = new Date(v.date_visite)
                                return (
                                    <div key={v.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                            background: "var(--gold-bg)", border: "1px solid rgba(184,146,42,0.2)",
                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--gold)", lineHeight: 1 }}>{d.getDate()}</span>
                                            <span style={{ fontSize: 9, color: "var(--gold)", textTransform: "uppercase" }}>{MONTHS[d.getMonth()].slice(0,3)}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.bien_detail.adresse}</div>
                                            <div style={{ fontSize: 11, color: "var(--text3)" }}>
                                                {d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc?.dot ?? "var(--gold)", flexShrink: 0 }}/>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Calendar