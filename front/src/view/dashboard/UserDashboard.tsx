import { useEffect, useMemo, useState, type MouseEvent } from "react"
import DashboardLayout from "../../component/sidebar"
import {
    IconSearch, IconHeart, IconMapPin,
    IconArrowLeft, IconStar, IconSend, IconMap,
    IconEye
} from "../../component/Icons"
import { useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { fetchBiens, fetchCategories, fetchTypesBien, type Bien, type Categorie, type TypeBien } from "../../services/biens"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
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

type BrowseProperty = {
    id: number
    address: string
    description: string
    statut: Bien["statut"]
    statusLabel: string
    categorie: number
    typeBien: number | null
    loyerHc: number
    charges: number
    equipements: string[]
    photos: string[]
}

const statusLabel = (status: Bien["statut"]) => {
    if (status === "VACANT") return "Vacant"
    if (status === "LOUE") return "Loue"
    if (status === "EN_VENTE") return "En vente"
    return "En travaux"
}

const toNumber = (value: number | string | undefined) => {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const ClientDashboard = () => {
    const { user } = useAuth()
    const location = useLocation()
    const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || "http://127.0.0.1:8000"
    const [activeStatus, setActiveStatus] = useState<"ALL" | "VACANT" | "LOUE" | "EN_VENTE" | "EN_TRAVAUX">("ALL")
    const [selectedCategorie, setSelectedCategorie] = useState<string>("ALL")
    const [selectedTypeBien, setSelectedTypeBien] = useState<string>("ALL")
    const [selectedPrice, setSelectedPrice] = useState<"ALL" | "LOW" | "MID" | "HIGH">("ALL")
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
    const [search, setSearch] = useState("")
    const [likedIds, setLikedIds] = useState<number[]>([])
    const [biens, setBiens] = useState<Bien[]>([])
    const [categories, setCategories] = useState<Categorie[]>([])
    const [typesBien, setTypesBien] = useState<TypeBien[]>([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState("")
    const [selectedProp, setSelectedProp] = useState<BrowseProperty | null>(null)
    const [comment, setComment] = useState("")
    const [allComments, setAllComments] = useState(COMMENTS)
    const isSavedMode = location.pathname.startsWith("/dashboard/client/saved")

    const toAbsoluteImageUrl = (value?: string) => {
        if (!value) return ""
        if (value.startsWith("http://") || value.startsWith("https://")) return value
        if (value.startsWith("/")) return `${API_ROOT_URL}${value}`
        return `${API_ROOT_URL}/${value}`
    }

    const getPhotos = (bien: Bien) => {
        if (bien.photos_files && bien.photos_files.length > 0) {
            return bien.photos_files
                .map((item) => toAbsoluteImageUrl(item.image_url || item.image))
                .filter(Boolean)
        }
        return (bien.photos || []).map((item) => toAbsoluteImageUrl(item)).filter(Boolean)
    }

    const browseData = useMemo<BrowseProperty[]>(() => {
        return biens.map((bien) => ({
            id: bien.id,
            address: bien.adresse,
            description: bien.description || `Bien #${bien.id}`,
            statut: bien.statut,
            statusLabel: statusLabel(bien.statut),
            categorie: bien.categorie,
            typeBien: bien.type_bien,
            loyerHc: toNumber(bien.loyer_hc),
            charges: toNumber(bien.charges),
            equipements: bien.equipements || [],
            photos: getPhotos(bien),
        }))
    }, [biens])

    useEffect(() => {
        const key = `liked_biens_${user?.id ?? "guest"}`
        const raw = localStorage.getItem(key)
        if (!raw) {
            setLikedIds([])
            return
        }
        try {
            const parsed = JSON.parse(raw) as number[]
            setLikedIds(Array.isArray(parsed) ? parsed : [])
        } catch {
            setLikedIds([])
        }
    }, [user?.id])

    useEffect(() => {
        const key = `liked_biens_${user?.id ?? "guest"}`
        localStorage.setItem(key, JSON.stringify(likedIds))
    }, [likedIds, user?.id])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setLoadError("")
            try {
                const [biensList, categoriesList, typesList] = await Promise.all([
                    fetchBiens(),
                    fetchCategories(),
                    fetchTypesBien(),
                ])
                setBiens(biensList)
                setCategories(categoriesList)
                setTypesBien(typesList)
            } catch (error) {
                console.error("[GET /api/biens/] erreur:", error)
                setLoadError("Impossible de charger les biens pour le moment.")
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [])

    const toggleLike = (id: number, e?: MouseEvent) => {
        e?.stopPropagation()
        setLikedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
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

    const sourceData = isSavedMode ? browseData.filter((item) => likedIds.includes(item.id)) : browseData

    const filtered = sourceData.filter((p) => {
        if (activeStatus !== "ALL" && p.statut !== activeStatus) return false
        if (selectedCategorie !== "ALL" && p.categorie !== Number(selectedCategorie)) return false
        if (selectedTypeBien !== "ALL" && p.typeBien !== Number(selectedTypeBien)) return false
        if (selectedPrice === "LOW" && p.loyerHc >= 100000) return false
        if (selectedPrice === "MID" && (p.loyerHc < 100000 || p.loyerHc > 300000)) return false
        if (selectedPrice === "HIGH" && p.loyerHc <= 300000) return false

        if (search) {
            const text = search.toLowerCase()
            const inAddress = p.address.toLowerCase().includes(text)
            const inDescription = p.description.toLowerCase().includes(text)
            const inEquipements = p.equipements.some((item) => item.toLowerCase().includes(text))
            if (!inAddress && !inDescription && !inEquipements) return false
        }

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
                        <div className="detail-main-img" style={selectedProp.photos[0] ? { backgroundImage: `url(${selectedProp.photos[0]})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                        <div className="detail-gallery-row">
                            {[0, 1, 2].map((index) => (
                                <div
                                    key={index}
                                    className="detail-thumb"
                                    style={selectedProp.photos[index] ? { backgroundImage: `url(${selectedProp.photos[index]})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                                />
                            ))}
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
                            <span className={`badge badge-${selectedProp.statut === "LOUE" ? "rent" : "sale"}`}>
                                {selectedProp.statusLabel}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                                <IconEye size={13} color="var(--text3)" /> Bien #{selectedProp.id}
                            </span>
                        </div>

                        <h1 className="detail-title">{selectedProp.description}</h1>
                        <div className="detail-loc">
                            <IconMapPin size={14} color="var(--gold)" />
                            {selectedProp.address}
                        </div>
                        <div className="detail-price">
                            {selectedProp.loyerHc.toLocaleString("fr-FR")} FCFA
                            <span> / mois</span>
                        </div>

                        <div className="detail-specs">
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.charges.toLocaleString("fr-FR")}</span>
                                <span className="detail-spec-lbl">Charges</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.equipements.length}</span>
                                <span className="detail-spec-lbl">Equipements</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val">{selectedProp.photos.length}</span>
                                <span className="detail-spec-lbl">Photos</span>
                            </div>
                            <div className="detail-spec">
                                <span className="detail-spec-val" style={{ color: "var(--gold)" }}>{selectedProp.statusLabel}</span>
                                <span className="detail-spec-lbl">Statut</span>
                            </div>
                        </div>

                        <p className="detail-desc">{selectedProp.description}</p>

                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features & Amenities</div>
                        <div className="detail-features">
                            {selectedProp.equipements.map(f => (
                                <span className="feature-chip" key={f}>
                                    <span style={{ width: 5, height: 5, background: "var(--gold)", borderRadius: "50%", flexShrink: 0 }} />
                                    {f}
                                </span>
                            ))}
                            {selectedProp.equipements.length === 0 && <span className="feature-chip">Aucun equipement renseigne</span>}
                        </div>

                        <div className="detail-actions">
                            <button className="btn-primary">Book a Visit</button>
                            <button
                                className="btn-ghost"
                                onClick={() => toggleLike(selectedProp.id)}
                                style={{ color: likedIds.includes(selectedProp.id) ? "var(--red)" : undefined }}
                            >
                                {likedIds.includes(selectedProp.id) ? "Liked" : "Like"}
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
                                <div className="comment-av" style={{ width: 40, height: 40, fontSize: 15 }}>{selectedProp.description.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>Owner #{selectedProp.id}</div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Annonce immobiliere</div>
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
        <DashboardLayout navItems={NAV_ITEMS} pageTitle={isSavedMode ? "Saved Properties" : "Browse Properties"} pageAction={<><button className="dl-add-btn" style={{ fontSize:13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>Explore Map</button></>}>
            {/* Search bar */}
                <div className="c-search-bar">
                    <div className="c-type-tabs">
                        {(["ALL", "VACANT", "LOUE", "EN_TRAVAUX"] as const).map(t => (
                            <button key={t} className={`c-tab ${activeStatus === t ? "c-tab--active" : ""}`} onClick={() => setActiveStatus(t)}>
                                {t === "ALL" ? "Tous" : t === "VACANT" ? "Vacants" : t === "LOUE" ? "Loues" : "Travaux"}
                            </button>
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
                    <select className="c-select" value={selectedCategorie} onChange={(e) => setSelectedCategorie(e.target.value)}>
                        <option value="ALL">Toutes categories</option>
                        {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
                    </select>
                    <select className="c-select" value={selectedTypeBien} onChange={(e) => setSelectedTypeBien(e.target.value)}>
                        <option value="ALL">Tous types</option>
                        {typesBien
                            .filter((type) => selectedCategorie === "ALL" || type.categorie === Number(selectedCategorie))
                            .map((type) => <option key={type.id} value={String(type.id)}>{type.nom}</option>)}
                    </select>
                    <select className="c-select" value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value as "ALL" | "LOW" | "MID" | "HIGH")}>
                        <option value="ALL">Tous les prix</option>
                        <option value="LOW">Moins de 100 000</option>
                        <option value="MID">100 000 - 300 000</option>
                        <option value="HIGH">Plus de 300 000</option>
                    </select>
</div>

    <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
        <strong>{filtered.length}</strong> {isSavedMode ? "bien(s) like(s)" : "properties found"}
    </div>

    {loadError && <p className="c-browse-msg c-browse-msg--error">{loadError}</p>}
    {loading && <p className="c-browse-msg">Chargement des biens...</p>}

    {/* Grid + Map */}
    <div className="c-grid">
        <div className={`c-cards ${viewMode === "map" ? "c-cards--with-map" : ""}`}>
            {!loading && filtered.map(prop => (
                <div className="p-card" key={prop.id} onClick={() => setSelectedProp(prop)}>
                    <div className="p-card-img">
                        {prop.photos[0] ? <img className="p-card-media-img" src={prop.photos[0]} alt={`Bien ${prop.id}`} loading="lazy" /> : <div className="p-card-media-empty">Photo indisponible</div>}
                        <button className={`p-save-btn ${likedIds.includes(prop.id) ? "p-save-btn--saved" : ""}`} onClick={e => toggleLike(prop.id, e)}>
                            <IconHeart size={14} filled={likedIds.includes(prop.id)} color={likedIds.includes(prop.id) ? "var(--red)" : "var(--text2)"} />
                        </button>
                    </div>
                    <div className="p-body">
                        <div className="p-status">
                            <div className={`p-status-dot p-status-dot--${prop.statut === "LOUE" ? "rent" : "sale"}`} />
                            <span style={{ color: prop.statut === "LOUE" ? "var(--gold)" : "var(--blue)" }}>{prop.statusLabel}</span>
                        </div>
                        <div className="p-price">{prop.loyerHc.toLocaleString("fr-FR")} FCFA</div>
                        <div className="p-specs">
                            <div className="p-spec">Charges: {prop.charges.toLocaleString("fr-FR")}</div>
                            <div className="p-spec">Eqp: {prop.equipements.length}</div>
                            <div className="p-spec">Photos: {prop.photos.length}</div>
                        </div>
                        <div className="p-addr"><IconMapPin size={10} color="var(--text3)" style={{ display: "inline", marginRight: 3 }} />{prop.address}</div>
                    </div>
                </div>
            ))}
            {!loading && filtered.length === 0 && <p className="c-browse-msg">{isSavedMode ? "Aucun bien like pour le moment." : "Aucun bien ne correspond a vos criteres."}</p>}
        </div>

        {viewMode === "map" && (
            <div className="c-map-panel">
                <div className="c-map-box">
                    <IconMap size={36} color="var(--border2)" />
                    <p>Map view — integrate Mapbox or Google Maps</p>
                    {filtered.slice(0, 3).map((item, index) => (
                        <div key={item.id} className={`c-map-pin pin-${index + 1}`}>{item.loyerHc.toLocaleString("fr-FR")} F</div>
                    ))}
                </div>
            </div>
        )}
    </div>
</DashboardLayout>
)
}

export default ClientDashboard