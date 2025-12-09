import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: boolean;
  loading: boolean;
  validateSecretKey: (secretKey: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = "mpgoy_auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid session in localStorage
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setUser(true);
    }
    setLoading(false);
  }, []);

  const validateSecretKey = async (secretKey: string) => {
    const { data: validationResult, error: validationError } = await supabase.functions.invoke(
      "validate-signup-key",
      { body: { secretKey } }
    );

    if (validationError) {
      return { error: new Error("Failed to validate secret key. Please try again.") };
    }

    if (!validationResult?.valid) {
      return { error: new Error("Invalid secret key. Contact the admin to get access.") };
    }

    // Store auth state
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setUser(true);

    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, validateSecretKey, signOut }}>
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
