import { useState } from "react"
import DashboardLayout from "../../component/sidebar"
import {
    IconSearch, IconHeart, IconMapPin, IconBed, IconBath,
    IconSquare, IconArrowLeft, IconStar, IconSend, IconMap,
    IconEye
} from "../../component/Icons"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

const PROPERTIES = [
    { id: 1, agent: "Brandon Levin",   price: "$389,781",   address: "6391 Elgin St, Celina, Delaware 10299",              beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: "New",        saved: false, views: 1240, rating: 4.8, reviews: 24, desc: "A beautifully crafted 4-bedroom home with open-plan living spaces, high ceilings, and a modern kitchen. Located in a quiet residential area close to schools and parks. Features include a large landscaped garden, double garage, and premium finishes throughout. Natural light fills every room, creating a warm and welcoming atmosphere.", features: ["Garden", "Double Garage", "Modern Kitchen", "High Ceilings", "Quiet Street", "Near Schools"] },
    { id: 2, agent: "Gustavo Calzoni", price: "$160,581",   address: "2715 Ash Dr, San Jose, South Dakota 83475",           beds: 5, baths: 4, sqft: "2240", status: "For Sale", tag: null,         saved: true,  views: 876,  rating: 4.5, reviews: 18, desc: "Spacious 5-bedroom property offering generous living space across two floors. Recently renovated kitchen and bathrooms, with new hardwood floors throughout. The large backyard is perfect for entertaining, and the property sits on a quiet cul-de-sac in a sought-after neighborhood.", features: ["Renovated Kitchen", "Hardwood Floors", "Large Backyard", "Cul-de-sac", "Two Stories", "New Bathrooms"] },
    { id: 3, agent: "Chance Dorwart", price: "$2,400 /mo",  address: "8502 Preston Rd, Inglewood, Maine 98380",             beds: 3, baths: 2, sqft: "1850", status: "For Rent", tag: "Featured",   saved: false, views: 543,  rating: 4.7, reviews: 11, desc: "Modern 3-bedroom rental with stunning city views from the rooftop terrace. Open-plan kitchen and living area with designer fixtures. Building amenities include a gym, concierge service, and secure underground parking. Available immediately.", features: ["City Views", "Rooftop Terrace", "Gym Access", "Concierge", "Underground Parking", "Furnished"] },
    { id: 4, agent: "Craig Herwitz",   price: "$778,100",   address: "4140 Parker Rd, New Mexico 31134",                   beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: null,         saved: true,  views: 2100, rating: 4.9, reviews: 37, desc: "A premium 4-bedroom estate nestled in the prestigious Parker Road enclave. This stunning property features a chef's kitchen, formal dining room, home office, and a resort-style pool. The master suite includes a walk-in wardrobe and spa-inspired ensuite.", features: ["Swimming Pool", "Chef Kitchen", "Home Office", "Walk-in Wardrobe", "Formal Dining", "Spa Ensuite"] },
    { id: 5, agent: "Livia Rhiel",     price: "$1,200 /mo", address: "1234 Sunset Blvd, Los Angeles, CA 90028",             beds: 2, baths: 1, sqft: "850",  status: "For Rent", tag: null,         saved: false, views: 390,  rating: 4.2, reviews: 8,  desc: "Charming 2-bedroom apartment in the heart of West Hollywood. Walking distance to restaurants, cafes, and nightlife. Recently renovated with new appliances and fresh interiors. Includes one designated parking spot and access to a shared rooftop garden.", features: ["Rooftop Garden", "Renovated", "New Appliances", "Parking Spot", "West Hollywood", "Walk to Shops"] },
    { id: 6, agent: "Nolan Saris",     price: "$245,000",   address: "9876 Maple Ave, Chicago, IL 60601",                  beds: 3, baths: 2, sqft: "1400", status: "For Sale", tag: "Price Drop", saved: false, views: 720,  rating: 4.4, reviews: 14, desc: "Charming brick home in Chicago's vibrant Maple Avenue corridor. Three bedrooms, two full bathrooms, and a cozy living room with a fireplace. The basement is fully finished and ideal as a media room or home gym. Walking distance to the L-train for easy city access.", features: ["Fireplace", "Finished Basement", "Brick Exterior", "Near L-Train", "Media Room", "Updated HVAC"] },
]

const COMMENTS: Record<number, { name: string; date: string; rating: number; text: string }[]> = {
    1: [
        { name: "Amina Touré", date: "2 days ago", rating: 5, text: "Visited this property last weekend — absolutely stunning. The garden is even more beautiful in person and the open-plan living area is very well designed." },
        { name: "James W.", date: "1 week ago", rating: 4, text: "Great location and the house is immaculate. The only downside is parking can be a bit tricky on weekends due to the nearby market." },
    ],
    2: [{ name: "Sofia Chen", date: "3 days ago", rating: 5, text: "Great value for money! The renovation quality is excellent and the neighborhood is peaceful. Highly recommend visiting." }],
    3: [{ name: "Rania M.", date: "5 days ago", rating: 5, text: "The rooftop terrace has an incredible view. Building management is responsive and the gym is well-equipped." }],
    4: [
        { name: "Lucas Bernard", date: "1 day ago", rating: 5, text: "Dream property. The pool and chef kitchen are worth every cent. Viewing was impressive, the agent was very professional." },
        { name: "Nadia P.", date: "4 days ago", rating: 5, text: "By far the most impressive listing I've visited. The spa ensuite is a showstopper." },
    ],
    5: [{ name: "Marco F.", date: "1 week ago", rating: 4, text: "Perfect location for anyone who enjoys the LA lifestyle. The rooftop garden is a real bonus." }],
    6: [{ name: "Ella D.", date: "3 days ago", rating: 4, text: "Great starter home in a convenient location. The finished basement is a big plus — used it as a home office." }],
}

const ClientDashboard = () => {
    const [activeType, setActiveType] = useState<"Buy" | "Rent" | "Sell">("Buy")
    const [activeFilter, setActiveFilter] = useState("House")
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
    const [search, setSearch] = useState("")
    const [savedIds, setSavedIds] = useState<number[]>([2, 4])
    const [selectedProp, setSelectedProp] = useState<typeof PROPERTIES[0] | null>(null)
    const [comment, setComment] = useState("")
    const [allComments, setAllComments] = useState(COMMENTS)

    const toggleSave = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const submitComment = () => {
        if (!comment.trim() || !selectedProp) return
        const newComment = { name: "You", date: "Just now", rating: 5, text: comment }
        setAllComments(prev => ({
            ...prev,
            [selectedProp.id]: [newComment, ...(prev[selectedProp.id] || [])]
        }))
        setComment("")
    }

    const filtered = PROPERTIES.filter(p => {
        if (activeType === "Rent" && p.status !== "For Rent") return false
        if (activeType === "Buy" && p.status !== "For Sale") return false
        if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !p.agent.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    // DETAIL VIEW
    if (selectedProp) {
        const propComments = allComments[selectedProp.id] || []
        return (
            <DashboardLayout navItems={NAV_ITEMS} pageTitle="Property Detail">
                <button className="detail-back" onClick={() => setSelectedProp(null)}>
                    <IconArrowLeft size={16} />
                    Back to listings
                </button>

                <div className="detail-grid">
                    {/* LEFT — gallery + comments */}
                    <div>
                        <div className="detail-main-img" />
                        <div className="detail-gallery-row">
                            <div className="detail-thumb" />
                            <div className="detail-thumb" />
                            <div className="detail-thumb" style={{ background: "linear-gradient(135deg,#ddd8d0,#ccc5b8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#999", fontSize:"12px" }}>+4 photos</div>
                        </div>

                        {/* Comments */}
                        <div className="card">
                            <div className="card-hd">
                                <span className="card-title">Reviews & Comments ({propComments.length})</span>
                            </div>
                            <div>
                                {propComments.length === 0 && (
                                    <p style={{ color: "var(--text3)", fontSize: "13px", padding: "12px 0" }}>No comments yet. Be the first to leave a review.</p>
                                )}
                                {propComments.map((c, i) => (
                                    <div className="comment-item" key={i}>
                                        <div className="comment-av">{c.name.charAt(0)}</div>
                                        <div className="comment-body">
                                            <div className="comment-header">
                                                <span className="comment-name">{c.name}</span>
                                                <span className="comment-date">{c.date}</span>
                                            </div>
                                            <div className="comment-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <IconStar key={s} size={12} color={s <= c.rating ? "#b8922a" : "#d4cfc7"} filled={s <= c.rating} />
                                                ))}
                                            </div>
                                            <p className="comment-text">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="comment-form">
                                <div className="comment-input-wrap">
                                    <div className="comment-av" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>Y</div>
                                    <input
                                        className="comment-input"
                                        placeholder="Share your thoughts about this property..."
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && submitComment()}
                                    />
                                </div>
                                <button className="comment-send" onClick={submitComment}>
                                    <IconSend size={14} color="white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — info */}
                    <div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <span className={`badge badge-${selectedProp.status === "For Sale" ? "sale" : "rent"}`}>
                                {selectedProp.status}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                                <IconEye size={13} color="var(--text3)" /> {selectedProp.views.toLocaleString()} views
                            </span>
                        </div>

                        <h1 className="detail-title">{selectedProp.agent}'s Property</h1>
                        <div className="detail-loc">
                            <IconMapPin size={14} color="var(--gold)" />
                            {selectedProp.address}
                        </div>
                        <div className="detail-price">
                            {selectedProp.price}
                            {selectedProp.status === "For Rent" && <span> / month</span>}
                        </div>

                        <div className="detail-specs">
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.beds}</span>
                                <span className="detail-spec-lbl">Bedrooms</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.baths}</span>
                                <span className="detail-spec-lbl">Bathrooms</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.sqft}</span>
                                <span className="detail-spec-lbl">Sq. ft</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val" style={{ color: "var(--gold)" }}>{selectedProp.rating}</span>
                                <span className="detail-spec-lbl">Rating</span>
                            </div>
                        </div>

                        <p className="detail-desc">{selectedProp.desc}</p>

                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features & Amenities</div>
                        <div className="detail-features">
                            {selectedProp.features.map(f => (
                                <span className="feature-chip" key={f}>
                                    <span style={{ width: 5, height: 5, background: "var(--gold)", borderRadius: "50%", flexShrink: 0 }} />
                                    {f}
                                </span>
                            ))}
                        </div>

                        <div className="detail-actions">
                            <button className="btn-primary">Book a Visit</button>
                            <button
                                className="btn-ghost"
                                onClick={() => toggleSave(selectedProp.id, { stopPropagation: () => {} } as any)}
                                style={{ color: savedIds.includes(selectedProp.id) ? "var(--red)" : undefined }}
                            >
                                {savedIds.includes(selectedProp.id) ? "Saved" : "Save"}
                            </button>
                        </div>

                        {/* Map placeholder */}
                        <div className="detail-map">
                            <IconMap size={28} color="var(--border2)" />
                            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text2)" }}>Location Map</div>
                            <div style={{ fontSize: 11 }}>Integrate Mapbox / Google Maps here</div>
                        </div>

                        {/* Agent */}
                        <div className="card" style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>Listed by</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="comment-av" style={{ width: 40, height: 40, fontSize: 15 }}>{selectedProp.agent.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedProp.agent}</div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Certified Agent · KÔRÂ</div>
                                </div>
                                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Contact</button>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // BROWSE VIEW
    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Browse Properties" pageAction={<><button className="dl-add-btn" style={{ fontSize:13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>Explore Map</button></>}>
            {/* Search bar */}
                <div className="c-search-bar">
                    <div className="c-type-tabs">
                        {(["Buy", "Rent", "Sell"] as const).map(t => (
                            <button key={t} className={`c-tab ${activeType === t ? "c-tab--active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
                        ))}
                    </div>
                    <div className="c-search-input-wrap">
                        <IconSearch size={16} color="var(--text3)" />
                        <input className="c-search-input" placeholder="Search city, address, agent..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="c-view-toggle">
                        <button className={`c-view-btn ${viewMode === "grid" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("grid")}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                            Grid
                        </button>
                        <button className={`c-view-btn ${viewMode === "map" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("map")}>
                            <IconMap size={13} />
                            Map
                        </button>
                    </div>
                </div>

            {/* Filters */}
                <div className="c-filters">
                <span className="c-filter-lbl">Filter:</span>
            {["House", "Villa", "Apartment", "Guesthouse"].map(f => (
                <button key={f} className={`c-filter-pill ${activeFilter === f ? "c-filter-pill--active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
    ))}
    <select className="c-select"><option>Any Price</option><option>Under $200K</option><option>$200K–$500K</option><option>$500K+</option></select>
    <select className="c-select"><option>Any Location</option><option>Casablanca</option><option>Rabat</option><option>Marrakech</option></select>
</div>

    <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
        <strong>{filtered.length}</strong> properties found
    </div>

    {/* Grid + Map */}
    <div className="c-grid">
        <div className={`c-cards ${viewMode === "map" ? "c-cards--with-map" : ""}`}>
            {filtered.map(prop => (
                <div className="p-card" key={prop.id} onClick={() => setSelectedProp(prop)}>
                    <div className="p-card-img">
                        {prop.tag && <span className="p-tag">{prop.tag}</span>}
                        <button className={`p-save-btn ${savedIds.includes(prop.id) ? "p-save-btn--saved" : ""}`} onClick={e => toggleSave(prop.id, e)}>
                            <IconHeart size={14} filled={savedIds.includes(prop.id)} color={savedIds.includes(prop.id) ? "var(--red)" : "var(--text2)"} />
                        </button>
                        <div className="p-agent">
                            <div className="p-agent-av">{prop.agent.charAt(0)}</div>
                            <span>{prop.agent}</span>
                        </div>
                    </div>
                    <div className="p-body">
                        <div className="p-status">
                            <div className={`p-status-dot p-status-dot--${prop.status === "For Sale" ? "sale" : "rent"}`} />
                            <span style={{ color: prop.status === "For Sale" ? "var(--blue)" : "var(--gold)" }}>{prop.status}</span>
                        </div>
                        <div className="p-price">{prop.price}</div>
                        <div className="p-specs">
                            <div className="p-spec"><IconBed size={12} color="var(--text3)" />{prop.beds} bed</div>
                            <div className="p-spec"><IconBath size={12} color="var(--text3)" />{prop.baths} bath</div>
                            <div className="p-spec"><IconSquare size={12} color="var(--text3)" />{prop.sqft} sqft</div>
                        </div>
                        <div className="p-addr"><IconMapPin size={10} color="var(--text3)" style={{ display: "inline", marginRight: 3 }} />{prop.address}</div>
                    </div>
                </div>
            ))}
        </div>

        {viewMode === "map" && (
            <div className="c-map-panel">
                <div className="c-map-box">
                    <IconMap size={36} color="var(--border2)" />
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

export default ClientDashboard