import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../style/auth.css"

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error,    setError]    = useState("")
    const [loading,  setLoading]  = useState(false)

    const handleSubmit = async () => {
        if (!username || !password) { setError("Fill all fields"); return }
        setLoading(true); setError("")
        try {
            await login(username, password)
            navigate("/dashboard")
        } catch (err: any) {
            if (err?.is2FA) {
                navigate("/2fa/verify")
            } else {
                setError(err?.message || "Invalid credentials")
            }
        } finally {
            setLoading(false)
        }
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

                <div className="input-group">
                    <input type="text" placeholder=" " value={username}
                           onChange={e => setUsername(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                    <label>Username</label>
                </div>
                <div className="input-group">
                    <input type="password" placeholder=" " value={password}
                           onChange={e => setPassword(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                    <label>Password</label>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-forgot"><span>Forgot password?</span></div>
                <button className={`btn-auth ${loading ? "loading" : ""}`}
                        onClick={handleSubmit} disabled={loading}>
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