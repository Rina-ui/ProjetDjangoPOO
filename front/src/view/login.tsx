import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../style/auth.css"

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = () => {
        if (!email || !password) {
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }
        setLoading(true)
        // Simule un appel API
        setTimeout(() => {
            setLoading(false)
            // navigate("/dashboard") quand tu auras la route
        }, 1500)
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

                {/* Forgot */}
                <div className="auth-forgot">
                    <span>Forgot password?</span>
                </div>

                {/* Submit */}
                <button
                    className={`btn-auth ${loading ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <span className="spinner" /> : "Sign In"}
                </button>

                {/* Footer */}
                <p className="auth-footer">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/register")}>Register</span>
                </p>
            </div>
        </div>
    )
}

export default Login