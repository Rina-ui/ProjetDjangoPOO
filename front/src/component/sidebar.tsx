import type {ReactNode} from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../style/dashboard.css"

interface DashboardLayoutProps {
    children: ReactNode
    navItems: { label: string; icon: string; path: string }[]
}

const DashboardLayout = ({ children, navItems }: DashboardLayoutProps) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const roleLabel = {
        admin: "Administrator",
        owner: "Property Owner",
        client: "Client",
    }

    const roleBadgeClass = {
        admin: "badge-admin",
        owner: "badge-owner",
        client: "badge-client",
    }

    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">KÔRÂ</div>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.fullName.charAt(0)}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.fullName}</span>
                        <span className={`sidebar-badge ${roleBadgeClass[user!.role]}`}>
                            {roleLabel[user!.role]}
                        </span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className={`sidebar-nav-item ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button className="sidebar-logout" onClick={handleLogout}>
                    <span>↩</span> Logout
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    )
}

export default DashboardLayout