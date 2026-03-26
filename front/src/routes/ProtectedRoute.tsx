import { Navigate } from "react-router-dom"
import { useAuth, type Role } from "../context/AuthContext"
import type { JSX } from "react"

interface ProtectedRouteProps {
    children: JSX.Element
    allowedRoles: Role[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated, loading } = useAuth()

    // Attendre la fin du check de session au refresh avant toute redirection.
    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text3)", fontSize: 14 }}>
                Loading...
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/not-authorized" replace />

    return children
}

export default ProtectedRoute