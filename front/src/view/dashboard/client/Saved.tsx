import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

interface BienDetail {
    id:              number
    adresse:         string
    loyer_hc:        string
    statut:          string
    description:     string
    photo:           string | null
    proprietaire_nom: string
}

interface Saved {
    id:          number
    bien:        number
    bien_detail: BienDetail
    created_at:  string
}

const token = () => localStorage.getItem("access_token")

const Saved = () => {
    const navigate = useNavigate()
    const [items,   setItems]   = useState<Saved[]>([])
    const [loading, setLoading] = useState(true)
    const [search,  setSearch]  = useState("")

    useEffect(() => {
        fetch(`${BASE_URL}/api/locataires/sauvegardes/`, {
            headers: { Authorization: `Bearer ${token()}` }
        })
            .then(r => r.json())
            .then(d => setItems(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [])

    const unsave = async (id: number) => {
        await fetch(`${BASE_URL}/api/locataires/sauvegardes/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token()}` }
        })
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const filtered = items.filter(i =>
        i.bien_detail.adresse.toLowerCase().includes(search.toLowerCase()) ||
        i.bien_detail.proprietaire_nom.toLowerCase().includes(search.toLowerCase())
    )

    const statusLabel: Record<string, string> = {
        VACANT:    "Available",
        LOUE:      "Rented",
        EN_VENTE:  "For Sale",
        EN_TRAVAUX:"In Works",
    }
    const statusColor: Record<string, string> = {
        VACANT:   "var(--green)",
        LOUE:     "var(--gold)",
        EN_VENTE: "var(--blue)",
    }

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Saved Properties">
            <div className="pg-header">
                <div>
                    <div className="pg-title">Saved Properties</div>
                    <div className="pg-subtitle">{items.length} propert{items.length !== 1 ? "ies" : "y"} bookmarked</div>
                </div>
                {/* Search */}
                <div className="tbl-search-wrap" style={{ width: 240 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
                        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
            </div>

            {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--text3)", fontSize: 14 }}>
                    Loading…
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)" }}>No saved properties yet</div>
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>Browse properties and click the heart icon to save them</div>
                    <button className="btn-primary" onClick={() => navigate("/dashboard/client")} style={{ marginTop: 8 }}>
                        Browse Properties
                    </button>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {filtered.map(item => {
                    const b = item.bien_detail
                    return (
                        <div key={item.id} className="p-card" style={{ position: "relative" }}>
                            {/* Image */}
                            <div className="p-card-img" style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard/client")}>
                                {b.photo
                                    ? <img src={b.photo} alt={b.adresse} className="p-card-photo"/>
                                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#e8e0d0,#d4c9b0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9l4-4 4 4 4-4 4 4"/></svg>
                                    </div>
                                }
                                {/* Status badge */}
                                <span className="p-tag" style={{ background: statusColor[b.statut] ?? "var(--text3)" }}>
                                    {statusLabel[b.statut] ?? b.statut}
                                </span>
                                {/* Unsave btn */}
                                <button
                                    className="p-save-btn p-save-btn--saved"
                                    onClick={e => { e.stopPropagation(); unsave(item.id) }}
                                    title="Remove from saved"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-body">
                                <div className="p-price">
                                    ${parseFloat(b.loyer_hc).toLocaleString()}
                                    {b.statut !== "EN_VENTE" && <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 400 }}> /mo</span>}
                                </div>
                                <div className="p-addr" style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{b.adresse}</div>
                                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
                                    Listed by <span style={{ color: "var(--text2)", fontWeight: 500 }}>{b.proprietaire_nom}</span>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px 12px" }}
                                            onClick={() => navigate("/dashboard/client")}>
                                        View
                                    </button>
                                    <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px 12px" }}
                                            onClick={() => navigate("/dashboard/client/messages")}>
                                        Contact
                                    </button>
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10, textAlign: "right" }}>
                                    Saved {new Date(item.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </DashboardLayout>
    )
}

export default Saved