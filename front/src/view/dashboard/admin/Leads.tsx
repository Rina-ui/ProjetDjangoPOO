import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
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

interface User {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
    role: string
    date_creation: string
    is_active: boolean
}

const ROLE_COLOR: Record<string, { bg: string; color: string; label: string }> = {
    PROPRIETAIRE: { bg: "#fdf6e7", color: "#b8922a", label: "Owner" },
    LOCATAIRE:    { bg: "#f0fdf4", color: "#15803d", label: "Tenant" },
    ADMIN:        { bg: "#eff6ff", color: "#1d4ed8", label: "Admin" },
}

const isTmpUser = (u: Pick<User, "username">) =>
    (u.username ?? "").toLowerCase().startsWith("tmp")

const Leads = () => {
    const [users,   setUsers]   = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search,  setSearch]  = useState("")
    const [roleFilter, setRole] = useState<"all" | "PROPRIETAIRE" | "LOCATAIRE" | "ADMIN">("all")
    const [sortBy,  setSortBy]  = useState<"name" | "date" | "role">("date")
    const [selected, setSelected] = useState<User | null>(null)
    const [, setMounted] = useState(false)

    useEffect(() => {
        const loadAllUsers = async () => {
            setTimeout(() => setMounted(true), 50)

            const collectAllPages = async (initialUrl: string) => {
                const all: User[] = []
                let nextUrl: string | null = initialUrl

                while (nextUrl) {
                    const res = await fetch(nextUrl, {
                        headers: { Authorization: `Bearer ${token()}` }
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

            try {
                // Endpoint demandé: GET http://127.0.0.1:8000/users/
                const all = await collectAllPages(`${BASE_URL}/users/`)
                setUsers(all.filter(u => !isTmpUser(u)))
            } catch {
                // Fallback de compatibilité avec l'ancien endpoint.
                try {
                    const all = await collectAllPages(`${BASE_URL}/api/utilisateurs/users/`)
                    setUsers(all.filter(u => !isTmpUser(u)))
                } catch {
                    setUsers([])
                }
            } finally {
                setLoading(false)
            }
        }

        loadAllUsers()
    }, [])

    const filtered = users
        .filter(u => roleFilter === "all" || u.role === roleFilter)
        .filter(u => {
            const q = search.toLowerCase()
            return u.username.toLowerCase().includes(q)
                || u.email.toLowerCase().includes(q)
                || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
        })
        .sort((a, b) => {
            if (sortBy === "name") return `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`)
            if (sortBy === "role") return a.role.localeCompare(b.role)
            return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
        })

    const owners  = users.filter(u => u.role === "PROPRIETAIRE").length
    const tenants = users.filter(u => u.role === "LOCATAIRE").length
    const active  = users.filter(u => u.is_active).length

    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    const initials = (u: User) => `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.username[0].toUpperCase()

    const avatarColors = ["#e8d5c4","#c4d5e8","#d5c4e8","#c4e8d5","#e8c4d5","#d5e8c4"]
    const avatarColor  = (id: number) => avatarColors[id % avatarColors.length]

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Leads">
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
                @keyframes countUp { from { opacity:0; transform:scale(.8); } to { opacity:1; transform:scale(1); } }
                .lead-row-anim { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
                .stat-anim { animation: countUp .5s cubic-bezier(.4,0,.2,1) both; }
                .panel-anim { animation: slideIn .35s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            <div className="pg-header">
                <div>
                    <div className="pg-title">User Management</div>
                    <div className="pg-subtitle">{users.length} registered users on the platform</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="tbl-search-wrap" style={{ width: 260 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Users",  value: users.length,  color: "#1d4ed8", bg: "#eff6ff" },
                    { label: "Owners",       value: owners,         color: "#b8922a", bg: "#fdf6e7" },
                    { label: "Tenants",      value: tenants,        color: "#15803d", bg: "#f0fdf4" },
                    { label: "Active",       value: active,         color: "#7c3aed", bg: "#f5f3ff" },
                ].map((s, i) => (
                    <div key={s.label} className="stat-card stat-anim" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 16, transition: "all .3s" }}>
                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {/* Toolbar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                        <div className="tab-pills">
                            {(["all", "PROPRIETAIRE", "LOCATAIRE", "ADMIN"] as const).map(r => (
                                <button key={r} className={`tab-pill ${roleFilter === r ? "tab-pill--active" : ""}`}
                                        onClick={() => setRole(r)}>
                                    {r === "all" ? "All" : r === "PROPRIETAIRE" ? "Owners" : r === "LOCATAIRE" ? "Tenants" : "Admins"}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--text3)" }}>Sort:</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                                    style={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", background: "var(--bg)", color: "var(--text)", fontFamily: "DM Sans, sans-serif" }}>
                                <option value="date">Newest</option>
                                <option value="name">Name</option>
                                <option value="role">Role</option>
                            </select>
                        </div>
                    </div>

                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: 12, padding: "10px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                        {["User", "Email", "Role", "Joined", ""].map(h => (
                            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</div>
                        ))}
                    </div>

                    {loading && (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}/>
                            Loading users…
                        </div>
                    )}

                    {!loading && filtered.map((u, i) => {
                        const rc = ROLE_COLOR[u.role] ?? ROLE_COLOR.LOCATAIRE
                        const isActive = selected?.id === u.id
                        return (
                            <div key={u.id} className="lead-row-anim"
                                 style={{
                                     display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto",
                                     gap: 12, padding: "14px 20px", alignItems: "center",
                                     borderBottom: "1px solid var(--border)",
                                     background: isActive ? "var(--gold-bg)" : "transparent",
                                     cursor: "pointer", transition: "background .15s",
                                     animationDelay: `${i * 40}ms`
                                 }}
                                 onClick={() => setSelected(isActive ? null : u)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        background: avatarColor(u.id),
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                                        border: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                                        transition: "border .15s"
                                    }}>
                                        {initials(u)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                                            {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text3)" }}>@{u.username}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                                <div>
                                    <span style={{ ...rc, background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                                        {rc.label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text3)" }}>{fmt(u.date_creation)}</div>
                                <div>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.is_active ? "var(--green)" : "var(--border2)" }}/>
                                </div>
                            </div>
                        )
                    })}

                    {!loading && filtered.length === 0 && (
                        <div style={{ padding: 48, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                            No users found
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="card panel-anim" style={{ padding: 24, position: "sticky", top: 20, alignSelf: "start" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>User Profile</div>
                            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18 }}>×</button>
                        </div>

                        {/* Avatar */}
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: "50%",
                                background: avatarColor(selected.id),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 26, fontWeight: 800, margin: "0 auto 12px",
                                border: "3px solid var(--gold)"
                            }}>
                                {initials(selected)}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>
                                {selected.first_name || selected.last_name
                                    ? `${selected.first_name} ${selected.last_name}`.trim()
                                    : selected.username}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>@{selected.username}</div>
                            <div style={{ marginTop: 8 }}>
                                <span style={{
                                    background: ROLE_COLOR[selected.role]?.bg ?? "#f0f0f0",
                                    color: ROLE_COLOR[selected.role]?.color ?? "#666",
                                    fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20
                                }}>
                                    {ROLE_COLOR[selected.role]?.label ?? selected.role}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Email",   value: selected.email },
                                { label: "Joined",  value: fmt(selected.date_creation) },
                                { label: "Status",  value: selected.is_active ? "Active" : "Inactive" },
                                { label: "User ID", value: `#${selected.id}` },
                            ].map(r => (
                                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                                    <span style={{ color: "var(--text3)", fontWeight: 500 }}>{r.label}</span>
                                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions retirees temporairement */}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default Leads