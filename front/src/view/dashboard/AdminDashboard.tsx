import DashboardLayout from "../../component/sidebar.tsx"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Dashboard", icon: "⊞", path: "/dashboard/admin" },
    { label: "Leads", icon: "👥", path: "/dashboard/admin/leads" },
    { label: "Properties", icon: "🏠", path: "/dashboard/admin/properties" },
    { label: "Transactions", icon: "💳", path: "/dashboard/admin/transactions" },
    { label: "Calendar", icon: "📅", path: "/dashboard/admin/calendar" },
    { label: "Settings", icon: "⚙️", path: "/dashboard/admin/settings" },
]

const ACTIVE_LISTINGS = [
    { name: "Maison Sterling", location: "New York, Albany", type: "House", units: 12, cost: "$15M", leads: 32, views: 125, status: "occupied", statusLabel: "9/12 Occupied" },
    { name: "The Orchid", location: "Ohio, Columbus", type: "Villa", units: 9300, cost: "$520K", leads: 15, views: 930, status: "available", statusLabel: "Available" },
    { name: "Echelon West", location: "Ohio, Columbus", type: "House", units: 26, cost: "$700K", leads: 140, views: 855, status: "available", statusLabel: "Available" },
    { name: "Le Résidence", location: "Ohio, Columbus", type: "Apartment", units: 17, cost: "$700K", leads: 11, views: 425, status: "sold", statusLabel: "Sold Out" },
]

const LEADS = [
    { name: "Jessica Chen", location: "New York, Albany" },
    { name: "John Doe", location: "California, LA" },
    { name: "Hailee S.", location: "New York, Troy" },
    { name: "Evan Chris", location: "Ohio, Columbus" },
    { name: "Emily Paris", location: "California, LA" },
]

const CALENDAR_DAYS = [
    "", "", "", "", "", "1", "2",
    "3", "4", "5", "6", "7", "8", "9",
    "10", "11", "12", "13", "14", "15", "16",
    "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30",
]

const AdminDashboard = () => {
    return (
        <DashboardLayout navItems={NAV_ITEMS}>
            <div className="admin-dashboard">
                {/* HEADER */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">Dashboard</h1>
                        <p className="dash-subtitle">Welcome back, Sarah — here's your overview</p>
                    </div>
                    <div className="dash-header-actions">
                        <button className="icon-btn">🔍</button>
                        <button className="icon-btn notif">🔔 <span className="notif-dot">7</span></button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="stats-row">
                    {[
                        { label: "Active Leads", value: "120", change: "+12%", icon: "👤", up: true },
                        { label: "Total Revenue", value: "$96.7M", change: "+12%", icon: "💰", up: true },
                        { label: "Active Listings", value: "23", change: "+12%", icon: "🏷️", up: true },
                        { label: "Total Closed", value: "42", change: "+12%", icon: "✅", up: false },
                    ].map((stat) => (
                        <div className="stat-card" key={stat.label}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                                <span className={`stat-change ${stat.up ? "up" : "down"}`}>{stat.change} ↑</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MIDDLE ROW */}
                <div className="dash-middle">
                    {/* Performance Chart (static SVG) */}
                    <div className="dash-card perf-card">
                        <div className="card-header">
                            <span className="card-title">Performance</span>
                            <select className="card-select"><option>Monthly</option></select>
                        </div>
                        <div className="chart-legend">
                            <span className="legend-dot orange" /> Revenue
                            <span className="legend-dot grey" /> Visit
                        </div>
                        <div className="chart-area">
                            <svg viewBox="0 0 400 120" className="perf-svg">
                                {/* Grid lines */}
                                {[0, 30, 60, 90, 120].map(y => (
                                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#2a2a2a" strokeWidth="1" />
                                ))}
                                {/* Revenue line */}
                                <polyline
                                    points="0,90 50,70 100,80 150,40 200,55 250,30 300,50 350,35 400,45"
                                    fill="none" stroke="#c9a84c" strokeWidth="2.5"
                                />
                                {/* Visit line */}
                                <polyline
                                    points="0,100 50,95 100,105 150,85 200,95 250,75 300,80 350,70 400,75"
                                    fill="none" stroke="#555" strokeWidth="2"
                                    strokeDasharray="4 2"
                                />
                                {/* Target dot */}
                                <circle cx="250" cy="30" r="4" fill="#c9a84c" />
                                <rect x="220" y="10" width="80" height="18" rx="4" fill="#1a1a1a" stroke="#c9a84c" strokeWidth="1" />
                                <text x="228" y="22" fill="#c9a84c" fontSize="9">$96,700,050</text>
                            </svg>
                            <div className="chart-months">
                                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"].map(m => (
                                    <span key={m} className={m === "Jun" ? "active-month" : ""}>{m}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Featured Property */}
                    <div className="dash-card featured-card">
                        <div className="card-header">
                            <span className="card-title">The Somerset</span>
                            <span className="card-sub">House</span>
                        </div>
                        <div className="featured-img-placeholder">
                            <div className="featured-badge">Recommended to 4 Leads</div>
                        </div>
                        <div className="featured-stats">
                            <div><span className="fstat-val">175</span><span className="fstat-label">Sold</span></div>
                            <div><span className="fstat-val">125</span><span className="fstat-label">Rented</span></div>
                            <div><span className="fstat-val">2K+</span><span className="fstat-label">Views</span></div>
                        </div>
                        <div className="deals-section">
                            <div className="card-header">
                                <span className="card-title">Deals</span>
                                <span className="card-link">›</span>
                            </div>
                            <div className="deals-bar">
                                <div className="deals-fill" style={{ width: "24%" }} />
                            </div>
                            <div className="deals-nums">
                                <span><strong>42</strong> Closed Deals</span>
                                <span><strong>132</strong> On Progress</span>
                            </div>
                        </div>
                    </div>

                    {/* Reminders + Calendar */}
                    <div className="dash-card reminder-card">
                        <div className="card-header">
                            <span className="card-title">Reminder</span>
                            <span className="card-link">↗</span>
                        </div>
                        {[
                            { label: "Follow-Ups", desc: "15 leads need to be followed up", color: "#c9a84c" },
                            { label: "Documents", desc: "3 documents awaiting review", color: "#6ab04c" },
                            { label: "Expire Listings", desc: "2 listings about to expire in 3 days", color: "#e55039" },
                        ].map(r => (
                            <div className="reminder-item" key={r.label}>
                                <div className="reminder-dot" style={{ background: r.color }} />
                                <div>
                                    <span className="reminder-label">{r.label}</span>
                                    <span className="reminder-desc">{r.desc}</span>
                                </div>
                                <span className="reminder-arrow">›</span>
                            </div>
                        ))}

                        {/* Mini Calendar */}
                        <div className="mini-calendar">
                            <div className="cal-header">
                                <span>‹</span>
                                <span>June 2025</span>
                                <span>›</span>
                            </div>
                            <div className="cal-grid">
                                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                    <span key={d} className="cal-day-label">{d}</span>
                                ))}
                                {CALENDAR_DAYS.map((d, i) => (
                                    <span key={i} className={`cal-day ${d === "3" ? "cal-today" : ""} ${!d ? "cal-empty" : ""}`}>
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="dash-bottom">
                    {/* Active Listings Table */}
                    <div className="dash-card table-card">
                        <div className="card-header">
                            <span className="card-title">Active Listing</span>
                            <div className="table-search">
                                <input placeholder="Search..." />
                                <span>↗</span>
                            </div>
                        </div>
                        <table className="dash-table">
                            <thead>
                            <tr>
                                <th>Property</th>
                                <th>Type</th>
                                <th>Cost</th>
                                <th>Active Leads</th>
                                <th>Views</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ACTIVE_LISTINGS.map((item) => (
                                <tr key={item.name}>
                                    <td>
                                        <div className="prop-cell">
                                            <div className="prop-thumb" />
                                            <div>
                                                <span className="prop-name">{item.name}</span>
                                                <span className="prop-loc">{item.location}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.type}</td>
                                    <td>{item.cost}</td>
                                    <td>{item.leads}</td>
                                    <td>{item.views}</td>
                                    <td>
                                            <span className={`status-badge status-${item.status}`}>
                                                {item.statusLabel}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Leads Contact */}
                    <div className="dash-card leads-card">
                        <div className="card-header">
                            <span className="card-title">Leads Contact</span>
                            <span className="card-link">↗</span>
                        </div>
                        <div className="leads-list">
                            {LEADS.map((lead) => (
                                <div className="lead-item" key={lead.name}>
                                    <div className="lead-avatar">{lead.name.charAt(0)}</div>
                                    <div className="lead-info">
                                        <span className="lead-name">{lead.name}</span>
                                        <span className="lead-loc">{lead.location}</span>
                                    </div>
                                    <button className="lead-call">📞</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AdminDashboard