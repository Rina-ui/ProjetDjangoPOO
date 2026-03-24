import { useEffect, useState } from "react"
import DashboardLayout from "../../component/sidebar"
import { IconMapPin, IconEye, IconMessage, IconHeart, IconBuilding, IconEdit, IconTrash, IconTrendUp, IconPlus } from "../../component/Icons"
import AddBienForm from "../../component/AddBienForm"
import { useAuth } from "../../context/AuthContext"
import { fetchBiensByOwner, type Bien, type CreateBienPayload } from "../../services/biens"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

const INQUIRIES = [
    { name:"Amine Touhami",   property:"Villa Anfa",         date:"2 hours ago", type:"Visit Request" },
    { name:"Sophie Marchand", property:"Appartement Guéliz", date:"Yesterday",   type:"Price Inquiry" },
    { name:"Omar Bennis",     property:"Riad Medina",        date:"3 days ago",  type:"Visit Request" },
    { name:"Laura Petit",     property:"Villa Anfa",         date:"4 days ago",  type:"Price Inquiry" },
]

type PageActionProps = {
    onAddProperty: () => void
}

const PageAction = ({ onAddProperty }: PageActionProps) => (
    <>
        <button className="dl-export-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
        </button>
        <button className="dl-add-btn" onClick={onAddProperty}>
            <IconPlus size={15} color="white" />
            Add Property
        </button>
    </>
)

const OwnerDashboard = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<"all"|"vacant"|"loue">("all")
    const [showAddForm, setShowAddForm] = useState(false)
    const [biens, setBiens] = useState<Bien[]>([])
    const [loadingBiens, setLoadingBiens] = useState(false)
    const [biensError, setBiensError] = useState("")
    const [refreshKey, setRefreshKey] = useState(0)
    const [editingBien, setEditingBien] = useState<Bien | null>(null)
    const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || "http://127.0.0.1:8000"

    const toMoney = (value: number | string) => {
        const parsed = Number(value)
        if (Number.isNaN(parsed)) return "0 FCFA"
        return `${parsed.toLocaleString("fr-FR")} FCFA`
    }

    const formatEquipements = (equipements: string[] | undefined) => {
        if (!equipements || equipements.length === 0) {
            return "Aucun"
        }
        return equipements.join(", ")
    }

    const toAbsoluteImageUrl = (value?: string) => {
        if (!value) {
            return ""
        }
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value
        }
        if (value.startsWith("/")) {
            return `${API_ROOT_URL}${value}`
        }
        return `${API_ROOT_URL}/${value}`
    }

    const getBienImageUrl = (bien: Bien) => {
        const firstPhoto = bien.photos_files?.[0]
        const raw = firstPhoto?.image_url || firstPhoto?.image
        return toAbsoluteImageUrl(raw)
    }

    const statusToBadge = (status: Bien["statut"]) => {
        if (status === "VACANT") return { className: "available", label: "Vacant" }
        if (status === "LOUE") return { className: "rented", label: "Loue" }
        if (status === "EN_VENTE") return { className: "sale", label: "En vente" }
        return { className: "sold", label: "En travaux" }
    }

    useEffect(() => {
        const ownerId = user?.id
        if (!ownerId) {
            setBiens([])
            return
        }

        const loadBiens = async () => {
            setLoadingBiens(true)
            setBiensError("")
            try {
                const list = await fetchBiensByOwner(ownerId)
                setBiens(list)
            } catch (error) {
                console.error("[GET /api/biens/] erreur:", error)
                setBiensError("Impossible de charger vos biens.")
                setBiens([])
            } finally {
                setLoadingBiens(false)
            }
        }

        void loadBiens()
    }, [user?.id, refreshKey])

    const filtered = biens.filter((p) => {
        if (activeTab === "vacant") return p.statut === "VACANT"
        if (activeTab === "loue") return p.statut === "LOUE"
        return true
    })

    const totalBiens = biens.length
    const totalVacants = biens.filter((p) => p.statut === "VACANT").length
    const totalLoues = biens.filter((p) => p.statut === "LOUE").length
    const totalEnTravaux = biens.filter((p) => p.statut === "EN_TRAVAUX").length
    const proprietaireId = user?.id || 0

    const handleOpenCreate = () => {
        setEditingBien(null)
        setShowAddForm(true)
    }

    const handleEditBien = (bien: Bien) => {
        setEditingBien(bien)
        setShowAddForm(true)
    }

    const handleDeleteBien = (id: number, label: string) => {
        const confirmed = window.confirm(`Confirmer la suppression de \"${label}\" ?`)
        if (!confirmed) {
            return
        }

        setBiens((prev) => prev.filter((bien) => bien.id !== id))
    }

    const handleLocalEditSubmit = async (payload: CreateBienPayload, sourceBien: Bien | null) => {
        if (!sourceBien) {
            return
        }

        setBiens((prev) => prev.map((bien) => {
            if (bien.id !== sourceBien.id) {
                return bien
            }

            return {
                ...bien,
                proprietaire: payload.proprietaire,
                categorie: payload.categorie,
                type_bien: payload.type_bien,
                adresse: payload.adresse,
                description: payload.description,
                equipements: payload.equipements,
                photos: payload.photos?.map((file) => file.name) || bien.photos,
                loyer_hc: payload.loyer_hc,
                charges: payload.charges,
                statut: payload.statut,
            }
        }))
    }

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="My Properties" pageAction={<PageAction onAddProperty={handleOpenCreate} />}>
            {showAddForm && proprietaireId > 0 && (
                <AddBienForm
                    proprietaireId={proprietaireId}
                    mode={editingBien ? "edit" : "create"}
                    initialBien={editingBien}
                    onSubmitPayload={editingBien ? handleLocalEditSubmit : undefined}
                    onClose={() => {
                        setShowAddForm(false)
                        setEditingBien(null)
                    }}
                    onSuccess={() => {
                        setShowAddForm(false)
                        if (editingBien) {
                            setEditingBien(null)
                            return
                        }
                        setRefreshKey((prev) => prev + 1)
                    }}
                />
            )}

            {biensError && <p className="error-msg">{biensError}</p>}

            {/* Stats */}
            <div className="stats-row">
                {[
                    { label:"Total Biens",    value:totalBiens.toLocaleString(), icon:<IconEye size={18} color="#1d4ed8"/>,     bg:"var(--blue-bg)",  change:"", up:true  },
                    { label:"Vacants",        value:totalVacants,                icon:<IconMessage size={18} color="#b8922a"/>, bg:"var(--gold-bg)",  change:"", up:true  },
                    { label:"Loues",          value:totalLoues,                  icon:<IconHeart size={18} color="#c0392b"/>,   bg:"var(--red-bg)",   change:"", up:true  },
                    { label:"En travaux",     value:totalEnTravaux,              icon:<IconBuilding size={18} color="#15803d"/>, bg:"var(--green-bg)", change:"", up:true },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{s.value}</span>
                            {s.change && <span className={`stat-change ${s.up?"stat-up":"stat-down"}`}><IconTrendUp size={10} color="var(--green)"/>{s.change}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="owner-grid">
                {/* Listings */}
                <div className="card owner-list-card">
                    <div className="card-hd">
                        <span className="card-title">Listings</span>
                        <div className="tab-pills">
                            {(["all","vacant","loue"] as const).map(t => (
                                <button key={t} className={`tab-pill ${activeTab===t?"tab-pill--active":""}`} onClick={() => setActiveTab(t)}>
                                    {t==="all"?"Tous":t==="vacant"?"Vacants":"Loues"}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loadingBiens && <p className="add-bien-loading">Chargement des biens...</p>}
                    {!loadingBiens && filtered.length === 0 && (
                        <p className="add-bien-loading owner-list-empty">Aucun bien trouve pour votre compte.</p>
                    )}
                    {!loadingBiens && filtered.map((p) => {
                        const status = statusToBadge(p.statut)
                        const loyer = toMoney(p.loyer_hc)
                        const imageUrl = getBienImageUrl(p)
                        const photoCount = p.photos_files?.length ?? p.photos?.length ?? 0
                        return (
                        <div className="prop-row" key={p.id}>
                            <div className="prop-thumb-lg">
                                {imageUrl ? (
                                    <img
                                        className="prop-thumb-lg-img"
                                        src={imageUrl}
                                        alt={`Photo bien ${p.id}`}
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="prop-thumb-fallback">Photo</span>
                                )}
                            </div>
                            <div className="prop-main">
                                <div className="prop-name">{p.description || `Bien #${p.id}`}</div>
                                <div className="prop-loc"><IconMapPin size={11} color="var(--text3)"/>{p.adresse}</div>
                                <div className="prop-tags">
                                    <span className="tag-type">Type #{p.type_bien ?? "N/A"}</span>
                                    <span className={`badge badge-${status.className}`}>{status.label}</span>
                                </div>
                            </div>
                            <div className="prop-price">{loyer}</div>
                            <div className="prop-metrics">
                                <div className="metric"><span className="metric-val">{toMoney(p.charges)}</span><span className="metric-lbl">Charges</span></div>
                                <div className="metric"><span className="metric-val metric-val--list">{formatEquipements(p.equipements)}</span><span className="metric-lbl">Equipements</span></div>
                                <div className="metric"><span className="metric-val">{photoCount}</span><span className="metric-lbl">Photos</span></div>
                            </div>
                            <div className={`prop-trend ${p.statut === "VACANT" ? "trend-up" : "trend-down"}`}>{status.label}</div>
                            <div className="prop-actions">
                                <button type="button" className="prop-action-btn" onClick={() => handleEditBien(p)}>
                                    <IconEdit size={14}/>
                                    <span>Modifier</span>
                                </button>
                                <button type="button" className="prop-action-btn prop-action-btn--danger" onClick={() => handleDeleteBien(p.id, p.description || `Bien #${p.id}`)}>
                                    <IconTrash size={14}/>
                                    <span>Supprimer</span>
                                </button>
                            </div>
                        </div>
                    )})}
                </div>

                {/* Right col */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="card">
                        <div className="card-hd">
                            <span className="card-title">Recent Inquiries</span>
                            <span className="card-action">See all</span>
                        </div>
                        <div className="inq-list">
                            {INQUIRIES.map((inq,i) => (
                                <div className="inq-row" key={i}>
                                    <div className="inq-av">{inq.name.charAt(0)}</div>
                                    <div style={{ flex:1 }}>
                                        <div className="inq-name">{inq.name}</div>
                                        <div className="inq-prop">{inq.property}</div>
                                        <span className="inq-type">{inq.type}</span>
                                    </div>
                                    <span className="inq-date">{inq.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-hd"><span className="card-title">Views This Week</span></div>
                        <svg className="spark-svg" viewBox="0 0 240 56">
                            <defs>
                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#b8922a" stopOpacity="0.18"/>
                                    <stop offset="100%" stopColor="#b8922a" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <polygon points="0,48 40,34 80,38 120,18 160,26 200,14 240,20 240,56 0,56" fill="url(#sg)"/>
                            <polyline points="0,48 40,34 80,38 120,18 160,26 200,14 240,20" fill="none" stroke="#b8922a" strokeWidth="2" strokeLinejoin="round"/>
                            {[0,40,80,120,160,200,240].map((x,i) => {
                                const ys=[48,34,38,18,26,14,20]
                                return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#b8922a"/>
                            })}
                        </svg>
                        <div className="spark-lbl">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d}>{d}</span>)}</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default OwnerDashboard