import DashboardLayout from "../../component/sidebar"
import { IconUsers, IconBarChart, IconBuilding, IconCreditCard, IconPhone, IconTrendUp, IconPlus } from "../../component/Icons"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const LISTINGS = [
    { name: "Maison Sterling", loc: "New York, Albany",  type: "House",     cost: "$15M",  leads: 32,  views: 125, status: "occupied",  statusLabel: "9/12 Occupied" },
    { name: "The Orchid",      loc: "Ohio, Columbus",    type: "Villa",     cost: "$520K", leads: 15,  views: 930, status: "available", statusLabel: "Available" },
    { name: "Echelon West",    loc: "Ohio, Columbus",    type: "House",     cost: "$700K", leads: 140, views: 855, status: "available", statusLabel: "Available" },
    { name: "Le Résidence",    loc: "Ohio, Columbus",    type: "Apartment", cost: "$700K", leads: 11,  views: 425, status: "sold",      statusLabel: "Sold Out" },
]

const LEADS = [
    { name: "Jessica Chen", loc: "New York, Albany" },
    { name: "John Doe",     loc: "California, LA" },
    { name: "Hailee S.",    loc: "New York, Troy" },
    { name: "Evan Chris",   loc: "Ohio, Columbus" },
    { name: "Emily Paris",  loc: "California, LA" },
]

const CALENDAR_DAYS = ["","","","","","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30"]

const PageAction = () => (
    <>
        <button className="dl-export-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
        </button>
        <button className="dl-add-btn">
            <IconPlus size={15} color="white" />
            Add Property
        </button>
    </>
)

const AdminDashboard = () => (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Dashboard Overview" pageAction={<PageAction />}>
        <div>
            {/* Stats */}
            <div className="stats-row">
                {[
                    { label: "Properties Managed", value: "4,860",  change: "+12%", up: true,  icon: <IconBuilding size={18} color="#15803d" />,  bg: "var(--green-bg)" },
                    { label: "Asset Value",         value: "$2B",    change: "+8%",  up: true,  icon: <IconBarChart size={18} color="#b8922a" />, bg: "var(--gold-bg)"  },
                    { label: "Properties Sold",     value: "1,037",  change: "+5%",  up: true,  icon: <IconCreditCard size={18} color="#1d4ed8" />,bg: "var(--blue-bg)"  },
                    { label: "New Clients",         value: "895",    change: "-2%",  up: false, icon: <IconUsers size={18} color="#c0392b" />,     bg: "var(--red-bg)"   },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{s.value}</span>
                            <span className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>
                                <IconTrendUp size={10} color={s.up ? "var(--green)" : "var(--red)"} />
                                {s.change} this month
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle */}
            <div className="admin-grid-top">
                {/* Chart */}
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Revenue Performance</span>
                        <select style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", fontSize:12, color:"var(--text2)", fontFamily:"DM Sans,sans-serif" }}><option>Monthly</option></select>
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item"><div className="legend-dot" style={{ background:"#b8922a" }} />Revenue</div>
                        <div className="legend-item"><div className="legend-dot" style={{ background:"#d4cfc7" }} />Visits</div>
                    </div>
                    <svg viewBox="0 0 380 100" style={{ width:"100%", height:90, overflow:"visible" }}>
                        <defs>
                            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#b8922a" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#b8922a" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0,33,66,100].map(y => <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#e5e1da" strokeWidth="1"/>)}
                        <polygon points="0,85 47,65 95,72 143,38 190,52 238,28 285,46 333,32 380,42 380,100 0,100" fill="url(#rg)"/>
                        <polyline points="0,85 47,65 95,72 143,38 190,52 238,28 285,46 333,32 380,42" fill="none" stroke="#b8922a" strokeWidth="2.5" strokeLinejoin="round"/>
                        <polyline points="0,92 47,88 95,95 143,78 190,88 238,70 285,75 333,65 380,70" fill="none" stroke="#d4cfc7" strokeWidth="2" strokeDasharray="4 2"/>
                        <circle cx="238" cy="28" r="4" fill="#b8922a"/>
                        <rect x="208" y="10" width="68" height="16" rx="4" fill="var(--text)"/>
                        <text x="215" y="21" fill="white" fontSize="9" fontFamily="DM Sans,sans-serif">$96,700,050</text>
                    </svg>
                    <div className="chart-months">
                        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"].map(m => (
                            <span key={m} className={m === "Jun" ? "active" : ""}>{m}</span>
                        ))}
                    </div>
                </div>

                {/* Featured */}
                <div className="card">
                    <div className="card-hd">
                        <div>
                            <span className="card-title">The Somerset</span>
                            <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>Featured property</div>
                        </div>
                    </div>
                    <div className="featured-img"><div className="featured-badge">Recommended · 4 Leads</div></div>
                    <div className="feat-stats">
                        <div><span className="feat-stat-val">175</span><span className="feat-stat-lbl">Sold</span></div>
                        <div><span className="feat-stat-val">125</span><span className="feat-stat-lbl">Rented</span></div>
                        <div><span className="feat-stat-val">2K+</span><span className="feat-stat-lbl">Views</span></div>
                    </div>
                    <div style={{ borderTop:"1px solid var(--border)", paddingTop:12 }}>
                        <div className="card-hd" style={{ marginBottom:8 }}>
                            <span style={{ fontSize:13, fontWeight:600 }}>Deals</span>
                            <span className="card-action">See all</span>
                        </div>
                        <div className="deals-bar-wrap"><div className="deals-bar-fill" style={{ width:"24%" }}/></div>
                        <div className="deals-nums"><span><strong>42</strong> Closed</span><span><strong>132</strong> In Progress</span></div>
                    </div>
                </div>

                {/* Reminders + Calendar */}
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Reminders</span>
                        <span className="card-action">See all</span>
                    </div>
                    {[
                        { label:"Follow-Ups",      desc:"15 leads need follow-up",      color:"#b8922a" },
                        { label:"Documents",       desc:"3 documents awaiting review",  color:"#15803d" },
                        { label:"Expire Listings", desc:"2 listings expire in 3 days",  color:"#c0392b" },
                    ].map(r => (
                        <div className="reminder-item" key={r.label}>
                            <div className="reminder-dot" style={{ background:r.color }}/>
                            <div style={{ flex:1 }}>
                                <span className="reminder-lbl">{r.label}</span>
                                <span className="reminder-desc">{r.desc}</span>
                            </div>
                            <span className="reminder-arr">›</span>
                        </div>
                    ))}
                    <div className="mini-cal">
                        <div className="cal-hd">
                            <button>‹</button>
                            <span>June 2025</span>
                            <button>›</button>
                        </div>
                        <div className="cal-grid">
                            {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => <span key={d} className="cal-day-lbl">{d}</span>)}
                            {CALENDAR_DAYS.map((d,i) => (
                                <span key={i} className={`cal-day ${d==="3"?"cal-day--today":""} ${!d?"cal-day--empty":""}`}>{d}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="admin-grid-bot">
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Active Listings</span>
                        <div className="tbl-search-wrap">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                            <input placeholder="Search..."/>
                        </div>
                    </div>
                    <table className="dash-table">
                        <thead><tr><th>Property</th><th>Type</th><th>Cost</th><th>Leads</th><th>Views</th><th>Status</th></tr></thead>
                        <tbody>
                        {LISTINGS.map(item => (
                            <tr key={item.name}>
                                <td><div className="prop-cell"><div className="prop-thumb"/><div><span className="prop-n">{item.name}</span><span className="prop-l">{item.loc}</span></div></div></td>
                                <td style={{ color:"var(--text2)", fontSize:13 }}>{item.type}</td>
                                <td style={{ fontWeight:600, fontSize:13 }}>{item.cost}</td>
                                <td style={{ fontSize:13 }}>{item.leads}</td>
                                <td style={{ fontSize:13 }}>{item.views}</td>
                                <td><span className={`badge badge-${item.status}`}>{item.statusLabel}</span></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Leads Contact</span>
                        <span className="card-action">See all</span>
                    </div>
                    <div className="leads-list">
                        {LEADS.map(l => (
                            <div className="lead-row" key={l.name}>
                                <div className="lead-av">{l.name.charAt(0)}</div>
                                <div style={{ flex:1 }}><span className="lead-n">{l.name}</span><span className="lead-l">{l.loc}</span></div>
                                <button className="lead-phone"><IconPhone size={13}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
)

export default AdminDashboard