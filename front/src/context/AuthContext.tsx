import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Role = "admin" | "owner" | "client"

export interface User {
    id:        string
    fullName:  string
    email:     string
    role:      Role
    username:  string
}

interface AuthContextType {
    user:            User | null
    loading:         boolean
    login:           (username: string, password: string) => Promise<void>
    logout:          () => void
    register:        (data: any) => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const mapRole = (role: string): Role => {
    if (role === "ADMIN")        return "admin"
    if (role === "PROPRIETAIRE") return "owner"
    return "client"
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user,    setUser]    = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (!token) { setLoading(false); return }
        fetch(`${BASE_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setUser({
                    id:       String(data.id),
                    fullName: `${data.first_name} ${data.last_name}`.trim() || data.username,
                    email:    data.email,
                    role:     mapRole(data.role),
                    username: data.username,
                })
            })
            .catch(() => {
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
            })
            .finally(() => setLoading(false))
    }, [])

    const login = async (username: string, password: string) => {
        const res = await fetch(`${BASE_URL}/api/auth/login/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ username, password })
        })
        if (!res.ok) throw new Error("Identifiants incorrects")
        const tokens = await res.json()
        localStorage.setItem("access_token",  tokens.access)
        localStorage.setItem("refresh_token", tokens.refresh)

        const meRes = await fetch(`${BASE_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${tokens.access}` }
        })
        const me = await meRes.json()
        setUser({
            id:       String(me.id),
            fullName: `${me.first_name} ${me.last_name}`.trim() || me.username,
            email:    me.email,
            role:     mapRole(me.role),
            username: me.username,
        })
    }

    const logout = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        setUser(null)
    }

    const register = async (data: any) => {
        const res = await fetch(`${BASE_URL}/api/auth/register/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(data)
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(JSON.stringify(err))
        }
    }

    return (
        <AuthContext.Provider value={{
            user, loading, login, logout, register,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}