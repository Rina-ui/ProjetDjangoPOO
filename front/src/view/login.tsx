import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../style/auth.css"

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!email || !password) {
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }

        setLoading(true)

        try {
            await login(email, password) // 🔥 appel backend réel

            navigate("/dashboard")
        } catch (err) {
            console.error(err)
            setError(true)
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