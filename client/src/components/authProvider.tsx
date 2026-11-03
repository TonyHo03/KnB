// auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../client.ts";
import type {Roles} from "@/src/RolesEnum.ts";

const ROLES: Roles[] = ["admin", "superuser", "user"] as const;
type Role = (typeof ROLES)[number];
type Actor = { id: number; role: Role };

function parseActor(data: { id?: number; role?: string | null }): Actor | null {
    const role = data.role as Role | undefined;
    return data.id != null && role && ROLES.includes(role) ? { id: data.id, role } : null;
}

type AuthContextValue = {
    user: Actor | null;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Actor | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const me = await api.api.authMeList();
            console.log("raw /auth/me:", me);
            const actor = parseActor(me);
            console.log("parsed actor:", actor);
            setUser(actor);
        } catch (err) {
            console.error("refresh failed:", err);
            setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext value={{ user, loading, refresh, logout }}>
            {children}
        </AuthContext>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}