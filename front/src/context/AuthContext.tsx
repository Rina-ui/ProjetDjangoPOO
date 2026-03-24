import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, logout as logoutRequest, type AuthUser } from "../services/auth";


const mapRole = (role: string) => {
    if (role === "ADMIN") return "admin"
    if (role === "PROPRIETAIRE") return "owner"
    if (role === "LOCATAIRE") return "client"
    return "client"
}

export type Role = "client" | "owner" | "admin";

type User = AuthUser & { role: Role; fullName: string };

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("auth_user");
        if (!saved) return null;

        const parsed = JSON.parse(saved) as Partial<User>;
        return {
            ...(parsed as User),
            fullName: parsed.fullName || parsed.full_name || parsed.email || parsed.username || "Utilisateur",
            role: mapRole(parsed.role || "")
        };
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem("auth_user", JSON.stringify(user));
            return;
        }
        localStorage.removeItem("auth_user");
    }, [user]);

    const login = async (email: string, password: string) => {
        try {
            const userData = await loginRequest(email, password);

            const normalizedUser: User = {
                ...userData,
                fullName: userData.fullName || userData.full_name || userData.email || userData.username || "Utilisateur",
                role: mapRole(userData.role)
            };

            setUser(normalizedUser);

            return normalizedUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await logoutRequest();
        setUser(null);
    };

    const value = useMemo(
        () => ({ user, isAuthenticated: Boolean(user), login, logout }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth doit etre utilise dans AuthProvider");
    }

    return context;
};
