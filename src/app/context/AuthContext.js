import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { observeAuth, signOut as fbSignOut } from "../../lib/lib-firebase/auth";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        return observeAuth(u => {
            setUser(u);
            setLoading(false);
        });
    }, []);
    return (_jsx(AuthContext.Provider, { value: { user, loading, signOut: fbSignOut }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    }
    return context;
}
