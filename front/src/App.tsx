import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Home from "./view/home"
import Login from "./view/login"
import Register from "./view/register"
import AdminDashboard from "./view/dashboard/AdminDashboard"
import OwnerDashboard from "./view/dashboard/ProprioDashboard.tsx"
import ClientDashboard from "./view/dashboard/UserDashboard.tsx"
import NotAuthorized from "./view/Notauthorized.tsx"
import ProtectedRoute from "./routes/ProtectedRoute"

// Redirect user to their dashboard based on role
const DashboardRedirect = () => {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    if (user.role === "admin") return <Navigate to="/dashboard/admin" replace />
    if (user.role === "owner") return <Navigate to="/dashboard/owner" replace />
    return <Navigate to="/dashboard/client" replace />
}

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                    {/* Public */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/not-authorized" element={<NotAuthorized />} />

                    {/* Role redirect */}
                    <Route path="/dashboard" element={<DashboardRedirect />} />

                    {/* Admin only */}
                    <Route
                        path="/dashboard/admin"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Owner only */}
                    <Route
                        path="/dashboard/owner"
                        element={
                            <ProtectedRoute allowedRoles={["owner"]}>
                                <OwnerDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Client only */}
                    <Route
                        path="/dashboard/client"
                        element={
                            <ProtectedRoute allowedRoles={["client"]}>
                                <ClientDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App