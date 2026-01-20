import { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (email, password, fullName, role, businessName) => {
    // Mock sign up - just set user
    const mockUser = { 
      id: Date.now().toString(),
      email, 
      full_name: fullName 
    };
    setUser(mockUser);
    setRole(role);
    return { error: null };
  };

  const signIn = async (email, password) => {
    // Mock sign in - just set user
    const mockUser = { 
      id: Date.now().toString(),
      email 
    };
    setUser(mockUser);
    setRole("customer");
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

