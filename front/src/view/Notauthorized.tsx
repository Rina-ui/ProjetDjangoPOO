import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../style/auth.css"

const NotAuthorized = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    return (
        <div className="auth-page">
            <div className="auth-overlay" />
            <div className="auth-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ marginBottom: "8px" }}>Access Denied</h2>
                <p style={{ color: "#888", marginBottom: "24px" }}>
                    You don't have permission to access this page.
                </p>
                <button className="btn-auth" onClick={() => { logout(); navigate("/login") }}>
                    Back to Login
                </button>
            </div>
        </div>
    )
}

export default NotAuthorized