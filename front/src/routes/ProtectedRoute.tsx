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
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100vh", 
                flexDirection: "column",
                gap: "16px",
                color: "var(--text3)", 
                fontSize: 14,
                background: "var(--bg)"
            }}>
                <div style={{
                    width: "40px", 
                    height: "40px",
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--gold)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }}/>
                <span>Authentification en cours...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!isAuthenticated || !user) return <Navigate to="/login" replace />
    if (!allowedRoles.includes(user.role)) return <Navigate to="/not-authorized" replace />

    return children
}

export default ProtectedRoute