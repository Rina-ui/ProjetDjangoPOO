import {type ReactNode, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
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
    const navigate = useNavigate()
    const location = useLocation()
    const [expanded, setExpanded] = useState(false)
    const handleLogout = () => { logout(); navigate("/login") }

    const roleLabel: Record<string, string> = { admin: "Administrator", owner: "Property Owner", client: "Client" }
    const roleColor: Record<string, string> = { admin: "#b45309", owner: "#15803d", client: "#1d4ed8" }

    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

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
                        <button className="dl-date-btn">
                            <IconCalendar size={14} color="var(--text2)" />
                            {today}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
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