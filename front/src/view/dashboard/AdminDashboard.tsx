import { useState } from "react"
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

const ACTIVITY = [
    { date: "Nov 29, 2025", type: "Tenant Application",   desc: "Tenant signed lease for Unit 3C – Emerald Apartments",  status: "cancelled" },
    { date: "Nov 15, 2025", type: "Property Viewing",     desc: "Property viewing scheduled for real estate dashboard",  status: "cancelled" },
    { date: "Nov 08, 2025", type: "Rent Payment",         desc: "Rent payment processed for Unit 7A – Azure Apartments", status: "pending"   },
    { date: "Nov 18, 2025", type: "Inspection Scheduled", desc: "KÔRÂ Inspection scheduled for management suite",        status: "pending"   },
    { date: "Nov 03, 2025", type: "Offer Accepted",       desc: "Offer accepted for 12A – Skyview Apartments",           status: "finished"  },
    { date: "Oct 28, 2025", type: "Lease Renewal",        desc: "Lease renewal completed for Unit 5B – Garden Court",    status: "finished"  },
]

// ── MODAL CRÉATION PROPRIÉTAIRE EN 3 ÉTAPES ──────────────
const CreateOwnerModal = ({ onClose }: { onClose: () => void }) => {
    const [step,    setStep]    = useState(1)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        // Étape 1 — Compte
        username:   "",
        email:      "",
        password:   "",
        password2:  "",
        // Étape 2 — Profil
        first_name: "",
        last_name:  "",
        telephone:  "",
        adresse:    "",
    })

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const validateStep1 = () => {
        if (!form.username || !form.email || !form.password || !form.password2) {
            setError("Fill all fields"); return false
        }
        if (form.password !== form.password2) {
            setError("Passwords do not match"); return false
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters"); return false
        }
        return true
    }

    const validateStep2 = () => {
        if (!form.first_name || !form.last_name || !form.telephone) {
            setError("Fill all required fields"); return false
        }
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

            // 1. Créer le compte utilisateur
            const res = await fetch(`${BASE_URL}/api/auth/register/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username:   form.username,
                    email:      form.email,
                    first_name: form.first_name,
                    last_name:  form.last_name,
                    password:   form.password,
                    password2:  form.password2,
                    role:       "PROPRIETAIRE",
                })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(JSON.stringify(err))
            }
            const data = await res.json()

            // 2. Mettre à jour le profil propriétaire
            await fetch(`${BASE_URL}/api/patrimoine/proprietaires/`, {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${token}`
                },
                body: JSON.stringify({
                    utilisateur: data.user.id,
                    nom:         form.last_name,
                    prenom:      form.first_name,
                    email:       form.email,
                    telephone:   form.telephone,
                    adresse:     form.adresse,
                })
            })

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || "Creation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000
        }}>
            <div style={{
                background: "#fff", borderRadius: 20, padding: 32,
                width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Add Owner</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                            Step {success ? "3" : step} of 3
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text3)" }}>×</button>
                </div>

                {/* Progress bar */}
                <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                    {[1,2,3].map(n => (
                        <div key={n} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: n <= (success ? 3 : step) ? "#b8922a" : "var(--border)"
                        }}/>
                    ))}
                </div>

                {/* ── ÉTAPE 1 : Compte ── */}
                {step === 1 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
                            Account credentials
                        </div>
                        {[
                            { label: "Username",         key: "username",  type: "text" },
                            { label: "Email",            key: "email",     type: "email" },
                            { label: "Password",         key: "password",  type: "password" },
                            { label: "Confirm password", key: "password2", type: "password" },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                                    {f.label}
                                </label>
                                <input
                                    type={f.type}
                                    value={form[f.key as keyof typeof form]}
                                    onChange={e => set(f.key, e.target.value)}
                                    style={{
                                        width: "100%", padding: "10px 12px", borderRadius: 10,
                                        border: "1px solid var(--border)", fontSize: 14,
                                        background: "var(--bg)", color: "var(--text)",
                                        outline: "none", boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── ÉTAPE 2 : Profil ── */}
                {step === 2 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
                            Owner profile
                        </div>
                        {[
                            { label: "First name",   key: "first_name", type: "text",  required: true },
                            { label: "Last name",    key: "last_name",  type: "text",  required: true },
                            { label: "Phone",        key: "telephone",  type: "tel",   required: true },
                            { label: "Address",      key: "adresse",    type: "text",  required: false },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>
                                    {f.label} {f.required && <span style={{ color: "#c0392b" }}>*</span>}
                                </label>
                                <input
                                    type={f.type}
                                    value={form[f.key as keyof typeof form]}
                                    onChange={e => set(f.key, e.target.value)}
                                    style={{
                                        width: "100%", padding: "10px 12px", borderRadius: 10,
                                        border: "1px solid var(--border)", fontSize: 14,
                                        background: "var(--bg)", color: "var(--text)",
                                        outline: "none", boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── ÉTAPE 3 : Confirmation ── */}
                {step === 3 && !success && (
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
                            Confirm details
                        </div>
                        <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            {[
                                { label: "Username",  value: form.username },
                                { label: "Email",     value: form.email },
                                { label: "Full name", value: `${form.first_name} ${form.last_name}` },
                                { label: "Phone",     value: form.telephone },
                                { label: "Address",   value: form.adresse || "—" },
                                { label: "Role",      value: "Owner (Propriétaire)" },
                            ].map(r => (
                                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                                    <span style={{ color: "var(--text3)", fontWeight: 500 }}>{r.label}</span>
                                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SUCCÈS ── */}
                {success && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "#f0fdf4", border: "2px solid #bbf7d0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 16px"
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Owner created!</div>
                        <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>
                            <strong>{form.first_name} {form.last_name}</strong> can now log in with username <strong>{form.username}</strong>
                        </div>
                        <button onClick={onClose} style={{
                            background: "#1a1814", color: "#fff", border: "none",
                            borderRadius: 12, padding: "12px 32px", fontSize: 14,
                            fontWeight: 600, cursor: "pointer"
                        }}>
                            Done
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ fontSize: 12, color: "#c0392b", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                        {error}
                    </div>
                )}

                {/* Actions */}
                {!success && (
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        {step > 1 && (
                            <button
                                onClick={() => { setError(""); setStep(s => s - 1) }}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 12,
                                    border: "1px solid var(--border)", background: "transparent",
                                    fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text)"
                                }}
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={step === 3 ? handleCreate : handleNext}
                            disabled={loading}
                            style={{
                                flex: 1, padding: "12px", borderRadius: 12,
                                border: "none", background: "#1a1814", color: "#fff",
                                fontSize: 14, fontWeight: 600, cursor: "pointer",
                                opacity: loading ? 0.6 : 1
                            }}
                        >
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
                <stop offset="0%" stopColor="#c8dff0"/>
                <stop offset="55%" stopColor="#d8eaf8"/>
                <stop offset="100%" stopColor="#e8f2f8"/>
            </linearGradient>
            <linearGradient id="grass-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#82b856"/>
                <stop offset="100%" stopColor="#6a9e44"/>
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

const AdminDashboard = () => {
    const [showCreateOwner, setShowCreateOwner] = useState(false)

    const r = 66, cx = 88, cy = 86
    const toRad = (d: number) => (d * Math.PI) / 180
    const pt = (pct: number) => {
        const a = -210 + 240 * pct
        return { x: +(cx + r * Math.cos(toRad(a))).toFixed(2), y: +(cy + r * Math.sin(toRad(a))).toFixed(2) }
    }
    const s = pt(0), e = pt(1), f = pt(0.68)

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
            {showCreateOwner && <CreateOwnerModal onClose={() => setShowCreateOwner(false)}/>}

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

                <div className="adm-pills">
                    {[
                        { val: "24", label: "PROPERTY", desc: "Ensuring portfolio stability through continuous property monitoring." },
                        { val: "18", label: "OWNER",    desc: "Measuring owner engagement to elevate team productivity." },
                        { val: "32", label: "TENANTS",  desc: "Visualizing tenant trends to forecast revenue with precision." },
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

                <div className="adm-bottom">
                    <div className="adm-card">
                        <div className="adm-card-hd">
                            <div className="adm-card-hd-left">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                Risk Overview
                            </div>
                            <span className="adm-card-link">↗</span>
                        </div>
                        <div className="adm-gauge-wrap">
                            <svg viewBox="0 0 176 110" className="adm-gauge-svg">
                                <defs>
                                    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%"   stopColor="#e8c040"/>
                                        <stop offset="70%"  stopColor="#b89020"/>
                                        <stop offset="100%" stopColor="#50a868"/>
                                    </linearGradient>
                                </defs>
                                <path d={`M${s.x} ${s.y} A${r} ${r} 0 1 1 ${e.x} ${e.y}`} fill="none" stroke="#ede9e0" strokeWidth="9" strokeLinecap="round"/>
                                <path d={`M${s.x} ${s.y} A${r} ${r} 0 0 1 ${f.x} ${f.y}`} fill="none" stroke="url(#gg)"   strokeWidth="9" strokeLinecap="round"/>
                                <circle cx={f.x} cy={f.y} r="5" fill="#b8922a" stroke="white" strokeWidth="2"/>
                            </svg>
                            <div className="adm-gauge-center">
                                <div className="adm-gauge-val">$487K</div>
                                <div className="adm-gauge-lbl">Estimated Property Value</div>
                                <div className="adm-gauge-risk">Moderate Risk</div>
                            </div>
                        </div>
                        <div className="adm-risk-bars">
                            {[
                                { label: "Structural Condition",   pct: 92, color: "#50a868" },
                                { label: "Rental Market Strength", pct: 85, color: "#50a868" },
                                { label: "Location Score",         pct: 78, color: "#c89828" },
                                { label: "Vacancy Risk",           pct: 34, color: "#e05030" },
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
                                Portfolio Performance Metrics
                            </div>
                            <span className="adm-card-link">↗</span>
                        </div>
                        <div className="adm-perf-kpis">
                            <div className="adm-perf-kpi"><span className="adm-perf-val">9.4%</span><span className="adm-perf-lbl">Average ROI</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">4.1%</span><span className="adm-perf-lbl">Vacancy Rate</span></div>
                            <div className="adm-perf-kpi"><span className="adm-perf-val">417</span><span className="adm-perf-lbl">Active Leases</span></div>
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
                            <span className="adm-card-link">↗</span>
                        </div>
                        <table className="adm-act-table">
                            <thead>
                            <tr><th>Date</th><th>Activity Type</th><th>Description</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                            {ACTIVITY.map((a,i) => (
                                <tr key={i}>
                                    <td className="adm-act-date">{a.date}</td>
                                    <td className="adm-act-type">{a.type}</td>
                                    <td className="adm-act-desc">{a.desc}</td>
                                    <td><span className={`adm-status adm-status--${a.status}`}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AdminDashboard