import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"

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
const toPositiveNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const ACCESS_REFRESH_SKEW_MS = toPositiveNumber(import.meta.env.VITE_ACCESS_REFRESH_SKEW_MS, 2 * 60_000)
const FALLBACK_REFRESH_INTERVAL_MS = toPositiveNumber(import.meta.env.VITE_FALLBACK_REFRESH_INTERVAL_MS, 5 * 60_000)
const REFRESH_RETRY_DELAY_MS = toPositiveNumber(import.meta.env.VITE_REFRESH_RETRY_DELAY_MS, 20_000)
const REFRESH_RETRY_COUNT = Math.floor(toPositiveNumber(import.meta.env.VITE_REFRESH_RETRY_COUNT, 2))
const ACCESS_MIN_VALID_MS = 8_000
const SESSION_RECOVERY_GRACE_MS = toPositiveNumber(import.meta.env.VITE_SESSION_RECOVERY_GRACE_MS, 10 * 60_000)
const USER_CACHE_KEY = "auth_user_cache"

const getTokenExpiryMs = (token: string): number | null => {
    try {
        const payload = token.split(".")[1]
        if (!payload) return null

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
        const decoded = JSON.parse(atob(base64))
        return typeof decoded?.exp === "number" ? decoded.exp * 1000 : null
    } catch {
        return null
    }
}

const clearPending2FA = () => {
    sessionStorage.removeItem("pending_2fa_user")
    sessionStorage.removeItem("pending_2fa_challenge")
    sessionStorage.removeItem("pending_2fa_method")
    sessionStorage.removeItem("pending_2fa_temp_token")
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user,    setUser]    = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const refreshTimerRef = useRef<number | null>(null)
    const refreshFailureSinceRef = useRef<number | null>(null)
    const isRecoveringRef = useRef(false)

    const stopSessionRefreshTimer = () => {
        if (refreshTimerRef.current !== null) {
            window.clearTimeout(refreshTimerRef.current)
            refreshTimerRef.current = null
        }
    }

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

    const refreshAccessTokenWithRetry = async (): Promise<string | null> => {
        for (let attempt = 0; attempt <= REFRESH_RETRY_COUNT; attempt += 1) {
            const access = await refreshAccessToken()
            if (access) return access
            if (attempt < REFRESH_RETRY_COUNT) {
                await new Promise(resolve => window.setTimeout(resolve, 800))
            }
        }
        return null
    }

    const loadCachedUser = (): User | null => {
        try {
            const raw = localStorage.getItem(USER_CACHE_KEY)
            if (!raw) return null
            const parsed = JSON.parse(raw) as Partial<User>
            if (!parsed?.id || !parsed?.username || !parsed?.role) return null
            return {
                id: String(parsed.id),
                fullName: String(parsed.fullName ?? parsed.username),
                email: String(parsed.email ?? ""),
                role: parsed.role,
                username: String(parsed.username),
            }
        } catch {
            return null
        }
    }

    const clearCachedUser = () => {
        localStorage.removeItem(USER_CACHE_KEY)
    }

    const scheduleSessionRefresh = (accessToken?: string | null) => {
        stopSessionRefreshTimer()

        const token = accessToken ?? localStorage.getItem("access_token")
        const refresh = localStorage.getItem("refresh_token")
        if (!token || !refresh) return

        const expMs = getTokenExpiryMs(token)
        const delayMs = expMs
            ? Math.max(expMs - Date.now() - ACCESS_REFRESH_SKEW_MS, 5_000)
            : FALLBACK_REFRESH_INTERVAL_MS

        refreshTimerRef.current = window.setTimeout(async () => {
            const refreshedAccess = await refreshAccessTokenWithRetry()
            if (!refreshedAccess) {
                const currentAccess = localStorage.getItem("access_token")
                const currentExp = currentAccess ? getTokenExpiryMs(currentAccess) : null

                // Si le token access est encore valide, on retente plus tard.
                if (currentAccess && currentExp && (currentExp - Date.now()) > ACCESS_MIN_VALID_MS) {
                    refreshFailureSinceRef.current = null
                    refreshTimerRef.current = window.setTimeout(() => {
                        scheduleSessionRefresh(currentAccess)
                    }, REFRESH_RETRY_DELAY_MS)
                    return
                }

                const failureSince = refreshFailureSinceRef.current ?? Date.now()
                refreshFailureSinceRef.current = failureSince
                const inGracePeriod = Date.now() - failureSince < SESSION_RECOVERY_GRACE_MS

                if (inGracePeriod) {
                    refreshTimerRef.current = window.setTimeout(() => {
                        scheduleSessionRefresh(localStorage.getItem("access_token"))
                    }, REFRESH_RETRY_DELAY_MS)
                    return
                }

                clearTokens()
                clearCachedUser()
                setUser(null)
                stopSessionRefreshTimer()
                return
            }

            refreshFailureSinceRef.current = null
            scheduleSessionRefresh(refreshedAccess)
        }, delayMs)
    }

    const setUserFromMe = (me: any) => {
        const mappedUser: User = {
            id: String(me.id),
            fullName: `${me.first_name} ${me.last_name}`.trim() || me.username,
            email: me.email,
            role: mapRole(me.role),
            username: me.username,
        }
        setUser(mappedUser)
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser))
    }

    const attemptSessionRecovery = async () => {
        if (isRecoveringRef.current) return

        const refresh = localStorage.getItem("refresh_token")
        const hasUserSession = Boolean(user || loadCachedUser())
        if (!refresh || !hasUserSession) return

        isRecoveringRef.current = true
        try {
            const refreshedAccess = await refreshAccessTokenWithRetry()
            if (!refreshedAccess) return

            const me = await fetchMe(refreshedAccess)
            if (me) {
                setUserFromMe(me)
                refreshFailureSinceRef.current = null
                scheduleSessionRefresh(refreshedAccess)
            }
        } catch {
            // Ignore transient errors: periodic scheduler will retry.
        } finally {
            isRecoveringRef.current = false
        }
    }

    useEffect(() => {
        const initializeSession = async () => {
            const access = localStorage.getItem("access_token")
            const refresh = localStorage.getItem("refresh_token")
            const cachedUser = loadCachedUser()

            if (cachedUser && !user) {
                setUser(cachedUser)
            }

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
                    refreshFailureSinceRef.current = null
                    scheduleSessionRefresh(localStorage.getItem("access_token") ?? access)
                } else {
                    const hasCached = Boolean(cachedUser)
                    if (hasCached && refresh) {
                        scheduleSessionRefresh(localStorage.getItem("access_token"))
                    } else {
                        stopSessionRefreshTimer()
                        clearTokens()
                        clearCachedUser()
                        setUser(null)
                    }
                }
            } catch (err) {
                console.error("Auth check failed:", err)
                const hasCached = Boolean(cachedUser)
                if (hasCached && refresh) {
                    scheduleSessionRefresh(localStorage.getItem("access_token"))
                } else {
                    stopSessionRefreshTimer()
                    clearTokens()
                    clearCachedUser()
                    setUser(null)
                }
            } finally {
                setLoading(false)
            }
        }

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void attemptSessionRecovery()
            }
        }

        const onFocus = () => {
            void attemptSessionRecovery()
        }

        const onOnline = () => {
            void attemptSessionRecovery()
        }

        initializeSession()
        document.addEventListener("visibilitychange", onVisibilityChange)
        window.addEventListener("focus", onFocus)
        window.addEventListener("online", onOnline)

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            window.removeEventListener("focus", onFocus)
            window.removeEventListener("online", onOnline)
            stopSessionRefreshTimer()
        }
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
        stopSessionRefreshTimer()
        refreshFailureSinceRef.current = null
        clearTokens()
        clearCachedUser()
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
        refreshFailureSinceRef.current = null
        scheduleSessionRefresh(localStorage.getItem("access_token") ?? tokens.access)
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