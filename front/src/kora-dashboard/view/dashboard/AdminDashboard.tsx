import { useState } from "react"
import PropertyViewer3D from "./PropertyViewer3D"
import DashboardLayout from "../../component/DashboardLayout"
import { IconPlus, IconBarChart } from "../../component/Icons"
import "../../style/dashboard.css"
import "../../style/admin.css"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const TEAM = [
    { name: "Sarah", bg: "#e2d4b8" },
    { name: "Marc",  bg: "#b8ccd8" },
    { name: "Lina",  bg: "#dbb8c0" },
    { name: "Omar",  bg: "#c8b8d8" },
    { name: "Tina",  bg: "#b8d4c0" },
]

const ACTIVITY = [
    { date: "Nov 29, 2025", type: "Tenant Application",   desc: "Tenant signed lease for Unit 3C – Emerald Apartments",  status: "cancelled" },
    { date: "Nov 15, 2025", type: "Property Viewing",     desc: "Property viewing scheduled for real estate dashboard",  status: "cancelled" },
    { date: "Nov 08, 2025", type: "Rent Payment",         desc: "Rent payment processed for Unit 7A – Azure Apartments", status: "pending"   },
    { date: "Nov 18, 2025", type: "Inspection Scheduled", desc: "KÔRÂ Inspection scheduled for management suite",        status: "pending"   },
    { date: "Nov 03, 2025", type: "Offer Accepted",       desc: "Offer accepted for 12A – Skyview Apartments",           status: "finished"  },
    { date: "Oct 28, 2025", type: "Lease Renewal",        desc: "Lease renewal completed for Unit 5B – Garden Court",    status: "finished"  },
]

// ── REAL HOUSE PHOTO ────────────────────────────────────────────────
const HouseSVG = () => (
    <img
        src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=90&auto=format&fit=crop"
        alt="Modern villa"
        className="adm-house-img"
    />
)


const PageAction = () => (
    <button className="dl-add-btn">
        <IconPlus size={15} color="white" /> Add New
    </button>
)

const AdminDashboard = () => {
    const [show3D, setShow3D] = useState(false)

    // Gauge math
    const r = 66, cx = 88, cy = 86
    const toRad = (d: number) => (d * Math.PI) / 180
    const pt = (pct: number) => {
        const a = -210 + 240 * pct
        return { x: +(cx + r * Math.cos(toRad(a))).toFixed(2), y: +(cy + r * Math.sin(toRad(a))).toFixed(2) }
    }
    const s = pt(0), e = pt(1), f = pt(0.68)

    if (show3D) return <PropertyViewer3D onBack={() => setShow3D(false)} />

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Real estate management" pageAction={<PageAction />}>
            <div className="adm">

                {/* ── HERO ── */}
                <div className="adm-hero">
                    <div className="adm-hero-left">
                        <div className="adm-breadcrumb">Main Menu <span>/</span> Dashboard</div>
                        <h1 className="adm-hero-title">Real estate management</h1>
                        <p className="adm-hero-desc">
                            A smart dashboard providing real estate insights,<br/>
                            performance metrics, and portfolio monitoring.
                        </p>
                        <div className="adm-hero-actions-row1">
                            <button className="adm-btn-add">
                                <IconPlus size={14} color="white"/> Add New
                            </button>
                            <button className="adm-btn-3d" onClick={() => setShow3D(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                                3D View
                            </button>
                            <button className="adm-icon-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                            </button>
                            <button className="adm-icon-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
                            </button>
                        </div>
                        <div className="adm-hero-actions-row2">
                            <div className="adm-team">
                                {TEAM.map((m, i) => (
                                    <div key={i} className="adm-team-av" style={{ background: m.bg, zIndex: TEAM.length - i }}>
                                        {m.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <button className="adm-icon-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="5" x2="20" y2="5"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="adm-hero-img">
                        <HouseSVG />
                    </div>
                </div>

                {/* ── KPI PILLS ── */}
                <div className="adm-pills">
                    {[
                        { val: "24", label: "PROPERTY", desc: "Ensuring portfolio stability through continuous property monitoring." },
                        { val: "18", label: "AGENT",    desc: "Measuring agent engagement to elevate team productivity." },
                        { val: "32", label: "SALES",    desc: "Visualizing sales trends to forecast revenue with precision." },
                    ].map(k => (
                        <div className="adm-pill" key={k.label}>
                            <div className="adm-pill-left">
                                <div className="adm-pill-ring">
                                    <span className="adm-pill-val">{k.val}</span>
                                </div>
                                <span className="adm-pill-label">{k.label}</span>
                            </div>
                            <p className="adm-pill-desc">{k.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── BOTTOM GRID ── */}
                <div className="adm-bottom">

                    {/* Risk */}
                    <div className="adm-card">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                Risk Overview
                            </div>
                            <span className="adm-card-link">↗</span>
                        </div>
                        <div className="adm-gauge-wrap">
                            <svg viewBox="0 0 176 110" className="adm-gauge-svg">
                                <defs>
                                    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%"   stopColor="#e8c040"/>
                                        <stop offset="70%"  stopColor="#b89020"/>
                                        <stop offset="100%" stopColor="#50a868"/>
                                    </linearGradient>
                                </defs>
                                <path d={`M${s.x} ${s.y} A${r} ${r} 0 1 1 ${e.x} ${e.y}`} fill="none" stroke="#ede9e0" strokeWidth="9" strokeLinecap="round"/>
                                <path d={`M${s.x} ${s.y} A${r} ${r} 0 0 1 ${f.x} ${f.y}`} fill="none" stroke="url(#gg)"   strokeWidth="9" strokeLinecap="round"/>
                                <circle cx={f.x} cy={f.y} r="5" fill="#b8922a" stroke="white" strokeWidth="2"/>
                            </svg>
                            <div className="adm-gauge-center">
                                <div className="adm-gauge-val">$487K</div>
                                <div className="adm-gauge-lbl">Estimated Property Value</div>
                                <div className="adm-gauge-risk">Moderate Risk</div>
                            </div>
                        </div>
                        <div className="adm-risk-bars">
                            {[
                                { label: "Structural Condition",   pct: 92, color: "#50a868" },
                                { label: "Rental Market Strength", pct: 85, color: "#50a868" },
                                { label: "Location Score",         pct: 78, color: "#c89828" },
                                { label: "Vacancy Risk",           pct: 34, color: "#e05030" },
                            ].map(b => (
                                <div className="adm-rbar" key={b.label}>
                                    <div className="adm-rbar-top"><span>{b.label}</span><span>{b.pct}%</span></div>
                                    <div className="adm-rbar-track">
                                        <div className="adm-rbar-fill" style={{ width: `${b.pct}%`, background: b.color }}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="adm-card">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <IconBarChart size={13} color="currentColor"/>
                                Portfolio Performance Metrics
                            </div>
                            <span className="adm-card-link">↗</span>
                        </div>
                        <div className="adm-perf-kpis">
                            <div className="adm-perf-kpi"><span className="adm-perf-val">9.4%</span><span className="adm-perf-lbl">Average ROI</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">4.1%</span><span className="adm-perf-lbl">Vacancy Rate</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">417</span><span className="adm-perf-lbl">Active Leases</span></div>
                        </div>
                        <div className="adm-bars-chart">
                            {[58,75,48,88,65,82,55,92,70,85,45,78].map((h,i) => (
                                <div key={i} className="adm-bar-col">
                                    <div className="adm-bar" style={{ height: `${h}%` }}/>
                                </div>
                            ))}
                        </div>
                        <div className="adm-bars-months">
                            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="adm-card adm-activity">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                Recent Activity
                            </div>
                            <span className="adm-card-link">↗</span>
                        </div>
                        <table className="adm-act-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>Activity Type</th><th>Description</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ACTIVITY.map((a,i) => (
                                    <tr key={i}>
                                        <td className="adm-act-date">{a.date}</td>
                                        <td className="adm-act-type">{a.type}</td>
                                        <td className="adm-act-desc">{a.desc}</td>
                                        <td><span className={`adm-status adm-status--${a.status}`}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AdminDashboard
