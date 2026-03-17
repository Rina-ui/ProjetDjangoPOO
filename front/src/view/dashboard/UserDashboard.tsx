import { useState } from "react"
import DashboardLayout from "../../component/sidebar"
import PropertyCard    from "../../component/PropertyCard"
import PropertyDetail  from "../../component/ProperryDetail"
import { IconMap, IconSearch } from "../../component/Icons"
import { PROPERTIES, COMMENTS } from "../../data/property"
import type { Property, Comment } from "../../data/property"
import "../../style/dashboard.css"
import "../../style/client3d.css"

// ── NAVIGATION ────────────────────────────────
const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

// ── COMPOSANT PRINCIPAL ───────────────────────
const UserDashboard = () => {
    // ── État global de la vue ─────────────────
    const [activeType,   setActiveType]   = useState<"Buy" | "Rent" | "Sell">("Buy")
    const [activeFilter, setActiveFilter] = useState("House")
    const [viewMode,     setViewMode]     = useState<"grid" | "map">("grid")
    const [search,       setSearch]       = useState("")
    const [savedIds,     setSavedIds]     = useState<number[]>([2, 4])
    const [selectedProp, setSelectedProp] = useState<Property | null>(null)
    const [allComments,  setAllComments]  = useState(COMMENTS)

    // ── Handlers ─────────────────────────────
    const toggleSave = (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const addComment = (propId: number, text: string) => {
        const newComment: Comment = { name: "You", date: "Just now", rating: 5, text }
        setAllComments(prev => ({
            ...prev,
            [propId]: [newComment, ...(prev[propId] || [])]
        }))
    }

    // ── Filtrage des propriétés ───────────────
    const filtered = PROPERTIES.filter(p => {
        if (activeType === "Rent" && p.status !== "For Rent") return false
        if (activeType === "Buy"  && p.status !== "For Sale") return false
        if (search && !p.address.toLowerCase().includes(search.toLowerCase())
            && !p.agent.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    // ── VUE DÉTAIL ────────────────────────────
    // Si une propriété est sélectionnée, on affiche sa page de détail
    if (selectedProp) {
        return (
            <PropertyDetail
                prop={selectedProp}
                savedIds={savedIds}
                comments={allComments[selectedProp.id] || []}
                onBack={() => setSelectedProp(null)}
                onToggleSave={toggleSave}
                onAddComment={(text) => addComment(selectedProp.id, text)}
            />
        )
    }

    // ── VUE BROWSE ────────────────────────────
    return (
        <DashboardLayout
            navItems={NAV_ITEMS}
            pageTitle="Browse Properties"
            pageAction={
                <button className="dl-add-btn" style={{ fontSize: 13 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Explore Map
                </button>
            }
        >
            {/* Barre de recherche */}
            <div className="c-search-bar">
                <div className="c-type-tabs">
                    {(["Buy", "Rent", "Sell"] as const).map(t => (
                        <button
                            key={t}
                            className={`c-tab ${activeType === t ? "c-tab--active" : ""}`}
                            onClick={() => setActiveType(t)}
                        >{t}</button>
                    ))}
                </div>
                <div className="c-search-input-wrap">
                    <IconSearch size={16} color="var(--text3)"/>
                    <input
                        className="c-search-input"
                        placeholder="Search city, address, agent..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="c-view-toggle">
                    <button className={`c-view-btn ${viewMode === "grid" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("grid")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        Grid
                    </button>
                    <button className={`c-view-btn ${viewMode === "map" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("map")}>
                        <IconMap size={13}/> Map
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="c-filters">
                <span className="c-filter-lbl">Filter:</span>
                {["House", "Villa", "Apartment", "Guesthouse"].map(f => (
                    <button
                        key={f}
                        className={`c-filter-pill ${activeFilter === f ? "c-filter-pill--active" : ""}`}
                        onClick={() => setActiveFilter(f)}
                    >{f}</button>
                ))}
                <select className="c-select">
                    <option>Any Price</option><option>Under $200K</option>
                    <option>$200K–$500K</option><option>$500K+</option>
                </select>
                <select className="c-select">
                    <option>Any Location</option><option>Lomé</option>
                    <option>Aného</option><option>Kpalimé</option>
                </select>
            </div>

            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                <strong>{filtered.length}</strong> properties found
            </div>

            {/* Grille + carte */}
            <div className="c-grid">
                <div className={`c-cards ${viewMode === "map" ? "c-cards--with-map" : ""}`}>
                    {filtered.map(prop => (
                        <PropertyCard
                            key={prop.id}
                            prop={prop}
                            saved={savedIds.includes(prop.id)}
                            onSave={e => toggleSave(prop.id, e)}
                            onClick={() => setSelectedProp(prop)}
                        />
                    ))}
                </div>

                {viewMode === "map" && (
                    <div className="c-map-panel">
                        <div className="c-map-box">
                            <IconMap size={36} color="var(--border2)"/>
                            <p>Map view — integrate Mapbox or Google Maps</p>
                            <div className="c-map-pin pin-1">$389K</div>
                            <div className="c-map-pin pin-2">$160K</div>
                            <div className="c-map-pin pin-3">$778K</div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default UserDashboard