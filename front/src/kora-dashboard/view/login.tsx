import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, Role } from "../context/AuthContext"
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
                <div className="auth-switcher">
                    <button className="active">Login</button>
                    <button onClick={() => navigate("/register")}>Register</button>
                </div>
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                </div>

                {/* Dev role selector */}
                <div className="mock-selector">
                    <span className="mock-selector-lbl">Dev mode — Select role to preview</span>
                    <div className="mock-btns">
                        {(["client", "owner", "admin"] as Role[]).map(r => (
                            <button
                                key={r}
                                className={`mock-btn ${mockRole === r ? "mock-btn--active" : ""}`}
                                onClick={() => setMockRole(r)}
                            >
                                {r === "client" ? "Client" : r === "owner" ? "Owner" : "Admin"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input type="email" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
                    <label>Email address</label>
                </div>
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input type="password" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} />
                    <label>Password</label>
                </div>
                <div className="auth-forgot"><span>Forgot password?</span></div>
                <button className={`btn-auth ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={loading}>
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
