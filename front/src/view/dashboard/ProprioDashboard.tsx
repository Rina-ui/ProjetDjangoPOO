import { useState, useEffect } from "react"
import DashboardLayout from "../../component/sidebar"
import {
    IconMapPin, IconEye, IconMessage, IconHeart,
    IconBuilding, IconEdit, IconTrash, IconTrendUp, IconPlus
} from "../../component/Icons"
import "../../style/dashboard.css"
import InvestmentTimeline from "../../component/investmen_timline.tsx"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

// ── MODAL AJOUT PROPRIÉTÉ ─────────────────────────────────
const AddPropertyModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")
    const [form, setForm] = useState({
        adresse: "", description: "", loyer_hc: "",
        charges: "0", statut: "VACANT", categorie: "1", type_bien: ""
    })
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async () => {
        if (!form.adresse || !form.loyer_hc) { setError("Fill required fields"); return }
        setLoading(true); setError("")
        try {
            const token = localStorage.getItem("access_token")
            const res = await fetch(`${BASE_URL}/api/patrimoine/biens/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    adresse:     form.adresse,
                    description: form.description,
                    loyer_hc:    parseFloat(form.loyer_hc),
                    charges:     parseFloat(form.charges),
                    statut:      form.statut,
                    categorie:   parseInt(form.categorie),
                    en_ligne:    false,
                })
            })
            if (!res.ok) throw new Error("Failed to create property")
            onSuccess()
            onClose()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>Add Property</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text3)" }}>×</button>
                </div>

                {[
                    { label: "Address *",     key: "adresse",     type: "text" },
                    { label: "Description",   key: "description", type: "text" },
                    { label: "Rent (HC) *",   key: "loyer_hc",    type: "number" },
                    { label: "Charges",       key: "charges",     type: "number" },
                ].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>{f.label}</label>
                        <input
                            type={f.type}
                            value={form[f.key as keyof typeof form]}
                            onChange={e => set(f.key, e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, background: "var(--bg)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                        />
                    </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Status</label>
                    <select
                        value={form.statut}
                        onChange={e => set("statut", e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, background: "var(--bg)", color: "var(--text)", outline: "none" }}
                    >
                        <option value="VACANT">Vacant</option>
                        <option value="LOUE">Rented</option>
                        <option value="EN_VENTE">For Sale</option>
                        <option value="EN_TRAVAUX">Under Construction</option>
                    </select>
                </div>

                {error && <div style={{ fontSize: 12, color: "#c0392b", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>{error}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#1a1814", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                        {loading ? "Creating…" : "Add Property"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────
const ProprioDashboard = () => {
    const [biens,       setBiens]       = useState<any[]>([])
    const [loading,     setLoading]     = useState(true)
    const [activeTab,   setActiveTab]   = useState<"all"|"sale"|"rent">("all")
    const [showAddProp, setShowAddProp] = useState(false)
    const [conversations, setConversations] = useState<any[]>([])

    const token = localStorage.getItem("access_token")

    // ── Charger les biens depuis l'API ────────────────────
    const fetchBiens = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/patrimoine/biens/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setBiens(Array.isArray(data) ? data : data.results ?? [])
        } catch {
            setBiens([])
        } finally {
            setLoading(false)
        }
    }

    // ── Charger les conversations (demandes) ──────────────
    const fetchConversations = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/chat/conversations/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setConversations(Array.isArray(data) ? data : data.results ?? [])
        } catch {
            setConversations([])
        }
    }

    useEffect(() => {
        fetchBiens()
        fetchConversations()
    }, [])

    // ── Supprimer un bien ─────────────────────────────────
    const handleDelete = async (id: number) => {
        if (!confirm("Delete this property?")) return
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchBiens()
    }

    // ── Mettre en ligne ───────────────────────────────────
    const handlePublish = async (id: number) => {
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/mettre_en_ligne/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchBiens()
    }

    // ── Stats dynamiques ──────────────────────────────────
    const totalViews    = biens.reduce((a, b) => a + (b.views ?? 0), 0)
    const totalInq      = conversations.length
    const totalSaved    = biens.reduce((a, b) => a + (b.saved ?? 0), 0)
    const activeListings = biens.filter(b => b.statut !== "LOUE").length

    // ── Filtrage ──────────────────────────────────────────
    const filtered = biens.filter(b => {
        if (activeTab === "sale") return b.statut === "EN_VENTE"
        if (activeTab === "rent") return b.statut === "LOUE" || b.statut === "VACANT"
        return true
    })

    const mapStatut = (s: string) => ({
        LOUE: { label: "Rented",           css: "rented"   },
        VACANT: { label: "Vacant",         css: "vacant"   },
        EN_VENTE: { label: "For Sale",     css: "for_sale" },
        EN_TRAVAUX: { label: "In Works",   css: "pending"  },
    }[s] ?? { label: s, css: "vacant" })

    return (
        <DashboardLayout
            navItems={NAV_ITEMS}
            pageTitle="My Properties"
            pageAction={
                <>
                    <button className="dl-export-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export
                    </button>
                    <button className="dl-add-btn" onClick={() => setShowAddProp(true)}>
                        <IconPlus size={15} color="white"/> Add Property
                    </button>
                </>
            }
        >
            {showAddProp && (
                <AddPropertyModal
                    onClose={() => setShowAddProp(false)}
                    onSuccess={fetchBiens}
                />
            )}

            {/* ── KPI STATS ── */}
            <div className="stats-row">
                {[
                    { label: "Total Views",     value: totalViews.toLocaleString(), icon: <IconEye size={18} color="#1d4ed8"/>,      bg: "var(--blue-bg)",  change: "+18%", up: true },
                    { label: "Inquiries",       value: totalInq,                    icon: <IconMessage size={18} color="#b8922a"/>,  bg: "var(--gold-bg)",  change: "+9%",  up: true },
                    { label: "Saved by Users",  value: totalSaved,                  icon: <IconHeart size={18} color="#c0392b"/>,    bg: "var(--red-bg)",   change: "+14%", up: true },
                    { label: "Active Listings", value: activeListings,              icon: <IconBuilding size={18} color="#15803d"/>, bg: "var(--green-bg)", change: "",     up: true },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{loading ? "…" : s.value}</span>
                            {s.change && (
                                <span className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>
                                    <IconTrendUp size={10} color="var(--green)"/>
                                    {s.change}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="owner-grid">
                {/* ── LISTE DES BIENS ── */}
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Listings</span>
                        <div className="tab-pills">
                            {(["all","sale","rent"] as const).map(t => (
                                <button key={t} className={`tab-pill ${activeTab === t ? "tab-pill--active" : ""}`} onClick={() => setActiveTab(t)}>
                                    {t === "all" ? "All" : t === "sale" ? "For Sale" : "For Rent"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading && <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>Loading…</div>}

                    {!loading && filtered.length === 0 && (
                        <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>
                            No properties yet —
                            <span style={{ color: "var(--gold)", cursor: "pointer", marginLeft: 4 }} onClick={() => setShowAddProp(true)}>
                                add your first one
                            </span>
                        </div>
                    )}

                    {filtered.map(b => {
                        const st = mapStatut(b.statut)
                        return (
                            <div className="prop-row" key={b.id}>
                                <div className="prop-thumb-lg"/>
                                <div className="prop-main">
                                    <div className="prop-name">{b.adresse}</div>
                                    <div className="prop-loc">
                                        <IconMapPin size={11} color="var(--text3)"/>
                                        {b.adresse}
                                    </div>
                                    <div className="prop-tags">
                                        <span className={`badge badge-${st.css}`}>{st.label}</span>
                                        {b.en_ligne
                                            ? <span style={{ fontSize: 10, background: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Online</span>
                                            : <span style={{ fontSize: 10, background: "#fef2f2", color: "#c0392b", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Offline</span>
                                        }
                                    </div>
                                </div>
                                <div className="prop-price">{b.loyer_hc} / mo</div>
                                <div className="prop-metrics">
                                    <div className="metric"><span className="metric-val">{b.loyer_hc}</span><span className="metric-lbl">Rent</span></div>
                                    <div className="metric"><span className="metric-val">{b.charges}</span><span className="metric-lbl">Charges</span></div>
                                </div>
                                <div className="prop-actions">
                                    {!b.en_ligne && (
                                        <button
                                            className="btn-icon"
                                            title="Publish"
                                            onClick={() => handlePublish(b.id)}
                                            style={{ color: "#15803d" }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                        </button>
                                    )}
                                    <button className="btn-icon"><IconEdit size={14}/></button>
                                    <button className="btn-icon" onClick={() => handleDelete(b.id)}><IconTrash size={14}/></button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── COLONNE DROITE ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Demandes récentes depuis conversations */}
                    <div className="card">
                        <div className="card-hd">
                            <span className="card-title">Recent Inquiries</span>
                            <span className="card-action">See all</span>
                        </div>
                        <div className="inq-list">
                            {conversations.length === 0 && (
                                <div style={{ padding: "12px 0", color: "var(--text3)", fontSize: 13 }}>No inquiries yet</div>
                            )}
                            {conversations.slice(0, 4).map((conv: any, i: number) => (
                                <div className="inq-row" key={i}>
                                    <div className="inq-av">{conv.client_name?.charAt(0) ?? "?"}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="inq-name">{conv.client_name}</div>
                                        <div className="inq-prop">{conv.property_name}</div>
                                        <span className="inq-type">Message</span>
                                    </div>
                                    <span className="inq-date">{new Date(conv.last_message_at ?? conv.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Graphique views */}
                    <div className="card">
                        <div className="card-hd">
                            <span className="card-title">Views This Week</span>
                        </div>
                        <svg className="spark-svg" viewBox="0 0 240 56">
                            <defs>
                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#b8922a" stopOpacity="0.18"/>
                                    <stop offset="100%" stopColor="#b8922a" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <polygon points="0,48 40,34 80,38 120,18 160,26 200,14 240,20 240,56 0,56" fill="url(#sg)"/>
                            <polyline points="0,48 40,34 80,38 120,18 160,26 200,14 240,20" fill="none" stroke="#b8922a" strokeWidth="2" strokeLinejoin="round"/>
                            {[0,40,80,120,160,200,240].map((x, i) => {
                                const ys = [48,34,38,18,26,14,20]
                                return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#b8922a"/>
                            })}
                        </svg>
                        <div className="spark-lbl">
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {biens.length > 0 && (
                <InvestmentTimeline
                    propertyPrice={parseFloat(biens[0]?.loyer_hc ?? 850000) * 12 * 10}
                    propertyName={biens[0]?.adresse ?? "My Portfolio"}
                />
            )}
        </DashboardLayout>
    )
}

export default ProprioDashboard