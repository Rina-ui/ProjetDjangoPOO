import { useState, useEffect } from "react"
import { resolveMediaUrl } from "../../utils/media"
import DashboardLayout from "../../component/sidebar"
import { IconPlus, IconBarChart } from "../../component/Icons"
import "../../style/dashboard.css"
import "../../style/admin.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const TEAM = [
    { name: "Sarah", bg: "#e2d4b8" },
    { name: "Marc",  bg: "#b8ccd8" },
    { name: "Lina",  bg: "#dbb8c0" },
    { name: "Omar",  bg: "#c8b8d8" },
    { name: "Tina",  bg: "#b8d4c0" },
]

// ── MODAL CRÉATION PROPRIÉTAIRE ───────────────────────────
const CreateOwnerModal = ({ onClose }: { onClose: () => void }) => {
    const [step,    setStep]    = useState(1)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")
    const [success, setSuccess] = useState(false)
    const [form, setForm] = useState({
        username: "", email: "", password: "", password2: "",
        first_name: "", last_name: "", telephone: "", adresse: "",
    })
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const validateStep1 = () => {
        if (!form.username || !form.email || !form.password || !form.password2) { setError("Fill all fields"); return false }
        if (form.password !== form.password2) { setError("Passwords do not match"); return false }
        if (form.password.length < 6) { setError("Password must be at least 6 characters"); return false }
        return true
    }
    const validateStep2 = () => {
        if (!form.first_name || !form.last_name || !form.telephone) { setError("Fill all required fields"); return false }
        return true
    }
    const handleNext = () => {
        setError("")
        if (step === 1 && !validateStep1()) return
        if (step === 2 && !validateStep2()) return
        setStep(s => s + 1)
    }
    const handleCreate = async () => {
        setLoading(true); setError("")
        try {
            const token = localStorage.getItem("access_token")
            const res = await fetch(`${BASE_URL}/api/auth/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, role: "PROPRIETAIRE" })
            })
            if (!res.ok) { const err = await res.json(); throw new Error(JSON.stringify(err)) }
            const data = await res.json()
            await fetch(`${BASE_URL}/api/utilisateurs/proprietaires/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ utilisateur: data.user.id, nom: form.last_name, prenom: form.first_name, email: form.email, telephone: form.telephone, adresse: form.adresse })
            })
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || "Creation failed")
        } finally { setLoading(false) }
    }

    const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, background: "var(--bg)", color: "var(--text)", outline: "none", boxSizing: "border-box" as const }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>Add Owner</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Step {success ? 3 : step} of 3</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                    {[1,2,3].map(n => <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= (success ? 3 : step) ? "#b8922a" : "var(--border)" }}/>)}
                </div>

                {step === 1 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Account credentials</div>
                        {[{label:"Username",key:"username",type:"text"},{label:"Email",key:"email",type:"email"},{label:"Password",key:"password",type:"password"},{label:"Confirm password",key:"password2",type:"password"}].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>{f.label}</label>
                                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} style={inputStyle}/>
                            </div>
                        ))}
                    </div>
                )}
                {step === 2 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Owner profile</div>
                        {[{label:"First name",key:"first_name",type:"text",req:true},{label:"Last name",key:"last_name",type:"text",req:true},{label:"Phone",key:"telephone",type:"tel",req:true},{label:"Address",key:"adresse",type:"text",req:false}].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>{f.label} {f.req && <span style={{ color: "#c0392b" }}>*</span>}</label>
                                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} style={inputStyle}/>
                            </div>
                        ))}
                    </div>
                )}
                {step === 3 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Confirm details</div>
                        <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            {[{label:"Username",value:form.username},{label:"Email",value:form.email},{label:"Full name",value:`${form.first_name} ${form.last_name}`},{label:"Phone",value:form.telephone},{label:"Role",value:"Owner (Propriétaire)"}].map(r => (
                                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                                    <span style={{ color: "var(--text3)" }}>{r.label}</span>
                                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {success && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Owner created!</div>
                        <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>
                            <strong>{form.first_name} {form.last_name}</strong> can log in as <strong>{form.username}</strong>
                        </div>
                        <button onClick={onClose} style={{ background: "#1a1814", color: "#fff", border: "none", borderRadius: 12, padding: "12px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
                    </div>
                )}
                {error && <div style={{ fontSize: 12, color: "#c0392b", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>{error}</div>}
                {!success && (
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        {step > 1 && <button onClick={() => { setError(""); setStep(s => s - 1) }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Back</button>}
                        <button onClick={step === 3 ? handleCreate : handleNext} disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#1a1814", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                            {loading ? "Creating…" : step === 3 ? "Create Owner" : "Next →"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── HOUSE SVG ─────────────────────────────────────────────
const HouseSVG = () => (
    <svg viewBox="0 0 560 360" className="adm-house-svg" preserveAspectRatio="xMidYMax meet">
        <defs>
            <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8dff0"/><stop offset="55%" stopColor="#d8eaf8"/><stop offset="100%" stopColor="#e8f2f8"/>
            </linearGradient>
            <linearGradient id="grass-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#82b856"/><stop offset="100%" stopColor="#6a9e44"/>
            </linearGradient>
        </defs>
        <rect width="560" height="360" fill="#e8e8e6"/>
        <rect x="100" width="460" height="360" fill="url(#bg-grad)" opacity=".7"/>
        <rect x="0" y="298" width="560" height="62" fill="url(#grass-g)"/>
        <rect x="0" y="296" width="560" height="4" fill="#96cc68" opacity=".6"/>
        <rect x="137" y="244" width="10" height="58" rx="3" fill="#5a7040"/>
        <ellipse cx="142" cy="232" rx="44" ry="50" fill="#4a8830"/>
        <ellipse cx="136" cy="215" rx="36" ry="44" fill="#5a9840"/>
        <ellipse cx="150" cy="212" rx="32" ry="40" fill="#6aaa50"/>
        <ellipse cx="142" cy="198" rx="28" ry="36" fill="#78bb5e"/>
        <rect x="468" y="240" width="10" height="62" rx="3" fill="#7a4030"/>
        <ellipse cx="473" cy="228" rx="48" ry="54" fill="#b03828"/>
        <ellipse cx="462" cy="210" rx="38" ry="46" fill="#c84838"/>
        <ellipse cx="473" cy="194" rx="30" ry="38" fill="#d05840"/>
        <ellipse cx="310" cy="302" rx="185" ry="9" fill="#00000018"/>
        <rect x="360" y="218" width="120" height="82" fill="#e8e2d8" rx="2"/>
        <rect x="165" y="158" width="220" height="142" fill="#f0ece4"/>
        <rect x="185" y="108" width="180" height="60" fill="#eae4da"/>
        <rect x="175" y="100" width="200" height="14" rx="2" fill="#1e1e1e"/>
        <rect x="150" y="150" width="250" height="14" rx="2" fill="#1e1e1e"/>
        <rect x="348" y="210" width="144" height="12" rx="2" fill="#2a2a2a"/>
        <rect x="196" y="118" width="52" height="36" rx="3" fill="#b8d8f0" opacity=".85"/>
        <rect x="262" y="118" width="52" height="36" rx="3" fill="#b8d8f0" opacity=".85"/>
        <rect x="175" y="170" width="75" height="100" rx="2" fill="#b0d4ec" opacity=".88"/>
        <rect x="262" y="170" width="55" height="100" rx="2" fill="#b0d4ec" opacity=".78"/>
        <rect x="325" y="216" width="30" height="84" rx="2" fill="#c8a870"/>
        <rect x="372" y="226" width="96" height="72" rx="1" fill="#ccc4b4"/>
        <rect x="162" y="296" width="332" height="6" rx="1" fill="#d4cfc4"/>
        <ellipse cx="178" cy="298" rx="16" ry="10" fill="#5a8840" opacity=".8"/>
        <ellipse cx="354" cy="297" rx="14" ry="9" fill="#5a8840" opacity=".7"/>
    </svg>
)

// ── DASHBOARD PRINCIPAL ───────────────────────────────────
const AdminDashboard = () => {
    const [showCreateOwner, setShowCreateOwner] = useState(false)
    const [users,          setUsers]          = useState<any[]>([])
    const [biens,          setBiens]          = useState<any[]>([])
    const [payments,       setPayments]       = useState<any[]>([])
    const [pendingBiens,    setPendingBiens]    = useState<any[]>([])
    const [showPending,     setShowPending]     = useState(false)
    const [rejectMotif,     setRejectMotif]     = useState("")
    const [rejectingId,     setRejectingId]     = useState<number|null>(null)
    const [failedPendingThumbs, setFailedPendingThumbs] = useState<Record<string, boolean>>({})

    const getPendingPhotoSrc = (bien: any) => {
        const photo = bien?.photos_list?.[0]
        const raw = photo?.image ?? photo?.url ?? photo?.image_url ?? photo?.photo ?? null
        return resolveMediaUrl(raw, BASE_URL)
    }

    const markPendingThumbFailed = (key: string) => {
        setFailedPendingThumbs(prev => ({ ...prev, [key]: true }))
    }

    const isPendingThumbFailed = (key: string) => Boolean(failedPendingThumbs[key])
    const isTmpUser = (u: any) => String(u?.username ?? "").toLowerCase().startsWith("tmp")

    // Stats dynamiques
    const [stats, setStats] = useState({
        totalBiens:      0,
        totalUsers:      0,
        totalPaiements:  0,
        biensEnLigne:    0,
        biensEnAttente:  0,
    })

    const token = localStorage.getItem("access_token")

    useEffect(() => {
        // Biens en attente de validation
        fetch(`${BASE_URL}/api/patrimoine/biens/?statut=EN_ATTENTE_VALIDATION`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setPendingBiens(Array.isArray(data) ? data : data.results ?? []))
            .catch(() => {})

        // Stats — tous les biens
        fetch(`${BASE_URL}/api/patrimoine/biens/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.results ?? []
                setBiens(list)
                setStats(s => ({
                    ...s,
                    totalBiens:     list.length,
                    biensEnLigne:   list.filter((b: any) => b.en_ligne).length,
                    biensEnAttente: list.filter((b: any) => b.statut === 'EN_ATTENTE_VALIDATION').length,
                }))
            })
            .catch(() => {})

        // Stats — utilisateurs (pagination complete)
        const collectAllUserPages = async (initialUrl: string) => {
            const all: any[] = []
            let nextUrl: string | null = initialUrl

            while (nextUrl) {
                const res = await fetch(nextUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!res.ok) throw new Error("users_fetch_failed")
                const data = await res.json()

                if (Array.isArray(data)) {
                    all.push(...data)
                    nextUrl = null
                } else {
                    all.push(...(data.results ?? []))
                    nextUrl = data.next ?? null
                }
            }

            return all
        }

        collectAllUserPages(`${BASE_URL}/users/`)
            .catch(() => collectAllUserPages(`${BASE_URL}/api/utilisateurs/users/`))
            .then(all => {
                const visibleUsers = all.filter(u => !isTmpUser(u))
                setUsers(visibleUsers)
                setStats(s => ({ ...s, totalUsers: visibleUsers.length }))
            })
            .catch(() => {})

        // Paiements
        fetch(`${BASE_URL}/api/paiements/tous/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.results ?? []
                setPayments(list)
                setStats(s => ({ ...s, totalPaiements: list.length }))
            })
            .catch(() => {})
    }, [])

    const byDateDesc = (a: any, b: any) => {
        const da = new Date(a?.date_creation ?? a?.created_at ?? a?.date ?? 0).getTime()
        const db = new Date(b?.date_creation ?? b?.created_at ?? b?.date ?? 0).getTime()
        return db - da
    }

    const recentUsers = [...users].sort(byDateDesc).slice(0, 5)
    const recentBiens = [...biens].sort(byDateDesc).slice(0, 5)
    const recentPayments = [...payments].sort(byDateDesc).slice(0, 5)

    const handleValider = async (id: number) => {
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/valider/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })

        // Force aussi la persistance en base pour la visibilite locataire.
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ en_ligne: true })
        }).catch(() => {})

        setPendingBiens(prev => prev.filter(b => b.id !== id))
        setStats(s => ({ ...s, biensEnAttente: s.biensEnAttente - 1, biensEnLigne: s.biensEnLigne + 1 }))
    }

    const handleRejeter = async (id: number) => {
        if (!rejectMotif.trim()) return
        await fetch(`${BASE_URL}/api/patrimoine/biens/${id}/rejeter/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ motif: rejectMotif })
        })
        setPendingBiens(prev => prev.filter(b => b.id !== id))
        setStats(s => ({ ...s, biensEnAttente: s.biensEnAttente - 1 }))
        setRejectingId(null)
        setRejectMotif("")
    }

    return (
        <DashboardLayout
            navItems={NAV_ITEMS}
            pageTitle="Real estate management"
            pageAction={
                <button className="dl-add-btn" onClick={() => setShowCreateOwner(true)}>
                    <IconPlus size={15} color="white"/> Add Owner
                </button>
            }
        >
            {showCreateOwner && <CreateOwnerModal onClose={() => setShowCreateOwner(false)} />}

            {/* ── PENDING VALIDATION BANNER ── */}
            {pendingBiens.length > 0 && (
                <div style={{
                    background: "#fffbeb", border: "1px solid #f0d980", borderRadius: 14,
                    padding: "14px 20px", marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{pendingBiens.length} property pending validation</div>
                            <div style={{ fontSize: 12, color: "#b45309" }}>Review and approve or reject listings</div>
                        </div>
                    </div>
                    <button onClick={() => setShowPending(!showPending)} style={{
                        padding: "8px 16px", borderRadius: 10, border: "1px solid #f0d980",
                        background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#92400e"
                    }}>
                        {showPending ? "Hide" : "Review →"}
                    </button>
                </div>
            )}

            {/* ── PENDING LIST ── */}
            {showPending && pendingBiens.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid var(--border)", marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Properties awaiting validation</div>
                    {pendingBiens.map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--bg2)", flexShrink: 0, overflow: "hidden" }}>
                                {(() => {
                                    const thumbKey = `pending-${b.id}`
                                    const thumbSrc = getPendingPhotoSrc(b)
                                    return thumbSrc && !isPendingThumbFailed(thumbKey)
                                        ? <img
                                            src={thumbSrc}
                                            alt="Property"
                                            onError={() => markPendingThumbFailed(thumbKey)}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                        </div>
                                })()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{b.adresse}</div>
                                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                                    {b.proprietaire_nom} · {b.loyer_hc} / mo
                                </div>
                                {b.description && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.description}</div>}
                                {rejectingId === b.id && (
                                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                        <input placeholder="Reason for rejection…" value={rejectMotif} onChange={e => setRejectMotif(e.target.value)}
                                               style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #f0d980", fontSize: 13, outline: "none", background: "#fffbeb" }}/>
                                        <button onClick={() => handleRejeter(b.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
                                        <button onClick={() => { setRejectingId(null); setRejectMotif("") }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                                    </div>
                                )}
                            </div>
                            {rejectingId !== b.id && (
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => handleValider(b.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
                                    <button onClick={() => setRejectingId(b.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #c0392b", background: "transparent", color: "#c0392b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="adm">
                <div className="adm-hero">
                    <div className="adm-hero-left">
                        <div className="adm-breadcrumb">Main Menu <span>/</span> Dashboard</div>
                        <h1 className="adm-hero-title">Real estate management</h1>
                        <p className="adm-hero-desc">
                            A smart dashboard providing real estate insights,<br/>
                            performance metrics, and portfolio monitoring.
                        </p>
                        <div className="adm-hero-actions">
                            <button className="adm-btn-add" onClick={() => setShowCreateOwner(true)}>
                                <IconPlus size={14} color="white"/> Add Owner
                            </button>
                            <div className="adm-team">
                                {TEAM.map((m, i) => (
                                    <div key={i} className="adm-team-av" style={{ background: m.bg, zIndex: TEAM.length - i }}>
                                        {m.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="adm-hero-img"><HouseSVG /></div>
                </div>

                {/* ── KPI PILLS DYNAMIQUES ── */}
                <div className="adm-pills">
                    {[
                        { val: String(stats.totalUsers),      label: "USERS",      desc: "Total users registered." },
                        { val: String(stats.totalBiens),      label: "PROPERTIES", desc: "Total properties in the platform." },
                        { val: String(stats.totalPaiements),  label: "PAYMENTS",   desc: "Total payments tracked." },
                    ].map(k => (
                        <div className="adm-pill" key={k.label}>
                            <div className="adm-pill-left">
                                <div className="adm-pill-ring">
                                    <span className="adm-pill-val">{k.val}</span>
                                </div>
                                <span className="adm-pill-label">{k.label}</span>
                            </div>
                            <p className="adm-pill-desc">{k.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                    <div className="adm-card">
                        <div className="adm-card-hd"><div className="adm-card-hd-left">Utilisateurs récents</div></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {recentUsers.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12 }}>Aucun utilisateur</div>}
                            {recentUsers.map((u: any) => (
                                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {u.first_name || u.last_name ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : u.username}
                                    </span>
                                    <span style={{ color: "var(--text3)", marginLeft: 8 }}>{u.role ?? "USER"}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-hd"><div className="adm-card-hd-left">Biens récents</div></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {recentBiens.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12 }}>Aucun bien</div>}
                            {recentBiens.map((b: any) => (
                                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.adresse ?? "Bien"}</span>
                                    <span style={{ color: "var(--text3)", marginLeft: 8 }}>{b.statut ?? "-"}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-hd"><div className="adm-card-hd-left">Paiements récents</div></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {recentPayments.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12 }}>Aucun paiement</div>}
                            {recentPayments.map((p: any, i: number) => (
                                <div key={p.id ?? i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "var(--text2)" }}>{(p.montant ?? 0).toLocaleString()} XOF</span>
                                    <span style={{ color: "var(--text3)", marginLeft: 8 }}>{p.statut ?? "PENDING"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="adm-bottom">
                    <div className="adm-card">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                Platform Overview
                            </div>
                        </div>
                        <div className="adm-risk-bars">
                            {[
                                { label: "Properties Online",    pct: stats.totalBiens > 0 ? Math.round(stats.biensEnLigne / stats.totalBiens * 100) : 0,   color: "#50a868" },
                                { label: "Pending Validation",   pct: stats.totalBiens > 0 ? Math.round(stats.biensEnAttente / stats.totalBiens * 100) : 0, color: "#e8c040" },
                                { label: "Owner Engagement",     pct: 78, color: "#c89828" },
                                { label: "Tenant Satisfaction",  pct: 91, color: "#50a868" },
                            ].map(b => (
                                <div className="adm-rbar" key={b.label}>
                                    <div className="adm-rbar-top"><span>{b.label}</span><span>{b.pct}%</span></div>
                                    <div className="adm-rbar-track">
                                        <div className="adm-rbar-fill" style={{ width: `${b.pct}%`, background: b.color }}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <IconBarChart size={13} color="currentColor"/>
                                Portfolio Performance
                            </div>
                        </div>
                        <div className="adm-perf-kpis">
                            <div className="adm-perf-kpi"><span className="adm-perf-val">{stats.biensEnLigne}</span><span className="adm-perf-lbl">Online</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">{stats.biensEnAttente}</span><span className="adm-perf-lbl">Pending</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">{stats.totalBiens}</span><span className="adm-perf-lbl">Total</span></div>
                        </div>
                        <div className="adm-bars-chart">
                            {[58,75,48,88,65,82,55,92,70,85,45,78].map((h,i) => (
                                <div key={i} className="adm-bar-col">
                                    <div className="adm-bar" style={{ height: `${h}%` }}/>
                                </div>
                            ))}
                        </div>
                        <div className="adm-bars-months">
                            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
                        </div>
                    </div>

                    <div className="adm-card adm-activity">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                Recent Activity
                            </div>
                        </div>
                        {pendingBiens.length > 0 ? (
                            <table className="adm-act-table">
                                <thead><tr><th>Property</th><th>Owner</th><th>Rent</th><th>Status</th></tr></thead>
                                <tbody>
                                {pendingBiens.slice(0, 6).map((b, i) => (
                                    <tr key={i}>
                                        <td className="adm-act-type">{b.adresse}</td>
                                        <td className="adm-act-desc">{b.proprietaire_nom}</td>
                                        <td className="adm-act-date">{b.loyer_hc}</td>
                                        <td><span className="adm-status adm-status--pending">Pending</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>No pending activity</div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AdminDashboard
