import { useState, useEffect, useRef } from "react"
import DashboardLayout from "../../../component/sidebar"
import TwoFactorCard from "../../../component/TwoFactorCard"
import { useAuth } from "../../../context/AuthContext"
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

// ── Toggle ────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button className={`st-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}>
        <span className="st-toggle-knob"/>
    </button>
)

// ── Avatar upload ─────────────────────────────────────────
const AvatarUpload = ({ name, onUpload }: { name: string; onUpload: (f: File) => void }) => {
    const ref = useRef<HTMLInputElement>(null)
    const initials = name.split(" ").map(n => n.charAt(0).toUpperCase()).join("").slice(0, 2) || "??"
    return (
        <div className="st-avatar-wrap">
            <div className="st-avatar">
                <span>{initials}</span>
                <div className="st-avatar-overlay" onClick={() => ref.current?.click()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
            </div>
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }}/>
        </div>
    )
}


// ── Main ─────────────────────────────────────────────────
const SettingsPage = () => {
    const { user, logout } = useAuth()
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState<string|null>(null)
    const [saved, setSaved]         = useState<string|null>(null)
    const [visible, setVisible]     = useState(false)
    const [activeTab, setActiveTab] = useState<"profile"|"notifications"|"security"|"billing">("profile")

    const [profile, setProfile] = useState({
        first_name: "", last_name: "", email: "", telephone: "", adresse: "", bio: ""
    })
    const [notifs, setNotifs] = useState({
        email_inquiries: true,
        email_payments:  true,
        email_updates:   false,
        push_inquiries:  true,
        push_payments:   false,
    })
    const [security, setSecurity] = useState({
        current_password: "", new_password: "", confirm_password: ""
    })
    const [pwError, setPwError]   = useState("")
    const [pwSuccess, setPwSuccess] = useState(false)
    const [totpEnabled, setTotpEnabled] = useState(false)

    const token = localStorage.getItem("access_token")

    useEffect(() => {
        fetch(`${BASE_URL}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setProfile({
                    first_name: data.first_name ?? "",
                    last_name:  data.last_name  ?? "",
                    email:      data.email      ?? "",
                    telephone:  data.telephone  ?? "",
                    adresse:    data.adresse    ?? "",
                    bio:        data.bio        ?? "",
                })
                setTotpEnabled(Boolean(data.totp_enabled))
                setLoading(false)
                setTimeout(() => setVisible(true), 80)
            })
            .catch(() => setLoading(false))
    }, [])

    const saveProfile = async () => {
        setSaving("profile")
        try {
            await fetch(`${BASE_URL}/api/auth/me/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(profile)
            })
            setSaved("profile")
            setTimeout(() => setSaved(null), 2500)
        } finally { setSaving(null) }
    }

    const saveNotifs = async () => {
        setSaving("notifs")
        try {
            await fetch(`${BASE_URL}/api/auth/notifications-preferences/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(notifs)
            }).catch(() => {})
            setSaved("notifs")
            setTimeout(() => setSaved(null), 2500)
        } finally { setSaving(null) }
    }

    const savePassword = async () => {
        setPwError(""); setPwSuccess(false)
        if (security.new_password !== security.confirm_password) { setPwError("Passwords do not match"); return }
        if (security.new_password.length < 6) { setPwError("Password must be at least 6 characters"); return }
        setSaving("security")
        try {
            const res = await fetch(`${BASE_URL}/api/auth/change-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ old_password: security.current_password, new_password: security.new_password })
            })
            if (!res.ok) { const err = await res.json(); throw new Error(err.detail ?? "Failed"); }
            setPwSuccess(true)
            setSecurity({ current_password: "", new_password: "", confirm_password: "" })
        } catch(e: any) { setPwError(e.message) }
        finally { setSaving(null) }
    }

    const fullName = `${profile.first_name} ${profile.last_name}`.trim()
    const initials = user?.fullName?.split(" ").map(p => p[0]).join("").toUpperCase() ?? "?"

    const tabs = [
        { key: "profile",       label: "Profile",       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
        { key: "notifications", label: "Notifications", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
        { key: "security",      label: "Security",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
        { key: "billing",       label: "Billing",       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    ]

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Settings">
            <div className={`op-page ${visible ? "op-visible" : ""}`}>
                <div className="op-head">
                    <div>
                        <h1 className="op-title">Settings</h1>
                        <p className="op-subtitle">Manage your account and preferences</p>
                    </div>
                </div>

                <div className="st-layout">
                    {/* Left nav */}
                    <nav className="st-nav">
                        <div className="st-side-title">Account</div>

                        <div className="card" style={{ textAlign: "center", padding: 20, marginBottom: 8 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: "var(--gold-bg)", border: "3px solid var(--gold)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, fontWeight: 800, color: "var(--gold)",
                                margin: "0 auto 10px"
                            }}>
                                {initials}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{(user?.fullName) || (fullName) || "Owner"}</div>
                            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{(user?.email) || (profile.email)}</div>
                            <div style={{ display: "inline-block", marginTop: 8, background: "var(--green-bg)", color: "var(--green)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                                Property Owner
                            </div>
                        </div>

                        <div className="st-side-meta">
                            <div className="st-side-meta-row">
                                <span>2FA / OTP</span>
                                <span className={`st-side-pill ${totpEnabled ? "ok" : "off"}`}>{totpEnabled ? "Active" : "Inactive"}</span>
                            </div>
                            <div className="st-side-meta-row">
                                <span>Email</span>
                                <span className="st-side-pill neutral">{profile.email ? "Set" : "Missing"}</span>
                            </div>
                        </div>

                        {tabs.map(t => (
                            <button key={t.key} className={`st-nav-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key as any)}>
                                {t.icon}
                                {t.label}
                            </button>
                        ))}

                        <button
                            className="op-btn-ghost"
                            onClick={() => setActiveTab("security")}
                            style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                        >
                            Security Center
                        </button>

                        <button
                            className="btn-ghost"
                            onClick={logout}
                            style={{ marginTop: 12, width: "100%", color: "var(--red)", borderColor: "var(--red)", justifyContent: "center" }}
                        >
                            Sign Out
                        </button>
                    </nav>

                    {/* Content */}
                    <div className="st-content">

                        {/* ── PROFILE ── */}
                        {activeTab === "profile" && (
                            <div className="st-panel op-anim-in">
                                <div className="st-panel-hd">
                                    <h2>Profile Information</h2>
                                    <p>Update your public profile visible to tenants and other users.</p>
                                </div>

                                {loading ? (
                                    <div className="op-skeleton-group">
                                        {[1,2,3,4].map(i => <div key={i} className="op-skeleton" style={{ height: 48, borderRadius: 10 }}/>)}
                                    </div>
                                ) : (
                                    <>
                                        <div className="st-avatar-row">
                                            <AvatarUpload name={fullName} onUpload={() => {}}/>
                                            <div>
                                                <p className="st-avatar-name">{fullName || "Your Name"}</p>
                                                <p className="st-avatar-role">Property Owner</p>
                                            </div>
                                        </div>

                                        <div className="op-form-grid">
                                            {[
                                                { label: "First name",   key: "first_name", type: "text",  full: false },
                                                { label: "Last name",    key: "last_name",  type: "text",  full: false },
                                                { label: "Email",        key: "email",      type: "email", full: false },
                                                { label: "Phone",        key: "telephone",  type: "tel",   full: false },
                                                { label: "Address",      key: "adresse",    type: "text",  full: true  },
                                            ].map(f => (
                                                <div key={f.key} className={`op-field ${f.full ? "full" : ""}`}>
                                                    <label className="op-label">{f.label}</label>
                                                    <input type={f.type} className="op-input" value={profile[f.key as keyof typeof profile]}
                                                           onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}/>
                                                </div>
                                            ))}
                                            <div className="op-field full">
                                                <label className="op-label">Bio</label>
                                                <textarea className="op-input op-textarea" rows={3} value={profile.bio}
                                                          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                                          placeholder="Tell tenants about yourself…"/>
                                            </div>
                                        </div>

                                        <div className="st-panel-ft">
                                            {saved === "profile" && <span className="st-saved-badge">Saved</span>}
                                            <button className="op-btn-primary" disabled={saving === "profile"} onClick={saveProfile}>
                                                {saving === "profile" ? <span className="op-spinner"/> : null}
                                                {saving === "profile" ? "Saving…" : "Save changes"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── NOTIFICATIONS ── */}
                        {activeTab === "notifications" && (
                            <div className="st-panel op-anim-in">
                                <div className="st-panel-hd">
                                    <h2>Notifications</h2>
                                    <p>Choose how and when you receive alerts.</p>
                                </div>

                                <div className="st-notif-group">
                                    <div className="st-notif-label">Email notifications</div>
                                    {[
                                        { key: "email_inquiries", label: "New inquiry on a property",        sub: "When a tenant sends you a message"   },
                                        { key: "email_payments",  label: "Payment received",                 sub: "When a rent payment is confirmed"    },
                                        { key: "email_updates",   label: "Platform updates",                 sub: "News and feature announcements"      },
                                    ].map(n => (
                                        <div key={n.key} className="st-notif-row">
                                            <div>
                                                <p className="st-notif-title">{n.label}</p>
                                                <p className="st-notif-sub">{n.sub}</p>
                                            </div>
                                            <Toggle value={notifs[n.key as keyof typeof notifs]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}/>
                                        </div>
                                    ))}
                                </div>

                                <div className="st-notif-group">
                                    <div className="st-notif-label">Push notifications</div>
                                    {[
                                        { key: "push_inquiries", label: "New inquiry",   sub: "In-app push alert" },
                                        { key: "push_payments",  label: "Payment alert", sub: "Instant notification for payments" },
                                    ].map(n => (
                                        <div key={n.key} className="st-notif-row">
                                            <div>
                                                <p className="st-notif-title">{n.label}</p>
                                                <p className="st-notif-sub">{n.sub}</p>
                                            </div>
                                            <Toggle value={notifs[n.key as keyof typeof notifs]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}/>
                                        </div>
                                    ))}
                                </div>

                                <div className="st-panel-ft">
                                    {saved === "notifs" && <span className="st-saved-badge">Saved</span>}
                                    <button className="op-btn-primary" disabled={saving === "notifs"} onClick={saveNotifs}>
                                        {saving === "notifs" ? <span className="op-spinner"/> : "Save preferences"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── SECURITY ── */}
                        {activeTab === "security" && (
                            <div className="st-panel op-anim-in">
                                <div className="st-panel-hd">
                                    <h2>Security</h2>
                                    <p>Keep your account safe by updating your password regularly.</p>
                                </div>

                                <div className="op-form-grid">
                                    {[
                                        { label: "Current password",  key: "current_password" },
                                        { label: "New password",      key: "new_password"     },
                                        { label: "Confirm password",  key: "confirm_password" },
                                    ].map(f => (
                                        <div key={f.key} className="op-field full">
                                            <label className="op-label">{f.label}</label>
                                            <input type="password" className="op-input" value={security[f.key as keyof typeof security]}
                                                   onChange={e => setSecurity(p => ({ ...p, [f.key]: e.target.value }))}/>
                                        </div>
                                    ))}
                                </div>

                                {pwError   && <div className="op-error">{pwError}</div>}
                                {pwSuccess && <div className="op-success-msg">Password updated successfully</div>}

                                <div className="st-panel-ft">
                                    <button className="op-btn-primary" disabled={saving === "security"} onClick={savePassword}>
                                        {saving === "security" ? <span className="op-spinner"/> : "Update password"}
                                    </button>
                                </div>

                                <TwoFactorCard />

                                <div className="st-danger-zone">
                                    <h3>Danger zone</h3>
                                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                                    <button className="op-btn-danger">Delete my account</button>
                                </div>
                            </div>
                        )}

                        {/* ── BILLING ── */}
                        {activeTab === "billing" && (
                            <div className="st-panel op-anim-in">
                                <div className="st-panel-hd">
                                    <h2>Billing</h2>
                                    <p>Manage your subscription and payment methods.</p>
                                </div>
                                <div className="st-plan-card">
                                    <div className="st-plan-badge">Free Plan</div>
                                    <p className="st-plan-desc">You're on the free tier. Upgrade to list unlimited properties and access premium analytics.</p>
                                    <button className="op-btn-primary st-upgrade-btn">Upgrade to Pro</button>
                                </div>
                                <div className="st-billing-empty">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                    <p>No payment history yet</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default SettingsPage