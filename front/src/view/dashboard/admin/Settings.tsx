import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import TwoFactorCard from "../../../component/TwoFactorCard"
import { useAuth } from "../../../context/AuthContext"
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

const AdminSettings = () => {
    const { user, logout } = useAuth()
    const [tab, setTab] = useState<"profile" | "platform" | "security" | "audit">("profile")

    // Profile
    const [firstName, setFirstName] = useState("")
    const [lastName,  setLastName]  = useState("")
    const [email,     setEmail]     = useState("")
    const [saving,    setSaving]    = useState(false)
    const [saveMsg,   setSaveMsg]   = useState("")

    // Platform
    const [platformName, setPlatformName] = useState("KÔRÂ Real Estate")
    const [allowReg,     setAllowReg]     = useState(true)
    const [maintenanceMode, setMaintenance] = useState(false)
    const [maxBiens,     setMaxBiens]     = useState("50")

    // Password
    const [oldPwd, setOldPwd] = useState("")
    const [newPwd, setNewPwd] = useState("")
    const [cfPwd,  setCfPwd]  = useState("")
    const [pwdMsg, setPwdMsg] = useState("")

    // Audit
    const [logs, setLogs] = useState<any[]>([])
    const [logsLoading, setLogsLoading] = useState(false)

    useEffect(() => {
        if (!user) return
        const parts = user.fullName.split(" ")
        setFirstName(parts[0] ?? "")
        setLastName(parts.slice(1).join(" ") ?? "")
        setEmail(user.email)
    }, [user])

    useEffect(() => {
        if (tab !== "audit") return
        setLogsLoading(true)
        fetch(`${BASE_URL}/api/utilisateurs/audit-logs/`, { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(d => setLogs(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setLogs([]))
            .finally(() => setLogsLoading(false))
    }, [tab])

    const saveProfile = async () => {
        setSaving(true); setSaveMsg("")
        try {
            const res = await fetch(`${BASE_URL}/api/auth/me/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, email })
            })
            setSaveMsg(res.ok ? "Profile updated successfully" : "Failed to update")
        } catch { setSaveMsg("Network error") }
        finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000) }
    }

    const changePassword = async () => {
        if (newPwd !== cfPwd) { setPwdMsg("Passwords do not match"); return }
        if (newPwd.length < 8) { setPwdMsg("Minimum 8 characters"); return }
        try {
            const res = await fetch(`${BASE_URL}/api/auth/change-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ old_password: oldPwd, new_password: newPwd })
            })
            setPwdMsg(res.ok ? "Password updated successfully" : "Failed to update password")
            if (res.ok) { setOldPwd(""); setNewPwd(""); setCfPwd("") }
        } catch { setPwdMsg("Network error") }
        finally { setTimeout(() => setPwdMsg(""), 4000) }
    }

    const initials = user?.fullName?.split(" ").map(p => p[0]).join("").toUpperCase() ?? "A"

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px",
        border: "1px solid var(--border)", borderRadius: 8,
        fontSize: 13, fontFamily: "DM Sans, sans-serif",
        color: "var(--text)", background: "var(--bg)", outline: "none"
    }

    const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
        <div onClick={() => onChange(!value)} style={{
            width: 44, height: 24, borderRadius: 12, cursor: "pointer",
            background: value ? "var(--gold)" : "var(--border2)",
            position: "relative", transition: "background .2s", flexShrink: 0
        }}>
            <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "white",
                position: "absolute", top: 3, left: value ? 23 : 3,
                transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
            }}/>
        </div>
    )

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Settings">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .set-anim { animation: fadeUp .35s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="pg-header">
                <div>
                    <div className="pg-title">Settings</div>
                    <div className="pg-subtitle">Platform configuration and admin preferences</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
                {/* Left nav */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="card" style={{ textAlign: "center", padding: 24, marginBottom: 8 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%",
                            background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 26, fontWeight: 800, color: "#fff",
                            margin: "0 auto 12px", border: "3px solid var(--border)"
                        }}>
                            {initials}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.fullName}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{user?.email}</div>
                        <div style={{ marginTop: 8, display: "inline-block", background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>
                            Administrator
                        </div>
                    </div>

                    {([
                        { key: "profile",  label: "Admin Profile",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                        { key: "platform", label: "Platform Config",     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> },
                        { key: "security", label: "Security",            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
                        { key: "audit",    label: "Audit Logs",          icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                    ] as const).map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 10,
                            border: `1px solid ${tab === t.key ? "rgba(184,146,42,0.2)" : "var(--border)"}`,
                            background: tab === t.key ? "var(--gold-bg)" : "var(--white)",
                            color: tab === t.key ? "var(--gold)" : "var(--text2)",
                            fontWeight: tab === t.key ? 600 : 400,
                            fontSize: 13, cursor: "pointer", textAlign: "left",
                            width: "100%", fontFamily: "DM Sans, sans-serif", transition: "all .15s"
                        }}>
                            {t.icon}{t.label}
                        </button>
                    ))}

                    <button className="btn-ghost" onClick={logout}
                            style={{ marginTop: 12, width: "100%", color: "var(--red)", borderColor: "var(--red)", justifyContent: "center" }}>
                        Sign Out
                    </button>
                </div>

                {/* Right content */}
                <div className="set-anim" key={tab}>

                    {/* PROFILE */}
                    {tab === "profile" && (
                        <div className="card">
                            <div className="card-hd"><div className="card-title">Admin Profile</div></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                {[{ label: "First Name", value: firstName, set: setFirstName }, { label: "Last Name", value: lastName, set: setLastName }].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>{f.label}</label>
                                        <input value={f.value} onChange={e => f.set(e.target.value)} style={inputStyle}/>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                                {saveMsg && <span style={{ fontSize: 13, color: saveMsg.includes("success") ? "var(--green)" : "var(--red)", fontWeight: 500 }}>{saveMsg}</span>}
                            </div>
                        </div>
                    )}

                    {/* PLATFORM */}
                    {tab === "platform" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="card">
                                <div className="card-hd"><div className="card-title">General Configuration</div></div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Platform Name</label>
                                    <input value={platformName} onChange={e => setPlatformName(e.target.value)} style={inputStyle}/>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Max Properties per Owner</label>
                                    <input type="number" value={maxBiens} onChange={e => setMaxBiens(e.target.value)} style={{ ...inputStyle, width: 120 }}/>
                                </div>
                                <button className="btn-primary">Save Configuration</button>
                            </div>

                            <div className="card">
                                <div className="card-hd"><div className="card-title">Feature Flags</div></div>
                                {[
                                    { label: "Allow new registrations", desc: "Enable public sign-up on the platform", value: allowReg, set: setAllowReg },
                                    { label: "Maintenance mode", desc: "Take the platform offline for maintenance", value: maintenanceMode, set: setMaintenance },
                                ].map((f, i, arr) => (
                                    <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                                            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{f.desc}</div>
                                        </div>
                                        <Toggle value={f.value} onChange={f.set}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY */}
                    {tab === "security" && (
                        <div className="card">
                            <div className="card-hd"><div className="card-title">Change Password</div></div>
                            {[
                                { label: "Current Password", value: oldPwd, set: setOldPwd },
                                { label: "New Password",     value: newPwd, set: setNewPwd },
                                { label: "Confirm Password", value: cfPwd,  set: setCfPwd  },
                            ].map(f => (
                                <div key={f.label} style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>{f.label}</label>
                                    <input type="password" value={f.value} onChange={e => f.set(e.target.value)} style={inputStyle}/>
                                </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button className="btn-primary" onClick={changePassword}>Update Password</button>
                                {pwdMsg && <span style={{ fontSize: 13, color: pwdMsg.includes("success") ? "var(--green)" : "var(--red)", fontWeight: 500 }}>{pwdMsg}</span>}
                            </div>

                            <TwoFactorCard />
                        </div>
                    )}

                    {/* AUDIT LOGS */}
                    {tab === "audit" && (
                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                                <div className="card-title">Audit Logs</div>
                                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>All admin actions on the platform</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12, padding: "10px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                                {["Action", "Model", "Object", "Date"].map(h => (
                                    <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</div>
                                ))}
                            </div>
                            {logsLoading && <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Loading logs…</div>}
                            {!logsLoading && logs.length === 0 && (
                                <div style={{ padding: 48, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No audit logs found</div>
                            )}
                            {logs.slice(0, 30).map((log, i) => (
                                <div key={log.id ?? i} style={{
                                    display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                                    gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)",
                                    transition: "background .15s"
                                }}
                                     onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                                     onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <div>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                            background: log.action === "CREATION" ? "var(--green-bg)" : log.action === "SUPPRESSION" ? "var(--red-bg)" : "var(--gold-bg)",
                                            color: log.action === "CREATION" ? "var(--green)" : log.action === "SUPPRESSION" ? "var(--red)" : "var(--gold)"
                                        }}>
                                            {log.action}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{log.modele}</div>
                                    <div style={{ fontSize: 13, color: "var(--text3)" }}>#{log.objet_id}</div>
                                    <div style={{ fontSize: 12, color: "var(--text3)" }}>
                                        {new Date(log.date_action).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AdminSettings