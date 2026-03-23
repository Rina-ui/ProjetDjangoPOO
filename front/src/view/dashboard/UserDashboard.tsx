import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import DashboardLayout from "../../component/sidebar"
import Viewer3D from "../../component/viewer3d"
import {
    IconSearch, IconHeart, IconMapPin, IconBed, IconBath,
    IconSquare, IconArrowLeft, IconStar, IconSend, IconMap, IconEye
} from "../../component/Icons"
import { COMMENTS } from "../../data/property"
import PropertyComparator from "../../component/PropertyComparator"
import type { Property, Comment } from "../../data/property"
import { useChat } from "../../context/Chatcontext"
import "../../style/dashboard.css"
import "../../style/client3d.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

// Mapper bien Django → Property front
const mapBien = (b: any): Property => ({
    id:        b.id,
    owner_id:  b.proprietaire,
    agent:     b.proprietaire_nom ?? "Owner",
    price:     b.statut === "EN_VENTE"
        ? `$${parseFloat(b.loyer_hc).toLocaleString()}`
        : `$${parseFloat(b.loyer_hc).toLocaleString()} /mo`,
    address:   b.adresse,
    beds:      b.equipements?.beds   ?? 3,
    baths:     b.equipements?.baths  ?? 2,
    sqft:      b.equipements?.sqft   ?? "1000",
    status:    b.statut === "EN_VENTE" ? "For Sale" : "For Rent",
    tag:       b.en_ligne ? null : "Offline",
    saved:     false,
    views:     b.views   ?? 0,
    rating:    4.5,
    reviews:   0,
    desc:      b.description ?? "",
    features:  b.equipements?.features ?? [],
    img:       b.photos_list?.[0]
        ? `${BASE_URL}${b.photos_list[0].image}`
        : "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    gallery:   b.photos_list?.slice(1).map((p: any) => `${BASE_URL}${p.image}`) ?? [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    ],
    modele_3d: b.modele_3d_url ?? null,
})

const ClientDashboard = () => {
    const navigate = useNavigate()
    const { openConversation } = useChat()

    const [properties,     setProperties]     = useState<Property[]>([])
    const [loadingProps,   setLoadingProps]   = useState(true)
    const [activeType, setActiveType] = useState<"Buy" | "Rent" | "Sell">("Rent")
    const [activeFilter,   setActiveFilter]   = useState("House")
    const [viewMode,       setViewMode]       = useState<"grid" | "map">("grid")
    const [search,         setSearch]         = useState("")
    const [savedIds,       setSavedIds]       = useState<number[]>([])
    const [selectedProp,   setSelectedProp]   = useState<Property | null>(null)
    const [comment,        setComment]        = useState("")
    const [allComments,    setAllComments]    = useState(COMMENTS)
    const [show3D,         setShow3D]         = useState(false)
    const [compareIds,     setCompareIds]     = useState<number[]>([])
    const [showComparator, setShowComparator] = useState(false)
    const [contacting,     setContacting]     = useState(false)

    // ── Charger les biens depuis l'API ────────────────────
    useEffect(() => {
        const token = localStorage.getItem("access_token")
        fetch(`${BASE_URL}/api/patrimoine/biens/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.results ?? []
                setProperties(list.map(mapBien))
            })
            .catch(() => setProperties([]))
            .finally(() => setLoadingProps(false))
    }, [])

    const toggleSave = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const submitComment = () => {
        if (!comment.trim() || !selectedProp) return
        const newComment: Comment = { name: "You", date: "Just now", rating: 5, text: comment }
        setAllComments(prev => ({ ...prev, [selectedProp.id]: [newComment, ...(prev[selectedProp.id] || [])] }))
        setComment("")
    }

    const handleContactOwner = async () => {
        if (!selectedProp) return
        setContacting(true)
        try {
            await openConversation(selectedProp.id, selectedProp.owner_id ?? 0)
            navigate("/dashboard/client/messages")
        } catch {
            console.error("Failed to open conversation")
        } finally {
            setContacting(false)
        }
    }

    const filtered = properties.filter(p => {
        if (activeType === "Sell") return false
        if (activeType === "Rent" && p.status !== "For Rent") return false
        if (activeType === "Buy"  && p.status !== "For Sale") return false
        if (search && !p.address.toLowerCase().includes(search.toLowerCase())
            && !p.agent.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    // ── VUE DÉTAIL ────────────────────────────────────────
    if (selectedProp) {
        const propComments = allComments[selectedProp.id] || []
        return (
            <>
                {show3D && <Viewer3D prop={selectedProp} onClose={() => setShow3D(false)} />}
                <DashboardLayout navItems={NAV_ITEMS} pageTitle="Property Detail">
                    <button className="detail-back" onClick={() => setSelectedProp(null)}>
                        <IconArrowLeft size={16} /> Back to listings
                    </button>
                    <div className="detail-grid">
                        <div>
                            <div className="detail-hero-block">
                                <div className="detail-main-img">
                                    <img src={selectedProp.img} alt={selectedProp.address} className="detail-main-photo"/>
                                    <button className="detail-3d-btn" onClick={() => setShow3D(true)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                            <path d="M2 17l10 5 10-5"/>
                                            <path d="M2 12l10 5 10-5"/>
                                        </svg>
                                        View in 3D
                                    </button>
                                </div>
                                <div className="detail-gallery-row">
                                    {selectedProp.gallery.map((src, i) => (
                                        <div key={i} className="detail-thumb">
                                            <img src={src} alt={`view ${i+1}`} className="detail-thumb-photo"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card" style={{ marginTop: 16 }}>
                                <div className="card-hd">
                                    <span className="card-title">Reviews & Comments ({propComments.length})</span>
                                </div>
                                {propComments.length === 0 && (
                                    <p style={{ color: "var(--text3)", fontSize: "13px", padding: "12px 0" }}>No comments yet.</p>
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
                                                    <IconStar key={s} size={12} color={s <= c.rating ? "#b8922a" : "#d4cfc7"} filled={s <= c.rating}/>
                                                ))}
                                            </div>
                                            <p className="comment-text">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="comment-form">
                                    <div className="comment-input-wrap">
                                        <div className="comment-av" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>Y</div>
                                        <input className="comment-input" placeholder="Share your thoughts..."
                                               value={comment} onChange={e => setComment(e.target.value)}
                                               onKeyDown={e => e.key === "Enter" && submitComment()}/>
                                    </div>
                                    <button className="comment-send" onClick={submitComment}>
                                        <IconSend size={14} color="white"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="detail-right-panel">
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <span className={`badge badge-${selectedProp.status === "For Sale" ? "sale" : "rent"}`}>{selectedProp.status}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                                    <IconEye size={13} color="var(--text3)"/> {selectedProp.views.toLocaleString()} views
                                </span>
                            </div>
                            <h1 className="detail-title">{selectedProp.agent}'s Property</h1>
                            <div className="detail-loc"><IconMapPin size={14} color="var(--gold)"/>{selectedProp.address}</div>
                            <div className="detail-price">
                                {selectedProp.price}
                                {selectedProp.status === "For Rent" && <span> / month</span>}
                            </div>
                            <div className="detail-specs">
                                {[["Bedrooms", selectedProp.beds], ["Bathrooms", selectedProp.baths], ["Sq. ft", selectedProp.sqft], ["Rating", selectedProp.rating]].map(([l, v]) => (
                                    <div key={String(l)} className="detail-spec">
                                        <span className="detail-spec-val" style={l === "Rating" ? { color: "var(--gold)" } : {}}>{v}</span>
                                        <span className="detail-spec-lbl">{l}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="detail-desc">{selectedProp.desc}</p>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features & Amenities</div>
                            <div className="detail-features">
                                {selectedProp.features.map(f => (
                                    <span className="feature-chip" key={f}>
                                        <span style={{ width: 5, height: 5, background: "var(--gold)", borderRadius: "50%", flexShrink: 0 }}/>{f}
                                    </span>
                                ))}
                            </div>
                            <div className="detail-actions">
                                <button className="btn-primary">Book a Visit</button>
                                <button className="btn-ghost"
                                        onClick={() => setSavedIds(p => p.includes(selectedProp.id) ? p.filter(i => i !== selectedProp.id) : [...p, selectedProp.id])}
                                        style={{ color: savedIds.includes(selectedProp.id) ? "var(--red)" : undefined }}>
                                    {savedIds.includes(selectedProp.id) ? "Saved" : "Save"}
                                </button>
                            </div>
                            <div className="detail-map-wrap">
                                <div className="detail-map-header">
                                    <IconMap size={14} color="var(--gold)"/>
                                    <span>Localisation</span>
                                    <span className="detail-map-addr">{selectedProp.address}</span>
                                </div>
                                <div className="detail-map-frame">
                                    <iframe title="map" className="detail-map-iframe"
                                            src="https://www.openstreetmap.org/export/embed.html?bbox=1.1309%2C6.1096%2C1.2309%2C6.1696&layer=mapnik&marker=6.1375%2C1.2123"
                                            loading="lazy"/>
                                    <a href="https://www.openstreetmap.org/?mlat=6.1375&mlon=1.2123#map=14/6.1375/1.2123"
                                       target="_blank" rel="noreferrer" className="detail-map-link">
                                        Ouvrir dans OpenStreetMap ↗
                                    </a>
                                </div>
                            </div>
                            <div className="card" style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>Listed by</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div className="comment-av" style={{ width: 40, height: 40, fontSize: 15 }}>{selectedProp.agent.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedProp.agent}</div>
                                        <div style={{ fontSize: 11, color: "var(--text3)" }}>Certified Agent · KÔRÂ</div>
                                    </div>
                                    <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}
                                            disabled={contacting} onClick={handleContactOwner}>
                                        {contacting ? "Opening…" : "Contact Owner"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </>
        )
    }

    // ── VUE BROWSE ────────────────────────────────────────
    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Browse Properties" pageAction={
            <button className="dl-add-btn" style={{ fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                Explore Map
            </button>
        }>
            <div className="c-search-bar">
                <div className="c-type-tabs">
                    {(["Buy", "Rent", "Sell"] as const).map(t => (
                        <button key={t} className={`c-tab ${activeType === t ? "c-tab--active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
                    ))}
                </div>
                <div className="c-search-input-wrap">
                    <IconSearch size={16} color="var(--text3)"/>
                    <input className="c-search-input" placeholder="Search city, address, agent..." value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <div className="c-view-toggle">
                    <button className={`c-view-btn ${viewMode === "grid" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("grid")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        Grid
                    </button>
                    <button className={`c-view-btn ${viewMode === "map" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("map")}>
                        <IconMap size={13}/> Map
                    </button>
                </div>
            </div>

            <div className="c-filters">
                <span className="c-filter-lbl">Filter:</span>
                {["House", "Villa", "Apartment", "Guesthouse"].map(f => (
                    <button key={f} className={`c-filter-pill ${activeFilter === f ? "c-filter-pill--active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
                ))}
                <select className="c-select"><option>Any Price</option><option>Under $200K</option><option>$200K–$500K</option><option>$500K+</option></select>
                <select className="c-select"><option>Any Location</option><option>Casablanca</option><option>Rabat</option><option>Marrakech</option></select>
            </div>

            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                {loadingProps
                    ? "Loading properties…"
                    : <><strong>{filtered.length}</strong> properties found</>
                }
            </div>

            <div className="c-grid">
                <div className={`c-cards ${viewMode === "map" ? "c-cards--with-map" : ""}`}>
                    {!loadingProps && filtered.length === 0 && (
                        <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>
                            No properties available yet.
                        </div>
                    )}
                    {filtered.map(prop => (
                        <div className="p-card" key={prop.id} onClick={() => setSelectedProp(prop)}>
                            <div className="p-card-img">
                                <img src={prop.img} alt={prop.address} className="p-card-photo"/>
                                {prop.tag && <span className="p-tag">{prop.tag}</span>}
                                <button className={`p-save-btn ${savedIds.includes(prop.id) ? "p-save-btn--saved" : ""}`} onClick={e => toggleSave(prop.id, e)}>
                                    <IconHeart size={14} filled={savedIds.includes(prop.id)} color={savedIds.includes(prop.id) ? "var(--red)" : "var(--text2)"}/>
                                </button>
                                <div className="p-agent">
                                    <div className="p-agent-av">{prop.agent.charAt(0)}</div>
                                    <span>{prop.agent}</span>
                                </div>
                                <span className="p-3d-badge">3D</span>
                                <button
                                    className={`p-compare-btn ${compareIds.includes(prop.id) ? "p-compare-btn--active" : ""}`}
                                    onClick={e => {
                                        e.stopPropagation()
                                        setCompareIds(prev => {
                                            if (prev.includes(prop.id)) return prev.filter(i => i !== prop.id)
                                            if (prev.length >= 2) return [prev[1], prop.id]
                                            return [...prev, prop.id]
                                        })
                                    }}
                                >
                                    {compareIds.includes(prop.id) ? "✓" : "+"}
                                </button>
                            </div>
                            <div className="p-body">
                                <div className="p-status">
                                    <div className={`p-status-dot p-status-dot--${prop.status === "For Sale" ? "sale" : "rent"}`}/>
                                    <span style={{ color: prop.status === "For Sale" ? "var(--blue)" : "var(--gold)" }}>{prop.status}</span>
                                </div>
                                <div className="p-price">{prop.price}</div>
                                <div className="p-specs">
                                    <div className="p-spec"><IconBed size={12} color="var(--text3)"/>{prop.beds} bed</div>
                                    <div className="p-spec"><IconBath size={12} color="var(--text3)"/>{prop.baths} bath</div>
                                    <div className="p-spec"><IconSquare size={12} color="var(--text3)"/>{prop.sqft} sqft</div>
                                </div>
                                <div className="p-addr"><IconMapPin size={10} color="var(--text3)"/>{prop.address}</div>
                            </div>
                        </div>
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

            {compareIds.length > 0 && (
                <div className="cmp-bar">
                    <span className="cmp-bar-text">
                        {compareIds.length === 1 ? "Select a 2nd property to compare" : "2 properties selected"}
                    </span>
                    <div className="cmp-bar-props">
                        {compareIds.map(id => {
                            const p = properties.find(pr => pr.id === id)!
                            return (
                                <span key={id} className="cmp-bar-chip">
                                    {p?.agent}
                                    <button onClick={() => setCompareIds(prev => prev.filter(i => i !== id))}>✕</button>
                                </span>
                            )
                        })}
                    </div>
                    {compareIds.length === 2 && (
                        <button className="cmp-bar-btn" onClick={() => setShowComparator(true)}>
                            Compare in 3D →
                        </button>
                    )}
                    <button className="cmp-bar-clear" onClick={() => setCompareIds([])}>Cancel</button>
                </div>
            )}

            {showComparator && compareIds.length === 2 && (
                <PropertyComparator
                    propA={properties.find(p => p.id === compareIds[0])!}
                    propB={properties.find(p => p.id === compareIds[1])!}
                    onClose={() => setShowComparator(false)}
                />
            )}
        </DashboardLayout>
    )
}

export default ClientDashboard