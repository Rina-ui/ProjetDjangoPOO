import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, type Role } from "../context/AuthContext"
import "../style/auth.css"

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mockRole, setMockRole] = useState<Role>("client")
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = () => {
        if (!email || !password) {
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }
        setLoading(true)
        setTimeout(() => {
            login(mockRole)
            setLoading(false)
            navigate("/dashboard")
        }, 1200)
    }

    return (
        <div className="auth-page">
            <div className="auth-overlay" />

            <div className="auth-card">
                {/* Switcher */}
                <div className="auth-switcher">
                    <button className="active">Login</button>
                    <button onClick={() => navigate("/register")}>Register</button>
                </div>

                {/* Header */}
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                </div>

                {/* DEV: Role Selector */}
                <div className="mock-role-selector">
                    <label className="mock-label">🛠 Dev · Select Role</label>
                    <div className="mock-role-btns">
                        {(["client", "owner", "admin"] as Role[]).map((r) => (
                            <button
                                key={r}
                                className={`mock-role-btn ${mockRole === r ? "active" : ""}`}
                                onClick={() => setMockRole(r)}
                            >
                                {r === "client" ? "👤 Client" : r === "owner" ? "🏠 Owner" : "⚙️ Admin"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Email */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input
                        type="email"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email address</label>
                </div>

                {/* Password */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input
                        type="password"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label>Password</label>
                </div>

                <div className="auth-forgot">
                    <span>Forgot password?</span>
                </div>

                <button
                    className={`btn-auth ${loading ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <span className="spinner" /> : "Sign In"}
                </button>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/register")}>Register</span>
                </p>
            </div>
        </div>
    )
}

export default Login