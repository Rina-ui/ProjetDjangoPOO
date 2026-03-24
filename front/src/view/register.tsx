import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { register as registerRequest } from "../services/auth"
import "../style/auth.css"

const Register = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [role, setRole] = useState<"LOCATAIRE" | "PROPRIETAIRE" | "ADMIN">("PROPRIETAIRE")
    const [error, setError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        // Validation
        if (!email || !password || !confirm) {
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
        try {
            await registerRequest({
                username: email,
                password,
                role,
            })

            setLoading(false)
            navigate("/login")
        } catch (err: any) {
            if (!err?.response) {
                setErrorMsg("Backend injoignable. Verifie que Django tourne sur http://127.0.0.1:8000")
                setError(true)
                setLoading(false)
                return
            }

            const data = err.response.data
            const backendMsg =
                data?.detail ||
                data?.email?.[0] ||
                data?.username?.[0] ||
                data?.password?.[0] ||
                data?.role?.[0] ||
                "Registration failed"

            setErrorMsg(String(backendMsg))
            setError(true)
            setLoading(false)
        }
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

                {/* Email */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <input
                        type="email"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email</label>
                </div>

                {/* Role */}
                <div className={`input-group ${error ? "input-error" : ""}`}>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as "LOCATAIRE" | "PROPRIETAIRE" | "ADMIN")}
                        style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "inherit" }}
                    >
                        <option value="LOCATAIRE">LOCATAIRE</option>
                        <option value="PROPRIETAIRE">PROPRIETAIRE</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
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