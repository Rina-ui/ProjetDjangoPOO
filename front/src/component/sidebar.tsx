import {type ReactNode, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import {
    IconLogOut, IconSettings,
    IconGrid, IconHome, IconSearch, IconHeart,
    IconCalendar, IconMessage, IconUsers,
    IconBarChart, IconCreditCard, IconBuilding
} from "./Icons"
import "../style/dashboard.css"

const ICON_MAP: Record<string, ReactNode> = {
    "Overview":       <IconGrid size={17} />,
    "Dashboard":      <IconGrid size={17} />,
    "Browse":         <IconSearch size={17} />,
    "My Properties":  <IconHome size={17} />,
    "Saved":          <IconHeart size={17} />,
    "Visits":         <IconCalendar size={17} />,
    "Messages":       <IconMessage size={17} />,
    "Settings":       <IconSettings size={17} />,
    "Leads":          <IconUsers size={17} />,
    "Properties":     <IconBuilding size={17} />,
    "Analytics":      <IconBarChart size={17} />,
    "Transactions":   <IconCreditCard size={17} />,
    "Calendar":       <IconCalendar size={17} />,
}

interface DashboardLayoutProps {
    children: ReactNode
    navItems: { label: string; path: string }[]
    pageTitle?: string
    pageAction?: ReactNode
}

const DashboardLayout = ({ children, navItems, pageTitle, pageAction }: DashboardLayoutProps) => {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState(false)
    const handleLogout = () => { logout(); navigate("/login") }

    const roleLabel: Record<string, string> = { admin: "Administrator", owner: "Property Owner", client: "Client" }
    const roleColor: Record<string, string> = { admin: "#b45309", owner: "#15803d", client: "#1d4ed8" }

    return (
        <div className="dl-wrapper">
            {/* SIDEBAR */}
            <aside
                className={`dl-sidebar ${expanded ? "dl-sidebar--open" : ""}`}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >
                <div className="dl-logo">
                    <div className="dl-logo-icon">K</div>
                    {expanded && <span className="dl-logo-text">ÔRÂ</span>}
                </div>

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
                                <span className="dl-nav-icon">{ICON_MAP[item.label] ?? <IconHome size={17} />}</span>
                                {expanded && <span className="dl-nav-label">{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                <div style={{ flex: 1 }} />

                {/* User at bottom */}
                <div className={`dl-user-bottom ${expanded ? "dl-user-bottom--open" : ""}`}>
                    <div className="dl-av-sm" style={{ borderColor: roleColor[user!.role] }}>
                        {user?.fullName.charAt(0)}
                    </div>
                    {expanded && (
                        <div className="dl-user-info">
                            <span className="dl-user-name">{user?.fullName}</span>
                            <span className="dl-user-role" style={{ color: roleColor[user!.role] }}>
                                {roleLabel[user!.role]}
                            </span>
                        </div>
                    )}
                </div>

                <button className="dl-logout" onClick={handleLogout} title={!expanded ? "Sign out" : undefined}>
                    <IconLogOut size={17} />
                    {expanded && <span>Sign out</span>}
                </button>
            </aside>

            {/* MAIN */}
            <div className="dl-main-wrap">


                {/* PAGE HEADER BAR */}
                <div className="dl-page-bar">
                    <h1 className="dl-page-title">{pageTitle}</h1>
                    <div className="dl-page-actions">
                        <button className="dl-theme-btn" onClick={toggleTheme} title={theme === "dark" ? "Passer au theme clair" : "Passer au theme sombre"}>
                            {theme === "dark" ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="4"/>
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
                                </svg>
                            )}
                            {theme === "dark" ? "Light" : "Dark"}
                        </button>
                        {pageAction}
                    </div>
                </div>

                {/* CONTENT */}
                <main className="dl-content">{children}</main>
            </div>
        </div>
    )
}

export default DashboardLayout