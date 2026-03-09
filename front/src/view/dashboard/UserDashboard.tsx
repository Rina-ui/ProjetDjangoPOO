import { useState } from "react"
import DashboardLayout from "../../component/sidebar.tsx"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Browse", icon: "🔍", path: "/dashboard/client" },
    { label: "Saved", icon: "❤️", path: "/dashboard/client/saved" },
    { label: "Visits", icon: "📅", path: "/dashboard/client/visits" },
    { label: "Messages", icon: "💬", path: "/dashboard/client/messages" },
    { label: "Settings", icon: "⚙️", path: "/dashboard/client/settings" },
]

const PROPERTIES = [
    {
        id: 1,
        name: "Brandon Levin",
        price: "$389,781",
        address: "6391 Elgin St, Celina, Delaware 10299",
        beds: 4, baths: 2, sqft: "1090",
        status: "For Sale",
        saved: false,
        tag: "New",
    },
    {
        id: 2,
        name: "Gustavo Calzoni",
        price: "$160,581",
        address: "2715 Ash Dr, San Jose, South Dakota 83475",
        beds: 5, baths: 4, sqft: "2240",
        status: "For Sale",
        saved: true,
        tag: null,
    },
    {
        id: 3,
        name: "Chance Dorwart",
        price: "$520,000",
        address: "8502 Preston Rd, Inglewood, Maine 98380",
        beds: 3, baths: 2, sqft: "1850",
        status: "For Rent",
        saved: false,
        tag: "Featured",
    },
    {
        id: 4,
        name: "Craig Herwitz",
        price: "$778,100",
        address: "4140 Parker Rd, New Mexico 31134",
        beds: 4, baths: 2, sqft: "1090",
        status: "For Sale",
        saved: true,
        tag: null,
    },
    {
        id: 5,
        name: "Livia Rhiel",
        price: "$1,200 / mo",
        address: "1234 Sunset Blvd, Los Angeles, CA 90028",
        beds: 2, baths: 1, sqft: "850",
        status: "For Rent",
        saved: false,
        tag: null,
    },
    {
        id: 6,
        name: "Nolan Saris",
        price: "$245,000",
        address: "9876 Maple Ave, Chicago, IL 60601",
        beds: 3, baths: 2, sqft: "1400",
        status: "For Sale",
        saved: false,
        tag: "Price Drop",
    },
]

const ClientDashboard = () => {
    const [activeType, setActiveType] = useState<"Buy" | "Rent" | "Sell">("Buy")
    const [activeFilter, setActiveFilter] = useState("House")
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
    const [search, setSearch] = useState("")
    const [savedIds, setSavedIds] = useState<number[]>([2, 4])

    const toggleSave = (id: number) => {
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const filtered = PROPERTIES.filter(p => {
        if (activeType === "Rent" && p.status !== "For Rent") return false
        if (activeType === "Buy" && p.status !== "For Sale") return false
        if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !p.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <DashboardLayout navItems={NAV_ITEMS}>
            <div className="client-dashboard">
                {/* HEADER */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">Find Your Home</h1>
                        <p className="dash-subtitle">{filtered.length} properties found</p>
                    </div>
                    <div className="dash-header-actions">
                        <button className="icon-btn notif">🔔 <span className="notif-dot">2</span></button>
                    </div>
                </div>

                {/* TYPE TABS + SEARCH */}
                <div className="client-search-bar">
                    <div className="type-tabs">
                        {(["Buy", "Rent", "Sell"] as const).map(t => (
                            <button
                                key={t}
                                className={`type-tab ${activeType === t ? "active" : ""}`}
                                onClick={() => setActiveType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="search-input-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            className="client-search-input"
                            placeholder="Search by city, address, agent..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="view-toggle">
                        <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>⊞ Grid</button>
                        <button className={viewMode === "map" ? "active" : ""} onClick={() => setViewMode("map")}>🗺 Map</button>
                    </div>
                </div>

                {/* FILTER PILLS */}
                <div className="filter-pills-row">
                    <span className="filter-label">Filter:</span>
                    {["House", "Villa", "Apartment", "Guesthouse"].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${activeFilter === f ? "active" : ""}`}
                            onClick={() => setActiveFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                    <select className="price-select">
                        <option>Any Price</option>
                        <option>Under $200K</option>
                        <option>$200K – $500K</option>
                        <option>$500K+</option>
                    </select>
                    <select className="price-select">
                        <option>Any Location</option>
                        <option>Casablanca</option>
                        <option>Rabat</option>
                        <option>Marrakech</option>
                    </select>
                </div>

                {/* PROPERTY GRID */}
                <div className={`props-grid ${viewMode === "map" ? "with-map" : ""}`}>
                    <div className="props-cards">
                        {filtered.map(prop => (
                            <div className="prop-card" key={prop.id}>
                                {/* Image placeholder */}
                                <div className="prop-card-img">
                                    <div className="prop-card-overlay" />
                                    {prop.tag && <span className="prop-tag">{prop.tag}</span>}
                                    <button
                                        className={`save-btn ${savedIds.includes(prop.id) ? "saved" : ""}`}
                                        onClick={() => toggleSave(prop.id)}
                                    >
                                        {savedIds.includes(prop.id) ? "❤️" : "🤍"}
                                    </button>
                                    <div className="agent-chip">
                                        <div className="agent-avatar-mini">{prop.name.charAt(0)}</div>
                                        <span>{prop.name}</span>
                                    </div>
                                </div>

                                <div className="prop-card-body">
                                    <div className="prop-card-top">
                                        <span className={`prop-status-tag ${prop.status === "For Rent" ? "rent" : "sale"}`}>
                                            ● {prop.status}
                                        </span>
                                    </div>
                                    <div className="prop-card-price">{prop.price}</div>
                                    <div className="prop-card-specs">
                                        <span>🛏 {prop.beds} bed</span>
                                        <span>🚿 {prop.baths} bath</span>
                                        <span>📐 {prop.sqft} sqft</span>
                                    </div>
                                    <div className="prop-card-address">{prop.address}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Map panel */}
                    {viewMode === "map" && (
                        <div className="map-panel">
                            <div className="map-placeholder">
                                <span className="map-label">🗺</span>
                                <p>Map view — integrate Mapbox or Google Maps here</p>
                                <div className="map-pin pin1">$389K</div>
                                <div className="map-pin pin2">$160K</div>
                                <div className="map-pin pin3">$778K</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default ClientDashboard