import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../style/auth.css"

const Register = () => {
    const navigate = useNavigate()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [error, setError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = () => {
        // Validation
        if (!fullName || !email || !password || !confirm) {
            setErrorMsg("Please fill in all fields")
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }
        if (password !== confirm) {
            setErrorMsg("Passwords do not match")
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }
        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters")
            setError(true)
            setTimeout(() => setError(false), 500)
            return
        }

        setErrorMsg("")
        setLoading(true)
        // Simule un appel API
        setTimeout(() => {
            setLoading(false)
            navigate("/login")
        }, 1500)
    }

    return (
        <div className="auth-page">
            <div className="auth-overlay" />

            <div className="auth-card">
                {/* Switcher */}
                <div className="auth-switcher">
                    <button onClick={() => navigate("/login")}>Login</button>
                    <button className="active">Register</button>
                </div>

                {/* Header */}
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join KÔRÂ today</p>
                </div>

                {/* Error message */}
                {errorMsg && <div className="error-msg">{errorMsg}</div>}

                {/* Full Name */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input
                        type="text"
                        placeholder=" "
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <label>Full Name</label>
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

                {/* Confirm Password */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input
                        type="password"
                        placeholder=" "
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                    <label>Confirm Password</label>
                </div>

                {/* Submit */}
                <button
                    className={`btn-auth ${loading ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <span className="spinner" /> : "Create Account"}
                </button>

                {/* Footer */}
                <p className="auth-footer">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")}>Sign in</span>
                </p>
            </div>
        </div>
    )
}

export default Register