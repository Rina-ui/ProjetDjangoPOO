import {type ReactNode, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
    IconLogOut, IconBell, IconSettings,
    IconGrid, IconHome, IconSearch, IconHeart,
    IconCalendar, IconMessage, IconUsers,
    IconBarChart, IconCreditCard, IconBuilding
} from "./Icons"
import ThemeToggle from "./ThemeToggle"
import "../style/dashboard.css"

const ICON_MAP: Record<string, ReactNode> = {
    "Overview":       <IconGrid size={18} />,
    "Dashboard":      <IconGrid size={18} />,
    "Browse":         <IconSearch size={18} />,
    "My Properties":  <IconHome size={18} />,
    "Saved":          <IconHeart size={18} />,
    "Reservations":   <IconCalendar size={18} />,
    "Visits":         <IconCalendar size={18} />,
    "Messages":       <IconMessage size={18} />,
    "Settings":       <IconSettings size={18} />,
    "Leads":          <IconUsers size={18} />,
    "Properties":     <IconBuilding size={18} />,
    "Analytics":      <IconBarChart size={18} />,
    "Transactions":   <IconCreditCard size={18} />,
    "Calendar":       <IconCalendar size={18} />,
}

interface DashboardLayoutProps {
    children: ReactNode
    navItems: { label: string; path: string }[]
    topbarLeft?: ReactNode
    pageTitle?: string
    pageAction?: ReactNode
}

const DashboardLayout = ({ children, navItems, topbarLeft, pageTitle, pageAction }: DashboardLayoutProps) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState(false)

    const handleLogout = () => { logout(); navigate("/login") }

    const roleLabel: Record<string, string> = {
        admin: "Administrator",
        owner: "Property Owner",
        client: "Client",
    }
    const roleColor: Record<string, string> = {
        admin: "#b45309",
        owner: "#15803d",
        client: "#1d4ed8",
    }

    const safeRole = user?.role || "client"
    const safeName = user?.fullName || "Utilisateur"
    const clientEmail = user?.email || user?.username || ""
    const roleDisplay = safeRole === "client" ? (clientEmail || "Client") : roleLabel[safeRole]
    const topbarContent = topbarLeft ?? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{pageTitle || "Dashboard"}</h1>
            {pageAction && <div style={{ display: "flex", gap: 8 }}>{pageAction}</div>}
        </div>
    )

    return (
        <div className="dl-wrapper">
            <aside
                className={`dl-sidebar ${expanded ? "dl-sidebar--open" : ""}`}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >
                <div className="dl-logo">
                    <span className="dl-logo-mark">K</span>
                    {expanded && <span className="dl-logo-text">ÔRÂ</span>}
                </div>

                <div className="dl-user">
                    <div className="dl-avatar" style={{ borderColor: roleColor[safeRole] }}>
                        {safeName.charAt(0)}
                    </div>
                    {expanded && (
                        <div className="dl-user-info">
                            <span className="dl-user-name">{safeName}</span>
                            <span className="dl-user-role" style={{ color: roleColor[safeRole] }}>
                                {roleDisplay}
                            </span>
                        </div>
                    )}
                </div>

                <div className="dl-divider" />

                <nav className="dl-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <button
                                key={item.path}
                                className={`dl-nav-item ${isActive ? "dl-nav-item--active" : ""}`}
                                onClick={() => navigate(item.path)}
                                title={!expanded ? item.label : undefined}
                            >
                                <span className="dl-nav-icon">
                                    {ICON_MAP[item.label] ?? <IconHome size={18} />}
                                </span>
                                {expanded && <span className="dl-nav-label">{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                <div style={{ flex: 1 }} />

                <button className="dl-logout" onClick={handleLogout} title={!expanded ? "Sign out" : undefined}>
                    <IconLogOut size={18} />
                    {expanded && <span>Sign out</span>}
                </button>
            </aside>

            <div className="dl-main-wrap">
                <header className="dl-topbar">
                    <div className="dl-topbar-left">{topbarContent}</div>
                    <div className="dl-topbar-right">
                        <ThemeToggle className="dl-theme-toggle" />
                        <button className="dl-topbar-btn" title="Notifications">
                            <IconBell size={18} color="var(--text2)" />
                            <span className="dl-notif-dot" />
                        </button>
                        <div className="dl-topbar-user">
                            <div className="dl-topbar-avatar" style={{ borderColor: roleColor[safeRole] }}>
                                {safeName.charAt(0)}
                            </div>
                            <div>
                                <div className="dl-topbar-name">{safeName}</div>
                                <div className="dl-topbar-role" style={{ color: roleColor[safeRole] }}>
                                    {roleDisplay}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="dl-content">{children}</main>
            </div>
        </div>
    )
}

export default DashboardLayout