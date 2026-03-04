import { useState } from "react";

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setpassword] = useState("")
    const [error, setError] = useState(false)

    const handleSubmit = () => {
        if (!email || !password) {
            setError(true);
            setTimeout(() => setError(false), 500)
            return
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-switcher">
                    <button className="active">
                        Login
                    </button>
                    <button onClick={() => {/* navigate vers notre register */}}>
                        Register
                    </button>
                </div>

                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>

                <div className={'input-group ${error ? "input-error" : ""}'}>
                    <input
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email address</label>
                </div>

                <div className={'input-group ${error ? "input-error" : ""}'}>
                    <input
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setpassword(e.target.value)}
                    />
                    <label>Password</label>
                </div>

                <button className="btn-auth" onClick={handleSubmit}>
                    Sign In
                </button>

            </div>
        </div>
    )

}

export default Login;