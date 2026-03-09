import { useState } from "react"
import DashboardLayout from "../../component/sidebar.tsx"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Overview", icon: "⊞", path: "/dashboard/owner" },
    { label: "My Properties", icon: "🏠", path: "/dashboard/owner/properties" },
    { label: "Analytics", icon: "📊", path: "/dashboard/owner/analytics" },
    { label: "Messages", icon: "💬", path: "/dashboard/owner/messages" },
    { label: "Settings", icon: "⚙️", path: "/dashboard/owner/settings" },
]

const MY_PROPERTIES = [
    {
        id: 1,
        name: "Villa Anfa",
        location: "Casablanca, Anfa",
        type: "Villa",
        price: "$850,000",
        status: "for_sale",
        statusLabel: "For Sale",
        views: 1240,
        inquiries: 18,
        saved: 43,
        trend: "+22%",
        trendUp: true,
    },
    {
        id: 2,
        name: "Appartement Guéliz",
        location: "Marrakech, Guéliz",
        type: "Apartment",
        price: "$1,200 / mo",
        status: "for_rent",
        statusLabel: "For Rent",
        views: 876,
        inquiries: 9,
        saved: 31,
        trend: "+8%",
        trendUp: true,
    },
    {
        id: 3,
        name: "Riad Medina",
        location: "Fès, Médina",
        type: "House",
        price: "$320,000",
        status: "for_sale",
        statusLabel: "For Sale",
        views: 412,
        inquiries: 4,
        saved: 17,
        trend: "-3%",
        trendUp: false,
    },
    {
        id: 4,
        name: "Studio Agdal",
        location: "Rabat, Agdal",
        type: "Apartment",
        price: "$650 / mo",
        status: "rented",
        statusLabel: "Rented",
        views: 230,
        inquiries: 0,
        saved: 12,
        trend: "—",
        trendUp: true,
    },
]

const RECENT_INQUIRIES = [
    { name: "Amine Touhami", property: "Villa Anfa", date: "2 hours ago", type: "Visit Request" },
    { name: "Sophie Marchand", property: "Appartement Guéliz", date: "Yesterday", type: "Price Inquiry" },
    { name: "Omar Bennis", property: "Riad Medina", date: "3 days ago", type: "Visit Request" },
    { name: "Laura Petit", property: "Villa Anfa", date: "4 days ago", type: "Price Inquiry" },
]

const OwnerDashboard = () => {
    const [activeTab, setActiveTab] = useState<"all" | "sale" | "rent">("all")

    const filtered = MY_PROPERTIES.filter(p => {
        if (activeTab === "all") return true
        if (activeTab === "sale") return p.status === "for_sale"
        if (activeTab === "rent") return p.status === "for_rent" || p.status === "rented"
        return true
    })

    const totalViews = MY_PROPERTIES.reduce((a, p) => a + p.views, 0)
    const totalInquiries = MY_PROPERTIES.reduce((a, p) => a + p.inquiries, 0)
    const totalSaved = MY_PROPERTIES.reduce((a, p) => a + p.saved, 0)

    return (
        <DashboardLayout navItems={NAV_ITEMS}>
            <div className="owner-dashboard">
                {/* HEADER */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">My Properties</h1>
                        <p className="dash-subtitle">Track your listings and their performance</p>
                    </div>
                    <button className="btn-add-property">+ Add Property</button>
                </div>

                {/* OVERVIEW STATS */}
                <div className="stats-row">
                    {[
                        { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁", change: "+18%", up: true },
                        { label: "Inquiries", value: totalInquiries, icon: "💬", change: "+9%", up: true },
                        { label: "Saved by Users", value: totalSaved, icon: "❤️", change: "+14%", up: true },
                        { label: "Active Listings", value: MY_PROPERTIES.filter(p => p.status !== "rented").length, icon: "🏷️", change: "", up: true },
                    ].map(stat => (
                        <div className="stat-card" key={stat.label}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                                {stat.change && <span className={`stat-change ${stat.up ? "up" : "down"}`}>{stat.change} ↑</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* PROPERTIES + INQUIRIES */}
                <div className="owner-main">
                    {/* Properties List */}
                    <div className="dash-card owner-props-card">
                        <div className="card-header">
                            <span className="card-title">Listings</span>
                            <div className="tab-pills">
                                {(["all", "sale", "rent"] as const).map(t => (
                                    <button
                                        key={t}
                                        className={`tab-pill ${activeTab === t ? "active" : ""}`}
                                        onClick={() => setActiveTab(t)}
                                    >
                                        {t === "all" ? "All" : t === "sale" ? "For Sale" : "For Rent"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="props-list">
                            {filtered.map(prop => (
                                <div className="prop-row" key={prop.id}>
                                    <div className="prop-row-thumb" />
                                    <div className="prop-row-info">
                                        <span className="prop-row-name">{prop.name}</span>
                                        <span className="prop-row-loc">📍 {prop.location}</span>
                                        <div className="prop-row-tags">
                                            <span className="tag-pill">{prop.type}</span>
                                            <span className={`status-badge status-${prop.status}`}>{prop.statusLabel}</span>
                                        </div>
                                    </div>
                                    <div className="prop-row-price">{prop.price}</div>
                                    <div className="prop-row-stats">
                                        <div className="mini-stat">
                                            <span className="mini-stat-val">👁 {prop.views}</span>
                                            <span className="mini-stat-label">Views</span>
                                        </div>
                                        <div className="mini-stat">
                                            <span className="mini-stat-val">💬 {prop.inquiries}</span>
                                            <span className="mini-stat-label">Inquiries</span>
                                        </div>
                                        <div className="mini-stat">
                                            <span className="mini-stat-val">❤️ {prop.saved}</span>
                                            <span className="mini-stat-label">Saved</span>
                                        </div>
                                    </div>
                                    <div className={`prop-trend ${prop.trendUp ? "trend-up" : "trend-down"}`}>
                                        {prop.trend}
                                    </div>
                                    <div className="prop-row-actions">
                                        <button className="action-btn">✏️</button>
                                        <button className="action-btn">🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Inquiries */}
                    <div className="dash-card inquiries-card">
                        <div className="card-header">
                            <span className="card-title">Recent Inquiries</span>
                            <span className="card-link">See all ›</span>
                        </div>
                        <div className="inquiries-list">
                            {RECENT_INQUIRIES.map((inq, i) => (
                                <div className="inquiry-item" key={i}>
                                    <div className="inq-avatar">{inq.name.charAt(0)}</div>
                                    <div className="inq-info">
                                        <span className="inq-name">{inq.name}</span>
                                        <span className="inq-prop">{inq.property}</span>
                                        <span className="inq-type-badge">{inq.type}</span>
                                    </div>
                                    <span className="inq-date">{inq.date}</span>
                                </div>
                            ))}
                        </div>

                        {/* Views sparkline (static) */}
                        <div className="views-chart">
                            <div className="card-header" style={{ marginBottom: "12px" }}>
                                <span className="card-title">Views This Week</span>
                            </div>
                            <svg viewBox="0 0 260 60" className="spark-svg">
                                <polyline
                                    points="0,50 40,35 80,40 120,20 160,28 200,15 260,22"
                                    fill="none" stroke="#c9a84c" strokeWidth="2"
                                />
                                <polyline
                                    points="0,50 40,35 80,40 120,20 160,28 200,15 260,22"
                                    fill="url(#grad)" stroke="none"
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="spark-labels">
                                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                    <span key={d}>{d}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default OwnerDashboard