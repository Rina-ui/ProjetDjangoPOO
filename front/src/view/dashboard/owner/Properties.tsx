import { useState, useEffect } from "react"
import DashboardLayout from "../../../component/sidebar"
import { IconPlus, IconEdit, IconTrash, IconEye, IconHeart } from "../../../component/Icons"
import { useAuth } from "../../../context/AuthContext"
import { extractSavedCountByProperty } from "../../../utils/savedProperties"
import { resolveMediaUrl } from "../../../utils/media"
import "../../../style/dashboard.css"
import "../../../style/owner-pages.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

// ── Add / Edit Property Modal ─────────────────────────────
const PropertyModal = ({
                           mode, bien, onClose, onSuccess
                       }: {
    mode: "add" | "edit"
    bien?: any
    onClose: () => void
    onSuccess: () => void
}) => {
    const [step, setStep]       = useState<1|2|3>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState("")
    const [bienId, setBienId]   = useState<number|null>(bien?.id ?? null)
    const [categories, setCategories] = useState<any[]>([])
    const [photos, setPhotos]   = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [glbFile, setGlbFile] = useState<File|null>(null)
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        adresse:     bien?.adresse     ?? "",
        description: bien?.description ?? "",
        loyer_hc:    bien?.loyer_hc    ?? "",
        charges:     bien?.charges     ?? "0",
        statut:      bien?.statut      ?? "VACANT",
        categorie:   bien?.categorie   ?? "",
    })
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
    const token = localStorage.getItem("access_token")

    useEffect(() => {
        fetch(`${BASE_URL}/api/patrimoine/categories/`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
            const list = Array.isArray(data) ? data : data.results ?? []
            setCategories(list)
            if (list.length > 0 && !form.categorie) set("categorie", String(list[0].id))
        }).catch(() => {})
    }, [])

    const inputCls = "op-input"
    const labelCls = "op-label"

    const handleStep1 = async () => {
        if (!form.adresse || !form.loyer_hc) { setError("Address and rent are required"); return }
        setLoading(true); setError("")
        try {
            const payload = {
                adresse:     form.adresse,
                description: form.description,
                loyer_hc:    parseFloat(form.loyer_hc),
                charges:     parseFloat(form.charges),
                statut:      form.statut,
                categorie:   parseInt(form.categorie),
                en_ligne:    false,
            }
            const url    = mode === "edit" ? `${BASE_URL}/api/patrimoine/biens/${bienId}/` : `${BASE_URL}/api/patrimoine/biens/`
            const method = mode === "edit" ? "PATCH" : "POST"
            const res    = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error(JSON.stringify(await res.json()))
            const data = await res.json()
            if (mode === "add") setBienId(data.data?.id ?? data.id)
            setStep(2)
        } catch(e: any) {
            setError(e.message)
        } finally { setLoading(false) }
    }

    const handleStep2 = async () => {
        if (photos.length === 0) { setStep(3); return }
        setLoading(true); setError("")
        try {
            for (const photo of photos) {
                const fd = new FormData(); fd.append("image", photo)
                await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/upload_photo/`, {
                    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
                })
            }
            setStep(3)
        } catch(e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    const handleStep3 = async () => {
        setLoading(true); setError("")
        try {
            if (glbFile) {
                const fd = new FormData(); fd.append("modele_3d", glbFile)
                await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/upload_3d/`, {
                    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
                })
            }
            await fetch(`${BASE_URL}/api/patrimoine/biens/${bienId}/demander_validation/`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }
            })
            setSuccess(true)
            setTimeout(() => { onSuccess(); onClose() }, 1600)
        } catch(e: any) { setError(e.message) }
        finally { setLoading(false) }
    }

    const stepLabels = ["Details", "Photos", "3D Model"]

    return (
        <div className="op-overlay">
            <div className="op-modal">
                {/* Header */}
                <div className="op-modal-hd">
                    <div>
                        <div className="op-modal-title">{mode === "edit" ? "Edit Property" : "Add Property"}</div>
                        <div className="op-modal-sub">Step {step} / 3 — {stepLabels[step - 1]}</div>
                    </div>
                    <button className="op-modal-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Progress */}
                <div className="op-steps">
                    {[1,2,3].map(n => (
                        <div key={n} className={`op-step ${n < step ? "done" : n === step ? "active" : ""}`}>
                            <div className="op-step-circle">
                                {n < step
                                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    : n
                                }
                            </div>
                            <span>{stepLabels[n-1]}</span>
                            {n < 3 && <div className={`op-step-line ${n < step ? "done" : ""}`}/>}
                        </div>
                    ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <div className="op-modal-body">
                        <div className="op-form-grid">
                            {[
                                { label: "Address *",     key: "adresse",     type: "text",   full: true },
                                { label: "Description",   key: "description", type: "text",   full: true },
                                { label: "Rent (XOF) *",  key: "loyer_hc",    type: "number", full: false },
                                { label: "Charges (XOF)", key: "charges",     type: "number", full: false },
                            ].map(f => (
                                <div key={f.key} className={`op-field ${f.full ? "full" : ""}`}>
                                    <label className={labelCls}>{f.label}</label>
                                    <input type={f.type} className={inputCls} value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} placeholder={f.key === "adresse" ? "e.g. Lomé, Boulevard du Mono" : ""}/>
                                </div>
                            ))}
                            <div className="op-field">
                                <label className={labelCls}>Category *</label>
                                <select className={inputCls} value={form.categorie} onChange={e => set("categorie", e.target.value)}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </div>
                            <div className="op-field">
                                <label className={labelCls}>Status</label>
                                <select className={inputCls} value={form.statut} onChange={e => set("statut", e.target.value)}>
                                    <option value="VACANT">Vacant</option>
                                    <option value="LOUE">Rented</option>
                                    <option value="EN_VENTE">For Sale</option>
                                    <option value="EN_TRAVAUX">Under Construction</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="op-modal-body">
                        <label className="op-upload-zone">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span className="op-upload-title">Click to upload photos</span>
                            <span className="op-upload-sub">JPG, PNG, WEBP · Multiple allowed</span>
                            <input type="file" accept="image/*" multiple onChange={e => {
                                const files = Array.from(e.target.files ?? [])
                                setPhotos(p => [...p, ...files])
                                setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))])
                            }} style={{ display: "none" }}/>
                        </label>
                        {previews.length > 0 && (
                            <div className="op-preview-grid">
                                {previews.map((src, i) => (
                                    <div key={i} className="op-preview-img">
                                        <img src={src}/>
                                        <button onClick={() => { setPhotos(p => p.filter((_,j) => j !== i)); setPreviews(p => p.filter((_,j) => j !== i)) }} className="op-preview-rm">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="op-upload-count">{photos.length} photo{photos.length !== 1 ? "s" : ""} selected</p>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="op-modal-body">
                        <label className={`op-upload-zone op-glb-zone ${glbFile ? "has-file" : ""}`}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={glbFile ? "#b8922a" : "var(--text3)"} strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                            </svg>
                            <span className="op-upload-title" style={{ color: glbFile ? "#b8922a" : undefined }}>
                                {glbFile ? glbFile.name : "Click to upload .glb 3D model"}
                            </span>
                            <span className="op-upload-sub">Optional — {glbFile ? `${(glbFile.size/1024/1024).toFixed(1)} MB` : "GLB / GLTF format"}</span>
                            <input type="file" accept=".glb,.gltf" onChange={e => setGlbFile(e.target.files?.[0] ?? null)} style={{ display: "none" }}/>
                        </label>
                        {glbFile && (
                            <button className="op-rm-link" onClick={() => setGlbFile(null)}>Remove file</button>
                        )}
                        <div className="op-notice">
                            Your property will be sent to admin for review before going live on the platform.
                        </div>
                    </div>
                )}

                {success && (
                    <div className="op-success-anim">
                        <div className="op-success-circle">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <p>Property {mode === "edit" ? "updated" : "submitted"} successfully</p>
                    </div>
                )}

                {error && <div className="op-error">{error}</div>}

                {!success && (
                    <div className="op-modal-ft">
                        {step > 1
                            ? <button className="op-btn-ghost" onClick={() => { setError(""); setStep(s => (s-1) as 1|2|3) }}>Back</button>
                            : <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
                        }
                        <button className="op-btn-primary" disabled={loading} onClick={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}>
                            {loading ? <span className="op-spinner"/> : null}
                            {loading ? "Processing…"
                                : step === 3 ? "Submit for Validation"
                                    : step === 2 && photos.length === 0 ? "Skip"
                                        : "Continue"}
                            {!loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Delete confirm ────────────────────────────────────────
const DeleteConfirm = ({ id, onClose, onDone }: { id: number; onClose: () => void; onDone: () => void }) => {
    const [loading, setLoading] = useState(false)
    const token = localStorage.getItem("access_token")
    const go = async () => {
        setLoading(true)
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        })
        onDone(); onClose()
    }
    return (
        <div className="op-overlay">
            <div className="op-confirm">
                <div className="op-confirm-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </div>
                <h3>Delete this property?</h3>
                <p>This action cannot be undone. All associated data will be permanently removed.</p>
                <div className="op-confirm-ft">
                    <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="op-btn-danger" disabled={loading} onClick={go}>
                        {loading ? <span className="op-spinner op-spinner--white"/> : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main ─────────────────────────────────────────────────
const PropertiesPage = () => {
    const { user } = useAuth()
    const [biens, setBiens]     = useState<any[]>([])
    const [likesByBien, setLikesByBien] = useState<Record<number, number>>({})
    const [loading, setLoading] = useState(true)
    const [filter, setFilter]   = useState<"all"|"online"|"pending"|"offline"|"liked">("all")
    const [sort, setSort]       = useState<"date"|"rent"|"views">("date")
    const [search, setSearch]   = useState("")
    const [visible, setVisible] = useState(false)
    const [showAdd, setShowAdd] = useState(false)
    const [editBien, setEditBien] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<number|null>(null)
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

    const fetchBiens = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/patrimoine/biens/`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            const list = Array.isArray(data) ? data : data.results ?? []
            const ownerId = Number(user?.id)
            const ownerBiens = Number.isFinite(ownerId)
                ? list.filter((b: any) => Number(b?.proprietaire) === ownerId)
                : list
            setBiens(ownerBiens)
            setTimeout(() => setVisible(true), 80)
        } catch { setBiens([]) }
        finally { setLoading(false) }
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

    useEffect(() => {
        fetchBiens()
        fetchLikes()
    }, [user?.id])

    const handlePublish = async (id: number) => {
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/demander_validation/`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` }
        })
        fetchBiens()
    }

    const mapStatut = (s: string) => ({
        LOUE:                   { label: "Rented",     css: "rented"   },
        VACANT:                 { label: "Vacant",     css: "vacant"   },
        EN_VENTE:               { label: "For Sale",   css: "for_sale" },
        EN_TRAVAUX:             { label: "In Works",   css: "pending"  },
        EN_ATTENTE_VALIDATION:  { label: "Pending",    css: "pending"  },
    }[s] ?? { label: s, css: "vacant" })

    const filtered = biens
        .filter(b => {
            if (filter === "online")  return b.en_ligne
            if (filter === "pending") return b.statut === "EN_ATTENTE_VALIDATION"
            if (filter === "offline") return !b.en_ligne
            if (filter === "liked") return getLikeCount(b) > 0
            return true
        })
        .filter(b => !search || b.adresse?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sort === "rent")  return parseFloat(b.loyer_hc) - parseFloat(a.loyer_hc)
            if (sort === "views") return (b.views ?? 0) - (a.views ?? 0)
            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        })

    const counts = {
        all:     biens.length,
        online:  biens.filter(b => b.en_ligne).length,
        pending: biens.filter(b => b.statut === "EN_ATTENTE_VALIDATION").length,
        offline: biens.filter(b => !b.en_ligne).length,
        liked:   biens.filter(b => getLikeCount(b) > 0).length,
    }

    return (
        <DashboardLayout
            navItems={NAV_ITEMS}
            pageTitle="My Properties"
            pageAction={
                <button className="dl-add-btn" onClick={() => setShowAdd(true)}>
                    <IconPlus size={15} color="white"/> Add Property
                </button>
            }
        >
            {showAdd && <PropertyModal mode="add" onClose={() => setShowAdd(false)} onSuccess={fetchBiens}/>}
            {editBien && <PropertyModal mode="edit" bien={editBien} onClose={() => setEditBien(null)} onSuccess={fetchBiens}/>}
            {deleteId !== null && <DeleteConfirm id={deleteId} onClose={() => setDeleteId(null)} onDone={fetchBiens}/>}

            <div className={`op-page ${visible ? "op-visible" : ""}`}>
                <div className="op-head">
                    <div>
                        <h1 className="op-title">My Properties</h1>
                        <p className="op-subtitle">{biens.length} listing{biens.length !== 1 ? "s" : ""} in your portfolio</p>
                    </div>
                </div>

                {/* Filters + search */}
                <div className="pr-toolbar">
                    <div className="pr-filter-tabs">
                        {(["all","online","pending","offline","liked"] as const).map(f => (
                            <button key={f} className={`pr-filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                <span className="pr-count">{counts[f]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="pr-right">
                        <div className="pr-search">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input placeholder="Search by address…" value={search} onChange={e => setSearch(e.target.value)}/>
                        </div>
                        <select className="pr-sort" value={sort} onChange={e => setSort(e.target.value as any)}>
                            <option value="date">Latest</option>
                            <option value="rent">Highest rent</option>
                            <option value="views">Most views</option>
                        </select>
                    </div>
                </div>

                {/* Property grid */}
                {loading ? (
                    <div className="pr-grid">
                        {[1,2,3,4].map(i => <div key={i} className="pr-card-skeleton"/>)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="op-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <p>No properties found</p>
                        <button className="op-btn-primary" onClick={() => setShowAdd(true)}>
                            <IconPlus size={14} color="white"/> Add your first property
                        </button>
                    </div>
                ) : (
                    <div className="pr-grid">
                        {filtered.map((b, idx) => {
                            const st = mapStatut(b.statut)
                            const coverSrc = resolveMediaUrl(b.photos_list?.[0]?.image, BASE_URL)
                            return (
                                <div key={b.id} className="pr-card" style={{ animationDelay: `${idx * 0.07}s` }}>
                                    {/* Thumbnail */}
                                    <div className="pr-card-img">
                                        {coverSrc
                                            ? <img src={coverSrc} alt={b.adresse ?? "Property photo"}/>
                                            : <div className="pr-card-img-placeholder">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                            </div>
                                        }
                                        <div className="pr-card-badges">
                                            <span className={`badge badge-${st.css}`}>{st.label}</span>
                                            <span className={`pr-online-dot ${b.en_ligne ? "online" : "offline"}`}>{b.en_ligne ? "Live" : "Offline"}</span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="pr-card-body">
                                        <h3 className="pr-card-addr">{b.adresse}</h3>
                                        <div className="pr-card-meta">
                                            <span className="pr-card-rent">{parseFloat(b.loyer_hc ?? 0).toLocaleString()} XOF <span>/ mo</span></span>
                                        </div>
                                        {b.description && <p className="pr-card-desc">{b.description}</p>}
                                        <div className="pr-card-stats">
                                            <span><IconEye size={12} color="var(--text3)"/> {b.views ?? 0}</span>
                                            <span><IconHeart size={12} color="#c0392b"/> {getLikeCount(b)}</span>
                                            <span>Charges: {parseFloat(b.charges ?? 0).toLocaleString()} XOF</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pr-card-ft">
                                        {!b.en_ligne && b.statut !== "EN_ATTENTE_VALIDATION" && (
                                            <button className="pr-submit-btn" onClick={() => handlePublish(b.id)}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                                Submit
                                            </button>
                                        )}
                                        <button className="pr-icon-btn" onClick={() => setEditBien(b)} title="Edit">
                                            <IconEdit size={14}/>
                                        </button>
                                        <button className="pr-icon-btn pr-icon-btn--danger" onClick={() => setDeleteId(b.id)} title="Delete">
                                            <IconTrash size={14}/>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default PropertiesPage