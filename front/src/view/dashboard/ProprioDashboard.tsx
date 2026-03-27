import { useState, useEffect } from "react"
import DashboardLayout from "../../component/sidebar"
import {
    IconMapPin, IconEye, IconMessage, IconHeart,
    IconBuilding, IconEdit, IconTrash, IconTrendUp, IconPlus
} from "../../component/Icons"
import { useAuth } from "../../context/AuthContext"
import { extractSavedCountByProperty } from "../../utils/savedProperties"
import { resolveMediaUrl } from "../../utils/media"
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

// ── MODAL AJOUT / EDIT PROPRIÉTÉ ──────────────────────────
const AddPropertyModal = ({
    mode = "add",
    bien,
    onClose,
    onSuccess,
}: {
    mode?: "add" | "edit"
    bien?: any
    onClose: () => void
    onSuccess: () => void
}) => {
    const [step,       setStep]       = useState<1|2|3>(1)
    const [loading,    setLoading]    = useState(false)
    const [error,      setError]      = useState("")
    const [bienId,     setBienId]     = useState<number|null>(bien?.id ?? null)
    const [categories, setCategories] = useState<any[]>([])

    const [form, setForm] = useState({
        adresse: bien?.adresse ?? "",
        description: bien?.description ?? "",
        loyer_hc: bien?.loyer_hc ?? "",
        charges: bien?.charges ?? "0",
        statut: bien?.statut ?? "VACANT",
        categorie: bien?.categorie ? String(bien.categorie) : "",
    })
    const [photos,   setPhotos]   = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [glbFile,  setGlbFile]  = useState<File|null>(null)

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
    const token = localStorage.getItem("access_token")

    const inputStyle = {
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1px solid var(--border)", fontSize: 14,
        background: "var(--bg)", color: "var(--text)",
        outline: "none", boxSizing: "border-box" as const
    }
    const labelStyle = {
        fontSize: 12, fontWeight: 600 as const,
        color: "var(--text2)", display: "block" as const, marginBottom: 5
    }

    // Charger les catégories au montage
    useEffect(() => {
        fetch(`${BASE_URL}/api/patrimoine/categories/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.results ?? []
                setCategories(list)
                if (list.length > 0 && !form.categorie) set("categorie", String(list[0].id))
            })
            .catch(() => {})
    }, [])

    const handleStep1 = async () => {
        if (!form.adresse || !form.loyer_hc) { setError("Address and rent are required"); return }
        if (!form.categorie) { setError("Please select a category"); return }
        setLoading(true); setError("")
        try {
            const url = mode === "edit" ? `${BASE_URL}/api/patrimoine/biens/${bienId}/` : `${BASE_URL}/api/patrimoine/biens/`
            const method = mode === "edit" ? "PATCH" : "POST"
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
            if (!res.ok) {
                const err = await res.json()
                throw new Error(JSON.stringify(err))
            }
            const data = await res.json()
            if (mode === "add") {
                setBienId(data.data?.id ?? data.id)
            }
            setStep(2)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        setPhotos(prev => [...prev, ...files])
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    }

    const handleStep2 = async () => {
        if (photos.length === 0) { setStep(3); return }
        setLoading(true); setError("")
        try {
            for (const photo of photos) {
                const fd = new FormData()
                fd.append("image", photo)
                const res = await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/upload_photo/`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(JSON.stringify(err))
                }
            }
            setStep(3)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleStep3 = async () => {
        setLoading(true); setError("")
        try {
            if (glbFile) {
                const fd = new FormData()
                fd.append("modele_3d", glbFile)
                const res = await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/upload_3d/`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(JSON.stringify(err))
                }
            }
            await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/demander_validation/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            await new Promise(r => setTimeout(r, 600)) // laisser Django persister
            onSuccess()
            onClose()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const steps = ["Property Info", "Photos", "3D Model"]

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{mode === "edit" ? "Edit Property" : "Add Property"}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Step {step} of 3 — {steps[step-1]}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text3)" }}>×</button>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                    {[1,2,3].map(n => (
                        <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= step ? "#b8922a" : "var(--border)", transition: "background .3s" }}/>
                    ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                    <div>
                        {[
                            { label: "Address *",   key: "adresse",     type: "text" },
                            { label: "Description", key: "description", type: "text" },
                            { label: "Rent (HC) *", key: "loyer_hc",    type: "number" },
                            { label: "Charges",     key: "charges",     type: "number" },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={labelStyle}>{f.label}</label>
                                <input type={f.type} value={form[f.key as keyof typeof form]}
                                       onChange={e => set(f.key, e.target.value)} style={inputStyle}/>
                            </div>
                        ))}
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Category *</label>
                            <select value={form.categorie} onChange={e => set("categorie", e.target.value)} style={inputStyle}>
                                {categories.length === 0 && <option value="">Loading…</option>}
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Status</label>
                            <select value={form.statut} onChange={e => set("statut", e.target.value)} style={inputStyle}>
                                <option value="VACANT">Vacant</option>
                                <option value="LOUE">Rented</option>
                                <option value="EN_VENTE">For Sale</option>
                                <option value="EN_TRAVAUX">Under Construction</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div>
                        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>Add photos. You can skip this step.</p>
                        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "24px", border: "2px dashed var(--border)", borderRadius: 12, cursor: "pointer", marginBottom: 16, background: "var(--bg)" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span style={{ fontSize: 13, color: "var(--text3)" }}>Click to upload photos</span>
                            <span style={{ fontSize: 11, color: "var(--text3)" }}>JPG, PNG, WEBP</span>
                            <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: "none" }}/>
                        </label>
                        {previews.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                                {previews.map((src, i) => (
                                    <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                                        <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                                        <button onClick={() => { setPhotos(p => p.filter((_,j) => j !== i)); setPreviews(p => p.filter((_,j) => j !== i)) }}
                                                style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer" }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p style={{ fontSize: 12, color: "var(--text3)" }}>{photos.length} photo{photos.length !== 1 ? "s" : ""} selected</p>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div>
                        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>Upload a 3D model (.glb). You can skip.</p>
                        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px", border: `2px dashed ${glbFile ? "#b8922a" : "var(--border)"}`, borderRadius: 12, cursor: "pointer", background: glbFile ? "#fdf6e7" : "var(--bg)" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={glbFile ? "#b8922a" : "var(--text3)"} strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                            </svg>
                            {glbFile
                                ? <span style={{ fontSize: 13, color: "#b8922a", fontWeight: 600 }}>{glbFile.name}</span>
                                : <span style={{ fontSize: 13, color: "var(--text3)" }}>Click to upload .glb file</span>
                            }
                            <input type="file" accept=".glb,.gltf" onChange={e => setGlbFile(e.target.files?.[0] ?? null)} style={{ display: "none" }}/>
                        </label>
                        {glbFile && (
                            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, color: "var(--text3)" }}>Size: {(glbFile.size/1024/1024).toFixed(1)} MB</span>
                                <button onClick={() => setGlbFile(null)} style={{ fontSize: 11, color: "#c0392b", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                            </div>
                        )}

                        {/* Info validation */}
                        <div style={{ marginTop: 16, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #f0d980", fontSize: 12, color: "#92400e" }}>
                            ⚠️ Your property will be submitted for admin review before going live.
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ fontSize: 12, color: "#c0392b", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", marginTop: 12, marginBottom: 4 }}>{error}</div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    {step > 1 && (
                        <button onClick={() => setStep(s => (s - 1) as 1|2|3)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Back</button>
                    )}
                    {step === 1 && (
                        <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    )}
                    <button
                        onClick={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}
                        disabled={loading}
                        style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#1a1814", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
                    >
                        {loading ? "Processing…"
                            : step === 3 ? "Submit for Validation →"
                                : step === 2 ? (photos.length > 0 ? "Upload Photos →" : "Skip →")
                                    : "Next →"
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
// ── COMPOSANT PRINCIPAL ───────────────────────────────────
const ProprioDashboard = () => {
    const { user } = useAuth()
    const [biens,       setBiens]       = useState<any[]>([])
    const [likesByBien, setLikesByBien] = useState<Record<number, number>>({})
    const [loading,     setLoading]     = useState(true)
    const [activeTab,   setActiveTab]   = useState<"all"|"sale"|"rent">("all")
    const [showAddProp, setShowAddProp] = useState(false)
    const [editBien, setEditBien] = useState<any | null>(null)
    const [galleryBien, setGalleryBien] = useState<any | null>(null)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [conversations, setConversations] = useState<any[]>([])

    const token = localStorage.getItem("access_token")

    const toNumber = (value: unknown): number | null => {
        const num = Number(value)
        return Number.isFinite(num) ? num : null
    }

    const getLikeCount = (bien: any) => {
        const id = toNumber(bien?.id)
        const fromSaves = id !== null ? likesByBien[id] : undefined
        return fromSaves
            ?? toNumber(bien?.likes_count)
            ?? toNumber(bien?.nb_sauvegardes)
            ?? toNumber(bien?.saved)
            ?? 0
    }

    // ── Charger les biens depuis l'API ────────────────────
    const fetchBiens = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/patrimoine/biens/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            const list = Array.isArray(data) ? data : data.results ?? []
            const ownerId = Number(user?.id)
            const ownerBiens = Number.isFinite(ownerId)
                ? list.filter((b: any) => Number(b?.proprietaire) === ownerId)
                : list
            setBiens(ownerBiens)
        } catch {
            setBiens([])
        } finally {
            setLoading(false)
        }
    }

    const fetchLikes = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/locataires/sauvegardes/?_ts=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store"
            })
            if (!res.ok) {
                setLikesByBien({})
                return
            }
            const data = await res.json()
            setLikesByBien(extractSavedCountByProperty(data))
        } catch {
            setLikesByBien({})
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
        fetchLikes()
    }, [user?.id])

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
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/demander_validation/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchBiens()
    }

    // ── Stats dynamiques ──────────────────────────────────
    const totalViews    = biens.reduce((a, b) => a + (b.views ?? 0), 0)
    const totalInq      = conversations.length
    const totalSaved    = biens.reduce((a, b) => a + getLikeCount(b), 0)
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

    const getGalleryPhotos = (bien: any): string[] => (
        Array.isArray(bien?.photos_list)
            ? bien.photos_list
                .map((p: any) => resolveMediaUrl(p?.image, BASE_URL))
                .filter((src: string | null): src is string => Boolean(src))
            : []
    )

    const galleryPhotos = galleryBien ? getGalleryPhotos(galleryBien) : []
    const activeGalleryPhoto = galleryPhotos[galleryIndex] ?? null

    const openGallery = (bien: any) => {
        const photos = getGalleryPhotos(bien)
        if (photos.length === 0) return
        setGalleryBien(bien)
        setGalleryIndex(0)
    }

    const closeGallery = () => {
        setGalleryBien(null)
        setGalleryIndex(0)
    }

    const goNextPhoto = () => {
        if (galleryPhotos.length === 0) return
        setGalleryIndex(prev => (prev + 1) % galleryPhotos.length)
    }

    const goPrevPhoto = () => {
        if (galleryPhotos.length === 0) return
        setGalleryIndex(prev => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
    }

    useEffect(() => {
        if (!galleryBien) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeGallery()
            if (event.key === "ArrowRight") goNextPhoto()
            if (event.key === "ArrowLeft") goPrevPhoto()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [galleryBien, galleryPhotos.length])

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
                    mode="add"
                    onClose={() => setShowAddProp(false)}
                    onSuccess={fetchBiens}
                />
            )}
            {editBien && (
                <AddPropertyModal
                    mode="edit"
                    bien={editBien}
                    onClose={() => setEditBien(null)}
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
                        const coverSrc = resolveMediaUrl(b.photos_list?.[0]?.image, BASE_URL)
                        return (
                            <div className="prop-row" key={b.id} onClick={() => openGallery(b)}>
                                <div className="prop-thumb-lg">
                                    {coverSrc && <img src={coverSrc} alt={b.adresse ?? "Property photo"}/>}
                                </div>
                                <div className="prop-main">
                                    <div className="prop-name">{b.adresse}</div>
                                    <div className="prop-loc">
                                        <IconMapPin size={11} color="var(--text3)"/>
                                        {b.adresse}
                                    </div>
                                    <div className="prop-tags">
                                        <span className={`badge badge-${st.css}`}>{st.label}</span>
                                        {b.en_ligne
                                            ? <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Online</span>
                                            : <span style={{ fontSize: 10, background: "var(--red-bg)", color: "var(--red)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Offline</span>
                                        }
                                    </div>
                                </div>
                                <div className="prop-price">{b.loyer_hc} / mo</div>
                                <div className="prop-metrics">
                                    <div className="metric"><span className="metric-val">{b.loyer_hc}</span><span className="metric-lbl">Rent</span></div>
                                    <div className="metric"><span className="metric-val">{b.charges}</span><span className="metric-lbl">Charges</span></div>
                                    <div className="metric"><span className="metric-val">{getLikeCount(b)}</span><span className="metric-lbl">Likes</span></div>
                                </div>
                                <div className="prop-actions">
                                    {!b.en_ligne && (
                                        <button
                                            className="btn-icon"
                                            title="Submit for validation"
                                            onClick={(e) => { e.stopPropagation(); handlePublish(b.id) }}
                                            style={{ color: "var(--gold)" }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                        </button>
                                    )}
                                    <button className="btn-icon" title="Edit property" onClick={(e) => { e.stopPropagation(); setEditBien(b) }}><IconEdit size={14}/></button>
                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }}><IconTrash size={14}/></button>
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
                                    <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18"/>
                                    <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <polygon points="0,48 40,34 80,38 120,18 160,26 200,14 240,20 240,56 0,56" fill="url(#sg)"/>
                            <polyline points="0,48 40,34 80,38 120,18 160,26 200,14 240,20" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round"/>
                            {[0,40,80,120,160,200,240].map((x, i) => {
                                const ys = [48,34,38,18,26,14,20]
                                return <circle key={i} cx={x} cy={ys[i]} r="3" fill="var(--gold)"/>
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

            {galleryBien && activeGalleryPhoto && (
                <div className="owner-gallery-overlay" onClick={closeGallery}>
                    <div className="owner-gallery-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="owner-gallery-top">
                            <div>
                                <div className="owner-gallery-title">{galleryBien.adresse ?? "Property photos"}</div>
                                <div className="owner-gallery-count">{galleryIndex + 1} / {galleryPhotos.length}</div>
                            </div>
                            <button className="owner-gallery-close" onClick={closeGallery}>×</button>
                        </div>

                        <div className="owner-gallery-main">
                            {galleryPhotos.length > 1 && (
                                <button className="owner-gallery-nav owner-gallery-nav--left" onClick={goPrevPhoto}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                                </button>
                            )}
                            <img src={activeGalleryPhoto} alt={galleryBien.adresse ?? "Property"} className="owner-gallery-photo"/>
                            {galleryPhotos.length > 1 && (
                                <button className="owner-gallery-nav owner-gallery-nav--right" onClick={goNextPhoto}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            )}
                        </div>

                        {galleryPhotos.length > 1 && (
                            <div className="owner-gallery-thumbs">
                                {galleryPhotos.map((src: string, idx: number) => (
                                    <button
                                        key={`${galleryBien.id}-${idx}`}
                                        className={`owner-gallery-thumb ${idx === galleryIndex ? "is-active" : ""}`}
                                        onClick={() => setGalleryIndex(idx)}
                                    >
                                        <img src={src} alt={`Photo ${idx + 1}`}/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

export default ProprioDashboard