import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../style/auth.css"

const Register = () => {
    const navigate = useNavigate()
    const { register } = useAuth()

    const [form, setForm] = useState({
        username:   "",
        first_name: "",
        last_name:  "",
        email:      "",
        password:   "",
        password2:  "",
        role:       "LOCATAIRE"
    })
    const [errorMsg, setErrorMsg] = useState("")
    const [loading,  setLoading]  = useState(false)

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async () => {
        if (!form.username || !form.email || !form.password || !form.password2) {
            setErrorMsg("Please fill in all fields")
            return
        }
        if (form.password !== form.password2) {
            setErrorMsg("Passwords do not match")
            return
        }
        if (form.password.length < 6) {
            setErrorMsg("Password must be at least 6 characters")
            return
        }
        setErrorMsg("")
        setLoading(true)
        try {
            await register(form)
            navigate("/login")
        } catch (err: any) {
            setErrorMsg("Registration failed. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-overlay" />
            <div className="auth-card">
                <div className="auth-switcher">
                    <button onClick={() => navigate("/login")}>Login</button>
                    <button className="active">Register</button>
                </div>
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join KÔRÂ today</p>
                </div>

                {errorMsg && <div className="error-msg">{errorMsg}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="input-group">
                        <input type="text" placeholder=" " value={form.first_name} onChange={e => set("first_name", e.target.value)}/>
                        <label>First name</label>
                    </div>
                    <div className="input-group">
                        <input type="text" placeholder=" " value={form.last_name} onChange={e => set("last_name", e.target.value)}/>
                        <label>Last name</label>
                    </div>
                </div>

                <div className="input-group">
                    <input type="text" placeholder=" " value={form.username} onChange={e => set("username", e.target.value)}/>
                    <label>Username</label>
                </div>

                <div className="input-group">
                    <input type="email" placeholder=" " value={form.email} onChange={e => set("email", e.target.value)}/>
                    <label>Email address</label>
                </div>

                <div className="input-group">
                    <select
                        value={form.role}
                        onChange={e => set("role", e.target.value)}
                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14 }}
                    >
                        <option value="LOCATAIRE">Client (Locataire)</option>
                        <option value="PROPRIETAIRE">Owner (Propriétaire)</option>
                    </select>
                </div>

                <div className="input-group">
                    <input type="password" placeholder=" " value={form.password} onChange={e => set("password", e.target.value)}/>
                    <label>Password</label>
                </div>

                <div className="input-group">
                    <input type="password" placeholder=" " value={form.password2} onChange={e => set("password2", e.target.value)}/>
                    <label>Confirm Password</label>
                </div>

                <button className={`btn-auth ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={loading}>
                    {loading ? <span className="spinner" /> : "Create Account"}
                </button>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")}>Sign in</span>
                </p>
            </div>
        </div>
    )
}

export default Register