import { createContext, useContext, useState, ReactNode } from "react"

export type Role = "admin" | "owner" | "client"

export interface MockUser {
    id: string
    fullName: string
    email: string
    role: Role
    avatar?: string
}

const MOCK_USERS: Record<Role, MockUser> = {
    admin: {
        id: "1",
        fullName: "Sarah Lemoine",
        email: "admin@kora.com",
        role: "admin",
    },
    owner: {
        id: "2",
        fullName: "Karim Benali",
        email: "owner@kora.com",
        role: "owner",
    },
    client: {
        id: "3",
        fullName: "Ryan Vaccaro",
        email: "client@kora.com",
        role: "client",
    },
}

interface AuthContextType {
    user: MockUser | null
    login: (role: Role) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<MockUser | null>(null)

    const login = (role: Role) => {
        setUser(MOCK_USERS[role])
    }

    const logout = () => setUser(null)

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
