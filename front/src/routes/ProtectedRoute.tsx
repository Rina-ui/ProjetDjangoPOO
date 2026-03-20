import { Navigate } from "react-router-dom"
import { useAuth, type Role } from "../context/AuthContext"
import type {JSX} from "react"

interface ProtectedRouteProps {
    children: JSX.Element
    allowedRoles: Role[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated } = useAuth()

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!allowedRoles.includes(user!.role)) return <Navigate to="/not-authorized" replace />

    return children
}

export default ProtectedRoute