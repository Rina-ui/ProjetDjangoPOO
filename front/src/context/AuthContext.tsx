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
    completeLogin:   (tokens: { access: string; refresh: string }) => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const mapRole = (role: string): Role => {
    if (role === "ADMIN")        return "admin"
    if (role === "PROPRIETAIRE") return "owner"
    return "client"
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const clearPending2FA = () => {
    sessionStorage.removeItem("pending_2fa_user")
    sessionStorage.removeItem("pending_2fa_challenge")
    sessionStorage.removeItem("pending_2fa_method")
    sessionStorage.removeItem("pending_2fa_temp_token")
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user,    setUser]    = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const clearTokens = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
    }

    const fetchMe = async (access: string) => {
        const meRes = await fetch(`${BASE_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${access}` }
        })
        if (!meRes.ok) return null
        return meRes.json()
    }

    const refreshAccessToken = async (): Promise<string | null> => {
        const refresh = localStorage.getItem("refresh_token")
        if (!refresh) return null

        const refreshEndpoints = [
            `${BASE_URL}/api/auth/token/refresh/`,
            `${BASE_URL}/api/auth/refresh/`,
        ]

        for (const endpoint of refreshEndpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh })
                })
                if (!res.ok) continue

                const data = await res.json()
                const access = data?.access ?? data?.token
                if (!access) continue

                localStorage.setItem("access_token", access)
                if (data?.refresh) {
                    localStorage.setItem("refresh_token", data.refresh)
                }
                return access
            } catch {
                // Try next known refresh endpoint.
            }
        }

        return null
    }

    const setUserFromMe = (me: any) => {
        setUser({
            id: String(me.id),
            fullName: `${me.first_name} ${me.last_name}`.trim() || me.username,
            email: me.email,
            role: mapRole(me.role),
            username: me.username,
        })
    }

    const completeLogin = async (tokens: { access: string; refresh: string }) => {
        localStorage.setItem("access_token", tokens.access)
        localStorage.setItem("refresh_token", tokens.refresh)

        let me = await fetchMe(tokens.access)
        if (!me) {
            const refreshedAccess = await refreshAccessToken()
            if (!refreshedAccess) {
                clearTokens()
                throw new Error("Impossible de recuperer le profil utilisateur")
            }
            me = await fetchMe(refreshedAccess)
            if (!me) {
                clearTokens()
                throw new Error("Impossible de recuperer le profil utilisateur")
            }
        }

        clearPending2FA()
        setUserFromMe(me)
    }

    useEffect(() => {
        const initializeSession = async () => {
            const access = localStorage.getItem("access_token")
            const refresh = localStorage.getItem("refresh_token")
            if (!access && !refresh) {
                setLoading(false)
                return
            }

            try {
                let me = access ? await fetchMe(access) : null

                if (!me) {
                    const refreshedAccess = await refreshAccessToken()
                    if (refreshedAccess) {
                        me = await fetchMe(refreshedAccess)
                    }
                }

                if (me) {
                    setUserFromMe(me)
                } else {
                    clearTokens()
                    setUser(null)
                }
            } catch (err) {
                console.error("Auth check failed:", err)
                clearTokens()
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        initializeSession()
    }, [])

    const login = async (username: string, password: string) => {
        const res = await fetch(`${BASE_URL}/api/auth/login/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ username, password })
        })
        if (!res.ok) throw new Error("Identifiants incorrects")
        const data = await res.json()

        // Nouveau contrat API recommandé pour 2FA.
        if (data?.requires_2fa) {
            sessionStorage.setItem("pending_2fa_user", username)
            if (data.challenge_token) {
                sessionStorage.setItem("pending_2fa_challenge", String(data.challenge_token))
            }
            if (data.method) {
                sessionStorage.setItem("pending_2fa_method", String(data.method))
            }
            if (data.temp_token) {
                sessionStorage.setItem("pending_2fa_temp_token", String(data.temp_token))
            } else if (data.access) {
                // Compat: certains backends renvoient un access temporaire pendant le challenge 2FA.
                sessionStorage.setItem("pending_2fa_temp_token", String(data.access))
            }
            throw { is2FA: true, method: data.method ?? "totp" }
        }

        const access = data?.access
        const refresh = data?.refresh
        if (!access || !refresh) throw new Error("Réponse de connexion invalide")

        const meRes = await fetch(`${BASE_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${access}` }
        })
        if (!meRes.ok) throw new Error("Impossible de recuperer le profil utilisateur")
        const me = await meRes.json()

        // Compat ancien backend: login normal + contrôle totp_enabled via /me.
        if (me?.totp_enabled) {
            sessionStorage.setItem("pending_2fa_user", username)
            sessionStorage.setItem("pending_2fa_temp_token", access)
            throw { is2FA: true, method: "totp" }
        }

        // Pas de 2FA → connexion directe
        await completeLogin({ access, refresh })
    }

    const logout = () => {
        clearTokens()
        clearPending2FA()
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
            user, loading, login, logout, register, completeLogin,
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