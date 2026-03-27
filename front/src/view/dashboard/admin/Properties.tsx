import { useEffect, useState } from "react"
import { resolveMediaUrl } from "../../../utils/media"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const token = () => localStorage.getItem("access_token")

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

interface Bien {
    id: number
    adresse: string
    loyer_hc: string
    statut: string
    en_ligne: boolean
    description: string
    proprietaire_nom: string
    photos_list: { image?: string; url?: string; image_url?: string; photo?: string }[]
    date_creation: string
    categorie_nom: string
}

const STATUT: Record<string, { label: string; bg: string; color: string }> = {
    VACANT:                { label: "Available",  bg: "#f0fdf4", color: "#15803d" },
    LOUE:                  { label: "Rented",     bg: "#fdf6e7", color: "#b8922a" },
    EN_VENTE:              { label: "For Sale",   bg: "#eff6ff", color: "#1d4ed8" },
    EN_TRAVAUX:            { label: "In Works",   bg: "#fef3c7", color: "#92400e" },
    EN_ATTENTE_VALIDATION: { label: "Pending",    bg: "#fef9c3", color: "#854d0e" },
    REJETE:                { label: "Rejected",   bg: "#fef2f2", color: "#c0392b" },
}

const Properties = () => {
    const [biens,   setBiens]   = useState<Bien[]>([])
    const [loading, setLoading] = useState(true)
    const [search,  setSearch]  = useState("")
    const [statut,  setStatut]  = useState("all")
    const [view,    setView]    = useState<"grid" | "list">("list")
    const [rejectId,  setRejectId]  = useState<number | null>(null)
    const [rejectMsg, setRejectMsg] = useState("")
    const [photoModal, setPhotoModal] = useState<Bien | null>(null)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
    const [togglingOnlineId, setTogglingOnlineId] = useState<number | null>(null)

    useEffect(() => {
        fetch(`${BASE_URL}/api/patrimoine/biens/`, { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(d => setBiens(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setBiens([]))
            .finally(() => setLoading(false))
    }, [])

    const approve = async (id: number) => {
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/valider/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token()}` }
        })

        // Force aussi le champ en_ligne a 1 en base pour la visibilite locataire.
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token()}`
            },
            body: JSON.stringify({ en_ligne: true })
        }).catch(() => {})

        setBiens(prev => prev.map(b => b.id === id ? { ...b, statut: "VACANT", en_ligne: true } : b))
    }

    const reject = async (id: number) => {
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/rejeter/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ motif: rejectMsg })
        })
        setBiens(prev => prev.map(b => b.id === id ? { ...b, statut: "REJETE" } : b))
        setRejectId(null); setRejectMsg("")
    }

    const toggleOnline = async (bien: Bien) => {
        setTogglingOnlineId(bien.id)
        const nextOnline = !bien.en_ligne
        try {
            const res = await fetch(`${BASE_URL}/api/patrimoine/biens/${bien.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({ en_ligne: nextOnline })
            })

            if (!res.ok) throw new Error("toggle_failed")

            const updated = await res.json().catch(() => null)
            const persistedOnline = typeof updated?.en_ligne === "boolean"
                ? updated.en_ligne
                : nextOnline

            setBiens(prev => prev.map(b => b.id === bien.id ? { ...b, en_ligne: persistedOnline } : b))
        } catch {
            // Keep UI unchanged if backend update failed.
        } finally {
            setTogglingOnlineId(null)
        }
    }

    const openPhotoModal = (bien: Bien) => {
        setPhotoModal(bien)
        setCurrentPhotoIndex(0)
    }

    const closePhotoModal = () => {
        setPhotoModal(null)
        setCurrentPhotoIndex(0)
    }

    const nextPhoto = () => {
        if (photoModal && photoModal.photos_list) {
            setCurrentPhotoIndex((prev) => (prev + 1) % photoModal.photos_list.length)
        }
    }

    const prevPhoto = () => {
        if (photoModal && photoModal.photos_list) {
            setCurrentPhotoIndex((prev) => (prev - 1 + photoModal.photos_list.length) % photoModal.photos_list.length)
        }
    }

    const approveFromModal = async (id: number) => {
        await approve(id)
        closePhotoModal()
    }

    const rejectFromModal = async (id: number) => {
        const motif = window.prompt("Motif du rejet:")
        if (!motif) return
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/rejeter/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ motif })
        })
        setBiens(prev => prev.map(b => b.id === id ? { ...b, statut: "REJETE" } : b))
        closePhotoModal()
    }

    const getPhotoRawPath = (photo?: { image?: string; url?: string; image_url?: string; photo?: string }) => {
        if (!photo) return null
        return photo.image ?? photo.url ?? photo.image_url ?? photo.photo ?? null
    }

    const getPhotoSrc = (photo?: { image?: string; url?: string; image_url?: string; photo?: string }) => {
        return resolveMediaUrl(getPhotoRawPath(photo), BASE_URL)
    }

    const markImageFailed = (key: string) => {
        setFailedImages(prev => ({ ...prev, [key]: true }))
    }

    const isImageFailed = (key: string) => Boolean(failedImages[key])

    const filtered = biens
        .filter(b => statut === "all" || b.statut === statut)
        .filter(b => b.adresse.toLowerCase().includes(search.toLowerCase()) || b.proprietaire_nom?.toLowerCase().includes(search.toLowerCase()))

    const stats = {
        total:    biens.length,
        online:   biens.filter(b => b.en_ligne).length,
        pending:  biens.filter(b => b.statut === "EN_ATTENTE_VALIDATION").length,
        rejected: biens.filter(b => b.statut === "REJETE").length,
    }

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Properties">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
                .prop-anim { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
                .pending-pulse { animation: pulse 2s infinite; }
            `}</style>

            <div className="pg-header">
                <div>
                    <div className="pg-title">All Properties</div>
                    <div className="pg-subtitle">{biens.length} total listings · {stats.online} online</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="tbl-search-wrap" style={{ width: 260 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
                    </div>
                    {/* View toggle */}
                    <div className="c-view-toggle">
                        <button className={`c-view-btn ${view === "list" ? "c-view-btn--active" : ""}`} onClick={() => setView("list")}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                            List
                        </button>
                        <button className={`c-view-btn ${view === "grid" ? "c-view-btn--active" : ""}`} onClick={() => setView("grid")}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                            Grid
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total",    value: stats.total,    color: "#1d4ed8", bg: "#eff6ff" },
                    { label: "Online",   value: stats.online,   color: "#15803d", bg: "#f0fdf4" },
                    { label: "Pending",  value: stats.pending,  color: "#b8922a", bg: "#fdf6e7", pulse: true },
                    { label: "Rejected", value: stats.rejected, color: "#c0392b", bg: "#fef2f2" },
                ].map((s, i) => (
                    <div key={s.label} className={`stat-card ${s.pulse && s.value > 0 ? "pending-pulse" : ""}`}
                         style={{ animationDelay: `${i * 60}ms`, cursor: s.pulse ? "pointer" : "default" }}
                         onClick={() => s.pulse && setStatut("EN_ATTENTE_VALIDATION")}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[
                    { key: "all", label: "All" },
                    { key: "EN_ATTENTE_VALIDATION", label: "Pending" },
                    { key: "VACANT",  label: "Available" },
                    { key: "LOUE",    label: "Rented" },
                    { key: "EN_VENTE",label: "For Sale" },
                    { key: "REJETE",  label: "Rejected" },
                ].map(f => (
                    <button key={f.key} className={`tab-pill ${statut === f.key ? "tab-pill--active" : ""}`}
                            onClick={() => setStatut(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List view */}
            {view === "list" && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1.2fr auto", gap: 12, padding: "10px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                        {["Property", "Owner", "Price", "Status", "Date", "Actions"].map(h => (
                            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</div>
                        ))}
                    </div>

                    {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Loading…</div>}

                    {filtered.map((b, i) => {
                        const sc = STATUT[b.statut] ?? STATUT.VACANT
                        return (
                            <div key={b.id} className="prop-anim"
                                 style={{
                                     display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1.2fr auto",
                                     gap: 12, padding: "14px 20px", alignItems: "center",
                                     borderBottom: "1px solid var(--border)",
                                     animationDelay: `${i * 40}ms`,
                                     background: b.statut === "EN_ATTENTE_VALIDATION" ? "#fffbeb" : "transparent",
                                     transition: "background .15s"
                                 }}>
                                {/* Property */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div 
                                        onClick={() => openPhotoModal(b)}
                                        style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", background: "var(--bg2)", flexShrink: 0, cursor: "pointer" }}>
                                        {(() => {
                                            const thumbKey = `list-${b.id}-0`
                                            const thumbSrc = getPhotoSrc(b.photos_list?.[0])
                                            return thumbSrc && !isImageFailed(thumbKey)
                                                ? <img
                                                    src={thumbSrc}
                                                    alt="Property"
                                                    onError={() => markImageFailed(thumbKey)}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                                </div>
                                        })()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{b.adresse}</div>
                                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{b.categorie_nom ?? "Property"}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text2)" }}>{b.proprietaire_nom}</div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>${parseFloat(b.loyer_hc).toLocaleString()}</div>
                                <div>
                                    <span style={{ background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                                        {sc.label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                                    {new Date(b.date_creation).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    {b.statut === "EN_ATTENTE_VALIDATION" && (
                                        <>
                                            <button onClick={() => approve(b.id)} style={{
                                                padding: "6px 12px", borderRadius: 8, border: "none",
                                                background: "var(--green)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer"
                                            }}>Approve</button>
                                            <button onClick={() => setRejectId(b.id)} style={{
                                                padding: "6px 12px", borderRadius: 8, border: "1px solid var(--red)",
                                                background: "transparent", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer"
                                            }}>Reject</button>
                                        </>
                                    )}
                                    {b.statut !== "EN_ATTENTE_VALIDATION" && (
                                        <button
                                            onClick={() => toggleOnline(b)}
                                            disabled={togglingOnlineId === b.id}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: 8,
                                                border: "1px solid var(--border)",
                                                background: b.en_ligne ? "#fef2f2" : "#f0fdf4",
                                                color: b.en_ligne ? "var(--red)" : "var(--green)",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                opacity: togglingOnlineId === b.id ? 0.7 : 1
                                            }}
                                        >
                                            {togglingOnlineId === b.id ? "..." : b.en_ligne ? "Mettre hors ligne" : "Mettre en ligne"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Reject input */}
                    {rejectId && (
                        <div style={{ padding: "14px 20px", background: "#fef2f2", borderTop: "1px solid var(--red)", display: "flex", gap: 10, alignItems: "center" }}>
                            <input placeholder="Reason for rejection…" value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}
                                   style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--red)", fontSize: 13, outline: "none", background: "#fff" }}/>
                            <button onClick={() => reject(rejectId)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
                            <button onClick={() => { setRejectId(null); setRejectMsg("") }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        </div>
                    )}
                </div>
            )}

            {/* Grid view */}
            {view === "grid" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {filtered.map((b, i) => {
                        const sc = STATUT[b.statut] ?? STATUT.VACANT
                        return (
                            <div key={b.id} className="p-card prop-anim" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="p-card-img" onClick={() => openPhotoModal(b)} style={{ cursor: "pointer" }}>
                                    {(() => {
                                        const gridKey = `grid-${b.id}-0`
                                        const gridSrc = getPhotoSrc(b.photos_list?.[0])
                                        return gridSrc && !isImageFailed(gridKey)
                                            ? <img src={gridSrc} className="p-card-photo" alt="Property" onError={() => markImageFailed(gridKey)}/>
                                            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#e8e0d0,#d4c9b0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                            </div>
                                    })()}
                                    <span style={{ ...sc, position: "absolute", top: 10, left: 10, zIndex: 1, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                                        {sc.label}
                                    </span>
                                </div>
                                <div className="p-body">
                                    <div className="p-price">${parseFloat(b.loyer_hc).toLocaleString()}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{b.adresse}</div>
                                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>{b.proprietaire_nom}</div>
                                    {b.statut === "EN_ATTENTE_VALIDATION" && (
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => approve(b.id)} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "6px 10px" }}>Approve</button>
                                            <button onClick={() => setRejectId(b.id)} className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "6px 10px", color: "var(--red)", borderColor: "var(--red)" }}>Reject</button>
                                        </div>
                                    )}
                                    {b.statut !== "EN_ATTENTE_VALIDATION" && (
                                        <button
                                            onClick={() => toggleOnline(b)}
                                            disabled={togglingOnlineId === b.id}
                                            className="btn-ghost"
                                            style={{
                                                width: "100%",
                                                justifyContent: "center",
                                                fontSize: 11,
                                                padding: "6px 10px",
                                                color: b.en_ligne ? "var(--red)" : "var(--green)",
                                                borderColor: b.en_ligne ? "var(--red)" : "var(--green)",
                                                opacity: togglingOnlineId === b.id ? 0.7 : 1
                                            }}
                                        >
                                            {togglingOnlineId === b.id ? "Mise a jour..." : b.en_ligne ? "Mettre hors ligne" : "Mettre en ligne"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Photo Modal */}
            {photoModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.8)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "var(--bg)", borderRadius: "12px",
                        width: "100%", maxWidth: "600px",
                        overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "16px 20px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{photoModal.adresse}</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text3)" }}>
                                    {photoModal.proprietaire_nom} • {photoModal.categorie_nom}
                                </p>
                            </div>
                            <button onClick={closePhotoModal} style={{
                                background: "transparent", border: "none", fontSize: 24, cursor: "pointer", padding: 0,
                                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center"
                            }}>×</button>
                        </div>

                        {/* Photo Display */}
                        <div style={{
                            position: "relative", width: "100%", paddingBottom: "75%", overflow: "hidden",
                            background: "var(--bg2)"
                        }}>
                            {photoModal.photos_list && photoModal.photos_list.length > 0 ? (
                                <>
                                    {(() => {
                                        const modalPhoto = photoModal.photos_list[currentPhotoIndex]
                                        const modalKey = `modal-${photoModal.id}-${currentPhotoIndex}`
                                        const modalSrc = getPhotoSrc(modalPhoto)
                                        return modalSrc && !isImageFailed(modalKey)
                                            ? <img
                                                src={modalSrc}
                                                style={{
                                                    position: "absolute", top: 0, left: 0,
                                                    width: "100%", height: "100%", objectFit: "cover"
                                                }}
                                                alt="Property"
                                                onError={() => markImageFailed(modalKey)}
                                            />
                                            : <div style={{
                                                position: "absolute", top: 0, left: 0,
                                                width: "100%", height: "100%",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "var(--text3)"
                                            }}>
                                                Photo indisponible
                                            </div>
                                    })()}
                                    {photoModal.photos_list.length > 1 && (
                                        <>
                                            <button onClick={prevPhoto} style={{
                                                position: "absolute", left: "10px", top: "50%",
                                                transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)",
                                                color: "#fff", border: "none", borderRadius: "50%",
                                                width: 36, height: 36, cursor: "pointer", fontSize: 18,
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>‹</button>
                                            <button onClick={nextPhoto} style={{
                                                position: "absolute", right: "10px", top: "50%",
                                                transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)",
                                                color: "#fff", border: "none", borderRadius: "50%",
                                                width: 36, height: 36, cursor: "pointer", fontSize: 18,
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>›</button>
                                            <div style={{
                                                position: "absolute", bottom: "10px", left: "50%",
                                                transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)",
                                                color: "#fff", padding: "6px 12px", borderRadius: 20,
                                                fontSize: 12, fontWeight: 600
                                            }}>
                                                {currentPhotoIndex + 1} / {photoModal.photos_list.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    position: "absolute", top: 0, left: 0,
                                    width: "100%", height: "100%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "var(--text3)"
                                }}>
                                    Pas de photo
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {photoModal.photos_list && photoModal.photos_list.length > 1 && (
                            <div style={{
                                display: "flex", gap: "6px", padding: "12px",
                                background: "var(--bg2)", overflowX: "auto", borderTop: "1px solid var(--border)"
                            }}>
                                {photoModal.photos_list.map((photo, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setCurrentPhotoIndex(idx)}
                                        style={{
                                            width: 60, height: 60, borderRadius: 6, overflow: "hidden",
                                            flexShrink: 0, cursor: "pointer",
                                            border: idx === currentPhotoIndex ? "2px solid var(--gold)" : "1px solid var(--border)",
                                            opacity: idx === currentPhotoIndex ? 1 : 0.6,
                                            transition: "all .2s"
                                        }}
                                    >
                                        {(() => {
                                            const thumbKey = `modal-thumb-${photoModal.id}-${idx}`
                                            const thumbSrc = getPhotoSrc(photo)
                                            return thumbSrc && !isImageFailed(thumbKey)
                                                ? <img src={thumbSrc} alt="Thumbnail" onError={() => markImageFailed(thumbKey)} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 10 }}>
                                                    N/A
                                                </div>
                                        })()}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Details */}
                        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div>
                                    <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>PRICE</span>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                                        ${parseFloat(photoModal.loyer_hc).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>STATUS</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span style={{
                                            background: STATUT[photoModal.statut]?.bg,
                                            color: STATUT[photoModal.statut]?.color,
                                            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6
                                        }}>
                                            {STATUT[photoModal.statut]?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>
                                {photoModal.description || "No description"}
                            </p>
                        </div>

                        {/* Actions */}
                        {photoModal.statut === "EN_ATTENTE_VALIDATION" && (
                            <div style={{
                                padding: "16px 20px",
                                borderTop: "1px solid var(--border)",
                                display: "flex", gap: 10,
                                background: "var(--bg)"
                            }}>
                                <button onClick={() => approveFromModal(photoModal.id)} style={{
                                    flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
                                    background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer"
                                }}>✓ Approve</button>
                                <button onClick={() => rejectFromModal(photoModal.id)} style={{
                                    flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid var(--red)",
                                    background: "transparent", color: "var(--red)", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer"
                                }}>✕ Reject</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

export default Properties
