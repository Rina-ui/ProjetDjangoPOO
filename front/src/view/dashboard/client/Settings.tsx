import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import TwoFactorCard from "../../../component/TwoFactorCard"
import { useAuth } from "../../../context/AuthContext"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

const token = () => localStorage.getItem("access_token")

const Settings = () => {
    const { user, logout } = useAuth()
    const [tab, setTab] = useState<"profile" | "security" | "notifications">("profile")

    // Profile form
    const [firstName, setFirstName] = useState("")
    const [lastName,  setLastName]  = useState("")
    const [email,     setEmail]     = useState("")
    const [phone,     setPhone]     = useState("")
    const [saving,    setSaving]    = useState(false)
    const [saveMsg,   setSaveMsg]   = useState("")

    // Password form
    const [oldPwd,    setOldPwd]    = useState("")
    const [newPwd,    setNewPwd]    = useState("")
    const [confPwd,   setConfPwd]   = useState("")
    const [pwdMsg,    setPwdMsg]    = useState("")
    const [pwdSaving, setPwdSaving] = useState(false)

    // Notifications
    const [notifEmail,   setNotifEmail]   = useState(true)
    const [notifVisit,   setNotifVisit]   = useState(true)
    const [notifMessage, setNotifMessage] = useState(true)
    const [notifNews,    setNotifNews]    = useState(false)

    useEffect(() => {
        if (!user) return
        const parts = user.fullName.split(" ")
        setFirstName(parts[0] ?? "")
        setLastName(parts.slice(1).join(" ") ?? "")
        setEmail(user.email)
    }, [user])

    const saveProfile = async () => {
        setSaving(true)
        setSaveMsg("")
        try {
            const res = await fetch(`${BASE_URL}/api/auth/me/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, email })
            })
            if (res.ok) setSaveMsg("✓ Profile updated successfully")
            else        setSaveMsg("✗ Failed to update profile")
        } catch {
            setSaveMsg("✗ Network error")
        } finally {
            setSaving(false)
            setTimeout(() => setSaveMsg(""), 3000)
        }
    }

    const changePassword = async () => {
        if (newPwd !== confPwd) { setPwdMsg("✗ Passwords do not match"); return }
        if (newPwd.length < 8)  { setPwdMsg("✗ Password must be at least 8 characters"); return }
        setPwdSaving(true)
        setPwdMsg("")
        try {
            const res = await fetch(`${BASE_URL}/api/auth/change-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ old_password: oldPwd, new_password: newPwd })
            })
            if (res.ok) {
                setPwdMsg("✓ Password changed successfully")
                setOldPwd(""); setNewPwd(""); setConfPwd("")
            } else {
                const d = await res.json()
                setPwdMsg(`✗ ${d.detail ?? "Failed to change password"}`)
            }
        } catch {
            setPwdMsg("✗ Network error")
        } finally {
            setPwdSaving(false)
            setTimeout(() => setPwdMsg(""), 4000)
        }
    }

    const initials = user?.fullName?.split(" ").map(p => p[0]).join("").toUpperCase() ?? "?"

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Settings">
            <div className="pg-header">
                <div>
                    <div className="pg-title">Settings</div>
                    <div className="pg-subtitle">Manage your account and preferences</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>

                {/* ── LEFT NAV ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Avatar card */}
                    <div className="card" style={{ textAlign: "center", padding: 24, marginBottom: 8 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%",
                            background: "var(--gold-bg)", border: "3px solid var(--gold)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24, fontWeight: 800, color: "var(--gold)",
                            margin: "0 auto 12px"
                        }}>
                            {initials}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.fullName}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{user?.email}</div>
                        <div style={{ display: "inline-block", marginTop: 8, background: "var(--blue-bg)", color: "var(--blue)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                            Client
                        </div>
                    </div>

                    {/* Nav tabs */}
                    {([
                        { key: "profile",       label: "Profile",       },
                        { key: "security",      label: "Security",       },
                        { key: "notifications", label: "Notifications",  },
                    ] as const).map(t => (
                        <button key={t.key}
                                onClick={() => setTab(t.key)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 14px", borderRadius: 10,
                                    background: tab === t.key ? "var(--gold-bg)" : "var(--white)",
                                    color: tab === t.key ? "var(--gold)" : "var(--text2)",
                                    fontWeight: tab === t.key ? 600 : 400,
                                    fontSize: 13, cursor: "pointer", textAlign: "left",
                                    width: "100%", fontFamily: "DM Sans, sans-serif",
                                    boxShadow: tab === t.key ? "none" : "var(--shadow)",
                                    border: "1px solid var(--border)",
                                    borderColor: tab === t.key ? "rgba(184,146,42,0.2)" : "var(--border)",
                                    transition: "all .15s"
                                }}>
                        </button>
                    ))}

                    <button className="btn-ghost"
                            onClick={logout}
                            style={{ marginTop: 12, width: "100%", color: "var(--red)", borderColor: "var(--red)", justifyContent: "center" }}>
                        Sign Out
                    </button>
                </div>

                {/* ── RIGHT CONTENT ── */}
                <div>

                    {/* PROFILE TAB */}
                    {tab === "profile" && (
                        <div className="card">
                            <div className="card-hd">
                                <div className="card-title">Personal Information</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                {[
                                    { label: "First Name", value: firstName, set: setFirstName },
                                    { label: "Last Name",  value: lastName,  set: setLastName  },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>{f.label}</label>
                                        <input
                                            value={f.value}
                                            onChange={e => f.set(e.target.value)}
                                            style={{
                                                width: "100%", padding: "10px 14px",
                                                border: "1px solid var(--border)", borderRadius: 8,
                                                fontSize: 13, fontFamily: "DM Sans, sans-serif",
                                                color: "var(--text)", background: "var(--bg)",
                                                outline: "none"
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Email Address</label>
                                <input
                                    type="email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        width: "100%", padding: "10px 14px",
                                        border: "1px solid var(--border)", borderRadius: 8,
                                        fontSize: 13, fontFamily: "DM Sans, sans-serif",
                                        color: "var(--text)", background: "var(--bg)", outline: "none"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Phone (optional)</label>
                                <input
                                    value={phone} onChange={e => setPhone(e.target.value)}
                                    placeholder="+228 90 00 00 00"
                                    style={{
                                        width: "100%", padding: "10px 14px",
                                        border: "1px solid var(--border)", borderRadius: 8,
                                        fontSize: 13, fontFamily: "DM Sans, sans-serif",
                                        color: "var(--text)", background: "var(--bg)", outline: "none"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                                {saveMsg && (
                                    <span style={{ fontSize: 13, color: saveMsg.startsWith("✓") ? "var(--green)" : "var(--red)", fontWeight: 500 }}>
                                        {saveMsg}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {tab === "security" && (
                        <div className="card">
                            <div className="card-hd">
                                <div className="card-title">Change Password</div>
                            </div>
                            {[
                                { label: "Current Password", value: oldPwd,  set: setOldPwd  },
                                { label: "New Password",     value: newPwd,  set: setNewPwd  },
                                { label: "Confirm Password", value: confPwd, set: setConfPwd },
                            ].map(f => (
                                <div key={f.label} style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>{f.label}</label>
                                    <input
                                        type="password" value={f.value}
                                        onChange={e => f.set(e.target.value)}
                                        style={{
                                            width: "100%", padding: "10px 14px",
                                            border: "1px solid var(--border)", borderRadius: 8,
                                            fontSize: 13, fontFamily: "DM Sans, sans-serif",
                                            color: "var(--text)", background: "var(--bg)", outline: "none"
                                        }}
                                    />
                                </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                                <button className="btn-primary" onClick={changePassword} disabled={pwdSaving}>
                                    {pwdSaving ? "Updating…" : "Update Password"}
                                </button>
                                {pwdMsg && (
                                    <span style={{ fontSize: 13, color: pwdMsg.startsWith("✓") ? "var(--green)" : "var(--red)", fontWeight: 500 }}>
                                        {pwdMsg}
                                    </span>
                                )}
                            </div>

                            <TwoFactorCard />

                            {/* Danger zone */}
                            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>Danger Zone</div>
                                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
                                    Deleting your account is permanent and cannot be undone.
                                </div>
                                <button className="btn-ghost" style={{ color: "var(--red)", borderColor: "var(--red)" }}>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {tab === "notifications" && (
                        <div className="card">
                            <div className="card-hd">
                                <div className="card-title">Notification Preferences</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {[
                                    { label: "Email notifications",    desc: "Receive updates via email",           value: notifEmail,   set: setNotifEmail   },
                                    { label: "Visit reminders",        desc: "Get reminded before scheduled visits",value: notifVisit,   set: setNotifVisit   },
                                    { label: "New messages",           desc: "Notify when you receive a message",   value: notifMessage, set: setNotifMessage },
                                    { label: "News & promotions",      desc: "New listings and offers",             value: notifNews,    set: setNotifNews    },
                                ].map((n, i, arr) => (
                                    <div key={n.label} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "16px 0",
                                        borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none"
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{n.label}</div>
                                            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{n.desc}</div>
                                        </div>
                                        {/* Toggle switch */}
                                        <div
                                            onClick={() => n.set(!n.value)}
                                            style={{
                                                width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                                                background: n.value ? "var(--gold)" : "var(--border2)",
                                                position: "relative", transition: "background .2s", flexShrink: 0
                                            }}
                                        >
                                            <div style={{
                                                width: 18, height: 18, borderRadius: "50%", background: "white",
                                                position: "absolute", top: 3,
                                                left: n.value ? 23 : 3,
                                                transition: "left .2s",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                            }}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-primary" style={{ marginTop: 20 }}>
                                Save Preferences
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Settings