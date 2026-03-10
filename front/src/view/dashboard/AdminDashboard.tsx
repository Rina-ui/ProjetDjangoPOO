import DashboardLayout from "../../component/sidebar"
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

// ── FLAT / CARTOON house — matches Image 2 exactly ──────────────────
const HouseSVG = () => (
    <svg viewBox="0 0 560 360" className="adm-house-svg" preserveAspectRatio="xMidYMax meet">
        <defs>
            <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8dff0"/>
                <stop offset="55%" stopColor="#d8eaf8"/>
                <stop offset="100%" stopColor="#e8f2f8"/>
            </linearGradient>
            <linearGradient id="grass-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#82b856"/>
                <stop offset="100%" stopColor="#6a9e44"/>
            </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="560" height="360" fill="#e8e8e6"/>
        {/* Gradient sky panel right side */}
        <rect x="100" width="460" height="360" fill="url(#bg-grad)" opacity=".7"/>

        {/* Ground strip */}
        <rect x="0" y="298" width="560" height="62" fill="url(#grass-g)"/>
        {/* Ground highlight */}
        <rect x="0" y="296" width="560" height="4" fill="#96cc68" opacity=".6"/>

        {/* ── LEFT GREEN TREE (round, tall) ── */}
        {/* trunk */}
        <rect x="137" y="244" width="10" height="58" rx="3" fill="#5a7040"/>
        {/* canopy — layered ellipses for depth */}
        <ellipse cx="142" cy="232" rx="44" ry="50" fill="#4a8830"/>
        <ellipse cx="136" cy="215" rx="36" ry="44" fill="#5a9840"/>
        <ellipse cx="150" cy="212" rx="32" ry="40" fill="#6aaa50"/>
        <ellipse cx="142" cy="198" rx="28" ry="36" fill="#78bb5e"/>
        {/* highlight */}
        <ellipse cx="148" cy="194" rx="14" ry="18" fill="#8ece70" opacity=".4"/>

        {/* ── RIGHT RED TREE (Japanese maple) ── */}
        <rect x="468" y="240" width="10" height="62" rx="3" fill="#7a4030"/>
        <ellipse cx="473" cy="228" rx="48" ry="54" fill="#b03828"/>
        <ellipse cx="462" cy="210" rx="38" ry="46" fill="#c84838"/>
        <ellipse cx="484" cy="208" rx="36" ry="44" fill="#a02818"/>
        <ellipse cx="473" cy="194" rx="30" ry="38" fill="#d05840"/>
        <ellipse cx="480" cy="190" rx="16" ry="20" fill="#e06848" opacity=".4"/>

        {/* ── SMALL RIGHT GREEN SHRUB ── */}
        <rect x="516" y="266" width="7" height="36" rx="2" fill="#5a7040"/>
        <ellipse cx="519" cy="258" rx="22" ry="26" fill="#5a9840"/>
        <ellipse cx="519" cy="246" rx="17" ry="22" fill="#6aaa50"/>

        {/* ── MAIN HOUSE BODY ── */}
        {/* Shadow under house */}
        <ellipse cx="310" cy="302" rx="185" ry="9" fill="#00000018"/>

        {/* Lower / garage wing */}
        <rect x="360" y="218" width="120" height="82" fill="#e8e2d8" rx="2"/>

        {/* Main house body */}
        <rect x="165" y="158" width="220" height="142" fill="#f0ece4"/>

        {/* Upper floor box (recessed) */}
        <rect x="185" y="108" width="180" height="60" fill="#eae4da"/>

        {/* ── ROOFS (flat, dark) ── */}
        {/* Upper roof slab */}
        <rect x="175" y="100" width="200" height="14" rx="2" fill="#1e1e1e"/>
        {/* Lower roof slab (main) */}
        <rect x="150" y="150" width="250" height="14" rx="2" fill="#1e1e1e"/>
        {/* Garage roof slab */}
        <rect x="348" y="210" width="144" height="12" rx="2" fill="#2a2a2a"/>

        {/* ── WINDOWS upper floor ── */}
        <rect x="196" y="118" width="52" height="36" rx="3" fill="#b8d8f0" opacity=".85"/>
        {/* window grid */}
        <line x1="222" y1="118" x2="222" y2="154" stroke="#fff" strokeWidth="1.5" opacity=".6"/>
        <line x1="196" y1="136" x2="248" y2="136" stroke="#fff" strokeWidth="1" opacity=".5"/>

        <rect x="262" y="118" width="52" height="36" rx="3" fill="#b8d8f0" opacity=".85"/>
        <line x1="288" y1="118" x2="288" y2="154" stroke="#fff" strokeWidth="1.5" opacity=".6"/>
        <line x1="262" y1="136" x2="314" y2="136" stroke="#fff" strokeWidth="1" opacity=".5"/>

        {/* ── WINDOWS main floor (large floor-to-ceiling) ── */}
        <rect x="175" y="170" width="75" height="100" rx="2" fill="#b0d4ec" opacity=".88"/>
        <line x1="212" y1="170" x2="212" y2="270" stroke="#fff" strokeWidth="2" opacity=".55"/>
        <line x1="175" y1="218" x2="250" y2="218" stroke="#fff" strokeWidth="1" opacity=".35"/>

        <rect x="262" y="170" width="55" height="100" rx="2" fill="#b0d4ec" opacity=".78"/>
        <line x1="262" y1="218" x2="317" y2="218" stroke="#fff" strokeWidth="1" opacity=".35"/>

        {/* ── DOOR ── */}
        <rect x="325" y="216" width="30" height="84" rx="2" fill="#c8a870"/>
        <rect x="327" y="218" width="26" height="80" rx="1" fill="#d8b880"/>
        <circle cx="351" cy="260" r="3" fill="#8a6030"/>

        {/* ── GARAGE ── */}
        <rect x="372" y="226" width="96" height="72" rx="1" fill="#ccc4b4"/>
        {/* Garage door panels */}
        {[234, 248, 262, 276].map(y => (
            <line key={y} x1="372" y1={y} x2="468" y2={y} stroke="#b8b0a0" strokeWidth="1" opacity=".55"/>
        ))}
        <line x1="420" y1="226" x2="420" y2="298" stroke="#b8b0a0" strokeWidth="1" opacity=".55"/>

        {/* Concrete base ledge */}
        <rect x="162" y="296" width="332" height="6" rx="1" fill="#d4cfc4"/>

        {/* Path to door */}
        <path d="M328 300 L346 300 L354 320 L320 320 Z" fill="#ccc0a8" opacity=".8"/>

        {/* Shrubs at base */}
        <ellipse cx="178" cy="298" rx="16" ry="10" fill="#5a8840" opacity=".8"/>
        <ellipse cx="354" cy="297" rx="14" ry="9" fill="#5a8840" opacity=".7"/>
        <ellipse cx="372" cy="296" rx="10" ry="7" fill="#4a7830" opacity=".7"/>
    </svg>
)

const PageAction = () => (
    <button className="dl-add-btn">
        <IconPlus size={15} color="white" /> Add New
    </button>
)

const AdminDashboard = () => {
    // Gauge math
    const r = 66, cx = 88, cy = 86
    const toRad = (d: number) => (d * Math.PI) / 180
    const pt = (pct: number) => {
        const a = -210 + 240 * pct
        return { x: +(cx + r * Math.cos(toRad(a))).toFixed(2), y: +(cy + r * Math.sin(toRad(a))).toFixed(2) }
    }
    const s = pt(0), e = pt(1), f = pt(0.68)

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
                        <div className="adm-hero-actions">
                            <button className="adm-btn-add">
                                <IconPlus size={14} color="white"/> Add New
                            </button>
                            <button className="adm-icon-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                            </button>
                            <button className="adm-icon-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
                            </button>
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